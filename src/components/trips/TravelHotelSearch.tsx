import React, { useState, useMemo } from 'react';
import { useExpenses, isHighCostTransitCity } from '../../context/ExpenseContext';
import { EmployeeGrade } from '../../types';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow,
  Pin 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Search, 
  Calendar, 
  Star, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  ArrowRight, 
  Building, 
  Sparkles, 
  Navigation, 
  Clock, 
  User, 
  Filter, 
  Bed, 
  CheckCircle2, 
  Info, 
  AlertOctagon,
  X,
  CreditCard,
  Send
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyAi8E5MZyJmsRKCJbcphloUPLbSpHnK-3U';

// Grade Policy Lodging Caps
export const GRADE_LODGING_CAPS: Record<EmployeeGrade, { cap: number; name: string }> = {
  'Executive': { cap: 350, name: 'Executive ($350/night)' },
  'Senior (Band C)': { cap: 275, name: 'Senior Band C ($275/night)' },
  'Mid-level (Band B)': { cap: 225, name: 'Mid-level Band B ($225/night)' },
  'Associate (Band A)': { cap: 180, name: 'Associate Band A ($180/night)' },
};

export interface HotelListing {
  id: string;
  name: string;
  city: string;
  country: string;
  destinationHub: string;
  address: string;
  lat: number;
  lng: number;
  nightlyRate: number;
  starRating: number;
  reviewCount: number;
  distanceToVenue: string;
  roomType: string;
  amenities: string[];
  imageUrl: string;
}

export const PRESET_DESTINATIONS = [
  {
    name: 'San Francisco (Moscone Center)',
    city: 'San Francisco',
    country: 'United States',
    center: { lat: 37.7841, lng: -122.4016 },
    zoom: 14,
    venueName: 'Moscone Convention Center',
  },
  {
    name: 'New York (Midtown & Javits)',
    city: 'New York',
    country: 'United States',
    center: { lat: 40.7580, lng: -73.9970 },
    zoom: 14,
    venueName: 'Javits Center & Silicon Alley',
  },
  {
    name: 'Austin (Silicon Hills & Downtown)',
    city: 'Austin',
    country: 'United States',
    center: { lat: 30.2672, lng: -97.7431 },
    zoom: 14,
    venueName: 'Austin Convention Center & Downtown',
  },
  {
    name: 'London (Tech City & Canary Wharf)',
    city: 'London',
    country: 'United Kingdom',
    center: { lat: 51.5230, lng: -0.0820 },
    zoom: 14,
    venueName: 'Shoreditch Silicon Roundabout',
  },
];

