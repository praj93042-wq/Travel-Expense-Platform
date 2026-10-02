import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { ExpenseClaim, ClaimType } from '../../types';
import { ClaimDetailModal } from './ClaimDetailModal';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface ClaimsViewProps {
  onOpenQuickCapture: () => void;
  onOpenNewClaim: () => void;
}

export const ClaimsView: React.FC<ClaimsViewProps> = ({ onOpenQuickCapture, onOpenNewClaim }) => {
  const { currentEmployee, claims } = useExpenses();

  const [activeTab, setActiveTab] = useState<'my_claims' | 'team_claims'>('my_claims');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectClaim, setInspectClaim] = useState<ExpenseClaim | null>(null);

  // Filtered claims
  const filteredClaims = claims.filter(c => {
    // Tab scope
    if (activeTab === 'my_claims' && c.employeeId !== currentEmployee.id) {
      return false;
    }
    // Type filter
    if (selectedType !== 'all' && c.type !== selectedType) {
      return false;
    }
    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'auto_authorized' && c.approvalStatus !== 'auto_authorized') return false;
      if (selectedStatus === 'pending_manager' && c.approvalStatus !== 'pending_manager') return false;
      if (selectedStatus === 'exception' && !c.isExceptionRequested) return false;
      if (selectedStatus === 'settled' && c.payableStatus !== 'settled_externally') return false;
    }
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        c.claimNumber.toLowerCase().includes(q) ||
        (c.merchantName && c.merchantName.toLowerCase().includes(q)) ||
        c.employeeName.toLowerCase().includes(q) ||
        c.businessPurpose.toLowerCase().includes(q) ||
        (c.tripNumber && c.tripNumber.toLowerCase().includes(q)) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(q)));
      if (!match) return false;
    }
    return true;
  });

  // Totals for top metrics
  const totalAmount = filteredClaims.reduce((sum, c) => sum + c.amount, 0);
  const autoAuthCount = filteredClaims.filter(c => c.approvalStatus === 'auto_authorized').length;
  const pendingCount = filteredClaims.filter(c => c.approvalStatus === 'pending_manager').length;

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Continuous Expense & Reimbursement Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            All captured bills, travel advances, mileage logs, and per diem allowances unified into a single authoritative state across web and messaging channels.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenNewClaim}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            + Structured Claim
          </button>
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Drop Bill</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Filtered Total</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            ${totalAmount.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{filteredClaims.length} records</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Auto-Authorized
          </div>
          <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5 tabular-nums">
            {autoAuthCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Bypassed manager intervention</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </div>
          <div className="text-lg font-bold font-mono text-amber-800 mt-0.5 tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Advances, Mileage & Exceptions</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Active Policy Scope</div>
          <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
            {currentEmployee.grade.split(' ')[0]} · {currentEmployee.legalEntity.split(' ')[1]}
          </div>
          <div className="text-[11px] text-emerald-700 font-mono mt-0.5">v2026.3 Enforced</div>
        </div>
      </div>

      {/* Control bar: Tabs + Search + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Scope Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('my_claims')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'my_claims'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Claims ({claims.filter(c => c.employeeId === currentEmployee.id).length})
          </button>
          <button
            onClick={() => setActiveTab('team_claims')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'team_claims'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Organization ({claims.length})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, ref, trip..."
              className="text-xs border border-slate-200 rounded-md pl-8 pr-3 py-1 bg-white text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden w-48 sm:w-56"
            />
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-white text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="reimbursement">Reimbursement</option>
            <option value="mileage">Mileage</option>
            <option value="allowance">Allowance</option>
            <option value="travel_advance">Travel Advance</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="auto_authorized">Auto-Authorized</option>
            <option value="pending_manager">Pending Manager</option>
            <option value="exception">Exception Review</option>
            <option value="settled">Settled in Payout</option>
          </select>
        </div>
      </div>

      {/* HIGH-DENSITY EXPENSE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
              <tr>
                <th className="py-2.5 px-4">Claim Ref</th>
                <th className="py-2.5 px-4">Spend Date</th>
                <th className="py-2.5 px-4">Merchant / Details</th>
                <th className="py-2.5 px-4">Employee & Grade</th>
                <th className="py-2.5 px-4">Trip</th>
                <th className="py-2.5 px-4">Channel</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Policy Evaluation & Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No expense claims match current filters.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isAuto = claim.approvalStatus === 'auto_authorized';
                  const isPending = claim.approvalStatus === 'pending_manager';
                  const isException = claim.isExceptionRequested;
                  const isSettled = claim.payableStatus === 'settled_externally';

                  return (
                    <tr 
                      key={claim.id} 
                      onClick={() => setInspectClaim(claim)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Ref & Type */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        <div>{claim.claimNumber}</div>
                        <div className="text-[10px] text-slate-400 font-sans capitalize">
                          {claim.type.replace('_', ' ')}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {claim.date}
                      </td>

                      {/* Merchant & Purpose */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {claim.merchantName || 'Direct Claim'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={claim.businessPurpose}>
                          {claim.businessPurpose}
                        </div>
                        {claim.tags && claim.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {claim.tags.map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{claim.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{claim.employeeGrade.split(' ')[0]}</div>
                      </td>

                      {/* Linked Trip */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {claim.tripNumber ? (
                          <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {claim.tripNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Ingestion Channel */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded">
                          {claim.submissionChannel}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        ${claim.amount.toFixed(2)}
                      </td>

                      {/* Status & Policy */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {isAuto && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Auto-Authorized
                            </span>
                          )}

                          {isPending && !isException && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" /> Pending Sign-off
                            </span>
                          )}

                          {isPending && isException && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-700" /> Exception Review
                            </span>
                          )}

                          {claim.approvalStatus === 'approved_by_manager' && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <CheckCircle2 className="w-3 h-3" /> Manager Approved
                            </span>
                          )}

                          {isSettled && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              · Settled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectClaim(claim);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Detail Modal */}
      <ClaimDetailModal 
        claim={inspectClaim}
        onClose={() => setInspectClaim(null)}
      />
    </div>
  );
};
