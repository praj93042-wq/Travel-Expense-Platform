export type EmployeeGrade = 
  | 'Executive' 
  | 'Senior (Band C)' 
  | 'Mid-level (Band B)' 
  | 'Associate (Band A)';

export type LegalEntity = 
  | 'Patty US Inc' 
  | 'Patty UK Ltd' 
  | 'Patty SG Pte';

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roleTitle: string;
  grade: EmployeeGrade;
  legalEntity: LegalEntity;
  location: string;
  department: 'Engineering' | 'Sales & Growth' | 'Product & Design' | 'Operations';
  managerId: string;
  managerName: string;
}

export type ClaimType = 
  | 'reimbursement' 
  | 'travel_advance' 
  | 'mileage' 
  | 'allowance';

export type ClaimCategory =
  | 'Meals & Entertainment'
  | 'Hotel & Lodging'
  | 'Ground Transport / Taxi'
  | 'Flights'
  | 'Mileage'
  | 'Per Diem / Allowance'
  | 'Office & Equipment'
  | 'Software & Subscriptions';

export type PolicyAssessmentStatus =
  | 'eligible_auto_authorized'
  | 'eligible_pending_manager_approval'
  | 'pending_exception_review'
  | 'policy_violation'
  | 'missing_information';

export type ApprovalStatus =
  | 'auto_authorized'
  | 'pending_manager'
  | 'approved_by_manager'
  | 'rejected'
  | 'requires_clarification';

export type PayableStatus =
  | 'unauthorized'
  | 'payable_pending_report'
  | 'included_in_payout_report'
  | 'settled_externally';

export type SubmissionChannel =
  | 'web_portal'
  | 'whatsapp'
  | 'slack'
  | 'teams'
  | 'mobile';

export interface ReceiptEvidence {
  name: string;
  url: string;
  size: string;
  mimeType: string;
  merchantName?: string;
  date?: string;
  total?: number;
  tax?: number;
  currency?: string;
  lineItems?: { description: string; amount: number }[];
  confidenceScore?: number;
  hash?: string;
}

export interface MileageDetails {
  distanceKm: number;
  vehicleType: 'personal_car' | 'motorcycle' | 'electric_vehicle';
  ratePerKm: number;
  fromLocation: string;
  toLocation: string;
  routeEvidenceNote?: string;
}

export interface AllowanceDetails {
  days: number;
  dailyRate: number;
  destinationCity: string;
  activityType: 'business_travel' | 'client_onsite' | 'training_seminar';
  declarationAgreed: boolean;
  allowanceSubType?: 'meals_incidentals' | 'daily_cab_allowance';
}

export interface TravelAdvanceDetails {
  estimatedBudget: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  disbursedAt?: string;
  externallyConfirmed: boolean;
  remainingOffsetBalance?: number;
}

export interface PolicyAssessment {
  status: PolicyAssessmentStatus;
  policyVersion: string;
  matchedRuleName: string;
  maxAllowedAmount?: number;
  excessAmount?: number;
  explanation: string;
  flags: string[];
  requiresManagerApproval: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  type: ClaimType;
  employeeId: string;
  employeeName: string;
  employeeGrade: EmployeeGrade;
  legalEntity: LegalEntity;
  location: string;
  tripId?: string;
  tripNumber?: string;
  date: string;
  amount: number;
  currency: string;
  category: ClaimCategory;
  businessPurpose: string;
  merchantName?: string;
  receipt?: ReceiptEvidence;
  mileageDetails?: MileageDetails;
  allowanceDetails?: AllowanceDetails;
  advanceDetails?: TravelAdvanceDetails;
  policyAssessment: PolicyAssessment;
  approvalStatus: ApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  clarificationMessage?: string;
  isExceptionRequested?: boolean;
  exceptionReason?: string;
  tags?: string[];
  submissionChannel: SubmissionChannel;
  payableStatus: PayableStatus;
  payoutReportId?: string;
  escalatedToManagerId?: string;
  escalatedToManagerName?: string;
  escalationReason?: string;
  approvalNotes?: string;
  rejectionCategory?: string;
  auditLog: AuditEntry[];
}

export interface ManagerApprovalAuthority {
  grade: EmployeeGrade;
  title: string;
  signingLimit: number; // Max amount per claim the manager can authorize (e.g. 1500 for Band C, Infinity for Executive)
  subordinateGradesAllowed: EmployeeGrade[];
  canApproveExceptions: boolean;
  canApproveAdvances: boolean;
  description: string;
}

