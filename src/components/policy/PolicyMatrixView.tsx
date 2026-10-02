import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { EmployeeGrade, ClaimCategory } from '../../types';
import { 
  ShieldCheck, 
  Building, 
  MapPin, 
  Edit2, 
  Check, 
  AlertCircle,
  HelpCircle,
  Lock
} from 'lucide-react';

export const PolicyMatrixView: React.FC = () => {
  const { policies, updatePolicyRule } = useExpenses();

  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policies[0]?.id || 'pol-us-01');
  const [editingRule, setEditingRule] = useState<{ grade: string; category: string; value: number } | null>(null);

  const activePolicy = policies.find(p => p.id === selectedPolicyId) || policies[0];

  const grades: EmployeeGrade[] = [
    'Executive',
    'Senior (Band C)',
    'Mid-level (Band B)',
    'Associate (Band A)',
  ];

  const categories: ClaimCategory[] = [
    'Meals & Entertainment',
    'Hotel & Lodging',
    'Ground Transport / Taxi',
    'Flights',
    'Office & Equipment',
    'Software & Subscriptions'
  ];

  const handleSaveEdit = () => {
    if (!editingRule) return;
    updatePolicyRule(activePolicy.id, editingRule.grade, editingRule.category, editingRule.value, editingRule.value);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Workforce Expense Policy & Grade Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Policy rules are scoped by Legal Entity and Employee Work Location, establishing grade-based limits (Executive, Senior Band C, Mid-level Band B, Associate Band A).
          </p>
        </div>

        {/* Policy Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Active Policy Scope:</span>
          <select
            value={selectedPolicyId}
            onChange={(e) => setSelectedPolicyId(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg py-1.5 px-3 shadow-2xs"
          >
            {policies.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.legalEntity}) - v{p.version}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Policy Governance Principles Strip (PRD Rules) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1">
          <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Reimbursement Auto-Authorization
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Employee-paid reimbursements within grade limits and supported by itemized receipts are authorized automatically by policy, bypassing approval bottlenecks.
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1">
          <div className="font-semibold text-amber-800 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-600" />
            Mandatory Manager Approval & Advance Governance
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Mileage, Per Diem Allowances, and Travel Advances always require manager approval. <strong className="text-amber-900">Policy Rule: Travel advance can ONLY be given for approved travel</strong> (unapproved or pending trips cannot receive advances).
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-600" />
            Entity & Location Hierarchy
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Entity policies override global fallbacks. Employee home location selects the baseline policy; travel destination applies location rate multipliers.
          </p>
        </div>
      </div>

      {/* DAILY CAB ALLOWANCE POLICY (MODEL B WITH ACTUAL RECEIPT OPTION) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>🚕 Ground Transport & Daily Cab Allowance (Dual-Model Policy)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Employees can receive a fixed daily cab stipend (Model B) or submit actual itemized taxi/rideshare receipts.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 text-[11px] font-bold">
            Auto-factored in Trip Budgets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5">
            <span className="font-bold text-emerald-900 block text-xs">
              Primary Option: Model B (Daily Fixed Transit Allowance)
            </span>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              When a trip is registered, our fixed daily cab rate is <strong>automatically factored into the pre-trip budget</strong> for each declared travel day. No taxi receipts required—eliminates receipt hoarding and audit overhead.
            </p>
            <div className="pt-1.5 grid grid-cols-4 gap-1 text-[11px] font-mono">
              <div className="p-1 bg-white rounded border border-emerald-200 text-center">
                <div className="text-[9px] text-slate-400 font-sans">Band A</div>
                <div className="font-bold text-slate-900">$40–$55/d</div>
              </div>
              <div className="p-1 bg-white rounded border border-emerald-200 text-center">
                <div className="text-[9px] text-slate-400 font-sans">Band B</div>
                <div className="font-bold text-slate-900">$55–$70/d</div>
              </div>
              <div className="p-1 bg-white rounded border border-emerald-200 text-center">
                <div className="text-[9px] text-slate-400 font-sans">Band C</div>
                <div className="font-bold text-slate-900">$75–$95/d</div>
              </div>
              <div className="p-1 bg-white rounded border border-emerald-200 text-center">
                <div className="text-[9px] text-slate-400 font-sans">Exec</div>
                <div className="font-bold text-slate-900">$100–$130/d</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <span className="font-bold text-slate-900 block text-xs">
              Secondary Option: Actual Cab Receipts / Itemized Bills
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If employees incur higher transit fares (e.g., long-distance client site visits, airport limos, surge pricing), they retain full flexibility to submit actual cab receipts under the <em>Reimbursement</em> claim category.
            </p>
            <ul className="text-[10.5px] text-slate-500 list-disc list-inside space-y-0.5 pt-1">
              <li>Itemized taxi/rideshare receipt upload required.</li>
              <li>Auto-authorized if within transaction cap; manager review for overage.</li>
              <li>Employees choose between Model B allowance or actual bills per trip.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* GRADE LIMIT MATRIX TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              {activePolicy.name} — Grade Limit Matrix
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any value to adjust limits and simulate changes in live policy evaluation.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Version {activePolicy.version} · {activePolicy.legalEntity}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Expense Category</th>
                {grades.map(grade => (
                  <th key={grade} className="py-3 px-4 text-right">
                    <div>{grade}</div>
                    <div className="text-[10px] font-normal text-slate-400">Limit / Day</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map(cat => (
                <tr key={cat} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {cat}
                  </td>

                  {grades.map(grade => {
                    const rule = activePolicy.rules.find(r => r.grade === grade && r.category === cat);
                    const val = rule?.maxDailyRate || rule?.maxPerTransaction || 0;
                    const isEditing = editingRule?.grade === grade && editingRule?.category === cat;

                    return (
                      <td key={grade} className="py-3 px-4 text-right font-mono tabular-nums">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editingRule.value}
                              onChange={(e) => setEditingRule({ ...editingRule, value: parseFloat(e.target.value) || 0 })}
                              className="w-16 text-right border border-emerald-500 rounded p-1 text-xs"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRule({ grade, category: cat, value: val })}
                            title="Click to edit rule threshold"
                            className="group flex items-center justify-end gap-1 w-full text-slate-800 hover:text-emerald-700 font-semibold"
                          >
                            <span>${val.toFixed(2)}</span>
                            <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MILEAGE & ALLOWANCE STATUTORY RATES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mileage Rates */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Distance & Vehicle Mileage Rates
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Mandatory Manager Approval
            </span>
          </div>
          <div className="space-y-2 text-xs">
            {activePolicy.mileageRates.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-700 border-b border-slate-50 pb-1.5">
                <span className="capitalize">{m.vehicleType.replace('_', ' ')}</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ${m.ratePerKm.toFixed(2)} / km
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Per Diem Destination Allowances */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Destination Per Diem Daily Allowances
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Mandatory Manager Approval
            </span>
          </div>
          <div className="space-y-2 text-xs">
            {activePolicy.allowanceRates.map((a, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-700 border-b border-slate-50 pb-1.5">
                <div>
                  <span className="font-medium text-slate-900">{a.destination}</span>
                  <span className="text-[10px] text-slate-400 block">{a.grade}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ${a.dailyRate.toFixed(2)} / day
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
