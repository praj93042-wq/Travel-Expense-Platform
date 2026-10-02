import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { ExpenseClaim, Employee, EmployeeGrade } from '../../types';
import { ClaimDetailModal } from '../claims/ClaimDetailModal';
import { 
  Check, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  User, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Filter,
  Users,
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Shield,
  Award,
  HelpCircle,
  Layers,
  CheckSquare,
  ArrowUpCircle
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const { 
    currentEmployee, 
    setCurrentEmployeeId,
    employees,
    claims, 
    trips, 
    approveClaim, 
    rejectClaim, 
    escalateClaim,
    requestClarification,
    getDirectReports,
    getAllHierarchySubordinates,
    getManagerAuthority,
    checkApprovalEligibility,
    approveTrip, 
    approveTripAmendment,
    rejectTrip 
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<'actionable' | 'visibility_audit' | 'hierarchy_matrix'>('actionable');
  const [hierarchyScope, setHierarchyScope] = useState<'direct' | 'all_subordinates' | 'all_company'>('direct');
  const [selectedReportId, setSelectedReportId] = useState<string>('all');
  const [inspectClaim, setInspectClaim] = useState<ExpenseClaim | null>(null);

  // Modals for structured actions
  const [rejectingClaim, setRejectingClaim] = useState<ExpenseClaim | null>(null);
  const [rejectReasonCategory, setRejectReasonCategory] = useState<string>('Policy Cap Violation');
  const [rejectFeedback, setRejectFeedback] = useState<string>('');

  const [approvingClaimWithNotes, setApprovingClaimWithNotes] = useState<ExpenseClaim | null>(null);
  const [approvalNote, setApprovalNote] = useState<string>('');

  const [escalatingClaim, setEscalatingClaim] = useState<ExpenseClaim | null>(null);
  const [targetManagerId, setTargetManagerId] = useState<string>('');
  const [escalationJustification, setEscalationJustification] = useState<string>('');

  const [clarifyingClaim, setClarifyingClaim] = useState<ExpenseClaim | null>(null);
  const [clarifyMessage, setClarifyMessage] = useState<string>('');

  // Manager Grade and Authority
  const currentAuthority = getManagerAuthority(currentEmployee.grade);
  const directReports = getDirectReports(currentEmployee.id);
  const allSubordinates = getAllHierarchySubordinates(currentEmployee.id);
  const hasDirectReports = directReports.length > 0;
  const isExecutive = currentEmployee.grade === 'Executive';

  // Available higher managers for escalation
  const higherManagers = employees.filter(e => 
    e.id !== currentEmployee.id && 
    (e.grade === 'Executive' || e.roleTitle.includes('Director') || e.roleTitle.includes('VP') || e.roleTitle.includes('Architect'))
  );

  // All pending claims
  const allPendingClaims = claims.filter(c => c.approvalStatus === 'pending_manager');

  // Filter claims based on selected hierarchical scope
  const filteredPendingClaims = allPendingClaims.filter(c => {
    // If specific direct report is selected
    if (selectedReportId !== 'all') {
      return c.employeeId === selectedReportId;
    }

    // Direct reports filter (Strict hierarchical approval)
    if (hierarchyScope === 'direct') {
      const isDirect = directReports.some(r => r.id === c.employeeId);
      const isEscalatedDirectlyToMe = c.escalatedToManagerId === currentEmployee.id;
      return isDirect || isEscalatedDirectlyToMe;
    }

    // Extended downline teams
    if (hierarchyScope === 'all_subordinates') {
      const isSub = allSubordinates.some(s => s.id === c.employeeId);
      const isEscalatedToMe = c.escalatedToManagerId === currentEmployee.id;
      return isSub || isEscalatedToMe;
    }

    // All company (Executive oversight)
    return true;
  });

  // Actionable trips for direct reports
  const allPendingTrips = trips.filter(t => t.status === 'pending_approval' || t.status === 'amendment_pending');
  const filteredPendingTrips = allPendingTrips.filter(t => {
    if (selectedReportId !== 'all') return t.employeeId === selectedReportId;
    if (hierarchyScope === 'direct') return directReports.some(r => r.id === t.employeeId);
    if (hierarchyScope === 'all_subordinates') return allSubordinates.some(s => s.id === t.employeeId);
    return true;
  });

  // Auto-authorized claims for visibility stream
  const allAutoAuthorizedClaims = claims.filter(c => c.approvalStatus === 'auto_authorized');
  const filteredAutoAuthorizedClaims = allAutoAuthorizedClaims.filter(c => {
    if (selectedReportId !== 'all') return c.employeeId === selectedReportId;
    if (hierarchyScope === 'direct') return directReports.some(r => r.id === c.employeeId);
    if (hierarchyScope === 'all_subordinates') return allSubordinates.some(s => s.id === c.employeeId);
    return true;
  });

  // Pending counts per direct report for the badge pills
  const reportPendingCounts = directReports.map(report => {
    const claimCount = allPendingClaims.filter(c => c.employeeId === report.id).length;
    const tripCount = allPendingTrips.filter(t => t.employeeId === report.id).length;
    return {
      report,
      totalPending: claimCount + tripCount
    };
  });

  const totalActionableCount = filteredPendingClaims.length + filteredPendingTrips.length;

  // Handle Reject Submit
  const handleConfirmRejection = () => {
    if (!rejectingClaim) return;
    const finalReason = rejectFeedback.trim() 
      ? `[${rejectReasonCategory}] ${rejectFeedback.trim()}`
      : `Declined per policy: ${rejectReasonCategory}`;

    rejectClaim(
      rejectingClaim.id, 
      finalReason, 
      currentEmployee.name, 
      rejectReasonCategory, 
      currentEmployee.grade
    );

    setRejectingClaim(null);
    setRejectFeedback('');
  };

  // Handle Approve Submit with Optional Note
  const handleConfirmApproval = () => {
    if (!approvingClaimWithNotes) return;
    approveClaim(
      approvingClaimWithNotes.id, 
      currentEmployee.name, 
      approvingClaimWithNotes.isExceptionRequested || approvingClaimWithNotes.policyAssessment.status === 'pending_exception_review',
      approvalNote.trim() || undefined,
      currentEmployee.grade
    );
    setApprovingClaimWithNotes(null);
    setApprovalNote('');
  };

  // Handle Escalation Submit
  const handleConfirmEscalation = () => {
    if (!escalatingClaim || !targetManagerId) return;
    const defaultJustification = `Claim amount of $${escalatingClaim.amount.toFixed(2)} exceeds ${currentEmployee.grade} signing limit of $${currentAuthority.signingLimit.toFixed(2)}. Escalated for higher authority sign-off.`;
    
    escalateClaim(
      escalatingClaim.id,
      targetManagerId,
      escalationJustification.trim() || defaultJustification,
      currentEmployee.name,
      currentEmployee.grade
    );

    setEscalatingClaim(null);
    setTargetManagerId('');
    setEscalationJustification('');
  };

  // Handle Clarification Submit
  const handleConfirmClarification = () => {
    if (!clarifyingClaim || !clarifyMessage.trim()) return;
    requestClarification(clarifyingClaim.id, clarifyMessage.trim());
    setClarifyingClaim(null);
    setClarifyMessage('');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & MANAGER GRADE IDENTITY CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Hierarchical Workflow Engine
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-medium text-slate-600">
                Direct Reports & Grade Signing Authority
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              Manager Approval & Governance Inbox
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              Review and approve or reject expenses submitted by direct reports. Signing limits and approval rights are strictly governed by your <strong>user grade</strong>.
            </p>
          </div>

          {/* Quick Persona Switcher for Instant Testing */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 self-start lg:self-auto">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              Switch Manager:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  setCurrentEmployeeId('emp-002');
                  setSelectedReportId('all');
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  currentEmployee.id === 'emp-002'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Elena Rostova (Executive - Director) manages Marcus Vance & Priya Sharma"
              >
                Elena (Executive)
              </button>
              <button
                onClick={() => {
                  setCurrentEmployeeId('emp-003');
                  setSelectedReportId('all');
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  currentEmployee.id === 'emp-003'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Priya Sharma (Senior Band C) manages Chloe Lin (Max limit $1,500)"
              >
                Priya (Senior Band C)
              </button>
              <button
                onClick={() => {
                  setCurrentEmployeeId('emp-005');
                  setSelectedReportId('all');
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  currentEmployee.id === 'emp-005'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Sarah Jenkins (Executive - VP Finance) manages Elena Rostova & Liam Davies"
              >
                Sarah (VP Exec)
              </button>
              <button
                onClick={() => {
                  setCurrentEmployeeId('emp-001');
                  setSelectedReportId('all');
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  currentEmployee.id === 'emp-001'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Marcus Vance (Mid-level Band B) - Individual contributor with no direct reports"
              >
                Marcus (Band B)
              </button>
            </div>
          </div>
        </div>

        {/* Manager Profile & Authority Status Strip */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Identity & Direct Reports */}
          <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
            <img 
              src={currentEmployee.avatar} 
              alt={currentEmployee.name} 
              className="w-10 h-10 rounded-full border-2 border-emerald-600 object-cover shrink-0" 
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                <span>{currentEmployee.name}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  {currentEmployee.grade}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">{currentEmployee.roleTitle} · {currentEmployee.department}</div>
              <div className="text-[10px] text-emerald-800 font-medium mt-0.5">
                {directReports.length === 1 
                  ? `1 Direct Report (${directReports[0].name})`
                  : directReports.length > 1
                    ? `${directReports.length} Direct Reports (${directReports.map(r => r.name.split(' ')[0]).join(', ')})`
                    : 'Individual Contributor (0 Direct Reports)'}
              </div>
            </div>
          </div>

          {/* User Grade Financial Signing Limit */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Grade Signing Limit</span>
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {currentAuthority.signingLimit === Infinity ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span>Unlimited ($∞)</span>
                    <span className="text-[10px] font-sans font-medium text-emerald-800 bg-emerald-50 px-1 rounded">Executive Tier</span>
                  </span>
                ) : (
                  <span className="text-slate-900">
                    ${currentAuthority.signingLimit.toFixed(2)}
                    <span className="text-xs font-sans font-normal text-slate-500 ml-1">/ claim max</span>
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
              Authorized for: {currentAuthority.subordinateGradesAllowed.length > 0 
                ? currentAuthority.subordinateGradesAllowed.join(', ')
                : 'None (Requires promotion to manager)'}
            </div>
          </div>

          {/* Policy Approval Scope & Escalation Rule */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Approval Authority Scope</span>
                <Award className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                {currentAuthority.canApproveExceptions 
                  ? 'Policy Exceptions & Advances Permitted'
                  : 'Standard In-Policy Limits Only'}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {currentEmployee.grade === 'Executive' 
                ? 'Final approval tier for all company exception requests.'
                : `Claims exceeding $${currentAuthority.signingLimit.toFixed(0)} must escalate to Director Elena or VP Sarah.`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION & DIRECT REPORTS SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Main Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('actionable')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'actionable'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Actionable Reviews</span>
            {totalActionableCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 font-mono">
                {totalActionableCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('visibility_audit')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'visibility_audit'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Team Visibility Stream</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 font-mono">
              {filteredAutoAuthorizedClaims.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hierarchy_matrix')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'hierarchy_matrix'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Grade Signing Matrix</span>
          </button>
        </div>

        {/* Scope Filter (Direct Reports vs Extended Downline) */}
        {hasDirectReports && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Scope:</span>
            <button
              onClick={() => setHierarchyScope('direct')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                hierarchyScope === 'direct'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Direct Reports ({directReports.length})
            </button>
            {allSubordinates.length > directReports.length && (
              <button
                onClick={() => setHierarchyScope('all_subordinates')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  hierarchyScope === 'all_subordinates'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Downline ({allSubordinates.length})
              </button>
            )}
            {isExecutive && (
              <button
                onClick={() => setHierarchyScope('all_company')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  hierarchyScope === 'all_company'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Company
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. DIRECT REPORTS PILL SELECTOR */}
      {hasDirectReports && (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filter Submitter:
          </span>

          <button
            onClick={() => setSelectedReportId('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedReportId === 'all'
                ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Reports ({reportPendingCounts.reduce((acc, curr) => acc + curr.totalPending, 0)} pending)
          </button>

          {reportPendingCounts.map(({ report, totalPending }) => (
            <button
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedReportId === report.id
                  ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <img 
                src={report.avatar} 
                alt={report.name} 
                className="w-4 h-4 rounded-full object-cover border border-slate-300"
              />
              <span>{report.name}</span>
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-semibold ${
                selectedReportId === report.id
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {report.grade.split(' ')[0]}
              </span>
              {totalPending > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  selectedReportId === report.id
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {totalPending}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 4. MAIN ACTIONABLE CONTENT TAB */}
      {activeTab === 'actionable' && (
        <div className="space-y-6">
          {/* Individual Contributor empty state notice if logged in user has no reports */}
          {!hasDirectReports && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Viewing as Individual Contributor ({currentEmployee.name})</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                You are currently logged in as a <strong>{currentEmployee.grade}</strong> ({currentEmployee.roleTitle}). 
                Individual contributors do not have direct reports assigned to approve. All claims you submit are automatically routed to your direct manager, <strong>{currentEmployee.managerName}</strong>.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-amber-800 font-medium">To test approving direct report claims, switch to a manager:</span>
                <button
                  onClick={() => setCurrentEmployeeId('emp-002')}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold shadow-xs"
                >
                  Switch to Elena Rostova (Director)
                </button>
                <button
                  onClick={() => setCurrentEmployeeId('emp-003')}
                  className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold shadow-xs"
                >
                  Switch to Priya Sharma (Senior Band C)
                </button>
              </div>
            </div>
          )}

          {/* Empty state when all items approved */}
          {totalActionableCount === 0 && hasDirectReports && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">All Direct Report Claims Reviewed!</div>
              <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
                There are no pending expenses, travel advances, or trips awaiting review from your direct reports. 
                You can switch personas above or check the Team Visibility Stream to audit automated in-policy reimbursements.
              </p>
            </div>
          )}

          {/* SECTION A: TRIP REQUESTS FROM DIRECT REPORTS */}
          {filteredPendingTrips.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    Trip Approvals & Itinerary Amendments ({filteredPendingTrips.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct manager sign-off required before subordinate employees can book expenses against travel itineraries.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredPendingTrips.map(trip => (
                  <div key={trip.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900">{trip.tripNumber}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          rev v{trip.version}
                        </span>
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          {trip.status === 'amendment_pending' ? 'Amendment Reapproval Required' : 'New Trip Registration'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Direct Report
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm">{trip.purpose}</div>
                      <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                        <span>Submitted by: <strong className="text-slate-700">{trip.employeeName}</strong> ({trip.employeeGrade})</span>
                        <span>·</span>
                        <span>Destination: <strong className="text-slate-700">{trip.destinations[0]?.city}, {trip.destinations[0]?.country}</strong></span>
                        <span>·</span>
                        <span className="font-mono">{trip.destinations[0]?.startDate} → {trip.destinations[0]?.endDate}</span>
                        <span>·</span>
                        <span>Est. Budget: <strong className="font-mono text-slate-800">${trip.estimatedCost.toFixed(2)}</strong></span>
                      </div>
                      {trip.status === 'amendment_pending' && (
                        <div className="text-[11px] text-amber-900 italic bg-amber-50/70 p-2 rounded border border-amber-200 mt-1">
                          <strong>Amendment reason:</strong> {trip.revisionsHistory[trip.revisionsHistory.length - 1]?.reasonForChange}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => rejectTrip(trip.id, 'Itinerary conflicts with team calendar or quarterly budget', currentEmployee.name)}
                        className="px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          if (trip.status === 'amendment_pending') {
                            approveTripAmendment(trip.id, currentEmployee.name);
                          } else {
                            approveTrip(trip.id, currentEmployee.name);
                          }
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-xs"
                      >
                        Approve Trip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION B: ACTIONABLE EXPENSE CLAIMS FROM DIRECT REPORTS */}
          {filteredPendingClaims.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Direct Report Expense Claims Awaiting Approval ({filteredPendingClaims.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Evaluated against submitter's user grade policy rules and your managerial signing limits.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredPendingClaims.map(claim => {
                  const eligibility = checkApprovalEligibility(currentEmployee, claim);
                  const isOverLimitException = claim.isExceptionRequested || claim.policyAssessment.status === 'pending_exception_review';
                  const isEscalatedToMe = claim.escalatedToManagerId === currentEmployee.id;

                  return (
                    <div 
                      key={claim.id}
                      className={`bg-white rounded-xl border p-4.5 shadow-xs transition-all ${
                        !eligibility.isWithinSigningLimit 
                          ? 'border-amber-300 bg-amber-50/20' 
                          : isOverLimitException 
                            ? 'border-amber-200 hover:border-amber-300' 
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Left column: Claim details, submitter grade, policy explanation */}
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Submitter & Direct Report Hierarchy Tag */}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-mono font-bold text-slate-900">{claim.claimNumber}</span>
                            <span className="text-slate-400">·</span>
                            <div className="flex items-center gap-1 font-semibold text-slate-900">
                              <span>{claim.employeeName}</span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {claim.employeeGrade}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {eligibility.isDirectReport ? 'Direct Report' : 'Subordinate Downline'}
                            </span>
                            {isEscalatedToMe && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                                <ArrowUpCircle className="w-3 h-3 text-purple-700" />
                                Escalated to You
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-slate-500 ml-auto">
                              Date: {claim.date}
                            </span>
                          </div>

                          {/* Merchant, Amount & Business Purpose */}
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {claim.merchantName || claim.businessPurpose}
                            </span>
                            <span className="font-mono font-bold text-emerald-800 text-base sm:ml-auto">
                              ${claim.amount.toFixed(2)} {claim.currency}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {claim.businessPurpose}
                          </p>

                          {/* Custom tags if attached */}
                          {claim.tags && claim.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {claim.tags.map((tag, idx) => (
                                <span 
                                  key={idx}
                                  className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Submitter Policy Limits & Exception Reason */}
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">
                                Submitter Policy Rule: {claim.policyAssessment.matchedRuleName}
                              </span>
                              {claim.policyAssessment.maxAllowedAmount && (
                                <span className="font-mono text-slate-500">
                                  Policy Cap: ${claim.policyAssessment.maxAllowedAmount.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {claim.policyAssessment.explanation}
                            </p>
                            {claim.isExceptionRequested && claim.exceptionReason && (
                              <div className="mt-1 pt-1 border-t border-slate-200 text-amber-950 font-medium text-[11px]">
                                <strong>Employee Exception Request:</strong> "{claim.exceptionReason}"
                              </div>
                            )}
                            {claim.escalationReason && (
                              <div className="mt-1 pt-1 border-t border-purple-200 text-purple-950 font-medium text-[11px]">
                                <strong>Prior Escalation Justification:</strong> "{claim.escalationReason}"
                              </div>
                            )}
                          </div>

                          {/* Reviewing Manager Grade Signing Authority Check Banner */}
                          <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                            eligibility.canApprove
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50 border-amber-300 text-amber-950'
                          }`}>
                            {eligibility.canApprove ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5">
                              <div className="font-bold flex items-center gap-1.5">
                                <span>Manager Grade Check:</span>
                                {eligibility.canApprove ? (
                                  <span className="text-emerald-700 font-semibold">
                                    Authorized (Within your {currentEmployee.grade} signing limit of {currentAuthority.signingLimit === Infinity ? 'Unlimited' : `$${currentAuthority.signingLimit.toFixed(2)}`})
                                  </span>
                                ) : (
                                  <span className="text-amber-800 font-bold">
                                    Signing Limit Exceeded (Your limit: ${currentAuthority.signingLimit.toFixed(2)})
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] leading-relaxed">
                                {eligibility.canApprove
                                  ? `You hold valid approval signing rights for ${claim.employeeName} (${claim.employeeGrade}). You can approve, reject, or request clarification.`
                                  : eligibility.reason}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Action buttons (Approve, Reject, Escalate, Clarify, Inspect) */}
                        <div className="flex lg:flex-col items-center lg:items-stretch gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          {/* Approve Button (or Approve Condition) */}
                          <button
                            disabled={!eligibility.canApprove}
                            onClick={() => {
                              // If within signing limit, open confirmation or approve
                              setApprovingClaimWithNotes(claim);
                            }}
                            className={`px-4 py-2 text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors ${
                              eligibility.canApprove
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                            title={eligibility.canApprove ? 'Approve expense claim' : eligibility.reason}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Claim</span>
                          </button>

                          {/* Reject Button (Always available for manager to decline) */}
                          <button
                            onClick={() => {
                              setRejectingClaim(claim);
                              setRejectFeedback('');
                            }}
                            className="px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-md transition-colors flex items-center justify-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline Claim</span>
                          </button>

                          {/* Escalate Button (Always enabled if over limit, or optional for senior manager) */}
                          <button
                            onClick={() => {
                              setEscalatingClaim(claim);
                              setTargetManagerId(higherManagers[0]?.id || 'emp-005');
                              setEscalationJustification(
                                !eligibility.isWithinSigningLimit
                                  ? `Amount of $${claim.amount.toFixed(2)} exceeds my ${currentEmployee.grade} signing limit of $${currentAuthority.signingLimit.toFixed(2)}.`
                                  : `Requesting executive second sign-off for large ${claim.category} investment.`
                              );
                            }}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
                              !eligibility.isWithinSigningLimit
                                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-xs'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                            title="Escalate claim to higher-level manager in the hierarchy"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Escalate Up</span>
                          </button>

                          {/* Request Clarification */}
                          <button
                            onClick={() => {
                              setClarifyingClaim(claim);
                              setClarifyMessage('');
                            }}
                            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Ask Direct Report</span>
                          </button>

                          {/* Inspect Modal */}
                          <button
                            onClick={() => setInspectClaim(claim)}
                            className="px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Inspect Audit Log</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TEAM VISIBILITY STREAM (AUTO-AUTHORIZED STREAM) */}
      {activeTab === 'visibility_audit' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Team Visibility Stream (Automated In-Policy Reimbursements)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These claims satisfied all grade policy criteria and required receipts. They were authorized automatically without taking up your manual approval time.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto font-semibold">
              {filteredAutoAuthorizedClaims.length} auto-authorized
            </span>
          </div>

          {filteredAutoAuthorizedClaims.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No auto-authorized claims recorded for selected team scope.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  <tr>
                    <th className="py-2.5 px-3">Ref</th>
                    <th className="py-2.5 px-3">Direct Report</th>
                    <th className="py-2.5 px-3">Merchant / Spend Details</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Matched Policy Rule</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAutoAuthorizedClaims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{claim.claimNumber}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{claim.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{claim.employeeGrade}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">{claim.merchantName || 'Direct'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{claim.businessPurpose}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{claim.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-emerald-800 font-medium">
                          {claim.policyAssessment.matchedRuleName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ${claim.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setInspectClaim(claim)}
                          className="text-emerald-700 hover:text-emerald-900 font-medium text-[11px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. GRADE SIGNING AUTHORITY MATRIX TAB */}
      {activeTab === 'hierarchy_matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Company Grade-Based Approval Signing Authority Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Patty Workforce Expense Governance: Each managerial grade carries an explicit financial signing threshold. Submissions exceeding a manager's signing limit require upward escalation in the corporate hierarchy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Executive Tier */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              currentEmployee.grade === 'Executive'
                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 font-mono">
                  Tier 1 · Executive
                </span>
                {currentEmployee.grade === 'Executive' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    Your Tier
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Executive (VP / Director)</h3>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-1">Unlimited ($∞)</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Full authority to approve claims of any size, policy exceptions, and offsite events across all employee bands.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>Subordinates: <strong>All Bands (C, B, A)</strong></div>
                <div>Exception Override: <strong className="text-emerald-700">Yes</strong></div>
              </div>
            </div>

            {/* Senior (Band C) Tier */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              currentEmployee.grade === 'Senior (Band C)'
                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 font-mono">
                  Tier 2 · Senior
                </span>
                {currentEmployee.grade === 'Senior (Band C)' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    Your Tier
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Senior (Band C)</h3>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">$1,500.00 / claim</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Authorizes direct reports in Mid-level (Band B) and Associate (Band A). Claims &gt; $1,500 escalate to Executive.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>Subordinates: <strong>Band B, Band A</strong></div>
                <div>Exception Override: <strong className="text-emerald-700">Up to $1,500</strong></div>
              </div>
            </div>

            {/* Mid-level (Band B) Tier */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              currentEmployee.grade === 'Mid-level (Band B)'
                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 font-mono">
                  Tier 3 · Lead
                </span>
                {currentEmployee.grade === 'Mid-level (Band B)' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    Your Tier
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mid-level (Band B)</h3>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">$300.00 / claim</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supervisory approval rights for Associate direct reports on local transit, meals, and books up to $300.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>Subordinates: <strong>Associate (Band A)</strong></div>
                <div>Exception Override: <strong className="text-amber-700">Requires Escalation</strong></div>
              </div>
            </div>

            {/* Associate (Band A) Tier */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              currentEmployee.grade === 'Associate (Band A)'
                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 font-mono">
                  Tier 4 · Contributor
                </span>
                {currentEmployee.grade === 'Associate (Band A)' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    Your Tier
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Associate (Band A)</h3>
                <div className="text-lg font-bold font-mono text-slate-400 mt-1">$0.00 (Submitter)</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Individual contributor. No managerial approval authority. Submits claims to direct team lead or director.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>Subordinates: <strong>None</strong></div>
                <div>Exception Override: <strong>No</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. STRUCTURED REJECTION MODAL */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <X className="w-4 h-4" />
                <span>Decline Expense Claim ({rejectingClaim.claimNumber})</span>
              </div>
              <button 
                onClick={() => setRejectingClaim(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Employee: <strong>{rejectingClaim.employeeName}</strong> ({rejectingClaim.employeeGrade})</div>
              <div>Amount: <strong className="font-mono text-slate-900">${rejectingClaim.amount.toFixed(2)}</strong> · {rejectingClaim.merchantName}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Policy Reason Category:
              </label>
              <select
                value={rejectReasonCategory}
                onChange={(e) => setRejectReasonCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-md p-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-red-600"
              >
                <option value="Policy Cap Violation">Policy Cap Violation (Exceeds grade limit without justification)</option>
                <option value="Missing or Invalid Tax Receipt">Missing or Invalid Tax Receipt (Unverifiable vendor)</option>
                <option value="Personal / Non-Reimbursable">Personal / Non-Reimbursable Business Expense</option>
                <option value="Duplicate Submission">Duplicate Submission or already reimbursed</option>
                <option value="Unapproved Travel Itinerary">Unapproved Travel Itinerary / Missing Trip link</option>
                <option value="Other Policy Conflict">Other Policy Conflict</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Manager Audit Feedback to Direct Report:
              </label>
              <textarea
                rows={3}
                required
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Explain why this expense was declined and instructions for resubmission if applicable..."
                className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingClaim(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. APPROVAL WITH OPTIONAL NOTES MODAL */}
      {approvingClaimWithNotes && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Check className="w-4 h-4" />
                <span>Approve Claim ({approvingClaimWithNotes.claimNumber})</span>
              </div>
              <button 
                onClick={() => setApprovingClaimWithNotes(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Employee: <strong>{approvingClaimWithNotes.employeeName}</strong> ({approvingClaimWithNotes.employeeGrade})</div>
              <div>Amount: <strong className="font-mono text-emerald-800 font-bold">${approvingClaimWithNotes.amount.toFixed(2)}</strong></div>
              <div>Approver Grade: <span className="font-semibold text-slate-800">{currentEmployee.name} ({currentEmployee.grade})</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Optional Manager Approval Note:
              </label>
              <textarea
                rows={2}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Approved for customer summit. Please ensure next quarter bookings are reserved 14 days in advance."
                className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingClaimWithNotes(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs"
              >
                Confirm Sign-Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. ESCALATE CLAIM MODAL */}
      {escalatingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>Hierarchical Escalation ({escalatingClaim.claimNumber})</span>
              </div>
              <button 
                onClick={() => setEscalatingClaim(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div>Claim Amount: <strong className="font-mono font-bold">${escalatingClaim.amount.toFixed(2)}</strong></div>
              <div>Current Manager: {currentEmployee.name} ({currentEmployee.grade}) · Signing limit: ${currentAuthority.signingLimit.toFixed(2)}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Target Higher-Grade Manager:
              </label>
              <select
                value={targetManagerId}
                onChange={(e) => setTargetManagerId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-md p-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              >
                {higherManagers.map(mgr => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.name} ({mgr.grade}) - {mgr.roleTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Escalation Justification:
              </label>
              <textarea
                rows={3}
                required
                value={escalationJustification}
                onChange={(e) => setEscalationJustification(e.target.value)}
                placeholder="Reason for requesting higher-level executive authorization..."
                className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEscalatingClaim(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEscalation}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-md shadow-xs"
              >
                Escalate to Executive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. CLARIFICATION MODAL */}
      {clarifyingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Request Clarification from Direct Report</span>
              </div>
              <button 
                onClick={() => setClarifyingClaim(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Direct Report: <strong>{clarifyingClaim.employeeName}</strong> ({clarifyingClaim.employeeGrade})
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Information Needed:
              </label>
              <textarea
                rows={3}
                required
                value={clarifyMessage}
                onChange={(e) => setClarifyMessage(e.target.value)}
                placeholder="e.g. Please upload the itemized invoice showing attendee breakdown or confirm business purpose..."
                className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClarifyingClaim(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClarification}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. CLAIM DETAIL MODAL */}
      <ClaimDetailModal
        claim={inspectClaim}
        onClose={() => setInspectClaim(null)}
      />
    </div>
  );
};