export const HOTEL_CATALOG: HotelListing[] = [
  // San Francisco Moscone Center Hub
  {
    id: 'hotel-sf-01',
    name: 'The Clancy, Autograph Collection',
    city: 'San Francisco',
    country: 'United States',
    destinationHub: 'San Francisco (Moscone Center)',
    address: '299 2nd St, San Francisco, CA 94105',
    lat: 37.7865,
    lng: -122.3985,
    nightlyRate: 210,
    starRating: 4.5,
    reviewCount: 1420,
    distanceToVenue: '0.3 miles from Moscone Center (6 min walk)',
    roomType: 'Deluxe King Room · Business Desk',
    amenities: ['High-Speed WiFi', 'Work Desk', 'Fitness Center', 'Flexible Cancellation'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hotel-sf-02',
    name: 'W San Francisco (SoMa Tech Hub)',
    city: 'San Francisco',
    country: 'United States',
    destinationHub: 'San Francisco (Moscone Center)',
    address: '181 3rd St, San Francisco, CA 94103',
    lat: 37.7852,
    lng: -122.4005,
    nightlyRate: 245,
    starRating: 4.6,
    reviewCount: 980,
    distanceToVenue: '0.1 miles from Moscone Center (2 min walk)',
    roomType: 'Spectacular King Room · City View',
    amenities: ['Free WiFi', 'Co-working Lounge', 'FIT Gym', 'Express Check-in'],
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hotel-sf-03',
    name: 'Courtyard by Marriott Downtown SFO',
    city: 'San Francisco',
    country: 'United States',
    destinationHub: 'San Francisco (Moscone Center)',
    address: '299 2nd St, San Francisco, CA 94105',
    lat: 37.7872,
    lng: -122.3970,
    nightlyRate: 175,
    starRating: 4.2,
    reviewCount: 840,
    distanceToVenue: '0.4 miles from Moscone Center (8 min walk)',
    roomType: 'Standard Queen Room · Ergonomic Chair',
    amenities: ['Free Breakfast', 'Free WiFi', 'Meeting Rooms', 'Business Center'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hotel-sf-04',
    name: 'Four Seasons Hotel San Francisco',
    city: 'San Francisco',
    country: 'United States',
    destinationHub: 'San Francisco (Moscone Center)',
    address: '757 Market St, San Francisco, CA 94103',
    lat: 37.7860,
    lng: -122.4048,
    nightlyRate: 440,
    starRating: 4.8,
    reviewCount: 1650,
    distanceToVenue: '0.2 miles from Moscone Center (4 min walk)',
    roomType: 'Executive Suite · Lounge Access',
    amenities: ['Equinox Club Access', 'Executive Lounge', 'Valet Parking', 'Concierge'],
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=80',
  },
  // New York Midtown & Javits Hub
  {
    id: 'hotel-ny-01',
    name: 'Ink 48 Hotel Midtown West',
    city: 'New York',
    country: 'United States',
    destinationHub: 'New York (Midtown & Javits)',
    address: '653 11th Ave, New York, NY 10036',
    lat: 40.7635,
    lng: -73.9985,
    nightlyRate: 220,
    starRating: 4.4,
    reviewCount: 1200,
    distanceToVenue: '0.5 miles from Javits Center (9 min walk)',
    roomType: 'Superior King · Hudson River View',
    amenities: ['Fast WiFi', 'Fitness Center', 'Pet Friendly', 'Workspace Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hotel-ny-02',
    name: 'Arlo Midtown Manhattan',
    city: 'New York',
    country: 'United States',
    destinationHub: 'New York (Midtown & Javits)',
    address: '351 W 38th St, New York, NY 10018',
    lat: 40.7562,
    lng: -73.9942,
    nightlyRate: 195,
    starRating: 4.3,
    reviewCount: 950,
    distanceToVenue: '0.4 miles from Javits Center (7 min walk)',
    roomType: 'Urban King · Modern Micro-Luxury',
    amenities: ['Rooftop Lounge', 'Coffee Bar', 'High-Speed WiFi', 'Co-working Spaces'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hotel-ny-03',
    name: 'The Ritz-Carlton New York, NoMad',
    city: 'New York',
    country: 'United States',
    destinationHub: 'New York (Midtown & Javits)',
    address: '25 W 28th St, New York, NY 10001',
    lat: 40.7455,
    lng: -73.9890,
    nightlyRate: 460,
    starRating: 4.9,
    reviewCount: 780,
    distanceToVenue: '1.1 miles from Javits Center (12 min taxi)',
    roomType: 'Club Level King Suite',
    amenities: ['Michelin Dining', 'Club Lounge', 'Spa by ESPA', 'Dedicated Concierge'],
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500&auto=format&fit=crop&q=80',
  },
  // Austin Silicon Hills & Downtown Hub
  {
    id: 'hotel-atx-01',
    name: 'The LINE Austin Downtown',
    city: 'Austin',
    country: 'United States',
    destinationHub: 'Austin (Silicon Hills & Downtown)',
    address: '111 E Cesar Chavez St, Austin, TX 78701',
    lat: 30.2635,
    lng: -97.7438,
    nightlyRate: 185,
    starRating: 4.5,
    reviewCount: 1150,
    distanceToVenue: '0.2 miles from Convention Center (4 min walk)',
    roomType: 'Studio King · Lady Bird Lake View',
    amenities: ['Pool Deck', 'Complimentary Bikes', 'High-Speed WiFi', 'Coffee Shop'],
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hotel-atx-02',
    name: 'Fairmont Austin Gold Experience',
    city: 'Austin',
    country: 'United States',
    destinationHub: 'Austin (Silicon Hills & Downtown)',
    address: '101 Red River St, Austin, TX 78701',
    lat: 30.2625,
    lng: -97.7395,
    nightlyRate: 260,
    starRating: 4.7,
    reviewCount: 1820,
    distanceToVenue: 'Direct Skybridge to Convention Center',
    roomType: 'Fairmont Gold King · Skybridge Access',
    amenities: ['Skybridge Access', 'Gold Lounge', 'Rooftop Heated Pool', 'Spa'],
    imageUrl: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=500&auto=format&fit=crop&q=80',
  },
  // London Shoreditch Tech City
  {
    id: 'hotel-lon-01',
    name: 'CitizenM London Shoreditch',
    city: 'London',
    country: 'United Kingdom',
    destinationHub: 'London (Tech City & Canary Wharf)',
    address: '6 Holywell Ln, London EC2A 3ET',
    lat: 51.5245,
    lng: -0.0785,
    nightlyRate: 165,
    starRating: 4.4,
    reviewCount: 2200,
    distanceToVenue: '0.1 miles from Shoreditch Silicon Roundabout',
    roomType: 'MoodPad Smart King Room',
    amenities: ['Superfast WiFi', '24/7 SocietyM Bar', 'iMac Workstations', 'Self Check-in'],
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'hotel-lon-02',
    name: 'The Ned City of London',
    city: 'London',
    country: 'United Kingdom',
    destinationHub: 'London (Tech City & Canary Wharf)',
    address: '27 Poultry, London EC2R 8AJ',
    lat: 51.5135,
    lng: -0.0895,
    nightlyRate: 360,
    starRating: 4.8,
    reviewCount: 1950,
    distanceToVenue: '0.8 miles from Tech City (10 min tube)',
    roomType: 'Heritage King Suite',
    amenities: ['Ned Club Spa', 'Rooftop Pool', '10 Restaurants', 'Historic Bank Vault'],
    imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500&auto=format&fit=crop&q=80',
  },
];

interface TravelHotelSearchProps {
  onTripRegistered?: () => void;
}

export const TravelHotelSearch: React.FC<TravelHotelSearchProps> = ({ onTripRegistered }) => {
  const { currentEmployee, createTrip, submitClaim, getDailyCabAllowanceRate } = useExpenses();

  // Selected Hub & Destination
  const [selectedHub, setSelectedHub] = useState(PRESET_DESTINATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('Hotels near San Francisco Moscone Center');
  
  // Date range
  const [checkInDate, setCheckInDate] = useState('2026-10-18');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-21');
  const [purposeDescription, setPurposeDescription] = useState('Q4 Client Summit & Technology Partner Architecture Sessions');

  // Policy Filter & Simulation
  const [policyFilter, setPolicyFilter] = useState<'all' | 'in_policy' | 'over_limit'>('all');
  const [activeGrade, setActiveGrade] = useState<EmployeeGrade>(currentEmployee.grade);

  // Selected Hotel & InfoWindow
  const [selectedHotel, setSelectedHotel] = useState<HotelListing | null>(HOTEL_CATALOG[0]);
  const [infoWindowHotel, setInfoWindowHotel] = useState<HotelListing | null>(null);

  // Pre-Trip Approval Modal State
  const [isPreTripModalOpen, setIsPreTripModalOpen] = useState(false);
  const [requestAdvanceAmount, setRequestAdvanceAmount] = useState<string>('300');
  const [includeAdvance, setIncludeAdvance] = useState(true);
  const [exceptionReason, setExceptionReason] = useState('');
  const [registeredTripSuccess, setRegisteredTripSuccess] = useState<string | null>(null);

  // Calculate nights
  const nightsCount = useMemo(() => {
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 3;
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [checkInDate, checkOutDate]);

  // Current grade cap
  const currentGradeCap = GRADE_LODGING_CAPS[activeGrade].cap;

  // Filtered hotels list
  const filteredHotels = useMemo(() => {
    return HOTEL_CATALOG.filter(hotel => {
      // Destination filter
      if (hotel.destinationHub !== selectedHub.name) return false;

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = 
          hotel.name.toLowerCase().includes(q) ||
          hotel.address.toLowerCase().includes(q) ||
          hotel.city.toLowerCase().includes(q) ||
          hotel.destinationHub.toLowerCase().includes(q);
        
        // If not matching specific text, check if query contains city
        const cityMatch = q.includes(hotel.city.toLowerCase());
        if (!matchesText && !cityMatch) return false;
      }

      // Policy filter
      const isInPolicy = hotel.nightlyRate <= currentGradeCap;
      if (policyFilter === 'in_policy' && !isInPolicy) return false;
      if (policyFilter === 'over_limit' && isInPolicy) return false;

      return true;
    });
  }, [selectedHub, searchQuery, policyFilter, currentGradeCap]);

  // Handler for destination preset click
  const handleSelectPresetDestination = (dest: typeof PRESET_DESTINATIONS[0]) => {
    setSelectedHub(dest);
    setSearchQuery(`Hotels near ${dest.name}`);
    const firstHotel = HOTEL_CATALOG.find(h => h.destinationHub === dest.name);
    if (firstHotel) {
      setSelectedHotel(firstHotel);
    }
  };

  // Open 1-Click Pre-Trip Approval
  const handleInitiateApproval = (hotel: HotelListing) => {
    setSelectedHotel(hotel);
    setIsPreTripModalOpen(true);
  };

  // Submit Pre-Trip Itinerary
  const handleSubmitPreTripApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;

    const totalLodgingCost = selectedHotel.nightlyRate * nightsCount;
    const dailyCabRate = getDailyCabAllowanceRate(activeGrade, selectedHotel.city);
    const dailyCabAllowanceTotal = nightsCount * dailyCabRate;
    const estimatedAirfareAndPerDiem = 750; // Standard domestic flight and per diem baseline
    const totalTripEstimate = totalLodgingCost + dailyCabAllowanceTotal + estimatedAirfareAndPerDiem;
    const advanceAmount = includeAdvance ? parseFloat(requestAdvanceAmount) || 0 : 0;

    const isOverLimit = selectedHotel.nightlyRate > currentGradeCap;
    const finalPurpose = isOverLimit
      ? `${purposeDescription} · Hotel: ${selectedHotel.name} ($${selectedHotel.nightlyRate}/nt, ${nightsCount} nts). Daily Cab Allowance: $${dailyCabRate}/day ($${dailyCabAllowanceTotal}). [EXCLUSION: ${exceptionReason || 'Conference venue direct accommodation required'}]`
      : `${purposeDescription} · Hotel: ${selectedHotel.name} ($${selectedHotel.nightlyRate}/nt, ${nightsCount} nts). Daily Cab Allowance: $${dailyCabRate}/day ($${dailyCabAllowanceTotal}). Policy Compliant.`;

    const newTrip = createTrip({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      employeeGrade: activeGrade,
      department: currentEmployee.department,
      purpose: finalPurpose,
      destinations: [
        {
          city: selectedHotel.city,
          country: selectedHotel.country,
          startDate: checkInDate,
          endDate: checkOutDate,
        }
      ],
      estimatedCost: totalTripEstimate,
      budgetBreakdown: {
        lodgingEstimate: totalLodgingCost,
        dailyCabAllowanceTotal,
        dailyCabRate,
        daysCount: nightsCount,
        perDiemMealsTotal: nightsCount * 65,
        flightsAndTransitEstimate: estimatedAirfareAndPerDiem,
      },
    });

    if (includeAdvance && advanceAmount > 0) {
      submitClaim({
        type: 'travel_advance',
        employeeId: currentEmployee.id,
        amount: advanceAmount,
        currency: 'USD',
        category: 'Ground Transport / Taxi',
        businessPurpose: `Pre-trip travel advance for ${selectedHotel.city} trip (${nightsCount} nights). Disbursed for airport transit & daily meals.`,
        tripId: newTrip.id,
        submissionChannel: 'web_portal',
      });
    }

    setIsPreTripModalOpen(false);
    setRegisteredTripSuccess(
      `Trip ${newTrip.tripNumber} successfully registered and routed to manager ${currentEmployee.managerName} for 1-click pre-trip sign-off!`
    );

    if (onTripRegistered) {
      onTripRegistered();
    }

    setTimeout(() => {
      setRegisteredTripSuccess(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Policy Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Google Maps Live Search
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-700">
              Corporate Travel & Hotel Booking Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Travel Search & Grade Policy Rate Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
            Search verified corporate accommodations on Google Maps. Interactive pins compare live nightly rates against employee grade allowances (<strong className="text-slate-700">${currentGradeCap}/night</strong>) and route 1-click pre-trip approvals directly to managers.
          </p>
        </div>

        {/* User Grade Simulator Selector */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 self-start lg:self-auto text-xs">
          <User className="w-4 h-4 text-slate-500" />
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Employee Grade Cap:</div>
            <select
              value={activeGrade}
              onChange={(e) => setActiveGrade(e.target.value as EmployeeGrade)}
              className="font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="Associate (Band A)">Associate (Band A) — Cap: $180/nt</option>
              <option value="Mid-level (Band B)">Mid-level (Band B) — Cap: $225/nt</option>
              <option value="Senior (Band C)">Senior (Band C) — Cap: $275/nt</option>
              <option value="Executive">Executive — Cap: $350/nt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {registeredTripSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-emerald-900 text-sm">Pre-Trip Itinerary Registered & Routed!</span>
            <p className="text-emerald-800 leading-relaxed font-medium">
              {registeredTripSuccess}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Quick Destination Hub Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Destinations:
          </span>
          {PRESET_DESTINATIONS.map((dest) => (
            <button
              key={dest.name}
              onClick={() => handleSelectPresetDestination(dest)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedHub.name === dest.name
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{dest.name}</span>
            </button>
          ))}
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Destination Search Box */}
          <div className="md:col-span-2 relative">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Destination Search Query</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Hotels near San Francisco Moscone Center..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-hidden text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Check-In Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Check-in Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-hidden text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Check-Out Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Check-out Date ({nightsCount} nts)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-hidden text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Automatic Daily Cab Allowance Banner */}
        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-950">
            <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider">
              Transit Policy (Model B)
            </span>
            <span>
              <strong>Fixed Daily Cab Allowance:</strong> ${getDailyCabAllowanceRate(activeGrade, selectedHub.name)}/day &times; {nightsCount} declared days ={' '}
              <strong className="text-emerald-900 font-mono font-bold text-sm">
                ${(getDailyCabAllowanceRate(activeGrade, selectedHub.name) * nightsCount).toFixed(2)}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-emerald-800">
            Automatically considered in trip budget · Receipt-free (or submit actual bills)
          </span>
        </div>

        {/* Policy Filter Pills */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Policy Status Filter:</span>
            <button
              onClick={() => setPolicyFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                policyFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Hotels ({HOTEL_CATALOG.filter(h => h.destinationHub === selectedHub.name).length})
            </button>
            <button
              onClick={() => setPolicyFilter('in_policy')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                policyFilter === 'in_policy'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>In Policy Only (&le; ${currentGradeCap}/nt)</span>
            </button>
            <button
              onClick={() => setPolicyFilter('over_limit')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                policyFilter === 'over_limit'
                  ? 'bg-amber-700 text-white font-semibold'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Over Limit Only (&gt; ${currentGradeCap}/nt)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredHotels.length}</strong> verified accommodations in {selectedHub.city}
          </div>
        </div>
      </div>

      {/* Main Content Area: Split View (Interactive Map + Hotel Listings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: HOTEL LISTINGS CARDS (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
          {filteredHotels.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
              <Building className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-semibold text-slate-700 text-sm">No hotels found matching criteria</div>
              <p className="text-xs text-slate-500">
                Try switching policy filter to "All Hotels" or choose a different destination hub.
              </p>
            </div>
          ) : (
            filteredHotels.map((hotel) => {
              const isInPolicy = hotel.nightlyRate <= currentGradeCap;
              const delta = hotel.nightlyRate - currentGradeCap;
              const isSelected = selectedHotel?.id === hotel.id;

              return (
                <div
                  key={hotel.id}
                  onClick={() => {
                    setSelectedHotel(hotel);
                    setInfoWindowHotel(hotel);
                  }}
                  className={`bg-white rounded-xl border p-4 transition-all cursor-pointer shadow-xs relative ${
                    isSelected 
                      ? 'border-emerald-700 ring-2 ring-emerald-700/20 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-24 h-24 rounded-lg object-cover shrink-0 border border-slate-100"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h2 className="font-bold text-slate-900 text-xs truncate" title={hotel.name}>
                          {hotel.name}
                        </h2>
                        {/* Policy Status Badge */}
                        {isInPolicy ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>IN POLICY</span>
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>OVER LIMIT (+${delta})</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 stroke-amber-500 mr-0.5" />
                          {hotel.starRating}
                        </span>
                        <span>·</span>
                        <span className="truncate">{hotel.distanceToVenue}</span>
                      </div>

                      <div className="text-[11px] text-slate-600 line-clamp-1">
                        {hotel.roomType}
                      </div>

                      {/* Pricing and Action Bar */}
                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-base font-bold font-mono text-slate-900">
                            ${hotel.nightlyRate}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal"> / night</span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            (${hotel.nightlyRate * nightsCount} total for {nightsCount} nts)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiateApproval(hotel);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 ${
                            isInPolicy
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          <span>Route 1-Click Approval</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT PANEL: INTERACTIVE GOOGLE MAPS WITH LIVE ADVANCED MARKERS (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-[720px] flex flex-col relative">
          {/* Map Top Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-slate-900">{selectedHub.name}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Target Venue: <strong>{selectedHub.venueName}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>In Policy (&le; ${currentGradeCap})</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>Over Limit (&gt; ${currentGradeCap})</span>
              </span>
            </div>
          </div>

          {/* Interactive Map Component Container */}
          <div className="flex-1 w-full h-full relative">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'places']}>
              <Map
                mapId="bf51a910020fa25a"
                defaultCenter={selectedHub.center}
                center={selectedHub.center}
                defaultZoom={selectedHub.zoom}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_git_agentskills_v1']}
                className="w-full h-full"
              >
                {/* Conference / Meeting Venue Marker */}
                <AdvancedMarker
                  position={selectedHub.center}
                  title={selectedHub.venueName}
                >
                  <div className="bg-slate-900 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-lg border border-slate-700 ring-2 ring-white">
                    <Building className="w-3 h-3 text-emerald-400" />
                    <span>Venue: {selectedHub.venueName.split(' ')[0]}</span>
                  </div>
                </AdvancedMarker>

                {/* Hotel Pins with Dynamic Nightly Rates */}
                {filteredHotels.map((hotel) => {
                  const isInPolicy = hotel.nightlyRate <= currentGradeCap;
                  const isSelected = selectedHotel?.id === hotel.id;

                  return (
                    <AdvancedMarker
                      key={hotel.id}
                      position={{ lat: hotel.lat, lng: hotel.lng }}
                      title={hotel.name}
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setInfoWindowHotel(hotel);
                      }}
                    >
                      <div className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold shadow-lg transition-transform hover:scale-110 flex items-center gap-1 cursor-pointer border-2 ${
                        isSelected ? 'ring-2 ring-slate-900 scale-110 z-20' : ''
                      } ${
                        isInPolicy
                          ? 'bg-emerald-600 text-white border-white'
                          : 'bg-amber-600 text-white border-white'
                      }`}>
                        <span>${hotel.nightlyRate}</span>
                        {isInPolicy ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Interactive InfoWindow on Marker Click */}
                {infoWindowHotel && (
                  <InfoWindow
                    position={{ lat: infoWindowHotel.lat, lng: infoWindowHotel.lng }}
                    onCloseClick={() => setInfoWindowHotel(null)}
                  >
                    <div className="p-1 max-w-[240px] text-xs space-y-1.5 text-slate-800">
                      <div className="font-bold text-slate-900 text-xs">
                        {infoWindowHotel.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {infoWindowHotel.distanceToVenue}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="font-bold font-mono text-slate-900">
                          ${infoWindowHotel.nightlyRate} / night
                        </span>
                        {infoWindowHotel.nightlyRate <= currentGradeCap ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            In Policy
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Over Cap (+${infoWindowHotel.nightlyRate - currentGradeCap})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInitiateApproval(infoWindowHotel)}
                        className="w-full mt-2 py-1.5 text-center text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors"
                      >
                        Select & Route Approval
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1-CLICK PRE-TRIP APPROVAL ROUTING MODAL */}
      {/* ========================================================================= */}
      {isPreTripModalOpen && selectedHotel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1-Click Pre-Trip Approval Routing
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Routes planned accommodation and travel itinerary directly to <strong className="text-slate-800">{currentEmployee.managerName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreTripModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPreTripApproval} className="p-6 space-y-4 text-xs">
              {/* Hotel Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center">
                <img
                  src={selectedHotel.imageUrl}
                  alt={selectedHotel.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200"
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="font-bold text-slate-900 text-sm block truncate">
                    {selectedHotel.name}
                  </span>
                  <div className="text-[11px] text-slate-500 truncate">
                    {selectedHotel.address}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono font-bold text-emerald-800">
                      ${selectedHotel.nightlyRate}/night &times; {nightsCount} nights = ${(selectedHotel.nightlyRate * nightsCount).toFixed(2)}
                    </span>
                    {selectedHotel.nightlyRate <= currentGradeCap ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        In Policy
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Over Cap by ${selectedHotel.nightlyRate - currentGradeCap}/nt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pre-Trip Budget Estimation Breakdown with Automatic Daily Cab Allowance */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Automatic Pre-Trip Budget Estimation ({nightsCount} Declared Days)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    City Tier: {isHighCostTransitCity(selectedHotel.city) ? 'Tier-1 High Cost' : 'Standard'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lodging ({nightsCount} nights @ ${selectedHotel.nightlyRate}/nt):</span>
                    </span>
                    <span className="font-mono font-medium">${(selectedHotel.nightlyRate * nightsCount).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-50/80 p-2 rounded-md text-emerald-950 border border-emerald-200">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-900">Fixed Daily Cab Allowance (Model B):</span>
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">Auto-Included</span>
                      </div>
                      <div className="text-[10.5px] text-emerald-700 mt-0.5">
                        ${getDailyCabAllowanceRate(activeGrade, selectedHotel.city)}/day &times; {nightsCount} declared days (Automatic transit allowance)
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-900 text-xs">
                      ${(getDailyCabAllowanceRate(activeGrade, selectedHotel.city) * nightsCount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Flights Baseline & Per Diem Meals:</span>
                    <span className="font-mono font-medium">$750.00</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                    <span>Total Estimated Pre-Trip Budget:</span>
                    <span className="font-mono text-emerald-800 text-sm">
                      ${(selectedHotel.nightlyRate * nightsCount + getDailyCabAllowanceRate(activeGrade, selectedHotel.city) * nightsCount + 750).toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed italic pt-1">
                  * Note: Per corporate policy Model B, employees automatically receive this fixed daily transit allowance without receipt tracking. Employees also retain the option to submit actual taxi/rideshare bills after travel if required.
                </p>
              </div>

              {/* Policy Assessment Banner */}
              {selectedHotel.nightlyRate > currentGradeCap ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Manager Exception Sign-off Required</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    This hotel rate (${selectedHotel.nightlyRate}/night) exceeds your grade allowance (${currentGradeCap}/night). Please supply a mandatory business justification for {currentEmployee.managerName} sign-off.
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-950 mb-1">
                      Exception Justification:
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      placeholder="e.g. Conference official partner venue, nearest lodging within 5 miles completely booked..."
                      className="w-full text-xs p-2 bg-white border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="text-[11px]">
                    <strong>Policy Compliant:</strong> Nightly rate is within your <strong>{activeGrade}</strong> allowance (${currentGradeCap}/night). Eligible for streamlined pre-trip budget approval.
                  </div>
                </div>
              )}

              {/* Business Purpose Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Business Purpose & Objective
                </label>
                <input
                  type="text"
                  required
                  value={purposeDescription}
                  onChange={(e) => setPurposeDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden text-slate-800"
                />
              </div>

              {/* Pre-Trip Advance Disbursement Option */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAdvance}
                    onChange={(e) => setIncludeAdvance(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Request Travel Advance Disbursement Ahead of Departure
                  </span>
                </label>

                {includeAdvance && (
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        min="50"
                        max="2000"
                        step="50"
                        value={requestAdvanceAmount}
                        onChange={(e) => setRequestAdvanceAmount(e.target.value)}
                        className="w-32 border border-slate-200 bg-white rounded-md p-1.5 font-mono font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-slate-500">
                        Disbursed to payroll account for daily meals & transit
                      </span>
                    </div>

                    {/* Explicit Corporate Policy Governance Note */}
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-md text-[11px] text-amber-950 flex items-start gap-2">
                      <AlertOctagon className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="text-amber-900 block font-bold">
                          Corporate Policy Note: Travel advance can ONLY be given for approved travel.
                        </strong>
                        <p className="text-[10.5px] text-amber-800 leading-relaxed font-normal">
                          Funds cannot be released while this itinerary is in "Pending Approval" status. The advance request will be queued alongside the itinerary and disbursed to payroll only after {currentEmployee.managerName} officially authorizes the trip.
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Disbursed advance will be automatically offset against subsequent expense vouchers.
                    </p>
                  </div>
                )}
              </div>

              {/* Routing Info */}
              <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                <span>Direct Approver: <strong className="text-slate-800">{currentEmployee.managerName}</strong></span>
                <span>Destination: <strong className="text-slate-800">{selectedHotel.city}, {selectedHotel.country}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPreTripModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Pre-Trip Sign-Off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
