/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import { Header } from './components/common/Header';
import { OverviewView } from './components/dashboard/OverviewView';
import { ClaimsView } from './components/claims/ClaimsView';
import { TripsView } from './components/trips/TripsView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { FinancePayoutView } from './components/finance/FinancePayoutView';
import { PolicyMatrixView } from './components/policy/PolicyMatrixView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { GeminiChatbot } from './components/chat/GeminiChatbot';
import { QuickCaptureModal } from './components/capture/QuickCaptureModal';
import { ChannelSimulatorModal } from './components/capture/ChannelSimulatorModal';
import { NewClaimModal } from './components/claims/NewClaimModal';
import { Bot, Sparkles, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isChannelSimulatorOpen, setIsChannelSimulatorOpen] = useState(false);
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* SaaS Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenChannelSimulator={() => setIsChannelSimulatorOpen(true)}
        onOpenNewClaim={() => setIsNewClaimOpen(true)}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView
            setActiveTab={setActiveTab}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            onOpenChannelSimulator={() => setIsChannelSimulatorOpen(true)}
            onOpenNewClaim={() => setIsNewClaimOpen(true)}
          />
        )}

        {activeTab === 'claims' && (
          <ClaimsView
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            onOpenNewClaim={() => setIsNewClaimOpen(true)}
          />
        )}

        {activeTab === 'trips' && <TripsView />}

        {activeTab === 'approvals' && <ApprovalsView />}

        {activeTab === 'finance' && <FinancePayoutView />}

        {activeTab === 'policies' && <PolicyMatrixView />}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'gemini_ai' && <GeminiChatbot />}
      </main>

      {/* Floating Gemini Chatbot Launcher Button */}
      {activeTab !== 'gemini_ai' && (
        <div className="fixed bottom-6 right-6 z-40">
          {!isFloatingChatOpen ? (
            <button
              onClick={() => setIsFloatingChatOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-semibold text-xs"
              title="Open Gemini Travel & Expense Assistant"
            >
              <Bot className="w-4 h-4" />
              <span>Ask Patty AI</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-96 sm:w-[420px] overflow-hidden flex flex-col h-[520px]">
              <div className="p-3 bg-emerald-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-bold">Patty Gemini Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsFloatingChatOpen(false);
                      setActiveTab('gemini_ai');
                    }}
                    className="text-[10px] bg-emerald-700 hover:bg-emerald-600 px-2 py-0.5 rounded text-white"
                  >
                    Full View
                  </button>
                  <button
                    onClick={() => setIsFloatingChatOpen(false)}
                    className="text-white hover:text-emerald-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <GeminiChatbot embedded={true} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <strong>Patty Expense Platform</strong> · Workforce Management Suite
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Entity & Location Policy Scoping</span>
            <span>·</span>
            <span>Continuous Channel Ingestion</span>
            <span>·</span>
            <span>Versioned Payout Snapshots</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      <ChannelSimulatorModal
        isOpen={isChannelSimulatorOpen}
        onClose={() => setIsChannelSimulatorOpen(false)}
      />

      <NewClaimModal
        isOpen={isNewClaimOpen}
        onClose={() => setIsNewClaimOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
}
