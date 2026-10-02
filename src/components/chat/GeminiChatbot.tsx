import React, { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { 
  Bot, 
  Send, 
  MapPin, 
  Globe, 
  Sparkles, 
  ExternalLink, 
  RotateCcw,
  Zap,
  Sliders,
  CheckCircle2,
  Shield,
  Compass
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingChunks?: any[];
}

interface GeminiChatbotProps {
  embedded?: boolean;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ embedded = false }) => {
  const { currentEmployee, policies, trips } = useExpenses();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `Hello ${currentEmployee.name}! I am Patty's Gemini-powered Travel & Expense Intelligence Assistant. I can check company policy for your ${currentEmployee.grade} band, verify travel venues with Google Maps, check live per diem rates with Google Search, or help draft exception requests.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash');
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [systemRole, setSystemRole] = useState<'policy_advisor' | 'travel_maps' | 'rate_auditor'>('policy_advisor');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Request browser geolocation if user enables Maps grounding
  const handleToggleMaps = (enabled: boolean) => {
    setUseMaps(enabled);
    if (enabled) {
      setUseSearch(false); // Google Maps cannot be combined with Google Search in the same request
      setSelectedModel('gemini-3.5-flash'); // Maps grounding requires gemini-3.5-flash
      if (navigator.geolocation && !userLocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => {
            console.warn('Geolocation access not available, using destination context:', err);
            // Default to San Francisco coordinates for travel demo
            setUserLocation({ latitude: 37.78193, longitude: -122.40476 });
          }
        );
      }
    }
  };

  const handleToggleSearch = (enabled: boolean) => {
    setUseSearch(enabled);
    if (enabled) {
      setUseMaps(false); // Mutual exclusivity with Maps
      setSelectedModel('gemini-3.5-flash');
    }
  };

  const systemInstructions: Record<string, string> = {
    policy_advisor: `You are Patty, an expert corporate travel and workforce expense intelligence advisor for ${currentEmployee.legalEntity}. The active user is ${currentEmployee.name}, currently in the ${currentEmployee.grade} tier, reporting to ${currentEmployee.managerName}.
Key company policy rules to uphold:
1. Employee-paid reimbursements within grade limits with valid receipts are auto-authorized.
2. Mileage claims ALWAYS require mandatory manager approval, even when within rates ($0.68/km).
3. Daily per diem allowances ALWAYS require mandatory manager approval.
4. Pre-trip travel advances ALWAYS require manager approval before entering payout disbursement schedules.
5. Over-limit claims require business justification for manager exception review.
Provide structured, clear, and helpful advice.`,

    travel_maps: `You are Patty's Corporate Travel & Maps Navigator. You specialize in locating verified hotels, transit stations, airport transfer hubs, and business meeting venues. When Google Maps Grounding is active, recommend specific, verifiable places and destinations for business travelers with proximity to convention centers and airports. Always cite location context clearly.`,

    rate_auditor: `You are Patty's Expense Audit & GSA Per Diem Specialist. With Google Search Grounding active, look up real-time federal GSA per diem rates, airline baggage allowances, standard hotel rates, and verify unfamiliar merchant names and VAT rates. Always state exact dates and reference sources.`
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemInstruction: systemInstructions[systemRole],
          model: selectedModel,
          useSearch,
          useMaps,
          userLocation
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.text || 'I processed your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
        groundingChunks: data.groundingChunks || []
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat request failed:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Error connecting to Gemini API: ${err.message || String(err)}. Please ensure your GEMINI_API_KEY is configured in AI Studio Secrets.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      label: 'Find SF Hotels (Maps)',
      prompt: 'Find 3 top-rated business hotels in San Francisco near Moscone Center with approximate nightly rates.',
      enableMaps: true,
    },
    {
      label: '2026 GSA Per Diem (Search)',
      prompt: 'What are the current 2026 GSA per diem meal and lodging rates for San Francisco, CA and Austin, TX?',
      enableSearch: true,
    },
    {
      label: 'Band B Meal Limit Rule',
      prompt: `What is the maximum allowed daily meal reimbursement for my grade (${currentEmployee.grade}) under Patty US policy, and does it auto-approve?`,
      role: 'policy_advisor' as const,
    },
    {
      label: 'Draft Exception Request',
      prompt: 'Draft an executive business justification for a $94.50 team dinner with external Cloudflare partners that exceeded our $65 limit.',
      role: 'policy_advisor' as const,
    }
  ];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col ${embedded ? 'h-[620px]' : 'h-[750px]'} overflow-hidden`}>
      {/* Top Bar with Role & Model Selectors */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Patty Gemini Travel & Policy AI</span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Multi-Turn
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Workforce Intelligence with Google Maps & Search Grounding
            </p>
          </div>
        </div>

        {/* Controls: Model & Tools */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Model Selector */}
          <div className="flex items-center gap-1">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="text-xs font-medium border border-slate-200 rounded-md py-1 px-2 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              title="Select Gemini Model Tier"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General + Maps/Search)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
            </select>
          </div>

          {/* Persona / System Role */}
          <select
            value={systemRole}
            onChange={(e) => setSystemRole(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
          >
            <option value="policy_advisor">Policy & Compliance Advisor</option>
            <option value="travel_maps">Travel & Maps Navigator</option>
            <option value="rate_auditor">Per Diem & Rate Auditor</option>
          </select>

          {/* Reset History */}
          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            title="Clear Chat History"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tool Grounding Toggles Sub-bar */}
      <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
            Grounding Tools:
          </span>

          {/* Google Maps Toggle */}
          <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer border text-[11px] transition-colors ${
            useMaps 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
            <input
              type="checkbox"
              checked={useMaps}
              onChange={(e) => handleToggleMaps(e.target.checked)}
              className="hidden"
            />
            <MapPin className={`w-3.5 h-3.5 ${useMaps ? 'text-emerald-700' : 'text-slate-400'}`} />
            <span>Google Maps Grounding</span>
          </label>

          {/* Google Search Toggle */}
          <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer border text-[11px] transition-colors ${
            useSearch 
              ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
            <input
              type="checkbox"
              checked={useSearch}
              onChange={(e) => handleToggleSearch(e.target.checked)}
              className="hidden"
            />
            <Globe className={`w-3.5 h-3.5 ${useSearch ? 'text-blue-700' : 'text-slate-400'}`} />
            <span>Google Search Grounding</span>
          </label>
        </div>

        <div className="text-[11px] text-slate-400">
          Role: <strong className="text-slate-700 capitalize">{systemRole.replace('_', ' ')}</strong>
        </div>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-700 text-white rounded-br-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                }`}
              >
                {/* Message prose */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounding Citations / Links (Mandatory requirement for Google Maps & Search Grounding) */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Grounded Citations & Sources:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingChunks.map((chunk, cIdx) => {
                        // Check web grounding chunk
                        if (chunk.web?.uri) {
                          return (
                            <a
                              key={cIdx}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{chunk.web.title || chunk.web.uri}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          );
                        }

                        // Check maps grounding chunk
                        if (chunk.maps?.uri) {
                          return (
                            <a
                              key={cIdx}
                              href={chunk.maps.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                            >
                              <MapPin className="w-3 h-3 text-emerald-700" />
                              <span className="truncate max-w-[200px]">{chunk.maps.title || 'Google Maps Location'}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp & Model Tag */}
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                <span>{msg.timestamp}</span>
                {msg.modelUsed && (
                  <>
                    <span>·</span>
                    <span className="text-slate-500">{msg.modelUsed}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 w-fit text-xs text-slate-600 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>Thinking with {selectedModel}{useMaps ? ' (Maps Grounding)' : useSearch ? ' (Search Grounding)' : ''}...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-medium whitespace-nowrap text-[10px] uppercase tracking-wide">
          Quick Prompts:
        </span>
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (qp.enableMaps) handleToggleMaps(true);
              if (qp.enableSearch) handleToggleSearch(true);
              if (qp.role) setSystemRole(qp.role);
              handleSend(qp.prompt);
            }}
            className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 whitespace-nowrap transition-colors shadow-2xs"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask Patty AI (${selectedModel})... e.g. "Check hotel options near Moscone Center"`}
          className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
