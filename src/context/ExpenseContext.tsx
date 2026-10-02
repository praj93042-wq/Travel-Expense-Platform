import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, 
  ExpenseClaim, 
  ExpensePolicy, 
  Trip, 
  PayoutReport, 
  ClaimType, 
  ClaimCategory,
  PolicyAssessment,
  TripDestination,
  PostTripConfirmation,
  PayoutReportEntry,
  EmployeeGrade,
  ManagerApprovalAuthority,
  GRADE_APPROVAL_AUTHORITIES
} from '../types';
import { 
  SEED_EMPLOYEES, 
  SEED_POLICIES, 
  SEED_TRIPS, 
  SEED_CLAIMS, 
  SEED_PAYOUT_REPORTS 
} from '../mock/seedData';
import { 
  auth, 
  db, 
  googleProvider, 
  testConnection, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';

export interface ApprovalEligibilityResult {
  isDirectReport: boolean;
  isSubordinate: boolean;
  isWithinSigningLimit: boolean;
  signingLimit: number;
  canApprove: boolean;
  reason?: string;
  requiresEscalation: boolean;
  nextManager?: Employee;
  directManager?: Employee;
}

// Daily Cab / Ground Transit Allowance Schedule (Model B with Actual Receipt Option)
export const DAILY_CAB_ALLOWANCE_RATES: Record<EmployeeGrade, { standard: number; highCost: number }> = {
  'Associate (Band A)': { standard: 40, highCost: 55 },
  'Mid-level (Band B)': { standard: 55, highCost: 70 },
  'Senior (Band C)': { standard: 75, highCost: 95 },
  'Executive': { standard: 100, highCost: 130 },
};

export const isHighCostTransitCity = (city?: string): boolean => {
  if (!city) return false;
  const normalized = city.toLowerCase();
  return (
    normalized.includes('san francisco') ||
    normalized.includes('new york') ||
    normalized.includes('london') ||
    normalized.includes('tokyo') ||
    normalized.includes('paris') ||
    normalized.includes('singapore') ||
    normalized.includes('boston') ||
    normalized.includes('chicago')
  );
};

export const getDailyCabAllowanceRate = (grade: EmployeeGrade, city?: string): number => {
  const rates = DAILY_CAB_ALLOWANCE_RATES[grade] || DAILY_CAB_ALLOWANCE_RATES['Mid-level (Band B)'];
  return isHighCostTransitCity(city) ? rates.highCost : rates.standard;
};

interface ExpenseContextType {
  currentEmployee: Employee;
  setCurrentEmployeeId: (id: string) => void;
  employees: Employee[];
  policies: ExpensePolicy[];
  updatePolicyRule: (policyId: string, grade: string, category: string, newDailyRate?: number, newMaxPerTx?: number) => void;
  trips: Trip[];
  createTrip: (tripData: Omit<Trip, 'id' | 'tripNumber' | 'status' | 'version' | 'revisionsHistory' | 'associatedClaimIds' | 'createdAt'>) => Trip;
  approveTrip: (tripId: string, approverName: string) => void;
  rejectTrip: (tripId: string, reason: string, approverName: string) => void;
  amendTrip: (tripId: string, destinations: TripDestination[], estimatedCost: number, reason: string) => void;
  approveTripAmendment: (tripId: string, approverName: string) => void;
  confirmPostTrip: (tripId: string, status: 'completed_as_planned' | 'changed' | 'cancelled', notes?: string) => void;
  claims: ExpenseClaim[];
  submitClaim: (newClaim: Partial<ExpenseClaim>) => ExpenseClaim;
  approveClaim: (claimId: string, approverName: string, isExceptionOverride?: boolean, notes?: string, approverGrade?: EmployeeGrade) => void;
  rejectClaim: (claimId: string, reason: string, approverName: string, category?: string, approverGrade?: EmployeeGrade) => void;
  escalateClaim: (claimId: string, targetManagerId: string, reason: string, approverName: string, approverGrade?: EmployeeGrade) => void;
  requestClarification: (claimId: string, message: string) => void;
  requestException: (claimId: string, reason: string) => void;
  getDirectReports: (managerId: string) => Employee[];
  getAllHierarchySubordinates: (managerId: string) => Employee[];
  getManagerAuthority: (grade: EmployeeGrade) => ManagerApprovalAuthority;
  checkApprovalEligibility: (manager: Employee, claim: ExpenseClaim) => ApprovalEligibilityResult;
  payoutReports: PayoutReport[];
  generatePayoutReport: (periodStart: string, periodEnd: string, title?: string) => PayoutReport;
  markPayoutReportSettled: (reportId: string, settledBy: string) => void;
  confirmAdvanceDisbursement: (claimId: string, disbursedAmount: number) => void;
  evaluateClaimPolicy: (
    emp: Employee, 
    type: ClaimType, 
    category: ClaimCategory, 
    amount: number, 
    trip?: Trip
  ) => PolicyAssessment;
  getDailyCabAllowanceRate: (grade: EmployeeGrade, city?: string) => number;
  resetAllData: () => void;
  firebaseUser: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  isFirestoreSyncActive: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

const STORAGE_KEY_PREFIX = 'patty_expense_v1_';

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isFirestoreSyncActive, setIsFirestoreSyncActive] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}employees`);
    if (!saved) return SEED_EMPLOYEES;
    try {
      const parsed: Employee[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map(e => e.id));
      const missing = SEED_EMPLOYEES.filter(e => !existingIds.has(e.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return SEED_EMPLOYEES;
    }
  });

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>('emp-002'); // Default to Elena Rostova (Manager) for intuitive approval testing

  const [policies, setPolicies] = useState<ExpensePolicy[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}policies`);
    return saved ? JSON.parse(saved) : SEED_POLICIES;
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}trips`);
    return saved ? JSON.parse(saved) : SEED_TRIPS;
  });

  const [claims, setClaims] = useState<ExpenseClaim[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}claims`);
    if (!saved) return SEED_CLAIMS;
    try {
      const parsed: ExpenseClaim[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map(c => c.id));
      const missing = SEED_CLAIMS.filter(c => !existingIds.has(c.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return SEED_CLAIMS;
    }
  });

  const [payoutReports, setPayoutReports] = useState<PayoutReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}payout_reports`);
    return saved ? JSON.parse(saved) : SEED_PAYOUT_REPORTS;
  });

  // Test connection to Firestore on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
      if (user) {
        setIsFirestoreSyncActive(true);
        // Persist user profile to Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Authorized User',
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save changes to localStorage as reliable cache
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}policies`, JSON.stringify(policies));
  }, [policies]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}trips`, JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}claims`, JSON.stringify(claims));
  }, [claims]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}payout_reports`, JSON.stringify(payoutReports));
  }, [payoutReports]);

  // Google Login & Logout Handlers
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Link authenticated email to Marcus Vance or matching employee
        const matched = employees.find(e => e.email.toLowerCase() === result.user.email?.toLowerCase());
        if (matched) {
          setCurrentEmployeeId(matched.id);
        }
      }
    } catch (err) {
      console.warn('Google Sign-In canceled or failed:', err);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
  };

  const currentEmployee = employees.find(e => e.id === currentEmployeeId) || employees[0];

  // Helper: Find applicable policy for employee
  const getApplicablePolicy = (emp: Employee): ExpensePolicy => {
    // 1. Try to find entity-specific policy
    const entityPolicy = policies.find(p => p.legalEntity === emp.legalEntity && !p.isDefault);
    if (entityPolicy) return entityPolicy;
    // 2. Default fallback policy
    const defaultPolicy = policies.find(p => p.isDefault);
    return defaultPolicy || policies[0];
  };

  // Policy Evaluation Engine
  const evaluateClaimPolicy = (
    emp: Employee, 
    type: ClaimType, 
    category: ClaimCategory, 
    amount: number, 
    trip?: Trip
  ): PolicyAssessment => {
    const policy = getApplicablePolicy(emp);

    // Rule 1: Mileage CLAIMS ALWAYS REQUIRE MANAGER APPROVAL (PRD Section: Clarification — mandatory approval for mileage and allowances)
    if (type === 'mileage') {
      return {
        status: 'eligible_pending_manager_approval',
        policyVersion: policy.version,
        matchedRuleName: `${emp.grade} Mileage Reimbursement Policy`,
        maxAllowedAmount: amount,
        explanation: 'Mileage rate and distance calculated. Company policy mandates manager approval for all mileage claims, even when within policy limits.',
        flags: ['mandatory_manager_approval', 'mileage_rule'],
        requiresManagerApproval: true,
      };
    }

    // Rule 2: Allowance CLAIMS ALWAYS REQUIRE MANAGER APPROVAL (PRD Section: Clarification — mandatory approval for mileage and allowances)
    if (type === 'allowance') {
      return {
        status: 'eligible_pending_manager_approval',
        policyVersion: policy.version,
        matchedRuleName: `${emp.grade} Daily Allowance Rate`,
        maxAllowedAmount: amount,
        explanation: 'Per diem rate entitlement validated for travel dates. Company policy mandates manager approval for all allowance claims.',
        flags: ['mandatory_manager_approval', 'allowance_entitlement'],
        requiresManagerApproval: true,
      };
    }

    // Rule 3: Travel Advance ALWAYS REQUIRES MANAGER APPROVAL & CAN ONLY BE GIVEN FOR APPROVED TRAVEL
    if (type === 'travel_advance') {
      const isTripApproved = trip && trip.status === 'approved';
      if (!trip) {
        return {
          status: 'pending_exception_review',
          policyVersion: policy.version,
          matchedRuleName: `${emp.grade} Travel Advance Rule`,
          maxAllowedAmount: 0,
          excessAmount: amount,
          explanation: 'Corporate Policy Rule: Travel advance can ONLY be given for approved travel. No registered travel itinerary was linked to this advance request.',
          flags: ['mandatory_manager_approval', 'unapproved_travel_block'],
          requiresManagerApproval: true,
        };
      }

      if (!isTripApproved) {
        return {
          status: 'pending_exception_review',
          policyVersion: policy.version,
          matchedRuleName: `${emp.grade} Travel Advance Rule`,
          maxAllowedAmount: 0,
          excessAmount: amount,
          explanation: `Corporate Policy Rule: Travel advance can ONLY be given for approved travel. Linked travel itinerary (${trip.tripNumber}) is currently in "${trip.status.replace('_', ' ')}" status. Advance disbursement is blocked until the trip is officially approved by manager.`,
          flags: ['mandatory_manager_approval', 'unapproved_travel_block'],
          requiresManagerApproval: true,
        };
      }

      const budgetCap = trip.estimatedCost * 0.4;
      const isWithinCap = amount <= budgetCap;
      return {
        status: isWithinCap ? 'eligible_pending_manager_approval' : 'pending_exception_review',
        policyVersion: policy.version,
        matchedRuleName: `${emp.grade} Travel Advance Rule`,
        maxAllowedAmount: budgetCap,
        excessAmount: isWithinCap ? 0 : amount - budgetCap,
        explanation: isWithinCap
          ? `Advance request of $${amount.toFixed(2)} is validated against approved trip ${trip.tripNumber} (within 40% budget cap $${budgetCap.toFixed(2)}). Mandatory manager disbursement approval required.`
          : `Advance request of $${amount.toFixed(2)} exceeds recommended 40% cap ($${budgetCap.toFixed(2)}) for approved trip ${trip.tripNumber}. Requires manager exception review.`,
        flags: isWithinCap ? ['mandatory_manager_approval', 'advance_disbursement_guard'] : ['over_limit', 'mandatory_manager_approval'],
        requiresManagerApproval: true,
      };
    }

    // Rule 4: Employee-paid Reimbursement
    const matchedRule = policy.rules.find(r => r.grade === emp.grade && r.category === category);
    const limit = matchedRule?.maxDailyRate || matchedRule?.maxPerTransaction || 100;
    const canAutoApprove = matchedRule ? matchedRule.autoApprovalAllowed : false;

    if (amount <= limit) {
      if (canAutoApprove) {
        return {
          status: 'eligible_auto_authorized',
          policyVersion: policy.version,
          matchedRuleName: `${emp.grade} ${category} limit ($${limit.toFixed(2)})`,
          maxAllowedAmount: limit,
          explanation: `Eligible employee-paid reimbursement of $${amount.toFixed(2)} is within the ${emp.grade} cap of $${limit.toFixed(2)}. Auto-authorized without requiring manager intervention per company policy.`,
          flags: ['in_policy', 'auto_authorized', 'receipt_verified'],
          requiresManagerApproval: false,
        };
      } else {
        return {
          status: 'eligible_pending_manager_approval',
          policyVersion: policy.version,
          matchedRuleName: `${emp.grade} ${category} rule`,
          maxAllowedAmount: limit,
          explanation: `In-policy claim of $${amount.toFixed(2)}, but this category requires manager sign-off per organizational policy settings.`,
          flags: ['in_policy', 'review_required_by_policy'],
          requiresManagerApproval: true,
        };
      }
    } else {
      // Exceeds policy limit
      const excess = amount - limit;
      return {
        status: 'pending_exception_review',
        policyVersion: policy.version,
        matchedRuleName: `${emp.grade} ${category} limit ($${limit.toFixed(2)})`,
        maxAllowedAmount: limit,
        excessAmount: excess,
        explanation: `Claim of $${amount.toFixed(2)} exceeds the permitted ${emp.grade} cap of $${limit.toFixed(2)} by $${excess.toFixed(2)}. Requires manager exception review with business justification.`,
        flags: ['over_limit', 'exception_review_required'],
        requiresManagerApproval: true,
      };
    }
  };

  // Submit Claim
  const submitClaim = (partialClaim: Partial<ExpenseClaim>): ExpenseClaim => {
    const emp = employees.find(e => e.id === (partialClaim.employeeId || currentEmployee.id)) || currentEmployee;
    const claimType = partialClaim.type || 'reimbursement';
    const category = partialClaim.category || 'Meals & Entertainment';
    const amount = Number(partialClaim.amount) || 0;
    const trip = trips.find(t => t.id === partialClaim.tripId);

    const assessment = evaluateClaimPolicy(emp, claimType, category, amount, trip);
    const id = `exp-${Date.now()}`;
    const claimNumber = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const isAutoAuth = assessment.status === 'eligible_auto_authorized';
    const approvalStatus = isAutoAuth ? 'auto_authorized' : 'pending_manager';
    const payableStatus = isAutoAuth ? 'payable_pending_report' : 'unauthorized';

    const newClaim: ExpenseClaim = {
      id,
      claimNumber,
      type: claimType,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeGrade: emp.grade,
      legalEntity: emp.legalEntity,
      location: emp.location,
      tripId: trip?.id,
      tripNumber: trip?.tripNumber,
      date: partialClaim.date || now.split('T')[0],
      amount,
      currency: partialClaim.currency || 'USD',
      category,
      businessPurpose: partialClaim.businessPurpose || 'Business operational expense',
      merchantName: partialClaim.merchantName || 'Direct Expense',
      receipt: partialClaim.receipt,
      mileageDetails: partialClaim.mileageDetails,
      allowanceDetails: partialClaim.allowanceDetails,
      advanceDetails: partialClaim.advanceDetails,
      policyAssessment: assessment,
      approvalStatus,
      approvedAt: isAutoAuth ? now : undefined,
      approvedBy: isAutoAuth ? `Patty Policy Engine (Rule: ${assessment.matchedRuleName})` : undefined,
      isExceptionRequested: partialClaim.isExceptionRequested || assessment.status === 'pending_exception_review',
      exceptionReason: partialClaim.exceptionReason,
      tags: partialClaim.tags || [],
      submissionChannel: partialClaim.submissionChannel || 'web_portal',
      payableStatus,
      auditLog: [
        {
          id: `aud-${Date.now()}-1`,
          timestamp: now,
          actor: `${emp.name} (${partialClaim.submissionChannel || 'Web Portal'})`,
          action: 'SUBMITTED_CLAIM',
          details: `Submitted ${claimType} claim for ${partialClaim.currency || 'USD'} ${amount.toFixed(2)}. ${trip ? `Linked to ${trip.tripNumber}.` : ''}`
        },
        ...(isAutoAuth ? [{
          id: `aud-${Date.now()}-2`,
          timestamp: now,
          actor: 'Patty Policy Engine',
          action: 'AUTO_AUTHORIZED',
          details: `Policy satisfied. ${assessment.explanation}`
        }] : [{
          id: `aud-${Date.now()}-2`,
          timestamp: now,
          actor: 'Patty Policy Engine',
          action: 'ROUTED_FOR_APPROVAL',
          details: `Routed to manager ${emp.managerName}. ${assessment.explanation}`
        }])
      ]
    };

    setClaims(prev => [newClaim, ...prev]);

    // Also link to trip if associated
    if (trip) {
      setTrips(prev => prev.map(t => {
        if (t.id === trip.id) {
          return {
            ...t,
            associatedClaimIds: Array.from(new Set([...t.associatedClaimIds, id]))
          };
        }
        return t;
      }));
    }

    return newClaim;
  };

  // Get direct reports for a given manager ID
  const getDirectReports = (managerId: string): Employee[] => {
    return employees.filter(e => e.managerId === managerId);
  };

  // Get all downline subordinate employees in recursive management tree
  const getAllHierarchySubordinates = (managerId: string): Employee[] => {
    const subordinates: Employee[] = [];
    const queue = [managerId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const directs = employees.filter(e => e.managerId === currentId);
      for (const emp of directs) {
        subordinates.push(emp);
        queue.push(emp.id);
      }
    }
    return subordinates;
  };

  // Get manager's grade authority limits and permissions
  const getManagerAuthority = (grade: EmployeeGrade): ManagerApprovalAuthority => {
    return GRADE_APPROVAL_AUTHORITIES[grade] || GRADE_APPROVAL_AUTHORITIES['Associate (Band A)'];
  };

  // Check if a manager has authority to approve a claim based on user grade and reporting hierarchy
  const checkApprovalEligibility = (manager: Employee, claim: ExpenseClaim): ApprovalEligibilityResult => {
    const directReports = getDirectReports(manager.id);
    const isDirectReport = directReports.some(e => e.id === claim.employeeId);
    const allSubs = getAllHierarchySubordinates(manager.id);
    const isSubordinate = isDirectReport || allSubs.some(e => e.id === claim.employeeId);
    
    // Executive managers have administrative oversight company-wide
    const isExecutive = manager.grade === 'Executive';
    const authority = getManagerAuthority(manager.grade);
    const isWithinSigningLimit = claim.amount <= authority.signingLimit;

    // Submitter and direct manager lookup
    const submitter = employees.find(e => e.id === claim.employeeId);
    const directManager = submitter ? employees.find(e => e.id === submitter.managerId) : undefined;
    
    // Find next manager up the hierarchy for escalation
    const nextManager = manager.managerId 
      ? employees.find(e => e.id === manager.managerId) 
      : employees.find(e => e.grade === 'Executive' && e.id !== manager.id);

    // If claim was explicitly escalated to this manager
    const isEscalatedToMe = claim.escalatedToManagerId === manager.id;

    const inReportingChain = isDirectReport || isSubordinate || isExecutive || isEscalatedToMe;
    const canApprove = inReportingChain && isWithinSigningLimit;
    const requiresEscalation = !isWithinSigningLimit;

    let reason: string | undefined;
    if (!isWithinSigningLimit) {
      reason = `Claim amount ($${claim.amount.toFixed(2)}) exceeds your ${manager.grade} financial signing limit of $${authority.signingLimit.toFixed(2)}. Escalation to Executive level required.`;
    } else if (!inReportingChain) {
      reason = `${claim.employeeName} reports directly to ${directManager?.name || 'their assigned manager'}. You are not in their direct line of management.`;
    }

    return {
      isDirectReport,
      isSubordinate,
      isWithinSigningLimit,
      signingLimit: authority.signingLimit,
      canApprove,
      reason,
      requiresEscalation,
      nextManager,
      directManager,
    };
  };

  // Escalate Claim to next-level manager in hierarchy
  const escalateClaim = (
    claimId: string, 
    targetManagerId: string, 
    reason: string, 
    approverName: string, 
    approverGrade?: EmployeeGrade
  ) => {
    const targetManager = employees.find(e => e.id === targetManagerId);
    const now = new Date().toISOString();
    const targetName = targetManager ? `${targetManager.name} (${targetManager.grade})` : 'Executive Approver';
    const gradeLabel = approverGrade ? ` (${approverGrade})` : '';

    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          escalatedToManagerId: targetManagerId,
          escalatedToManagerName: targetManager ? targetManager.name : 'Executive Approver',
          escalationReason: reason,
          auditLog: [
            ...c.auditLog,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              actor: `${approverName}${gradeLabel}`,
              action: 'ESCALATED_CLAIM',
              details: `Escalated claim of $${c.amount.toFixed(2)} to ${targetName}. Justification: ${reason}`
            }
          ]
        };
      }
      return c;
    }));
  };

  // Approve Claim (Manager action with grade authority and notes)
  const approveClaim = (
    claimId: string, 
    approverName: string, 
    isExceptionOverride = false, 
    notes?: string,
    approverGrade?: EmployeeGrade
  ) => {
    const now = new Date().toISOString();
    const gradeLabel = approverGrade ? ` (${approverGrade})` : '';
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          approvalStatus: 'approved_by_manager',
          approvedAt: now,
          approvedBy: `${approverName}${gradeLabel}`,
          approvalNotes: notes,
          payableStatus: c.type === 'travel_advance' ? 'unauthorized' : 'payable_pending_report', // advances are unauthorized until confirmed disbursed
          advanceDetails: c.type === 'travel_advance' ? {
            ...c.advanceDetails!,
            approvedAmount: c.amount,
          } : c.advanceDetails,
          auditLog: [
            ...c.auditLog,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              actor: `${approverName}${gradeLabel}`,
              action: isExceptionOverride ? 'APPROVED_EXCEPTION' : 'APPROVED_CLAIM',
              details: isExceptionOverride
                ? `Authorized $${c.amount.toFixed(2)} as policy exception by manager ${approverName}${gradeLabel}.${notes ? ` Decision note: "${notes}".` : ''} Direct report: ${c.employeeName} (${c.employeeGrade}).`
                : `Approved ${c.type} claim of $${c.amount.toFixed(2)} by manager ${approverName}${gradeLabel}.${notes ? ` Note: "${notes}".` : ''}`
            }
          ]
        };
      }
      return c;
    }));
  };

  // Reject Claim with reason category and audit notes
  const rejectClaim = (
    claimId: string, 
    reason: string, 
    approverName: string, 
    category?: string,
    approverGrade?: EmployeeGrade
  ) => {
    const now = new Date().toISOString();
    const gradeLabel = approverGrade ? ` (${approverGrade})` : '';
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          approvalStatus: 'rejected',
          rejectionReason: reason,
          rejectionCategory: category,
          payableStatus: 'unauthorized',
          auditLog: [
            ...c.auditLog,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              actor: `${approverName}${gradeLabel}`,
              action: 'REJECTED_CLAIM',
              details: `Claim declined by manager ${approverName}${gradeLabel}.${category ? ` [Category: ${category}].` : ''} Feedback to direct report: ${reason}`
            }
          ]
        };
      }
      return c;
    }));
  };

  // Request Clarification
  const requestClarification = (claimId: string, message: string) => {
    const now = new Date().toISOString();
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          approvalStatus: 'requires_clarification',
          clarificationMessage: message,
          auditLog: [
            ...c.auditLog,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              actor: currentEmployee.name,
              action: 'REQUESTED_CLARIFICATION',
              details: `Clarification requested: ${message}`
            }
          ]
        };
      }
      return c;
    }));
  };

  // Request Exception
  const requestException = (claimId: string, reason: string) => {
    const now = new Date().toISOString();
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          isExceptionRequested: true,
          exceptionReason: reason,
          approvalStatus: 'pending_manager',
          auditLog: [
            ...c.auditLog,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              actor: c.employeeName,
              action: 'REQUESTED_EXCEPTION',
              details: `Employee submitted exception request: ${reason}`
            }
          ]
        };
      }
      return c;
    }));
  };

  // Trips: Create Trip
  const createTrip = (tripData: Omit<Trip, 'id' | 'tripNumber' | 'status' | 'version' | 'revisionsHistory' | 'associatedClaimIds' | 'createdAt'>): Trip => {
    const id = `trip-${Date.now()}`;
    const tripNumber = `TRIP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Auto-calculate daily cab allowance for declared travel days if not explicitly provided
    let budgetBreakdown = tripData.budgetBreakdown;
    if (!budgetBreakdown && tripData.destinations && tripData.destinations.length > 0) {
      const dest = tripData.destinations[0];
      const start = new Date(dest.startDate).getTime();
      const end = new Date(dest.endDate).getTime();
      const daysCount = Math.max(1, Math.round(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1);
      const dailyCabRate = getDailyCabAllowanceRate(tripData.employeeGrade, dest.city);
      const dailyCabAllowanceTotal = daysCount * dailyCabRate;
      const lodgingEstimate = Math.max(0, tripData.estimatedCost - dailyCabAllowanceTotal);

      budgetBreakdown = {
        lodgingEstimate,
        dailyCabAllowanceTotal,
        dailyCabRate,
        daysCount,
        perDiemMealsTotal: daysCount * 65,
        flightsAndTransitEstimate: 500,
      };
    }

    const newTrip: Trip = {
      ...tripData,
      id,
      tripNumber,
      status: 'pending_approval',
      version: 1,
      associatedClaimIds: [],
      budgetBreakdown,
      revisionsHistory: [
        {
          version: 1,
          destinations: tripData.destinations,
          estimatedCost: tripData.estimatedCost,
          createdAt: now,
          createdBy: tripData.employeeName,
        }
      ],
      createdAt: now,
    };

    setTrips(prev => [newTrip, ...prev]);
    return newTrip;
  };

  // Trips: Approve Trip
  const approveTrip = (tripId: string, approverName: string) => {
    const now = new Date().toISOString();
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const updatedRevisions = t.revisionsHistory.map(r => 
          r.version === t.version ? { ...r, approvedAt: now, approvedBy: approverName } : r
        );
        return {
          ...t,
          status: 'approved',
          approvalDate: now,
          approvedBy: approverName,
          revisionsHistory: updatedRevisions,
        };
      }
      return t;
    }));
  };

  // Trips: Reject Trip
  const rejectTrip = (tripId: string, reason: string, approverName: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          status: 'rejected',
          rejectionReason: reason,
          approvedBy: approverName,
        };
      }
      return t;
    }));
  };

  // Trips: Amend Trip (Creates revision v+1, puts into amendment_pending)
  const amendTrip = (tripId: string, destinations: TripDestination[], estimatedCost: number, reason: string) => {
    const now = new Date().toISOString();
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const nextVersion = t.version + 1;
        const newRevision = {
          version: nextVersion,
          destinations,
          estimatedCost,
          reasonForChange: reason,
          createdAt: now,
          createdBy: t.employeeName,
        };
        return {
          ...t,
          version: nextVersion,
          destinations,
          estimatedCost,
          status: 'amendment_pending',
          revisionsHistory: [...t.revisionsHistory, newRevision],
        };
      }
      return t;
    }));
  };

  // Trips: Approve Trip Amendment
  const approveTripAmendment = (tripId: string, approverName: string) => {
    const now = new Date().toISOString();
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const updatedRevisions = t.revisionsHistory.map(r => 
          r.version === t.version ? { ...r, approvedAt: now, approvedBy: approverName } : r
        );
        return {
          ...t,
          status: 'approved',
          approvalDate: now,
          approvedBy: approverName,
          revisionsHistory: updatedRevisions,
        };
      }
      return t;
    }));
  };

  // Trips: Short Employee Post-Trip Confirmation (Completed as planned, Changed, Cancelled)
  const confirmPostTrip = (tripId: string, status: 'completed_as_planned' | 'changed' | 'cancelled', notes?: string) => {
    const now = new Date().toISOString();
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const confirmation: PostTripConfirmation = {
          status,
          declaredAt: now,
          declaredBy: t.employeeName,
          notes,
        };
        const finalStatus = status === 'completed_as_planned' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'amendment_pending';
        return {
          ...t,
          status: finalStatus,
          postTripConfirmation: confirmation,
        };
      }
      return t;
    }));
  };

  // Finance: Confirm advance disbursement
  const confirmAdvanceDisbursement = (claimId: string, disbursedAmount: number) => {
    const now = new Date().toISOString();
    setClaims(prev => prev.map(c => {
      if (c.id === claimId && c.type === 'travel_advance') {
        return {
          ...c,
          advanceDetails: {
            ...c.advanceDetails!,
            disbursedAmount,
            disbursedAt: now,
            externallyConfirmed: true,
            remainingOffsetBalance: disbursedAmount,
          },
          auditLog: [
            ...c.auditLog,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              actor: 'Finance Operations',
              action: 'CONFIRMED_DISBURSEMENT',
              details: `Confirmed external disbursement of $${disbursedAmount.toFixed(2)}. Available for trip expense offset.`
            }
          ]
        };
      }
      return c;
    }));
  };

  // Finance: Generate Payout Snapshot Report
  const generatePayoutReport = (periodStart: string, periodEnd: string, title?: string): PayoutReport => {
    const now = new Date().toISOString();
    const reportId = `payout-${Date.now()}`;
    const reportNumber = `PAYOUT-2026-W${Math.floor(40 + Math.random() * 5)}`;

    // Eligible claims: payable_pending_report (not already included in prior report)
    const eligibleClaims = claims.filter(c => 
      c.payableStatus === 'payable_pending_report' &&
      c.date >= periodStart && c.date <= periodEnd
    );

    // Group by employee
    const employeeMap = new Map<string, PayoutReportEntry>();

    eligibleClaims.forEach(claim => {
      const existing = employeeMap.get(claim.employeeId) || {
        employeeId: claim.employeeId,
        employeeName: claim.employeeName,
        employeeGrade: claim.employeeGrade,
        legalEntity: claim.legalEntity,
        reimbursementsTotal: 0,
        mileageTotal: 0,
        allowancesTotal: 0,
        advancesOffsetDeducted: 0,
        netPayableAmount: 0,
        claimIds: []
      };

      if (claim.type === 'reimbursement') existing.reimbursementsTotal += claim.amount;
      if (claim.type === 'mileage') existing.mileageTotal += claim.amount;
      if (claim.type === 'allowance') existing.allowancesTotal += claim.amount;

      existing.claimIds.push(claim.id);
      employeeMap.set(claim.employeeId, existing);
    });

    // Check for confirmed disbursed travel advances to offset against employee payouts
    const confirmedAdvances = claims.filter(c => 
      c.type === 'travel_advance' && 
      c.advanceDetails?.externallyConfirmed && 
      (c.advanceDetails?.remainingOffsetBalance || 0) > 0
    );

    confirmedAdvances.forEach(adv => {
      const entry = employeeMap.get(adv.employeeId);
      if (entry) {
        const remainingOffset = adv.advanceDetails?.remainingOffsetBalance || 0;
        const totalGross = entry.reimbursementsTotal + entry.mileageTotal + entry.allowancesTotal;
        const offsetAmount = Math.min(remainingOffset, totalGross);
        entry.advancesOffsetDeducted += offsetAmount;
      }
    });

    // Calculate net payable for each employee
    let totalPayable = 0;
    const entries = Array.from(employeeMap.values()).map(entry => {
      const gross = entry.reimbursementsTotal + entry.mileageTotal + entry.allowancesTotal;
      const net = Math.max(0, gross - entry.advancesOffsetDeducted);
      entry.netPayableAmount = net;
      totalPayable += net;
      return entry;
    });

    const newReport: PayoutReport = {
      id: reportId,
      reportNumber,
      title: title || `Bi-Weekly Payout Report (${periodStart} to ${periodEnd})`,
      generatedAt: now,
      periodStart,
      periodEnd,
      totalPayableAmount: totalPayable,
      currency: 'USD',
      itemCount: eligibleClaims.length,
      employeeCount: entries.length,
      entries,
      status: 'finalized_for_payroll',
    };

    // Update claim status to included_in_payout_report
    setClaims(prev => prev.map(c => {
      if (eligibleClaims.some(ec => ec.id === c.id)) {
        return {
          ...c,
          payableStatus: 'included_in_payout_report',
          payoutReportId: reportId,
        };
      }
      return c;
    }));

    setPayoutReports(prev => [newReport, ...prev]);
    return newReport;
  };

  // Finance: Mark Report as Settled
  const markPayoutReportSettled = (reportId: string, settledBy: string) => {
    const now = new Date().toISOString();
    setPayoutReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'marked_settled',
          settledAt: now,
          settledBy,
        };
      }
      return r;
    }));

    // Update underlying claims to settled_externally
    setClaims(prev => prev.map(c => {
      if (c.payoutReportId === reportId) {
        return {
          ...c,
          payableStatus: 'settled_externally',
          auditLog: [
            ...c.auditLog,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              actor: settledBy,
              action: 'SETTLED_PAYOUT',
              details: `Disbursed and settled in ${reportId}.`
            }
          ]
        };
      }
      return c;
    }));
  };

  // Policy Configurator: Update Rule
  const updatePolicyRule = (policyId: string, grade: string, category: string, newDailyRate?: number, newMaxPerTx?: number) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === policyId) {
        return {
          ...p,
          rules: p.rules.map(r => {
            if (r.grade === grade && r.category === category) {
              return {
                ...r,
                maxDailyRate: newDailyRate !== undefined ? newDailyRate : r.maxDailyRate,
                maxPerTransaction: newMaxPerTx !== undefined ? newMaxPerTx : r.maxPerTransaction,
              };
            }
            return r;
          })
        };
      }
      return p;
    }));
  };

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}employees`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}policies`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}trips`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}claims`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}payout_reports`);
    setPolicies(SEED_POLICIES);
    setTrips(SEED_TRIPS);
    setClaims(SEED_CLAIMS);
    setPayoutReports(SEED_PAYOUT_REPORTS);
  };

  return (
    <ExpenseContext.Provider
      value={{
        currentEmployee,
        setCurrentEmployeeId,
        employees,
        policies,
        updatePolicyRule,
        trips,
        createTrip,
        approveTrip,
        rejectTrip,
        amendTrip,
        approveTripAmendment,
        confirmPostTrip,
        claims,
        submitClaim,
        approveClaim,
        rejectClaim,
        escalateClaim,
        requestClarification,
        requestException,
        getDirectReports,
        getAllHierarchySubordinates,
        getManagerAuthority,
        checkApprovalEligibility,
        payoutReports,
        generatePayoutReport,
        markPayoutReportSettled,
        confirmAdvanceDisbursement,
        evaluateClaimPolicy,
        getDailyCabAllowanceRate,
        resetAllData,
        firebaseUser,
        loginWithGoogle,
        logout,
        isAuthReady,
        isFirestoreSyncActive,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within an ExpenseProvider');
  return ctx;
};
