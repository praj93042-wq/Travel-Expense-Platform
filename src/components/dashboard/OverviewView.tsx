import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { 
  PlusCircle, 
  MessageSquare, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface OverviewViewProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickCapture: () => void;
  onOpenChannelSimulator: () => void;
  onOpenNewClaim: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  setActiveTab,
  onOpenQuickCapture,
  onOpenChannelSimulator,
  onOpenNewClaim,
}) => {
  const { currentEmployee, claims, trips } = useExpenses();

  const myClaims = claims.filter(c => c.employeeId === currentEmployee.id);
  const myTrips = trips.filter(t => t.employeeId === currentEmployee.id);

  const pendingApprovalsCount = claims.filter(c => c.approvalStatus === 'pending_manager').length +
    trips.filter(t => t.status === 'pending_approval' || t.status === 'amendment_pending').length;

  const totalAuthorizedMySpend = myClaims
    .filter(c => c.approvalStatus === 'auto_authorized' || c.approvalStatus === 'approved_by_manager')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPendingMySpend = myClaims
    .filter(c => c.approvalStatus === 'pending_manager')
    .reduce((sum, c) => sum + c.amount, 0);

  const recentClaims = claims.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Workforce Suite · Native Patty Expense
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">Policy 2026.3</span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
            Welcome back, {currentEmployee.name}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Continuous expense capture is active for <strong className="text-slate-900">{currentEmployee.legalEntity}</strong>. Drop bills from web, WhatsApp, Slack, or Teams. In-policy reimbursements are auto-authorized instantly.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenChannelSimulator}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Channel Drop Simulator</span>
          </button>

          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Drop Bill (Instant OCR)</span>
          </button>
        </div>
      </div>

      {/* Pending Approvals Notice (if manager or items pending) */}
      {pendingApprovalsCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">
                {pendingApprovalsCount} Items Require Manager Approval:
              </span>
              <span className="text-amber-800 ml-1">
                Travel advances, mileage logs, and policy exceptions await sign-off.
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('approvals')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-md transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            Review Approvals Inbox →
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">My Authorized Reimbursable</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            ${totalAuthorizedMySpend.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto-authorized & manager approved
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">My Pending Sign-off</div>
          <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            ${totalPendingMySpend.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">
            Awaiting manager {currentEmployee.managerName}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Active Registered Trips</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {myTrips.filter(t => t.status === 'approved').length}
          </div>
          <div className="text-[11px] text-slate-500">
            Pre-requisite for travel expense intake
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">My Policy Band</div>
          <div className="text-base font-bold text-emerald-800 mt-1 truncate">
            {currentEmployee.grade}
          </div>
          <div className="text-[11px] text-slate-500">
            Meals: $65/day · Hotel: $220/night
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Active Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Intake Ledger (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Recent Continuous Intake Activity
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('claims')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                View Full Ledger <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentClaims.map(claim => {
                const isAuto = claim.approvalStatus === 'auto_authorized';
                const isPending = claim.approvalStatus === 'pending_manager';

                return (
                  <div key={claim.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{claim.claimNumber}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {claim.submissionChannel}
                        </span>
                        {claim.tripNumber && (
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {claim.tripNumber}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-slate-900">
                        {claim.merchantName || 'Direct'} · {claim.businessPurpose}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {claim.employeeName} ({claim.employeeGrade}) · {claim.date}
                      </div>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        ${claim.amount.toFixed(2)}
                      </div>
                      {isAuto ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Auto-Authorized
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={onOpenNewClaim}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              + Create Mileage, Per Diem, or Advance Request
            </button>
          </div>
        </div>

        {/* Active Registered Trips Card (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Approved Travel Trips
              </h2>
              <button
                onClick={() => setActiveTab('trips')}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                All Trips
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bills claimed during travel are automatically verified against approved destination stops and itinerary dates.
            </p>

            <div className="space-y-3">
              {trips.slice(0, 3).map(trip => (
                <div key={trip.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{trip.tripNumber}</span>
                    <span className="text-[10px] font-medium capitalize text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {trip.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800">{trip.purpose}</div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {trip.destinations[0]?.city}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{trip.destinations[0]?.startDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('trips')}
            className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
          >
            Register / Amend Business Trip
          </button>
        </div>
      </div>
    </div>
  );
};
