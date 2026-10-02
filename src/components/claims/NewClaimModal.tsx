import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { ClaimType, ClaimCategory } from '../../types';
import { 
  X, 
  Receipt, 
  Navigation, 
  Calendar, 
  CreditCard,
  Building,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface NewClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewClaimModal: React.FC<NewClaimModalProps> = ({ isOpen, onClose }) => {
  const { currentEmployee, trips, submitClaim, evaluateClaimPolicy, getDailyCabAllowanceRate } = useExpenses();

  const [claimType, setClaimType] = useState<ClaimType>('reimbursement');

  // Common fields
  const [amount, setAmount] = useState('65.00');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ClaimCategory>('Meals & Entertainment');
  const [merchant, setMerchant] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tripId, setTripId] = useState('');

  // Mileage specific
  const [distanceKm, setDistanceKm] = useState('40');
  const [vehicleType, setVehicleType] = useState<'personal_car' | 'electric_vehicle' | 'motorcycle'>('personal_car');
  const [fromLoc, setFromLoc] = useState('New York HQ');
  const [toLoc, setToLoc] = useState('Client Office, White Plains');

  // Allowance specific
  const [allowanceSubType, setAllowanceSubType] = useState<'daily_cab_allowance' | 'meals_incidentals'>('daily_cab_allowance');
  const [allowanceDays, setAllowanceDays] = useState('2');
  const [allowanceCity, setAllowanceCity] = useState('San Francisco, US');
  const [declarationAgreed, setDeclarationAgreed] = useState(true);

  // Travel Advance specific
  const [advanceAmount, setAdvanceAmount] = useState('350.00');

  if (!isOpen) return null;

  const employeeTrips = trips.filter(t => t.employeeId === currentEmployee.id && t.status === 'approved');
  const matchedTrip = trips.find(t => t.id === tripId);

  // Mileage calculation
  const mileageRate = vehicleType === 'electric_vehicle' ? 0.72 : vehicleType === 'motorcycle' ? 0.35 : 0.68;
  const calculatedMileageAmount = (parseFloat(distanceKm) || 0) * mileageRate;

  // Allowance calculation (Cab Allowance vs Meals & Incidentals)
  const cabAllowanceRate = getDailyCabAllowanceRate(currentEmployee.grade, allowanceCity);
  const mealsAllowanceRate = allowanceCity.includes('San Francisco') ? 75.00 : allowanceCity.includes('London') ? 80.00 : 65.00;
  const activeAllowanceRate = allowanceSubType === 'daily_cab_allowance' ? cabAllowanceRate : mealsAllowanceRate;
  const calculatedAllowanceAmount = (parseFloat(allowanceDays) || 0) * activeAllowanceRate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (claimType === 'reimbursement') {
      submitClaim({
        type: 'reimbursement',
        employeeId: currentEmployee.id,
        amount: parseFloat(amount) || 0,
        currency: 'USD',
        category,
        merchantName: merchant || 'Direct Expense',
        date,
        businessPurpose: purpose,
        tripId: tripId || undefined,
        submissionChannel: 'web_portal',
      });
    } else if (claimType === 'mileage') {
      submitClaim({
        type: 'mileage',
        employeeId: currentEmployee.id,
        amount: calculatedMileageAmount,
        currency: 'USD',
        category: 'Mileage',
        merchantName: 'Mileage Log',
        date,
        businessPurpose: purpose || `Business travel ${distanceKm} km from ${fromLoc} to ${toLoc}`,
        tripId: tripId || undefined,
        submissionChannel: 'web_portal',
        mileageDetails: {
          distanceKm: parseFloat(distanceKm) || 0,
          vehicleType,
          ratePerKm: mileageRate,
          fromLocation: fromLoc,
          toLocation: toLoc,
          routeEvidenceNote: 'Odometer & GPS log attested by employee'
        }
      });
    } else if (claimType === 'allowance') {
      submitClaim({
        type: 'allowance',
        employeeId: currentEmployee.id,
        amount: calculatedAllowanceAmount,
        currency: 'USD',
        category: allowanceSubType === 'daily_cab_allowance' ? 'Ground Transport / Taxi' : 'Per Diem / Allowance',
        merchantName: allowanceSubType === 'daily_cab_allowance' ? 'Daily Fixed Cab Allowance (Model B)' : 'Daily Per Diem Meals Allowance',
        date,
        businessPurpose: purpose || (allowanceSubType === 'daily_cab_allowance'
          ? `Fixed daily cab allowance for ${allowanceDays} days travel to ${allowanceCity} ($${activeAllowanceRate}/day - Model B)`
          : `Per diem allowance for ${allowanceDays} days travel to ${allowanceCity}`),
        tripId: tripId || undefined,
        submissionChannel: 'web_portal',
        allowanceDetails: {
          days: parseFloat(allowanceDays) || 0,
          dailyRate: activeAllowanceRate,
          destinationCity: allowanceCity,
          activityType: 'business_travel',
          declarationAgreed,
          allowanceSubType,
        }
      });
    } else if (claimType === 'travel_advance') {
      submitClaim({
        type: 'travel_advance',
        employeeId: currentEmployee.id,
        amount: parseFloat(advanceAmount) || 0,
        currency: 'USD',
        category: 'Ground Transport / Taxi',
        merchantName: 'Travel Advance Request',
        date,
        businessPurpose: purpose || 'Cash travel advance for incidental expenses',
        tripId: tripId || undefined,
        submissionChannel: 'web_portal',
        advanceDetails: {
          estimatedBudget: matchedTrip ? matchedTrip.estimatedCost : 1500,
          approvedAmount: undefined,
          disbursedAmount: undefined,
          externallyConfirmed: false,
          remainingOffsetBalance: parseFloat(advanceAmount) || 0,
        }
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">New Structured Expense Claim</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select claim category. Rules enforce mandatory approval for Advances, Mileage, and Allowances.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Claim Type Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg mt-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setClaimType('reimbursement')}
            className={`py-1.5 px-2 rounded-md transition-all ${
              claimType === 'reimbursement' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Reimbursement
          </button>
          <button
            type="button"
            onClick={() => setClaimType('mileage')}
            className={`py-1.5 px-2 rounded-md transition-all ${
              claimType === 'mileage' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Mileage
          </button>
          <button
            type="button"
            onClick={() => setClaimType('allowance')}
            className={`py-1.5 px-2 rounded-md transition-all ${
              claimType === 'allowance' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Allowance
          </button>
          <button
            type="button"
            onClick={() => setClaimType('travel_advance')}
            className={`py-1.5 px-2 rounded-md transition-all ${
              claimType === 'travel_advance' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Advance
          </button>
        </div>

        {/* Policy Rule Explainer Banner */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            {claimType === 'reimbursement' && (
              <span><strong>Employee-Paid Reimbursement:</strong> Within-policy claims are automatically authorized if policy permits. Exceptions route to manager.</span>
            )}
            {claimType === 'mileage' && (
              <span><strong>Mileage Claim:</strong> Mandatory manager approval required by policy, even when within rates (${mileageRate}/km).</span>
            )}
            {claimType === 'allowance' && (
              <span><strong>Per Diem Allowance:</strong> Mandatory manager approval required. Entitlement basis configured by destination city.</span>
            )}
            {claimType === 'travel_advance' && (
              <span><strong>Travel Advance Policy:</strong> Travel advance can ONLY be given for approved travel. Advances require mandatory manager approval and must be linked to an officially approved itinerary.</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          {/* Trip Linking */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Associate with Approved Trip {claimType === 'travel_advance' ? '(Approved Travel Required)' : '(Optional)'}
            </label>
            <select
              required={claimType === 'travel_advance'}
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="w-full border border-slate-200 rounded-md p-2"
            >
              <option value="">-- Select Trip --</option>
              {employeeTrips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.tripNumber}: {t.purpose} [{t.status === 'approved' ? 'APPROVED' : t.status.toUpperCase()}]
                </option>
              ))}
            </select>
            {claimType === 'travel_advance' && matchedTrip && matchedTrip.status !== 'approved' && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">
                ⚠️ Policy Restriction: Travel advance can ONLY be given for approved travel. The selected trip ({matchedTrip.tripNumber}) is currently "{matchedTrip.status}".
              </p>
            )}
          </div>

          {/* Form fields based on Claim Type */}
          {claimType === 'reimbursement' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Merchant / Vendor</label>
                  <input
                    type="text"
                    required
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Delta Airlines, Sweetgreen"
                    className="w-full border border-slate-200 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Spend Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2 font-mono tabular-nums font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClaimCategory)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  >
                    <option value="Meals & Entertainment">Meals & Entertainment</option>
                    <option value="Hotel & Lodging">Hotel & Lodging</option>
                    <option value="Ground Transport / Taxi">Ground Transport / Taxi</option>
                    <option value="Flights">Flights</option>
                    <option value="Office & Equipment">Office & Equipment</option>
                    <option value="Software & Subscriptions">Software & Subscriptions</option>
                  </select>
                </div>
              </div>

              {category === 'Ground Transport / Taxi' && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-950 flex items-start gap-2">
                  <span className="text-blue-600 font-bold shrink-0">🚕 Dual Option:</span>
                  <p className="text-[10.5px] text-blue-900 leading-relaxed">
                    You are claiming <strong>actual taxi / rideshare bills</strong> with itemized receipt evidence. Alternatively, per corporate policy Model B, you can claim the <strong>daily fixed cab allowance</strong> (${getDailyCabAllowanceRate(currentEmployee.grade, 'Standard')}/day) without receipts under the <em>Allowance</em> tab.
                  </p>
                </div>
              )}
            </>
          )}

          {claimType === 'mileage' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Distance (Kilometers)</label>
                  <input
                    type="number"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  >
                    <option value="personal_car">Personal Car ($0.68/km)</option>
                    <option value="electric_vehicle">Electric Vehicle ($0.72/km)</option>
                    <option value="motorcycle">Motorcycle ($0.35/km)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">From Location</label>
                  <input
                    type="text"
                    required
                    value={fromLoc}
                    onChange={(e) => setFromLoc(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">To Destination</label>
                  <input
                    type="text"
                    required
                    value={toLoc}
                    onChange={(e) => setToLoc(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-900 font-medium flex justify-between items-center">
                <span>Calculated Mileage Reimbursement:</span>
                <span className="font-mono text-sm font-bold tabular-nums">${calculatedMileageAmount.toFixed(2)}</span>
              </div>
            </>
          )}

          {claimType === 'allowance' && (
            <>
              {/* Allowance Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAllowanceSubType('daily_cab_allowance')}
                  className={`py-1.5 px-2 rounded-md transition-all text-center flex items-center justify-center gap-1.5 ${
                    allowanceSubType === 'daily_cab_allowance'
                      ? 'bg-white text-emerald-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🚕 Daily Cab Allowance (Model B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAllowanceSubType('meals_incidentals')}
                  className={`py-1.5 px-2 rounded-md transition-all text-center flex items-center justify-center gap-1.5 ${
                    allowanceSubType === 'meals_incidentals'
                      ? 'bg-white text-emerald-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🍽️ Meals & Incidentals</span>
                </button>
              </div>

              {allowanceSubType === 'daily_cab_allowance' && (
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-md text-[11px] text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Corporate Transit Policy (Model B):</span>
                    <span className="font-mono text-emerald-800 font-bold">${activeAllowanceRate}/day ({currentEmployee.grade})</span>
                  </div>
                  <p className="text-[10.5px] text-emerald-800 leading-relaxed">
                    Fixed daily cab allowance is automatically granted for declared travel days. No taxi/rideshare receipts are required. (If you incurred unusually high transit fares, you may alternatively submit actual receipts under the Reimbursement tab).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Number of Days Declared</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={allowanceDays}
                    onChange={(e) => setAllowanceDays(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Destination Tier</label>
                  <select
                    value={allowanceCity}
                    onChange={(e) => setAllowanceCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  >
                    <option value="San Francisco, US">San Francisco (Tier-1)</option>
                    <option value="London, UK">London (Tier-1)</option>
                    <option value="Default City">Standard Domestic</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-900 font-medium flex justify-between items-center">
                <span>
                  {allowanceSubType === 'daily_cab_allowance' ? 'Total Daily Cab Allowance:' : 'Total Per Diem Entitlement:'}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">${calculatedAllowanceAmount.toFixed(2)}</span>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  checked={declarationAgreed}
                  onChange={(e) => setDeclarationAgreed(e.target.checked)}
                  required
                  className="text-emerald-600 rounded"
                />
                <span>I attest that I completed business activities during these travel dates.</span>
              </label>
            </>
          )}

          {claimType === 'travel_advance' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Requested Advance Amount (USD)</label>
                <input
                  type="number"
                  step="10"
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 font-mono tabular-nums text-sm font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Advances are deducted from your final trip payout handoff once expenses are submitted.
                </p>
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-relaxed">
                  <strong>Corporate Governance Note:</strong> Travel advance can only be given for approved travel. The linked itinerary must be authorized by your manager before Finance will process disbursement.
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">Business Purpose & Details</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Travel to client site for technical architecture sprint"
              className="w-full border border-slate-200 rounded-md p-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs"
            >
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
