import { Employee, ExpenseClaim, ExpensePolicy, Trip, PayoutReport } from '../types';

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    name: 'Marcus Vance',
    email: 'marcus.vance@pattyworkforce.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Full-Stack Software Engineer',
    grade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    department: 'Engineering',
    managerId: 'emp-002',
    managerName: 'Elena Rostova',
  },
  {
    id: 'emp-002',
    name: 'Elena Rostova',
    email: 'elena.rostova@pattyworkforce.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Director of Engineering',
    grade: 'Executive',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    department: 'Engineering',
    managerId: 'emp-005',
    managerName: 'Sarah Jenkins',
  },
  {
    id: 'emp-003',
    name: 'Priya Sharma',
    email: 'priya.sharma@pattyworkforce.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Staff Infrastructure Architect',
    grade: 'Senior (Band C)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    department: 'Engineering',
    managerId: 'emp-002',
    managerName: 'Elena Rostova',
  },
  {
    id: 'emp-004',
    name: 'Liam Davies',
    email: 'liam.davies@pattyworkforce.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Enterprise Account Executive',
    grade: 'Associate (Band A)',
    legalEntity: 'Patty UK Ltd',
    location: 'London, UK',
    department: 'Sales & Growth',
    managerId: 'emp-005',
    managerName: 'Sarah Jenkins',
  },
  {
    id: 'emp-005',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@pattyworkforce.com',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'VP Finance & Operations',
    grade: 'Executive',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    department: 'Operations',
    managerId: '',
    managerName: 'Board of Directors',
  },
  {
    id: 'emp-006',
    name: 'Chloe Lin',
    email: 'chloe.lin@pattyworkforce.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    roleTitle: 'Associate Cloud Engineer',
    grade: 'Associate (Band A)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    department: 'Engineering',
    managerId: 'emp-003',
    managerName: 'Priya Sharma',
  },
];

