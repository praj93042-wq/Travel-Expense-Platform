import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { 
  Building2, 
  UserCheck, 
  PlusCircle, 
  MessageSquare, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogIn,
  LogOut,
  Cloud
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickCapture: () => void;
  onOpenChannelSimulator: () => void;
  onOpenNewClaim: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickCapture,
  onOpenChannelSimulator,
  onOpenNewClaim
}) => {
  const { 
    currentEmployee, 
    setCurrentEmployeeId, 
    employees, 
    claims, 
    trips, 
    resetAllData,
    firebaseUser,
    loginWithGoogle,
    logout,
    isFirestoreSyncActive
  } = useExpenses();

  // Pending approval counts for manager
  const pendingApprovalsCount = claims.filter(c => c.approvalStatus === 'pending_manager').length +
    trips.filter(t => t.status === 'pending_approval' || t.status === 'amendment_pending').length;

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Expenses' },
    { id: 'trips', label: 'Trips & Travel' },
    { 
      id: 'approvals', 
      label: 'Approvals', 
      badgeCount: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined 
    },
    { id: 'finance', label: 'Finance & Payouts' },
    { id: 'policies', label: 'Policy Matrix' },
    { id: 'analytics', label: 'Quarterly Spend' },
    { id: 'gemini_ai', label: 'Gemini AI Assistant', isAi: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top row: 3-zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              P
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Patty
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-1">
                Workforce Expenses
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Clean text navigation links with subtle underline/highlight */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`relative px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.isAi && <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{link.label}</span>
                {link.badgeCount !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold tabular-nums ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {link.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions, Firebase Auth & persona selector */}
        <div className="flex items-center gap-2">
          {/* Multi-channel capture drop simulator button */}
          <button
            onClick={onOpenChannelSimulator}
            title="Simulate WhatsApp, Slack or Teams drop"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Channel Simulator</span>
          </button>

          {/* Quick Capture receipt button */}
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Drop Bill</span>
          </button>

          {/* Firebase Google Auth Button */}
          {firebaseUser ? (
            <div className="flex items-center gap-1.5 pl-1">
              <img 
                src={firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                alt="User" 
                className="w-7 h-7 rounded-full border border-emerald-500 object-cover"
                title={`Signed in as ${firebaseUser.email}`}
              />
              <button
                onClick={logout}
                title="Sign out of Firebase"
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors"
              title="Sign in securely with Google via Firebase Auth"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="hidden sm:inline">Google Sign-in</span>
            </button>
          )}

          {/* Persona selector for rapid testing */}
          <div className="relative border-l border-slate-200 pl-2 ml-1 flex items-center">
            <select
              value={currentEmployee.id}
              onChange={(e) => setCurrentEmployeeId(e.target.value)}
              className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 pr-6 hover:bg-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              title="Switch logged-in persona to test workforce hierarchy"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.grade.split(' ')[0]}) - {emp.roleTitle.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all expenses, trips, and payout reports to initial seed state?')) {
                resetAllData();
              }
            }}
            title="Reset to clean demonstration state"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-bar showing active persona context & workforce metadata */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900">{currentEmployee.name}</span>
          <span className="text-slate-400">·</span>
          <span>{currentEmployee.roleTitle}</span>
          <span className="text-slate-400">·</span>
          <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 text-[11px]">
            {currentEmployee.grade}
          </span>
          <span className="text-slate-400">·</span>
          <span>{currentEmployee.legalEntity}</span>
          <span className="text-slate-400">·</span>
          <span>{currentEmployee.location}</span>
          {firebaseUser && (
            <>
              <span className="text-slate-400">·</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                <Cloud className="w-3 h-3 text-emerald-600" /> Firebase Auth: {firebaseUser.email}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Auto-Authorization for eligible reimbursements active
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Mandatory manager approval for Advances, Mileage & Allowances
          </span>
        </div>
      </div>
    </header>
  );
};