export const GRADE_APPROVAL_AUTHORITIES: Record<EmployeeGrade, ManagerApprovalAuthority> = {
  'Executive': {
    grade: 'Executive',
    title: 'Executive Level (C-Suite / VP / Director)',
    signingLimit: Infinity,
    subordinateGradesAllowed: ['Executive', 'Senior (Band C)', 'Mid-level (Band B)', 'Associate (Band A)'],
    canApproveExceptions: true,
    canApproveAdvances: true,
    description: 'Unlimited financial signing authority. Authorizes all subordinate grades, exceptions, and high-value advances.',
  },
  'Senior (Band C)': {
    grade: 'Senior (Band C)',
    title: 'Senior Management / Staff Lead (Band C)',
    signingLimit: 1500.00,
    subordinateGradesAllowed: ['Mid-level (Band B)', 'Associate (Band A)'],
    canApproveExceptions: true,
    canApproveAdvances: true,
    description: 'Financial signing authority up to $1,500.00 per claim. Authorizes Band B & A direct reports. Higher claims must be escalated to Executive.',
  },
  'Mid-level (Band B)': {
    grade: 'Mid-level (Band B)',
    title: 'Team Lead / Supervisor (Band B)',
    signingLimit: 300.00,
    subordinateGradesAllowed: ['Associate (Band A)'],
    canApproveExceptions: false,
    canApproveAdvances: false,
    description: 'Financial signing authority up to $300.00 per claim for Associate direct reports. Over-limit claims or exceptions must be escalated.',
  },
  'Associate (Band A)': {
    grade: 'Associate (Band A)',
    title: 'Individual Contributor (Band A)',
    signingLimit: 0,
    subordinateGradesAllowed: [],
    canApproveExceptions: false,
    canApproveAdvances: false,
    description: 'Individual contributor. No managerial approval authority.',
  },
};

export type TripStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'amendment_pending'
  | 'completed'
  | 'cancelled';

export interface TripDestination {
  city: string;
  country: string;
  startDate: string;
  endDate: string;
}

export interface PostTripConfirmation {
  status: 'completed_as_planned' | 'changed' | 'cancelled';
  declaredAt: string;
  declaredBy: string;
  notes?: string;
}

export interface TripRevision {
  version: number;
  destinations: TripDestination[];
  estimatedCost: number;
  reasonForChange?: string;
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Trip {
  id: string;
  tripNumber: string;
  employeeId: string;
  employeeName: string;
  employeeGrade: EmployeeGrade;
  department: string;
  purpose: string;
  destinations: TripDestination[];
  status: TripStatus;
  version: number;
  estimatedCost: number;
  approvalDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  postTripConfirmation?: PostTripConfirmation;
  revisionsHistory: TripRevision[];
  associatedClaimIds: string[];
  createdAt: string;
  budgetBreakdown?: {
    lodgingEstimate: number;
    dailyCabAllowanceTotal: number;
    dailyCabRate: number;
    daysCount: number;
    perDiemMealsTotal: number;
    flightsAndTransitEstimate: number;
  };
}

export interface GradePolicyRule {
  grade: EmployeeGrade;
  category: ClaimCategory;
  maxPerTransaction?: number;
  maxDailyRate?: number;
  autoApprovalAllowed: boolean; // only for employee-paid reimbursements within limit!
  requiresReceipt: boolean;
  currency: string;
}

export interface ExpensePolicy {
  id: string;
  name: string;
  legalEntity: LegalEntity | 'ALL';
  location: string;
  version: string;
  isDefault: boolean;
  rules: GradePolicyRule[];
  mileageRates: { vehicleType: string; ratePerKm: number; currency: string }[];
  allowanceRates: { destination: string; grade: EmployeeGrade; dailyRate: number; currency: string }[];
}

export interface PayoutReportEntry {
  employeeId: string;
  employeeName: string;
  employeeGrade: EmployeeGrade;
  legalEntity: LegalEntity;
  reimbursementsTotal: number;
  mileageTotal: number;
  allowancesTotal: number;
  advancesOffsetDeducted: number;
  netPayableAmount: number;
  claimIds: string[];
}

export interface PayoutReport {
  id: string;
  reportNumber: string;
  title: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  totalPayableAmount: number;
  currency: string;
  itemCount: number;
  employeeCount: number;
  entries: PayoutReportEntry[];
  status: 'draft' | 'finalized_for_payroll' | 'exported_to_bank' | 'marked_settled';
  settledAt?: string;
  settledBy?: string;
}
