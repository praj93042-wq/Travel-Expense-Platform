import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { Trip, TripDestination } from '../../types';
import { TravelHotelSearch } from './TravelHotelSearch';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  ArrowRight,
  Filter,
  DollarSign,
  User,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  Bed
} from 'lucide-react';

export const TripsView: React.FC = () => {
  const { currentEmployee, trips, createTrip, amendTrip, confirmPostTrip, claims, approveTrip, approveTripAmendment } = useExpenses();

  const [activeSubTab, setActiveSubTab] = useState<'hotel_search' | 'my_trips' | 'all_trips' | 'travel_register'>('hotel_search');
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAmendOpen, setIsAmendOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // New Trip form state
  const [newPurpose, setNewPurpose] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('United States');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newEstimatedCost, setNewEstimatedCost] = useState('1500');

  // Amendment form state
  const [amendReason, setAmendReason] = useState('');
  const [amendCity, setAmendCity] = useState('');
  const [amendStartDate, setAmendStartDate] = useState('');
  const [amendEndDate, setAmendEndDate] = useState('');
  const [amendCost, setAmendCost] = useState('');

  // Post trip confirmation state
  const [confirmStatus, setConfirmStatus] = useState<'completed_as_planned' | 'changed' | 'cancelled'>('completed_as_planned');
  const [confirmNotes, setConfirmNotes] = useState('');

  // Filtering
  const displayedTrips = trips.filter(trip => {
    if (activeSubTab === 'my_trips') {
      if (trip.employeeId !== currentEmployee.id) return false;
    }
    if (filterDestination !== 'all') {
      const hasDest = trip.destinations.some(d => 
        d.city.toLowerCase().includes(filterDestination.toLowerCase()) ||
        d.country.toLowerCase().includes(filterDestination.toLowerCase())
      );
      if (!hasDest) return false;
    }
    if (filterStatus !== 'all') {
      if (trip.status !== filterStatus) return false;
    }
    return true;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurpose || !newCity || !newStartDate || !newEndDate) return;

    createTrip({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      employeeGrade: currentEmployee.grade,
      department: currentEmployee.department,
      purpose: newPurpose,
      destinations: [
        {
          city: newCity,
          country: newCountry,
          startDate: newStartDate,
          endDate: newEndDate,
        }
      ],
      estimatedCost: parseFloat(newEstimatedCost) || 1000,
    });

    setIsRegisterOpen(false);
    setNewPurpose('');
    setNewCity('');
  };

  const handleAmendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !amendCity || !amendStartDate || !amendEndDate) return;

    amendTrip(
      selectedTrip.id,
      [
        {
          city: amendCity,
          country: selectedTrip.destinations[0]?.country || 'United States',
          startDate: amendStartDate,
          endDate: amendEndDate,
        }
      ],
      parseFloat(amendCost) || selectedTrip.estimatedCost,
      amendReason
    );

    setIsAmendOpen(false);
    setSelectedTrip(null);
  };

  const handlePostTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    confirmPostTrip(selectedTrip.id, confirmStatus, confirmNotes);
    setIsConfirmOpen(false);
    setSelectedTrip(null);
  };

  const openAmendModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setAmendCity(trip.destinations[0]?.city || '');
    setAmendStartDate(trip.destinations[0]?.startDate || '');
    setAmendEndDate(trip.destinations[0]?.endDate || '');
    setAmendCost(trip.estimatedCost.toString());
    setAmendReason('');
    setIsAmendOpen(true);
  };

  const openConfirmModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setConfirmStatus('completed_as_planned');
    setConfirmNotes('');
    setIsConfirmOpen(true);
  };

  // Helper to compute associated claims total for a trip
  const getTripExpenseSummary = (trip: Trip) => {
    const tripClaims = claims.filter(c => c.tripId === trip.id);
    const authorizedTotal = tripClaims
      .filter(c => c.approvalStatus === 'auto_authorized' || c.approvalStatus === 'approved_by_manager')
      .reduce((sum, c) => sum + c.amount, 0);
    const pendingTotal = tripClaims
      .filter(c => c.approvalStatus === 'pending_manager')
      .reduce((sum, c) => sum + c.amount, 0);
    return {
      claimCount: tripClaims.length,
      authorizedTotal,
      pendingTotal,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Registered Trips & Travel Register
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Per company policy, travel must be registered and approved by a manager before travel expenses, allowances, or advances can be claimed against it.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveSubTab('hotel_search')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap ${
              activeSubTab === 'hotel_search'
                ? 'bg-emerald-800 text-white ring-2 ring-emerald-600/30'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Search Hotels (Google Maps)</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Trip Entry</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Segmented Tab Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg flex-wrap">
          <button
            onClick={() => setActiveSubTab('hotel_search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'hotel_search'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hotel Search (Google Maps)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('my_trips')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'my_trips'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Trips ({trips.filter(t => t.employeeId === currentEmployee.id).length})
          </button>
          <button
            onClick={() => setActiveSubTab('all_trips')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'all_trips'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Company Trips ({trips.length})
          </button>
          <button
            onClick={() => setActiveSubTab('travel_register')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'travel_register'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Travel Register & Spend Audit
          </button>
        </div>

        {/* Filters */}
        {activeSubTab !== 'hotel_search' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={filterDestination}
                onChange={(e) => setFilterDestination(e.target.value)}
                className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-white text-slate-700"
              >
                <option value="all">All Destinations</option>
                <option value="San Francisco">San Francisco</option>
                <option value="London">London</option>
                <option value="Austin">Austin</option>
                <option value="Manchester">Manchester</option>
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="amendment_pending">Amendment Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
      </div>

      {/* HOTEL SEARCH ON GOOGLE MAPS VS TRAVEL REGISTER VS TRIPS CARDS */}
      {activeSubTab === 'hotel_search' ? (
        <TravelHotelSearch onTripRegistered={() => setActiveSubTab('my_trips')} />
      ) : activeSubTab === 'travel_register' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Organizational Travel Activity Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit travel itinerary schedules, participating staff, and claimed expenses by destination stop.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600">
              {displayedTrips.length} active records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                <tr>
                  <th className="py-2.5 px-4">Trip Ref</th>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Destination & Dates</th>
                  <th className="py-2.5 px-4">Status & Rev</th>
                  <th className="py-2.5 px-4 text-right">Est. Budget</th>
                  <th className="py-2.5 px-4 text-right">Authorized Spend</th>
                  <th className="py-2.5 px-4 text-right">Pending Spend</th>
                  <th className="py-2.5 px-4">Completion Declaration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTrips.map(trip => {
                  const summary = getTripExpenseSummary(trip);
                  const dest = trip.destinations[0];
                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {trip.tripNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{trip.employeeName}</div>
                        <div className="text-[11px] text-slate-400">{trip.employeeGrade} · {trip.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {dest?.city}, {dest?.country}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {dest?.startDate} → {dest?.endDate}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            trip.status === 'approved' ? 'bg-emerald-600' :
                            trip.status === 'completed' ? 'bg-blue-600' :
                            trip.status === 'amendment_pending' ? 'bg-amber-500' : 'bg-slate-400'
                          }`}></span>
                          <span className="capitalize font-medium text-slate-800">
                            {trip.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">v{trip.version}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        ${trip.estimatedCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                        ${summary.authorizedTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                        ${summary.pendingTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {trip.postTripConfirmation ? (
                          <div className="text-[11px]">
                            <span className="font-medium text-emerald-700">
                              {trip.postTripConfirmation.status.replace(/_/g, ' ')}
                            </span>
                            <div className="text-slate-400 text-[10px]">
                              {new Date(trip.postTripConfirmation.declaredAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unconfirmed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TRIPS CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTrips.map(trip => {
            const dest = trip.destinations[0];
            const summary = getTripExpenseSummary(trip);
            const isOwner = trip.employeeId === currentEmployee.id;
            const canAmend = isOwner && (trip.status === 'approved' || trip.status === 'amendment_pending');
            const canConfirm = isOwner && (trip.status === 'approved' || trip.status === 'completed');

            return (
              <div 
                key={trip.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {trip.tripNumber}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          rev v{trip.version}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mt-1 leading-snug">
                        {trip.purpose}
                      </h3>
                    </div>

                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      trip.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : trip.status === 'amendment_pending'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : trip.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {trip.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Trip Details */}
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-900">{dest?.city}, {dest?.country}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700">{dest?.startDate} → {dest?.endDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{trip.employeeName} ({trip.employeeGrade})</span>
                    </div>

                    {trip.approvalDate && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Approved by {trip.approvedBy} on {new Date(trip.approvalDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial & Claims Snapshot */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Est. Budget</div>
                      <div className="font-mono font-semibold text-slate-900 mt-0.5">
                        ${trip.estimatedCost.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-emerald-50/60 p-2 rounded-lg">
                      <div className="text-[10px] text-emerald-700 uppercase font-medium">Authorized</div>
                      <div className="font-mono font-semibold text-emerald-800 mt-0.5">
                        ${summary.authorizedTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-amber-50/60 p-2 rounded-lg">
                      <div className="text-[10px] text-amber-700 uppercase font-medium">Pending Claims</div>
                      <div className="font-mono font-semibold text-amber-800 mt-0.5">
                        ${summary.pendingTotal.toFixed(2)}
                      </div>
                    </div>

                    {trip.budgetBreakdown?.dailyCabAllowanceTotal && (
                      <div className="col-span-3 text-[11px] bg-emerald-50/60 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center justify-between text-emerald-950">
                        <span className="flex items-center gap-1">
                          <span className="font-bold">🚕 Daily Cab Allowance:</span>
                          <span className="text-[10px] text-emerald-700">({trip.budgetBreakdown.daysCount} declared travel days)</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-900">
                          ${trip.budgetBreakdown.dailyCabAllowanceTotal.toFixed(2)} (${trip.budgetBreakdown.dailyCabRate}/day)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Revision / Amendment Notification */}
                  {trip.status === 'amendment_pending' && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        Amendment Pending Manager Reapproval (v{trip.version})
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {trip.revisionsHistory[trip.revisionsHistory.length - 1]?.reasonForChange || 'Dates or destinations updated.'}
                      </p>
                    </div>
                  )}

                  {/* Post-trip confirmation notice */}
                  {trip.postTripConfirmation && (
                    <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                      <strong>Employee Post-Trip Declaration:</strong> {trip.postTripConfirmation.status.replace(/_/g, ' ')}
                      {trip.postTripConfirmation.notes && ` — "${trip.postTripConfirmation.notes}"`}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {summary.claimCount} bills attached
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canAmend && (
                      <button
                        type="button"
                        onClick={() => openAmendModal(trip)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Amend Itinerary
                      </button>
                    )}

                    {canConfirm && !trip.postTripConfirmation && (
                      <button
                        type="button"
                        onClick={() => openConfirmModal(trip)}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 rounded transition-colors"
                      >
                        Post-Trip Declaration
                      </button>
                    )}

                    {/* Manager quick approve button if viewing as manager */}
                    {trip.status === 'amendment_pending' && currentEmployee.grade === 'Executive' && (
                      <button
                        type="button"
                        onClick={() => approveTripAmendment(trip.id, currentEmployee.name)}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                      >
                        Approve Amendment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTER TRIP MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-base font-bold text-slate-900">Register New Business Trip</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide itinerary destination and purpose. Will be routed to {currentEmployee.managerName} for approval.
            </p>

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Business Purpose</label>
                <input
                  type="text"
                  required
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="e.g. Q4 Cloud Architecture Summit & Client Meetings"
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Budget (USD)</label>
                <input
                  type="number"
                  required
                  value={newEstimatedCost}
                  onChange={(e) => setNewEstimatedCost(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 font-mono tabular-nums focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs"
                >
                  Submit Trip for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AMEND TRIP MODAL (PRD requirement: versioned amendment & manager reapproval) */}
      {isAmendOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-base font-bold text-slate-900">
              Amend Itinerary: {selectedTrip.tripNumber} (v{selectedTrip.version} → v{selectedTrip.version + 1})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Material date or destination changes require manager reapproval. Unaffected earlier claims remain preserved.
            </p>

            <form onSubmit={handleAmendSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Itinerary Amendment</label>
                <input
                  type="text"
                  required
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  placeholder="e.g. Extended by 2 days due to client request for additional workshops"
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City Destination</label>
                <input
                  type="text"
                  required
                  value={amendCity}
                  onChange={(e) => setAmendCity(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Updated Start Date</label>
                  <input
                    type="date"
                    required
                    value={amendStartDate}
                    onChange={(e) => setAmendStartDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Updated End Date</label>
                  <input
                    type="date"
                    required
                    value={amendEndDate}
                    onChange={(e) => setAmendEndDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Revised Estimated Cost (USD)</label>
                <input
                  type="number"
                  required
                  value={amendCost}
                  onChange={(e) => setAmendCost(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 font-mono tabular-nums focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAmendOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-md shadow-xs"
                >
                  Submit Amendment for Manager Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST-TRIP CONFIRMATION MODAL (PRD Section: Confirmed — short employee post-trip confirmation) */}
      {isConfirmOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h2 className="text-base font-bold text-slate-900">
              Post-Trip Declaration: {selectedTrip.tripNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Confirm the outcome of your travel. This employee-reported declaration records travel completion without requiring burdensome surveillance.
            </p>

            <form onSubmit={handlePostTripSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="confirmStatus"
                    checked={confirmStatus === 'completed_as_planned'}
                    onChange={() => setConfirmStatus('completed_as_planned')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="block text-slate-900 font-semibold">Completed as planned</strong>
                    <span className="text-slate-500 text-[11px]">Travel occurred according to approved itinerary</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="confirmStatus"
                    checked={confirmStatus === 'changed'}
                    onChange={() => setConfirmStatus('changed')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="block text-slate-900 font-semibold">Changed (Requires Amendment)</strong>
                    <span className="text-slate-500 text-[11px]">Itinerary was modified; requires updated dates/cities</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="confirmStatus"
                    checked={confirmStatus === 'cancelled'}
                    onChange={() => setConfirmStatus('cancelled')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="block text-slate-900 font-semibold">Cancelled</strong>
                    <span className="text-slate-500 text-[11px]">Travel did not take place; cancellation bills can be reported</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Optional Notes</label>
                <textarea
                  rows={2}
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="e.g. Completed all meetings; met key partners"
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs"
                >
                  Record Declaration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
