import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { 
  X, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface ChannelSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChannelType = 'whatsapp' | 'slack' | 'teams';

interface ChatMessage {
  id: string;
  sender: 'user' | 'patty_bot';
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    amount: number;
    merchant: string;
  };
  policyOutcome?: {
    type: 'auto_authorized' | 'pending_manager' | 'clarification';
    summary: string;
  };
}

export const ChannelSimulatorModal: React.FC<ChannelSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { currentEmployee, trips, submitClaim } = useExpenses();
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('whatsapp');
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'patty_bot',
      text: `Hi ${currentEmployee.name}! Patty Expense Channel Adapter is connected for ${currentEmployee.legalEntity}. You can send photos of receipts, enter mileage, or request travel advances right here.`,
      timestamp: '09:00 AM',
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: 'Drop SFO Uber ($42.50)',
      text: 'Dropped Uber receipt from SFO airport to hotel for $42.50',
      amount: 42.50,
      merchant: 'Uber Technologies',
      category: 'Ground Transport / Taxi' as const,
      type: 'reimbursement' as const,
    },
    {
      label: 'Report Mileage (35 km)',
      text: 'Drove 35km from Brooklyn office to client site in White Plains in personal car',
      amount: 23.80, // 35 * 0.68
      merchant: 'Client Travel Mileage',
      category: 'Mileage' as const,
      type: 'mileage' as const,
    },
    {
      label: 'Drop Working Dinner ($52.00)',
      text: 'Dinner at Blue Ribbon Sushi with engineering contractor ($52.00)',
      amount: 52.00,
      merchant: 'Blue Ribbon Sushi',
      category: 'Meals & Entertainment' as const,
      type: 'reimbursement' as const,
    },
    {
      label: 'Request Travel Advance ($300)',
      text: 'Need a $300 cash advance for upcoming London trip transit & incidentals',
      amount: 300.00,
      merchant: 'Advance Request',
      category: 'Ground Transport / Taxi' as const,
      type: 'travel_advance' as const,
    }
  ];

  const handleSendPrompt = (prompt: typeof quickPrompts[0]) => {
    sendMessage(prompt.text, prompt);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Infer simple values from text
    const text = inputMessage;
    const amountMatch = text.match(/\$?(\d+(\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 45.00;
    
    let type: 'reimbursement' | 'mileage' | 'travel_advance' = 'reimbursement';
    let category: any = 'Meals & Entertainment';

    if (text.toLowerCase().includes('km') || text.toLowerCase().includes('mile') || text.toLowerCase().includes('drove')) {
      type = 'mileage';
      category = 'Mileage';
    } else if (text.toLowerCase().includes('advance') || text.toLowerCase().includes('cash')) {
      type = 'travel_advance';
      category = 'Ground Transport / Taxi';
    } else if (text.toLowerCase().includes('uber') || text.toLowerCase().includes('taxi') || text.toLowerCase().includes('train')) {
      category = 'Ground Transport / Taxi';
    }

    sendMessage(text, {
      amount,
      merchant: type === 'mileage' ? 'Vehicle Mileage' : 'Parsed Vendor',
      category,
      type,
    });
    setInputMessage('');
  };

  const sendMessage = (text: string, data: { amount: number; merchant: string; category: any; type: any }) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: {
        name: `${data.merchant.toLowerCase().replace(/\s+/g, '_')}_receipt.pdf`,
        amount: data.amount,
        merchant: data.merchant
      }
    };

    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    setTimeout(() => {
      // Find trip if available
      const trip = trips.find(t => t.employeeId === currentEmployee.id && t.status === 'approved');

      // Submit into central Patty state
      const createdClaim = submitClaim({
        type: data.type,
        employeeId: currentEmployee.id,
        amount: data.amount,
        currency: 'USD',
        category: data.category,
        merchantName: data.merchant,
        businessPurpose: text,
        submissionChannel: selectedChannel,
        tripId: trip?.id,
        receipt: {
          name: `${data.merchant}_mobile_drop.pdf`,
          url: 'https://images.unsplash.com/photo-1554415707-9e49fe74a661?w=400&auto=format&fit=crop&q=80',
          size: '195 KB',
          mimeType: 'application/pdf',
          merchantName: data.merchant,
          total: data.amount,
          currency: 'USD',
          confidenceScore: 0.97
        }
      });

      let botReply = '';
      let outcomeType: 'auto_authorized' | 'pending_manager' | 'clarification' = 'auto_authorized';

      if (createdClaim.approvalStatus === 'auto_authorized') {
        botReply = `Receipt verified! Scanned $${data.amount.toFixed(2)} at ${data.merchant}. Since this is within your ${currentEmployee.grade} limit, it was automatically authorized under Patty Policy Rule ${createdClaim.policyAssessment.matchedRuleName}. Added to your authorized payable ledger!`;
        outcomeType = 'auto_authorized';
      } else if (data.type === 'mileage') {
        botReply = `Recorded your mileage claim ($${data.amount.toFixed(2)}). Per Patty company policy, all mileage claims require mandatory manager sign-off. Routed to ${currentEmployee.managerName} for approval.`;
        outcomeType = 'pending_manager';
      } else if (data.type === 'travel_advance') {
        botReply = `Registered travel advance request for $${data.amount.toFixed(2)}. Per company policy, travel advances require manager approval before entering the advance disbursement schedule. Routed to ${currentEmployee.managerName}.`;
        outcomeType = 'pending_manager';
      } else {
        botReply = `Claim recorded ($${data.amount.toFixed(2)} at ${data.merchant}). It exceeds standard limits or requires managerial review. Routed to ${currentEmployee.managerName}.`;
        outcomeType = 'pending_manager';
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'patty_bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        policyOutcome: {
          type: outcomeType,
          summary: `${createdClaim.claimNumber} · ${createdClaim.approvalStatus === 'auto_authorized' ? 'Auto-Authorized' : 'Pending Manager Review'}`
        }
      };

      setMessages(prev => [...prev, botMsg]);
      setIsProcessing(false);
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col h-[600px] transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg">
              <button
                onClick={() => setSelectedChannel('whatsapp')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedChannel === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setSelectedChannel('slack')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedChannel === 'slack'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slack #expense
              </button>
              <button
                onClick={() => setSelectedChannel('teams')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedChannel === 'teams'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                MS Teams
              </button>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              · Continuous Channel Ingestion
            </span>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                }`}
              >
                {msg.text}

                {msg.attachment && (
                  <div className="mt-2 pt-2 border-t border-emerald-600/50 flex items-center justify-between text-[11px] opacity-90">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {msg.attachment.merchant}
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      ${msg.attachment.amount.toFixed(2)}
                    </span>
                  </div>
                )}

                {msg.policyOutcome && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px]">
                    {msg.policyOutcome.type === 'auto_authorized' ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {msg.policyOutcome.summary}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> {msg.policyOutcome.summary}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-mono">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 italic p-2 bg-white rounded-lg border border-slate-200 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Patty is validating receipt evidence & evaluating {currentEmployee.grade} policy rules...
            </div>
          )}
        </div>

        {/* Quick action chips */}
        <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-medium whitespace-nowrap text-[10px] uppercase tracking-wide">
            Test Drops:
          </span>
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendPrompt(q)}
              className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 whitespace-nowrap transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendCustom} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button 
            type="button"
            title="Attach simulated photo"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message Patty bot on ${selectedChannel}... (e.g. "Drove 30km to client")`}
            className="flex-1 text-xs border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing}
            className="p-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