export const SEED_POLICIES: ExpensePolicy[] = [
  {
    id: 'pol-us-01',
    name: 'Patty US Domestic Policy (Entity: US)',
    legalEntity: 'Patty US Inc',
    location: 'United States',
    version: '2026.3',
    isDefault: false,
    rules: [
      // Executive
      { grade: 'Executive', category: 'Meals & Entertainment', maxDailyRate: 120, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Executive', category: 'Hotel & Lodging', maxDailyRate: 350, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Executive', category: 'Ground Transport / Taxi', maxPerTransaction: 80, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Executive', category: 'Flights', maxPerTransaction: 1800, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Executive', category: 'Office & Equipment', maxPerTransaction: 300, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Executive', category: 'Software & Subscriptions', maxPerTransaction: 250, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      
      // Senior (Band C)
      { grade: 'Senior (Band C)', category: 'Meals & Entertainment', maxDailyRate: 85, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Senior (Band C)', category: 'Hotel & Lodging', maxDailyRate: 275, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Senior (Band C)', category: 'Ground Transport / Taxi', maxPerTransaction: 65, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Senior (Band C)', category: 'Flights', maxPerTransaction: 1200, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Senior (Band C)', category: 'Office & Equipment', maxPerTransaction: 200, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Senior (Band C)', category: 'Software & Subscriptions', maxPerTransaction: 150, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },

      // Mid-level (Band B)
      { grade: 'Mid-level (Band B)', category: 'Meals & Entertainment', maxDailyRate: 65, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Mid-level (Band B)', category: 'Hotel & Lodging', maxDailyRate: 220, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Mid-level (Band B)', category: 'Ground Transport / Taxi', maxPerTransaction: 50, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Mid-level (Band B)', category: 'Flights', maxPerTransaction: 900, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Mid-level (Band B)', category: 'Office & Equipment', maxPerTransaction: 150, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Mid-level (Band B)', category: 'Software & Subscriptions', maxPerTransaction: 100, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },

      // Associate (Band A)
      { grade: 'Associate (Band A)', category: 'Meals & Entertainment', maxDailyRate: 50, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Associate (Band A)', category: 'Hotel & Lodging', maxDailyRate: 180, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Associate (Band A)', category: 'Ground Transport / Taxi', maxPerTransaction: 40, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Associate (Band A)', category: 'Flights', maxPerTransaction: 750, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Associate (Band A)', category: 'Office & Equipment', maxPerTransaction: 100, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Associate (Band A)', category: 'Software & Subscriptions', maxPerTransaction: 75, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
    ],
    mileageRates: [
      { vehicleType: 'personal_car', ratePerKm: 0.68, currency: 'USD' },
      { vehicleType: 'electric_vehicle', ratePerKm: 0.72, currency: 'USD' },
      { vehicleType: 'motorcycle', ratePerKm: 0.35, currency: 'USD' },
    ],
    allowanceRates: [
      { destination: 'San Francisco, US', grade: 'Executive', dailyRate: 110, currency: 'USD' },
      { destination: 'San Francisco, US', grade: 'Senior (Band C)', dailyRate: 90, currency: 'USD' },
      { destination: 'San Francisco, US', grade: 'Mid-level (Band B)', dailyRate: 75, currency: 'USD' },
      { destination: 'San Francisco, US', grade: 'Associate (Band A)', dailyRate: 65, currency: 'USD' },
      { destination: 'London, UK', grade: 'Mid-level (Band B)', dailyRate: 80, currency: 'USD' },
      { destination: 'Default US City', grade: 'Mid-level (Band B)', dailyRate: 65, currency: 'USD' },
    ]
  },
  {
    id: 'pol-uk-01',
    name: 'Patty UK Entity Policy (Entity: UK)',
    legalEntity: 'Patty UK Ltd',
    location: 'United Kingdom',
    version: '2026.2',
    isDefault: false,
    rules: [
      { grade: 'Associate (Band A)', category: 'Meals & Entertainment', maxDailyRate: 40, autoApprovalAllowed: true, requiresReceipt: true, currency: 'GBP' },
      { grade: 'Associate (Band A)', category: 'Hotel & Lodging', maxDailyRate: 140, autoApprovalAllowed: true, requiresReceipt: true, currency: 'GBP' },
      { grade: 'Associate (Band A)', category: 'Ground Transport / Taxi', maxPerTransaction: 30, autoApprovalAllowed: true, requiresReceipt: true, currency: 'GBP' },
    ],
    mileageRates: [
      { vehicleType: 'personal_car', ratePerKm: 0.45, currency: 'GBP' }
    ],
    allowanceRates: [
      { destination: 'London, UK', grade: 'Associate (Band A)', dailyRate: 50, currency: 'GBP' }
    ]
  },
  {
    id: 'pol-default-01',
    name: 'Company-Wide Default Fallback Policy',
    legalEntity: 'ALL',
    location: 'Global',
    version: '2026.1',
    isDefault: true,
    rules: [
      { grade: 'Mid-level (Band B)', category: 'Meals & Entertainment', maxDailyRate: 60, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
      { grade: 'Mid-level (Band B)', category: 'Hotel & Lodging', maxDailyRate: 200, autoApprovalAllowed: true, requiresReceipt: true, currency: 'USD' },
    ],
    mileageRates: [
      { vehicleType: 'personal_car', ratePerKm: 0.60, currency: 'USD' }
    ],
    allowanceRates: [
      { destination: 'Global Default', grade: 'Mid-level (Band B)', dailyRate: 60, currency: 'USD' }
    ]
  }
];

export const SEED_TRIPS: Trip[] = [
  {
    id: 'trip-081',
    tripNumber: 'TRIP-2026-081',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    department: 'Engineering',
    purpose: 'Q4 San Francisco Engineering Summit & AWS Architecture Sync',
    destinations: [
      {
        city: 'San Francisco',
        country: 'United States',
        startDate: '2026-10-12',
        endDate: '2026-10-16',
      }
    ],
    status: 'approved',
    version: 1,
    estimatedCost: 1450,
    approvalDate: '2026-10-02T10:15:00Z',
    approvedBy: 'Elena Rostova',
    revisionsHistory: [
      {
        version: 1,
        destinations: [
          {
            city: 'San Francisco',
            country: 'United States',
            startDate: '2026-10-12',
            endDate: '2026-10-16',
          }
        ],
        estimatedCost: 1450,
        createdAt: '2026-10-01T14:00:00Z',
        createdBy: 'Marcus Vance',
        approvedAt: '2026-10-02T10:15:00Z',
        approvedBy: 'Elena Rostova',
      }
    ],
    associatedClaimIds: ['exp-101', 'exp-102', 'exp-103', 'exp-105'],
    createdAt: '2026-10-01T14:00:00Z',
  },
  {
    id: 'trip-092',
    tripNumber: 'TRIP-2026-092',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    department: 'Engineering',
    purpose: 'London Patty AI Integration Workshop & UK Tech Sync',
    destinations: [
      {
        city: 'London',
        country: 'United Kingdom',
        startDate: '2026-11-04',
        endDate: '2026-11-09',
      }
    ],
    status: 'amendment_pending',
    version: 2,
    estimatedCost: 2100,
    revisionsHistory: [
      {
        version: 1,
        destinations: [
          {
            city: 'London',
            country: 'United Kingdom',
            startDate: '2026-11-04',
            endDate: '2026-11-06',
          }
        ],
        estimatedCost: 1700,
        createdAt: '2026-09-28T09:00:00Z',
        createdBy: 'Marcus Vance',
        approvedAt: '2026-09-29T11:00:00Z',
        approvedBy: 'Elena Rostova',
      },
      {
        version: 2,
        destinations: [
          {
            city: 'London',
            country: 'United Kingdom',
            startDate: '2026-11-04',
            endDate: '2026-11-09',
          }
        ],
        estimatedCost: 2100,
        reasonForChange: 'Extended by 3 days for security compliance sprint with UK team lead',
        createdAt: '2026-10-02T15:30:00Z',
        createdBy: 'Marcus Vance',
      }
    ],
    associatedClaimIds: ['exp-104'],
    createdAt: '2026-09-28T09:00:00Z',
  },
  {
    id: 'trip-077',
    tripNumber: 'TRIP-2026-077',
    employeeId: 'emp-003',
    employeeName: 'Priya Sharma',
    employeeGrade: 'Senior (Band C)',
    department: 'Engineering',
    purpose: 'Austin Distributed Systems Conference & Keynote',
    destinations: [
      {
        city: 'Austin',
        country: 'United States',
        startDate: '2026-09-20',
        endDate: '2026-09-24',
      }
    ],
    status: 'completed',
    version: 1,
    estimatedCost: 1650,
    approvalDate: '2026-09-10T11:00:00Z',
    approvedBy: 'Elena Rostova',
    postTripConfirmation: {
      status: 'completed_as_planned',
      declaredAt: '2026-09-25T08:30:00Z',
      declaredBy: 'Priya Sharma',
      notes: 'Delivered talk and met 3 potential staff engineer recruits.'
    },
    revisionsHistory: [
      {
        version: 1,
        destinations: [
          {
            city: 'Austin',
            country: 'United States',
            startDate: '2026-09-20',
            endDate: '2026-09-24',
          }
        ],
        estimatedCost: 1650,
        createdAt: '2026-09-08T10:00:00Z',
        createdBy: 'Priya Sharma',
        approvedAt: '2026-09-10T11:00:00Z',
        approvedBy: 'Elena Rostova',
      }
    ],
    associatedClaimIds: ['exp-201', 'exp-202'],
    createdAt: '2026-09-08T10:00:00Z',
  },
  {
    id: 'trip-104',
    tripNumber: 'TRIP-2026-104',
    employeeId: 'emp-004',
    employeeName: 'Liam Davies',
    employeeGrade: 'Associate (Band A)',
    department: 'Sales & Growth',
    purpose: 'Enterprise Client Pitch Tour in Northern UK',
    destinations: [
      {
        city: 'Manchester',
        country: 'United Kingdom',
        startDate: '2026-10-20',
        endDate: '2026-10-23',
      }
    ],
    status: 'pending_approval',
    version: 1,
    estimatedCost: 850,
    revisionsHistory: [
      {
        version: 1,
        destinations: [
          {
            city: 'Manchester',
            country: 'United Kingdom',
            startDate: '2026-10-20',
            endDate: '2026-10-23',
          }
        ],
        estimatedCost: 850,
        createdAt: '2026-10-01T16:00:00Z',
        createdBy: 'Liam Davies',
      }
    ],
    associatedClaimIds: [],
    createdAt: '2026-10-01T16:00:00Z',
  }
];

export const SEED_CLAIMS: ExpenseClaim[] = [
  // 1. Employee-paid reimbursement WITHIN POLICY -> AUTO-AUTHORIZED
  {
    id: 'exp-101',
    claimNumber: 'EXP-9041',
    type: 'reimbursement',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    tripId: 'trip-081',
    tripNumber: 'TRIP-2026-081',
    date: '2026-10-13',
    amount: 54.20,
    currency: 'USD',
    category: 'Meals & Entertainment',
    businessPurpose: 'Dinner during SF Summit while discussing architecture migration roadmap',
    merchantName: 'The Grove Yerba Buena',
    receipt: {
      name: 'the_grove_dinner_receipt.pdf',
      url: 'https://images.unsplash.com/photo-1554415707-9e49fe74a661?w=400&auto=format&fit=crop&q=80',
      size: '240 KB',
      mimeType: 'application/pdf',
      merchantName: 'The Grove Yerba Buena',
      date: '2026-10-13',
      total: 54.20,
      tax: 4.80,
      currency: 'USD',
      confidenceScore: 0.98,
      lineItems: [
        { description: 'Roasted Salmon Bowl', amount: 32.00 },
        { description: 'San Pellegrino Sparkling', amount: 6.50 },
        { description: 'Artisan Berry Tart', amount: 10.90 }
      ]
    },
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.3',
      matchedRuleName: 'Mid-level (Band B) Meals Cap ($65.00/day)',
      maxAllowedAmount: 65.00,
      explanation: 'Eligible employee-paid reimbursement ($54.20) within Mid-level Band B meal limit ($65.00). Complies with Patty US domestic policy. Auto-authorized without requiring manager sign-off.',
      flags: ['in_policy', 'receipt_verified', 'approved_trip_linked'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'auto_authorized',
    approvedAt: '2026-10-13T20:45:00Z',
    approvedBy: 'Patty Policy Engine (Rule: US-B-MEAL-65)',
    tags: ['Client Lunch', 'Project X'],
    submissionChannel: 'web_portal',
    payableStatus: 'payable_pending_report',
    auditLog: [
      {
        id: 'aud-101-1',
        timestamp: '2026-10-13T20:44:30Z',
        actor: 'Marcus Vance',
        action: 'SUBMITTED_CLAIM',
        details: 'Uploaded receipt from Web Portal with trip TRIP-2026-081'
      },
      {
        id: 'aud-101-2',
        timestamp: '2026-10-13T20:45:00Z',
        actor: 'Patty Policy Engine',
        action: 'AUTO_AUTHORIZED',
        details: 'Rule US-B-MEAL-65 satisfied ($54.20 <= $65.00). Payable created.'
      }
    ]
  },

  // 2. MILEAGE claim -> MANDATORY MANAGER APPROVAL (even though within policy)
  {
    id: 'exp-102',
    claimNumber: 'EXP-9042',
    type: 'mileage',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    tripId: 'trip-081',
    tripNumber: 'TRIP-2026-081',
    date: '2026-10-14',
    amount: 30.60,
    currency: 'USD',
    category: 'Mileage',
    businessPurpose: 'Drive from SF downtown hotel to Palo Alto client datacenter for latency benchmark test',
    mileageDetails: {
      distanceKm: 45.0,
      vehicleType: 'personal_car',
      ratePerKm: 0.68,
      fromLocation: 'Marriott Marquis San Francisco',
      toLocation: 'Equinix SV5 Datacenter, San Jose/Palo Alto',
      routeEvidenceNote: 'US-101 Southbound route verified (45.0 km round trip segment)'
    },
    policyAssessment: {
      status: 'eligible_pending_manager_approval',
      policyVersion: '2026.3',
      matchedRuleName: 'Standard Vehicle Mileage ($0.68/km)',
      maxAllowedAmount: 30.60,
      explanation: 'Calculated 45 km @ $0.68/km = $30.60. Mileage claims require mandatory manager approval before payable inclusion per company policy.',
      flags: ['mandatory_manager_approval', 'valid_distance_rate'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    submissionChannel: 'whatsapp',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-102-1',
        timestamp: '2026-10-14T17:10:00Z',
        actor: 'Marcus Vance (via WhatsApp)',
        action: 'SUBMITTED_MILEAGE',
        details: 'Submitted 45 km personal car trip. Verified rate $0.68/km.'
      },
      {
        id: 'aud-102-2',
        timestamp: '2026-10-14T17:10:05Z',
        actor: 'Patty Policy Engine',
        action: 'ROUTED_FOR_APPROVAL',
        details: 'Mileage claims cannot be auto-authorized. Routed to Elena Rostova.'
      }
    ]
  },

  // 3. ALLOWANCE / PER DIEM claim -> MANDATORY MANAGER APPROVAL
  {
    id: 'exp-103',
    claimNumber: 'EXP-9043',
    type: 'allowance',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    tripId: 'trip-081',
    tripNumber: 'TRIP-2026-081',
    date: '2026-10-15',
    amount: 150.00,
    currency: 'USD',
    category: 'Per Diem / Allowance',
    businessPurpose: 'Daily travel allowance for 2 days on-site SF Summit customer meetings',
    allowanceDetails: {
      days: 2,
      dailyRate: 75.00,
      destinationCity: 'San Francisco, US',
      activityType: 'business_travel',
      declarationAgreed: true,
    },
    policyAssessment: {
      status: 'eligible_pending_manager_approval',
      policyVersion: '2026.3',
      matchedRuleName: 'SF High-Cost Tier Allowance ($75.00/day Band B)',
      maxAllowedAmount: 150.00,
      explanation: 'Calculated 2 days @ $75.00/day = $150.00. Per Diem allowances require mandatory manager approval before payable authorization.',
      flags: ['mandatory_manager_approval', 'destination_rate_matched'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-103-1',
        timestamp: '2026-10-15T09:00:00Z',
        actor: 'Marcus Vance',
        action: 'SUBMITTED_ALLOWANCE',
        details: 'Attested 2 days in San Francisco. Awaiting manager approval.'
      }
    ]
  },

  // 4. TRAVEL ADVANCE request -> MANDATORY MANAGER APPROVAL before disbursement report
  {
    id: 'exp-104',
    claimNumber: 'EXP-9044',
    type: 'travel_advance',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    tripId: 'trip-092',
    tripNumber: 'TRIP-2026-092',
    date: '2026-10-02',
    amount: 500.00,
    currency: 'USD',
    category: 'Ground Transport / Taxi',
    businessPurpose: 'Cash advance requested for London underground, airport express, and incidental local transit',
    advanceDetails: {
      estimatedBudget: 2100.00,
      approvedAmount: undefined,
      disbursedAmount: undefined,
      externallyConfirmed: false,
      remainingOffsetBalance: 500.00,
    },
    policyAssessment: {
      status: 'eligible_pending_manager_approval',
      policyVersion: '2026.3',
      matchedRuleName: 'International Travel Advance Request',
      maxAllowedAmount: 600.00,
      explanation: 'Advance request ($500.00) is within 30% of trip budget ($2,100). Requires manager approval before inclusion in Finance advance disbursement schedule.',
      flags: ['mandatory_manager_approval', 'advance_disbursement_guard'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-104-1',
        timestamp: '2026-10-02T16:00:00Z',
        actor: 'Marcus Vance',
        action: 'REQUESTED_ADVANCE',
        details: 'Requested $500.00 cash advance for TRIP-2026-092 London'
      }
    ]
  },

  // 5. EXCEPTION REQUEST: Reimbursement exceeding grade limit with justification
  {
    id: 'exp-105',
    claimNumber: 'EXP-9045',
    type: 'reimbursement',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    tripId: 'trip-081',
    tripNumber: 'TRIP-2026-081',
    date: '2026-10-15',
    amount: 94.50,
    currency: 'USD',
    category: 'Meals & Entertainment',
    businessPurpose: 'Working dinner with 2 Cloudflare enterprise infrastructure partners during summit',
    merchantName: 'Mourad Restaurant SF',
    receipt: {
      name: 'mourad_restaurant_bill.jpg',
      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      size: '1.2 MB',
      mimeType: 'image/jpeg',
      merchantName: 'Mourad Restaurant SF',
      date: '2026-10-15',
      total: 94.50,
      tax: 8.20,
      currency: 'USD',
      confidenceScore: 0.96,
      lineItems: [
        { description: 'Tagine Feast Shared Dinner', amount: 72.00 },
        { description: 'Mint Infusion & Teas', amount: 14.30 }
      ]
    },
    isExceptionRequested: true,
    exceptionReason: 'Dinner was attended by 2 external tech leads from Cloudflare to finalize SDK contract. Band B single meal limit ($65) was exceeded by $29.50 due to hosting partners.',
    tags: ['Client Lunch', 'Project X'],
    policyAssessment: {
      status: 'pending_exception_review',
      policyVersion: '2026.3',
      matchedRuleName: 'Meals & Entertainment Mid-level (Band B) Cap ($65.00)',
      maxAllowedAmount: 65.00,
      excessAmount: 29.50,
      explanation: 'Claim of $94.50 exceeds standard Band B meal limit ($65.00) by $29.50. Employee requested exception review with client justification. Cannot be auto-authorized.',
      flags: ['over_limit', 'exception_requested', 'requires_manager_review'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    submissionChannel: 'slack',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-105-1',
        timestamp: '2026-10-15T22:30:00Z',
        actor: 'Marcus Vance (via Slack #expense-bot)',
        action: 'EXCEPTION_REQUESTED',
        details: 'Submitted $94.50 bill with business justification for $29.50 excess.'
      },
      {
        id: 'aud-105-2',
        timestamp: '2026-10-15T22:30:05Z',
        actor: 'Patty Policy Engine',
        action: 'FLAGGED_EXCEPTION',
        details: 'Hold for Elena Rostova approval. Split authorization or full override permitted.'
      }
    ]
  },

  // 6. PRIYA SHARMA - Austin Conference Hotel (Auto-authorized, included in historical payout)
  {
    id: 'exp-201',
    claimNumber: 'EXP-8890',
    type: 'reimbursement',
    employeeId: 'emp-003',
    employeeName: 'Priya Sharma',
    employeeGrade: 'Senior (Band C)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    tripId: 'trip-077',
    tripNumber: 'TRIP-2026-077',
    date: '2026-09-22',
    amount: 520.00,
    currency: 'USD',
    category: 'Hotel & Lodging',
    businessPurpose: '2 nights lodging at Austin Marriott Downtown for Distributed Systems Conference',
    merchantName: 'Austin Marriott Downtown',
    receipt: {
      name: 'austin_marriott_folio.pdf',
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=80',
      size: '410 KB',
      mimeType: 'application/pdf',
      merchantName: 'Austin Marriott Downtown',
      date: '2026-09-22',
      total: 520.00,
      tax: 42.00,
      currency: 'USD',
      confidenceScore: 0.99,
      lineItems: [
        { description: 'Standard King Room (Night 1)', amount: 239.00 },
        { description: 'Standard King Room (Night 2)', amount: 239.00 }
      ]
    },
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.3',
      matchedRuleName: 'Senior (Band C) Lodging ($275.00/night)',
      maxAllowedAmount: 550.00,
      explanation: 'Lodging rate $260.00/night is below Senior Band C ceiling of $275.00/night. Verified folio attached.',
      flags: ['in_policy', 'receipt_verified'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'auto_authorized',
    approvedAt: '2026-09-23T14:00:00Z',
    approvedBy: 'Patty Policy Engine (Rule: US-C-HOTEL-275)',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    payoutReportId: 'payout-2026-w39',
    auditLog: [
      {
        id: 'aud-201-1',
        timestamp: '2026-09-23T13:58:00Z',
        actor: 'Priya Sharma',
        action: 'SUBMITTED_CLAIM',
        details: 'Submitted lodging invoice against TRIP-2026-077'
      },
      {
        id: 'aud-201-2',
        timestamp: '2026-09-23T14:00:00Z',
        actor: 'Patty Policy Engine',
        action: 'AUTO_AUTHORIZED',
        details: 'Approved automatically per Senior Band C rules.'
      },
      {
        id: 'aud-201-3',
        timestamp: '2026-09-28T17:00:00Z',
        actor: 'Sarah Jenkins',
        action: 'SETTLED',
        details: 'Net payable distributed via Bank ACH in PAYOUT-2026-W39.'
      }
    ]
  },

  // 7. PRIYA SHARMA - Travel Advance Offset Reconciled
  {
    id: 'exp-202',
    claimNumber: 'EXP-8891',
    type: 'travel_advance',
    employeeId: 'emp-003',
    employeeName: 'Priya Sharma',
    employeeGrade: 'Senior (Band C)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    tripId: 'trip-077',
    tripNumber: 'TRIP-2026-077',
    date: '2026-09-15',
    amount: 300.00,
    currency: 'USD',
    category: 'Ground Transport / Taxi',
    businessPurpose: 'Advance for airport transfers and ground transit in Austin',
    advanceDetails: {
      estimatedBudget: 1650.00,
      approvedAmount: 300.00,
      disbursedAmount: 300.00,
      disbursedAt: '2026-09-18T10:00:00Z',
      externallyConfirmed: true,
      remainingOffsetBalance: 0.00, // fully offset!
    },
    policyAssessment: {
      status: 'eligible_pending_manager_approval',
      policyVersion: '2026.3',
      matchedRuleName: 'Standard Advance Request',
      maxAllowedAmount: 300.00,
      explanation: 'Manager approved and finance confirmed external disbursement prior to travel.',
      flags: ['manager_approved', 'disbursement_confirmed', 'reconciled'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'approved_by_manager',
    approvedAt: '2026-09-16T12:00:00Z',
    approvedBy: 'Elena Rostova',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    payoutReportId: 'payout-2026-w39',
    auditLog: [
      {
        id: 'aud-202-1',
        timestamp: '2026-09-15T10:00:00Z',
        actor: 'Priya Sharma',
        action: 'REQUESTED_ADVANCE',
        details: 'Requested $300 advance'
      },
      {
        id: 'aud-202-2',
        timestamp: '2026-09-16T12:00:00Z',
        actor: 'Elena Rostova',
        action: 'APPROVED_ADVANCE',
        details: 'Approved for disbursement'
      },
      {
        id: 'aud-202-3',
        timestamp: '2026-09-28T17:00:00Z',
        actor: 'Patty Reconciliation Service',
        action: 'ADVANCE_OFFSET',
        details: 'Deducted $300.00 advance from Priya Sharma payout in PAYOUT-2026-W39.'
      }
    ]
  },

  // 8. LIAM DAVIES - UK Train tickets (Within policy, auto-authorized)
  {
    id: 'exp-301',
    claimNumber: 'EXP-9050',
    type: 'reimbursement',
    employeeId: 'emp-004',
    employeeName: 'Liam Davies',
    employeeGrade: 'Associate (Band A)',
    legalEntity: 'Patty UK Ltd',
    location: 'London, UK',
    date: '2026-09-30',
    amount: 28.50,
    currency: 'GBP',
    category: 'Ground Transport / Taxi',
    businessPurpose: 'Offpeak return ticket London King\'s Cross to Cambridge for enterprise prospect demo',
    merchantName: 'LNER Rail',
    receipt: {
      name: 'lner_rail_ticket.pdf',
      url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&auto=format&fit=crop&q=80',
      size: '180 KB',
      mimeType: 'application/pdf',
      merchantName: 'LNER Rail',
      date: '2026-09-30',
      total: 28.50,
      currency: 'GBP',
      confidenceScore: 0.97
    },
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Associate Band A Ground Transit (£30.00 max)',
      maxAllowedAmount: 30.00,
      explanation: 'Ticket £28.50 is within Associate Band A transit threshold of £30.00. Auto-authorized per UK policy.',
      flags: ['in_policy', 'receipt_verified'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'auto_authorized',
    approvedAt: '2026-09-30T18:00:00Z',
    approvedBy: 'Patty Policy Engine (Rule: UK-A-TRANSIT-30)',
    submissionChannel: 'teams',
    payableStatus: 'payable_pending_report',
    auditLog: [
      {
        id: 'aud-301-1',
        timestamp: '2026-09-30T17:55:00Z',
        actor: 'Liam Davies (via MS Teams)',
        action: 'SUBMITTED_CLAIM',
        details: 'Sent rail e-ticket via Teams #expenses channel'
      },
      {
        id: 'aud-301-2',
        timestamp: '2026-09-30T18:00:00Z',
        actor: 'Patty Policy Engine',
        action: 'AUTO_AUTHORIZED',
        details: 'Approved automatically per UK Band A policy.'
      }
    ]
  },

  // 9. PRIYA SHARMA - Staff Infrastructure Architect (Direct Report of Elena Rostova)
  {
    id: 'exp-203',
    claimNumber: 'EXP-9060',
    type: 'reimbursement',
    employeeId: 'emp-003',
    employeeName: 'Priya Sharma',
    employeeGrade: 'Senior (Band C)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    date: '2026-10-12',
    amount: 1850.00,
    currency: 'USD',
    category: 'Software & Subscriptions',
    businessPurpose: 'AWS Advanced Cloud Architect Certification Pass & Global Infrastructure Lab Voucher',
    merchantName: 'Amazon Web Services Training',
    receipt: {
      name: 'aws_cert_invoice.pdf',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
      size: '220 KB',
      mimeType: 'application/pdf',
      merchantName: 'Amazon Web Services Training',
      date: '2026-10-12',
      total: 1850.00,
      currency: 'USD',
      confidenceScore: 0.99
    },
    policyAssessment: {
      status: 'pending_exception_review',
      policyVersion: '2026.3',
      matchedRuleName: 'Senior Band C Software Cap ($150.00/yr)',
      maxAllowedAmount: 150.00,
      excessAmount: 1700.00,
      explanation: 'Training voucher ($1,850.00) exceeds standard self-service subscription threshold ($150.00). Requires direct manager (Elena Rostova, Executive) approval.',
      flags: ['over_limit', 'mandatory_manager_approval', 'training_investment'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    isExceptionRequested: true,
    exceptionReason: 'Approved annual engineering skill development allowance for leading cloud container migration.',
    tags: ['Certification', 'Cloud Migration'],
    submissionChannel: 'web_portal',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-203-1',
        timestamp: '2026-10-12T14:20:00Z',
        actor: 'Priya Sharma',
        action: 'SUBMITTED_CLAIM',
        details: 'Submitted AWS training invoice for executive approval.'
      }
    ]
  },

  // 10. CHLOE LIN - Associate Cloud Engineer (Direct Report of Priya Sharma, Senior Band C)
  // Under $1,500 limit: Priya can approve directly!
  {
    id: 'exp-601',
    claimNumber: 'EXP-9065',
    type: 'reimbursement',
    employeeId: 'emp-006',
    employeeName: 'Chloe Lin',
    employeeGrade: 'Associate (Band A)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    date: '2026-10-14',
    amount: 145.00,
    currency: 'USD',
    category: 'Office & Equipment',
    businessPurpose: 'Ergonomic split keyboard and technical Go & Kubernetes architecture references',
    merchantName: 'O\'Reilly & Keychron',
    receipt: {
      name: 'keyboard_books_receipt.jpg',
      url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80',
      size: '680 KB',
      mimeType: 'image/jpeg',
      merchantName: 'Keychron Online',
      date: '2026-10-14',
      total: 145.00,
      currency: 'USD',
      confidenceScore: 0.97
    },
    policyAssessment: {
      status: 'pending_exception_review',
      policyVersion: '2026.3',
      matchedRuleName: 'Associate Band A Equipment Limit ($100.00)',
      maxAllowedAmount: 100.00,
      excessAmount: 45.00,
      explanation: 'Expense of $145.00 exceeds Associate Band A equipment limit ($100.00) by $45.00. Within direct manager Priya Sharma (Senior Band C) signing authority ($1,500.00).',
      flags: ['over_limit', 'requires_manager_review'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    isExceptionRequested: true,
    exceptionReason: 'Home workstation setup during onboarding week. Approved during 1-on-1.',
    tags: ['Onboarding', 'Equipment'],
    submissionChannel: 'slack',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-601-1',
        timestamp: '2026-10-14T11:00:00Z',
        actor: 'Chloe Lin (via Slack)',
        action: 'SUBMITTED_CLAIM',
        details: 'Routed to direct manager Priya Sharma (Senior Band C).'
      }
    ]
  },

  // 11. CHLOE LIN - Workstation Spec Upgrade (Exceeds Priya's $1,500 Band C signing limit -> Requires Escalation to Elena)
  {
    id: 'exp-602',
    claimNumber: 'EXP-9066',
    type: 'reimbursement',
    employeeId: 'emp-006',
    employeeName: 'Chloe Lin',
    employeeGrade: 'Associate (Band A)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    date: '2026-10-15',
    amount: 1750.00,
    currency: 'USD',
    category: 'Office & Equipment',
    businessPurpose: 'Local LLM benchmark workstation upgrade (64GB RAM & external GPU enclosure for offline inference)',
    merchantName: 'B&H Photo Video / Apple',
    receipt: {
      name: 'bh_workstation_upgrade.pdf',
      url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80',
      size: '520 KB',
      mimeType: 'application/pdf',
      merchantName: 'B&H Photo Video',
      date: '2026-10-15',
      total: 1750.00,
      currency: 'USD',
      confidenceScore: 0.98
    },
    policyAssessment: {
      status: 'pending_exception_review',
      policyVersion: '2026.3',
      matchedRuleName: 'Associate Band A Special Equipment ($100.00 cap)',
      maxAllowedAmount: 100.00,
      excessAmount: 1650.00,
      explanation: 'High-value equipment request of $1,750.00 exceeds Priya Sharma\'s Senior Band C signing limit of $1,500.00. Must be escalated to Director Elena Rostova (Executive).',
      flags: ['over_limit', 'exceeds_manager_signing_limit', 'requires_executive_escalation'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    isExceptionRequested: true,
    exceptionReason: 'Required for testing on-device privacy-preserving models for upcoming client pilots.',
    tags: ['AI Hardware', 'Project X'],
    submissionChannel: 'web_portal',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-602-1',
        timestamp: '2026-10-15T15:30:00Z',
        actor: 'Chloe Lin',
        action: 'SUBMITTED_CLAIM',
        details: 'Routed to Priya Sharma. Exceeds $1,500 Band C signing limit; requires executive escalation.'
      }
    ]
  },

  // 12. LIAM DAVIES - Associate (Band A) (Direct Report of Sarah Jenkins, VP)
  {
    id: 'exp-302',
    claimNumber: 'EXP-9070',
    type: 'reimbursement',
    employeeId: 'emp-004',
    employeeName: 'Liam Davies',
    employeeGrade: 'Associate (Band A)',
    legalEntity: 'Patty UK Ltd',
    location: 'London, UK',
    date: '2026-10-11',
    amount: 220.00,
    currency: 'GBP',
    category: 'Meals & Entertainment',
    businessPurpose: 'Closing celebration dinner with UK Enterprise Fintech prospect procurement committee',
    merchantName: 'Dishoom Shoreditch London',
    receipt: {
      name: 'dishoom_dinner_bill.pdf',
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80',
      size: '340 KB',
      mimeType: 'application/pdf',
      merchantName: 'Dishoom Shoreditch',
      date: '2026-10-11',
      total: 220.00,
      currency: 'GBP',
      confidenceScore: 0.99
    },
    policyAssessment: {
      status: 'pending_exception_review',
      policyVersion: '2026.2',
      matchedRuleName: 'Associate Band A Meal Cap (£35.00)',
      maxAllowedAmount: 35.00,
      excessAmount: 185.00,
      explanation: 'Dinner bill £220.00 exceeds single meal limit (£35.00) by £185.00 due to hosting 4 client stakeholders. Routed to direct manager Sarah Jenkins (VP Finance & Ops).',
      flags: ['over_limit', 'exception_requested', 'client_hosting'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    isExceptionRequested: true,
    exceptionReason: 'Final contract signing dinner with Head of Technology and 3 lead engineers from London Fintech partner.',
    tags: ['Client Dinner', 'UK Growth'],
    submissionChannel: 'teams',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-302-1',
        timestamp: '2026-10-11T21:40:00Z',
        actor: 'Liam Davies (via MS Teams)',
        action: 'SUBMITTED_CLAIM',
        details: 'Submitted £220.00 dinner bill. Routed to Sarah Jenkins for executive sign-off.'
      }
    ]
  },

  // 13. ELENA ROSTOVA - Director of Engineering (Direct Report of Sarah Jenkins, VP)
  {
    id: 'exp-401',
    claimNumber: 'EXP-9080',
    type: 'reimbursement',
    employeeId: 'emp-002',
    employeeName: 'Elena Rostova',
    employeeGrade: 'Executive',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    date: '2026-10-09',
    amount: 2100.00,
    currency: 'USD',
    category: 'Hotel & Lodging',
    businessPurpose: 'Engineering Leadership Strategy Summit venue deposit and conference space reservation',
    merchantName: 'Convene Park Avenue NYC',
    receipt: {
      name: 'convene_summit_deposit.pdf',
      url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&auto=format&fit=crop&q=80',
      size: '640 KB',
      mimeType: 'application/pdf',
      merchantName: 'Convene Park Ave',
      date: '2026-10-09',
      total: 2100.00,
      currency: 'USD',
      confidenceScore: 0.99
    },
    policyAssessment: {
      status: 'pending_exception_review',
      policyVersion: '2026.3',
      matchedRuleName: 'Executive Offsite / Group Facility Rule',
      maxAllowedAmount: 1800.00,
      excessAmount: 300.00,
      explanation: 'Summit deposit ($2,100.00) exceeds standard Executive single lodging/venue cap ($1,800.00). Routed to VP Sarah Jenkins for peer executive sign-off.',
      flags: ['over_limit', 'mandatory_manager_approval', 'executive_spend'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'pending_manager',
    isExceptionRequested: true,
    exceptionReason: 'Offsite includes dedicated AV setup and recording booth for remote EMEA and APAC engineering managers.',
    tags: ['Leadership Summit', 'Engineering Q4'],
    submissionChannel: 'web_portal',
    payableStatus: 'unauthorized',
    auditLog: [
      {
        id: 'aud-401-1',
        timestamp: '2026-10-09T18:15:00Z',
        actor: 'Elena Rostova',
        action: 'SUBMITTED_CLAIM',
        details: 'Submitted $2,100 facility reservation. Routed to Sarah Jenkins.'
      }
    ]
  },

  // Historical claims for prior months (Sept & Aug 2026) for trend analysis
  {
    id: 'exp-hist-01',
    claimNumber: 'EXP-8501',
    type: 'reimbursement',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    date: '2026-09-18',
    amount: 142.50,
    currency: 'USD',
    category: 'Meals & Entertainment',
    businessPurpose: 'Q3 Team Planning Dinner and Project Retrospective',
    merchantName: 'Gramercy Tavern NY',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Mid-level (Band B) Meals Cap',
      maxAllowedAmount: 150.00,
      explanation: 'Authorized within Q3 team allowance budget.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-02',
    claimNumber: 'EXP-8502',
    type: 'reimbursement',
    employeeId: 'emp-002',
    employeeName: 'Elena Rostova',
    employeeGrade: 'Executive',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    date: '2026-09-10',
    amount: 1250.00,
    currency: 'USD',
    category: 'Flights',
    businessPurpose: 'Round-trip transcontinental flights for NYC-SFO Tech Architecture Review',
    merchantName: 'United Airlines',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Executive Flight Cap',
      maxAllowedAmount: 1800.00,
      explanation: 'Economy plus flight within Executive policy.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-03',
    claimNumber: 'EXP-8503',
    type: 'reimbursement',
    employeeId: 'emp-003',
    employeeName: 'Priya Sharma',
    employeeGrade: 'Senior (Band C)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    date: '2026-09-08',
    amount: 280.00,
    currency: 'USD',
    category: 'Software & Subscriptions',
    businessPurpose: 'Datadog observability and APM annual license renewal segment',
    merchantName: 'Datadog Inc',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Senior Software Cap',
      maxAllowedAmount: 300.00,
      explanation: 'Within allocated departmental software tools cap.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-04',
    claimNumber: 'EXP-8504',
    type: 'reimbursement',
    employeeId: 'emp-004',
    employeeName: 'Liam Davies',
    employeeGrade: 'Associate (Band A)',
    legalEntity: 'Patty UK Ltd',
    location: 'London, UK',
    date: '2026-09-14',
    amount: 85.00,
    currency: 'GBP',
    category: 'Office & Equipment',
    businessPurpose: 'Wireless noise-canceling headset for remote client pitches',
    merchantName: 'Currys London',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Associate Office Gear',
      maxAllowedAmount: 100.00,
      explanation: 'Within remote work equipment allotment.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'teams',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-05',
    claimNumber: 'EXP-8505',
    type: 'mileage',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    date: '2026-09-24',
    amount: 68.00,
    currency: 'USD',
    category: 'Mileage',
    businessPurpose: 'Client data center migration audit site visits (100km total)',
    policyAssessment: {
      status: 'eligible_pending_manager_approval',
      policyVersion: '2026.2',
      matchedRuleName: 'Standard Vehicle Mileage',
      maxAllowedAmount: 68.00,
      explanation: 'Mileage rate applied.',
      flags: ['in_policy'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-06',
    claimNumber: 'EXP-8506',
    type: 'allowance',
    employeeId: 'emp-003',
    employeeName: 'Priya Sharma',
    employeeGrade: 'Senior (Band C)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    date: '2026-09-21',
    amount: 225.00,
    currency: 'USD',
    category: 'Per Diem / Allowance',
    businessPurpose: 'Austin Distributed Systems Conference (3 days allowance @ $75/day)',
    policyAssessment: {
      status: 'eligible_pending_manager_approval',
      policyVersion: '2026.2',
      matchedRuleName: 'Daily Per Diem Rate',
      maxAllowedAmount: 225.00,
      explanation: 'Per diem verified.',
      flags: ['in_policy'],
      requiresManagerApproval: true,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  // August 2026 claims
  {
    id: 'exp-hist-07',
    claimNumber: 'EXP-8401',
    type: 'reimbursement',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    date: '2026-08-15',
    amount: 110.00,
    currency: 'USD',
    category: 'Meals & Entertainment',
    businessPurpose: 'Engineering team onboarding lunch and mentor coffee sessions',
    merchantName: 'Sweetgreen & Blue Bottle NY',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Band B Meal Cap',
      maxAllowedAmount: 130.00,
      explanation: 'In policy.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-08',
    claimNumber: 'EXP-8402',
    type: 'reimbursement',
    employeeId: 'emp-002',
    employeeName: 'Elena Rostova',
    employeeGrade: 'Executive',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    date: '2026-08-20',
    amount: 880.00,
    currency: 'USD',
    category: 'Hotel & Lodging',
    businessPurpose: 'Boston Executive Leadership Offsite (2 nights hotel @ $440)',
    merchantName: 'Four Seasons Boston',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Executive Hotel Cap',
      maxAllowedAmount: 900.00,
      explanation: 'In policy.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-09',
    claimNumber: 'EXP-8403',
    type: 'reimbursement',
    employeeId: 'emp-003',
    employeeName: 'Priya Sharma',
    employeeGrade: 'Senior (Band C)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    date: '2026-08-12',
    amount: 650.00,
    currency: 'USD',
    category: 'Flights',
    businessPurpose: 'Regional flight SF to Seattle for Microsoft Azure partner sync',
    merchantName: 'Alaska Airlines',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Senior Flight Cap',
      maxAllowedAmount: 1200.00,
      explanation: 'In policy.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-10',
    claimNumber: 'EXP-8404',
    type: 'reimbursement',
    employeeId: 'emp-004',
    employeeName: 'Liam Davies',
    employeeGrade: 'Associate (Band A)',
    legalEntity: 'Patty UK Ltd',
    location: 'London, UK',
    date: '2026-08-18',
    amount: 145.00,
    currency: 'GBP',
    category: 'Ground Transport / Taxi',
    businessPurpose: 'Client visits across Greater London and Heathrow express transfers',
    merchantName: 'Heathrow Express / Black Cabs',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Associate Transit Cap',
      maxAllowedAmount: 150.00,
      explanation: 'In policy.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'teams',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-11',
    claimNumber: 'EXP-8405',
    type: 'reimbursement',
    employeeId: 'emp-006',
    employeeName: 'Chloe Lin',
    employeeGrade: 'Associate (Band A)',
    legalEntity: 'Patty US Inc',
    location: 'San Francisco, US',
    date: '2026-08-25',
    amount: 95.00,
    currency: 'USD',
    category: 'Office & Equipment',
    businessPurpose: 'Ergonomic mouse and USB-C multiport hub',
    merchantName: 'Anker Direct',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Associate Office Cap',
      maxAllowedAmount: 100.00,
      explanation: 'In policy.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'slack',
    payableStatus: 'settled_externally',
    auditLog: []
  },
  {
    id: 'exp-hist-12',
    claimNumber: 'EXP-8406',
    type: 'reimbursement',
    employeeId: 'emp-001',
    employeeName: 'Marcus Vance',
    employeeGrade: 'Mid-level (Band B)',
    legalEntity: 'Patty US Inc',
    location: 'New York, US',
    date: '2026-08-28',
    amount: 195.00,
    currency: 'USD',
    category: 'Software & Subscriptions',
    businessPurpose: 'GitHub Copilot Enterprise and JetBrains All Products developer pack',
    merchantName: 'GitHub & JetBrains',
    policyAssessment: {
      status: 'eligible_auto_authorized',
      policyVersion: '2026.2',
      matchedRuleName: 'Band B Software Cap',
      maxAllowedAmount: 200.00,
      explanation: 'In policy.',
      flags: ['in_policy'],
      requiresManagerApproval: false,
    },
    approvalStatus: 'approved_by_manager',
    submissionChannel: 'web_portal',
    payableStatus: 'settled_externally',
    auditLog: []
  }
];

export const SEED_PAYOUT_REPORTS: PayoutReport[] = [
  {
    id: 'payout-2026-w39',
    reportNumber: 'PAYOUT-2026-W39',
    title: 'Bi-Weekly Expense Settlement Handoff (Late Sept 2026)',
    generatedAt: '2026-09-28T16:30:00Z',
    periodStart: '2026-09-15',
    periodEnd: '2026-09-28',
    totalPayableAmount: 220.00,
    currency: 'USD',
    itemCount: 2,
    employeeCount: 1,
    entries: [
      {
        employeeId: 'emp-003',
        employeeName: 'Priya Sharma',
        employeeGrade: 'Senior (Band C)',
        legalEntity: 'Patty US Inc',
        reimbursementsTotal: 520.00,
        mileageTotal: 0,
        allowancesTotal: 0,
        advancesOffsetDeducted: 300.00, // Offset against $300 advance!
        netPayableAmount: 220.00,
        claimIds: ['exp-201', 'exp-202']
      }
    ],
    status: 'marked_settled',
    settledAt: '2026-09-29T11:00:00Z',
    settledBy: 'Sarah Jenkins (Finance Controller)'
  }
];
