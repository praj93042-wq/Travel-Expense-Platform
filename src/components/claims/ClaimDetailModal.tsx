import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { ExpenseClaim } from '../../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  FileText, 
  User, 
  Building, 
  Calendar, 
  DollarSign, 
  MessageSquare,
  ExternalLink,
  Info,
  Tag,
  Shield
} from 'lucide-react';

interface ClaimDetailModalProps {
  claim: ExpenseClaim | null;
  onClose: () => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({ claim, onClose }) => {
  const { 
    currentEmployee, 
    approveClaim, 
    rejectClaim, 
    requestClarification,
    checkApprovalEligibility,
    employees 
  } = useExpenses();

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarifyMsg, setClarifyMsg] = useState('');

  if (!claim) return null;

  const eligibility = checkApprovalEligibility(currentEmployee, claim);
  const submitter = employees.find(e => e.id === claim.employeeId);
  const directManager = submitter ? employees.find(e => e.id === submitter.managerId) : undefined;

  const isManager = eligibility.isDirectReport || eligibility.isSubordinate || currentEmployee.grade === 'Executive' || claim.escalatedToManagerId === currentEmployee.id;
  const isPending = claim.approvalStatus === 'pending_manager';

  const handleApprove = (isOverride = false) => {
    approveClaim(claim.id, currentEmployee.name, isOverride, undefined, currentEmployee.grade);
    onClose();
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason) return;
    rejectClaim(claim.id, rejectReason, currentEmployee.name, 'Policy Review', currentEmployee.grade);
    onClose();
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarifyMsg) return;
    requestClarification(claim.id, clarifyMsg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-slate-900">
              {claim.claimNumber}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
              claim.approvalStatus === 'auto_authorized' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              claim.approvalStatus === 'approved_by_manager' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              claim.approvalStatus === 'pending_manager' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
              claim.approvalStatus === 'requires_clarification' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {claim.approvalStatus.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 capitalize">{claim.type.replace('_', ' ')}</span>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs text-slate-500 font-medium">Claim Amount</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {claim.currency} ${claim.amount.toFixed(2)}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {claim.merchantName || 'Direct Claim'} · {claim.category}
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1 sm:text-right">
              <div>Employee: <strong className="text-slate-900">{claim.employeeName}</strong></div>
              <div>Grade & Entity: <span className="font-mono text-slate-700">{claim.employeeGrade} · {claim.legalEntity}</span></div>
              <div>Spend Date: <span className="font-mono text-slate-700">{claim.date}</span></div>
              {claim.tripNumber && (
                <div>Trip: <strong className="text-emerald-700">{claim.tripNumber}</strong></div>
              )}
            </div>
          </div>

          {/* Custom Tags Section */}
          {claim.tags && claim.tags.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80 text-xs">
              <span className="font-semibold text-emerald-950 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                Custom Categorization Tags:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {claim.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 bg-white text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md text-xs font-semibold shadow-2xs"
                  >
                    <span className="text-emerald-600 font-mono text-[10px]">#</span>
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hierarchical Reporting & Manager Grade Governance */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-bold flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                Hierarchical Reporting & Grade Authority
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Direct Manager: <strong>{directManager?.name || 'Assigned Manager'}</strong> ({directManager?.grade})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200/80">
              <div>
                <span className="text-slate-500">Submitter Grade:</span>{' '}
                <strong className="text-slate-900">{claim.employeeGrade}</strong>
              </div>
              <div>
                <span className="text-slate-500">Your Manager Grade:</span>{' '}
                <strong className="text-slate-900">{currentEmployee.name} ({currentEmployee.grade})</strong>
              </div>
            </div>

            {claim.approvalStatus === 'pending_manager' && (
              <div className={`p-2 rounded-lg text-[11px] flex items-center gap-2 ${
                eligibility.canApprove 
                  ? 'bg-emerald-100/70 text-emerald-950 font-medium' 
                  : 'bg-amber-100/70 text-amber-950 font-medium'
              }`}>
                {eligibility.canApprove ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                )}
                <span>
                  {eligibility.canApprove
                    ? `Signing Check Passed: Claim amount ($${claim.amount.toFixed(2)}) is within your ${currentEmployee.grade} signing authority.`
                    : eligibility.reason}
                </span>
              </div>
            )}

            {claim.escalatedToManagerName && (
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 text-[11px] space-y-0.5">
                <div><strong>Escalated to:</strong> {claim.escalatedToManagerName}</div>
                {claim.escalationReason && (
                  <div className="text-purple-900 italic">"{claim.escalationReason}"</div>
                )}
              </div>
            )}

            {claim.approvedBy && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] space-y-0.5">
                <div><strong>Approved by:</strong> {claim.approvedBy} on {claim.approvedAt ? new Date(claim.approvedAt).toLocaleDateString() : 'N/A'}</div>
                {claim.approvalNotes && (
                  <div className="text-emerald-900 italic">Note: "{claim.approvalNotes}"</div>
                )}
              </div>
            )}

            {claim.approvalStatus === 'rejected' && claim.rejectionReason && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-950 text-[11px] space-y-0.5">
                <div><strong>Declined by:</strong> {claim.auditLog.find(a => a.action === 'REJECTED_CLAIM')?.actor || 'Manager'}</div>
                <div className="text-red-900">Feedback: "{claim.rejectionReason}"</div>
              </div>
            )}
          </div>

          {/* POLICY ENGINE FINDINGS (Crucial PRD verification) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Patty Policy Engine Evaluation
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Policy v{claim.policyAssessment.policyVersion}
              </span>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {claim.policyAssessment.status === 'eligible_auto_authorized' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">
                    Rule Matched: {claim.policyAssessment.matchedRuleName}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {claim.policyAssessment.explanation}
                  </p>
                </div>
              </div>

              {/* Policy Math Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Policy Cap</span>
                  <div className="font-mono font-medium text-slate-900">
                    ${(claim.policyAssessment.maxAllowedAmount || 0).toFixed(2)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Excess Over Limit</span>
                  <div className="font-mono font-medium text-amber-700">
                    ${(claim.policyAssessment.excessAmount || 0).toFixed(2)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Manager Sign-Off</span>
                  <div className="font-medium text-slate-900">
                    {claim.policyAssessment.requiresManagerApproval ? 'Mandatory' : 'Bypassed (Auto-Authorized)'}
                  </div>
                </div>
              </div>

              {/* Exception reason if present */}
              {claim.isExceptionRequested && claim.exceptionReason && (
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <div className="font-semibold text-amber-950 text-xs">Employee Exception Request:</div>
                  <p className="text-amber-900 text-xs mt-1 leading-relaxed italic">
                    "{claim.exceptionReason}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Specific Type Details (Mileage / Allowance / Advance) */}
          {claim.type === 'mileage' && claim.mileageDetails && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="font-bold text-slate-900">Mileage Trip Details</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Route: <strong className="text-slate-800">{claim.mileageDetails.fromLocation} → {claim.mileageDetails.toLocation}</strong></div>
                <div>Distance: <strong className="font-mono text-slate-800">{claim.mileageDetails.distanceKm} km</strong></div>
                <div>Approved Rate: <strong className="font-mono text-slate-800">${claim.mileageDetails.ratePerKm}/km</strong></div>
                <div>Vehicle: <strong className="text-slate-800 capitalize">{claim.mileageDetails.vehicleType.replace('_', ' ')}</strong></div>
              </div>
              {claim.mileageDetails.routeEvidenceNote && (
                <div className="text-[11px] text-slate-500 italic">Note: {claim.mileageDetails.routeEvidenceNote}</div>
              )}
            </div>
          )}

          {claim.type === 'allowance' && claim.allowanceDetails && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="font-bold text-slate-900">Per Diem Allowance Entitlement</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Destination City: <strong className="text-slate-800">{claim.allowanceDetails.destinationCity}</strong></div>
                <div>Eligible Days: <strong className="font-mono text-slate-800">{claim.allowanceDetails.days} days</strong></div>
                <div>Daily Entitlement Rate: <strong className="font-mono text-slate-800">${claim.allowanceDetails.dailyRate}/day</strong></div>
                <div>Attestation Declaration: <strong className="text-emerald-700">Signed & Confirmed</strong></div>
              </div>
            </div>
          )}

          {claim.type === 'travel_advance' && claim.advanceDetails && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="font-bold text-slate-900">Travel Advance Status & Reconciliation</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Trip Estimated Budget: <strong className="font-mono text-slate-800">${claim.advanceDetails.estimatedBudget.toFixed(2)}</strong></div>
                <div>Disbursement Status: <strong className={claim.advanceDetails.externallyConfirmed ? 'text-emerald-700' : 'text-amber-700'}>
                  {claim.advanceDetails.externallyConfirmed ? 'Confirmed Disbursed by Finance' : 'Pending Disbursement'}
                </strong></div>
                <div>Remaining Offset Balance: <strong className="font-mono text-slate-800">${(claim.advanceDetails.remainingOffsetBalance || 0).toFixed(2)}</strong></div>
              </div>
            </div>
          )}

          {/* Receipt Evidence Display */}
          {claim.receipt && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  Receipt Evidence Repository
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-normal">
                  {claim.receipt.name} ({claim.receipt.size})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center">
                  <img 
                    src={claim.receipt.url} 
                    alt="Receipt evidence" 
                    referrerPolicy="no-referrer"
                    className="object-cover w-full h-48"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-medium text-slate-800">Extracted Line Items:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {claim.receipt.lineItems?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                        <span>{item.description}</span>
                        <span className="font-mono font-medium tabular-nums">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {claim.receipt.tax && (
                    <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                      <span>Included Tax / VAT:</span>
                      <span className="font-mono">${claim.receipt.tax.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Verified Total:</span>
                    <span className="font-mono">${(claim.receipt.total || claim.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail Timeline (PRD Requirement: Revisions & Audit Log) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Complete Audit & Revision History
            </div>
            <div className="space-y-2 border-l-2 border-slate-200 pl-3">
              {claim.auditLog.map(entry => (
                <div key={entry.id} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{entry.actor}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{entry.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Payable Status: <strong className="text-slate-800 capitalize">{claim.payableStatus.replace(/_/g, ' ')}</strong>
          </div>

          <div className="flex items-center gap-2">
            {isPending && isManager && (
              <>
                <button
                  type="button"
                  onClick={() => setIsClarifying(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Request Clarification
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                >
                  Decline Claim
                </button>

                {claim.isExceptionRequested ? (
                  <button
                    type="button"
                    disabled={!eligibility.canApprove}
                    onClick={() => handleApprove(true)}
                    title={!eligibility.canApprove ? eligibility.reason : undefined}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors shadow-xs ${
                      eligibility.canApprove 
                        ? 'text-white bg-amber-700 hover:bg-amber-800 cursor-pointer' 
                        : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                    }`}
                  >
                    Authorize Exception Override (${claim.amount.toFixed(2)})
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!eligibility.canApprove}
                    onClick={() => handleApprove(false)}
                    title={!eligibility.canApprove ? eligibility.reason : undefined}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors shadow-xs ${
                      eligibility.canApprove 
                        ? 'text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer' 
                        : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                    }`}
                  >
                    Approve Claim
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* REJECT DIALOG */}
        {isRejecting && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Decline Expense Claim</h3>
              <p className="text-xs text-slate-500">Provide an audit reason for rejecting this claim.</p>
              <textarea
                rows={2}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Missing valid tax invoice or personal expense"
                className="w-full text-xs border border-slate-200 rounded p-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="px-3 py-1 text-xs text-white bg-red-700 rounded"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CLARIFY DIALOG */}
        {isClarifying && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Request Missing Information</h3>
              <p className="text-xs text-slate-500">Ask the employee for missing business purpose or receipts.</p>
              <textarea
                rows={2}
                required
                value={clarifyMsg}
                onChange={(e) => setClarifyMsg(e.target.value)}
                placeholder="e.g. Please clarify attendee list for this dinner"
                className="w-full text-xs border border-slate-200 rounded p-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClarifying(false)}
                  className="px-3 py-1 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClarifySubmit}
                  className="px-3 py-1 text-xs text-white bg-blue-700 rounded"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
