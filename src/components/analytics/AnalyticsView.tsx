import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { ClaimCategory } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart2, 
  Calendar, 
  DollarSign, 
  Users, 
  Sliders,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Meals & Entertainment': '#10b981', // emerald-500
  'Hotel & Lodging': '#3b82f6', // blue-500
  'Ground Transport / Taxi': '#f59e0b', // amber-500
  'Flights': '#8b5cf6', // purple-500
  'Mileage': '#06b6d4', // cyan-500
  'Per Diem / Allowance': '#14b8a6', // teal-500
  'Office & Equipment': '#f97316', // orange-500
  'Software & Subscriptions': '#6366f1', // indigo-500
};

const ALL_CATEGORIES: ClaimCategory[] = [
  'Meals & Entertainment',
  'Hotel & Lodging',
  'Ground Transport / Taxi',
  'Flights',
  'Mileage',
  'Per Diem / Allowance',
  'Office & Equipment',
  'Software & Subscriptions',
];

export const AnalyticsView: React.FC = () => {
  const { claims, employees } = useExpenses();

  const [selectedQuarter, setSelectedQuarter] = useState<'Q3_2026' | 'Q4_2026' | 'ALL'>('ALL');
  const [chartMode, setChartMode] = useState<'comparison' | 'stacked' | 'trend'>('comparison');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // Simulation controls
  const [simGrade, setSimGrade] = useState<'Mid-level (Band B)' | 'Senior (Band C)'>('Mid-level (Band B)');
  const [simMealCap, setSimMealCap] = useState(75);
  const [simHotelCap, setSimHotelCap] = useState(250);

  // Month references for analysis
  const currentMonthKey = '2026-10'; // October 2026
  const previousMonthKey = '2026-09'; // September 2026
  const prior2MonthKey = '2026-08'; // August 2026

  const monthLabels: Record<string, string> = {
    '2026-08': 'Aug 2026',
    '2026-09': 'Sept 2026 (Prev)',
    '2026-10': 'Oct 2026 (Current)'
  };

  // Filter claims based on selected quarter and department
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      // Quarter filter
      if (selectedQuarter === 'Q3_2026' && (c.date < '2026-07-01' || c.date > '2026-09-30')) return false;
      if (selectedQuarter === 'Q4_2026' && (c.date < '2026-10-01' || c.date > '2026-12-31')) return false;

      // Department filter
      if (selectedDepartment !== 'ALL') {
        const emp = employees.find(e => e.id === c.employeeId);
        if (emp && emp.department !== selectedDepartment) return false;
      }

      return true;
    });
  }, [claims, employees, selectedQuarter, selectedDepartment]);

  // Accounting State Separation
  const authorizedSpend = filteredClaims
    .filter(c => c.approvalStatus === 'auto_authorized' || c.approvalStatus === 'approved_by_manager')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingSpend = filteredClaims
    .filter(c => c.approvalStatus === 'pending_manager')
    .reduce((sum, c) => sum + c.amount, 0);

  const settledSpend = filteredClaims
    .filter(c => c.payableStatus === 'settled_externally')
    .reduce((sum, c) => sum + c.amount, 0);

  // -------------------------------------------------------------
  // RECHARTS DATA PREPARATION: CURRENT VS PREVIOUS MONTH SPENDING
  // -------------------------------------------------------------

  // 1. Grouped Category Comparison Data
  const categoryComparisonData = useMemo(() => {
    // Map spend per category for each month
    const categoryMonthSpend: Record<string, Record<string, number>> = {};
    ALL_CATEGORIES.forEach(cat => {
      categoryMonthSpend[cat] = {
        '2026-08': 0,
        '2026-09': 0,
        '2026-10': 0,
      };
    });

    claims.forEach(claim => {
      // Filter by department if selected
      if (selectedDepartment !== 'ALL') {
        const emp = employees.find(e => e.id === claim.employeeId);
        if (emp && emp.department !== selectedDepartment) return;
      }

      const month = claim.date.substring(0, 7); // 'YYYY-MM'
      const cat = claim.category;
      if (categoryMonthSpend[cat] && categoryMonthSpend[cat][month] !== undefined) {
        categoryMonthSpend[cat][month] += claim.amount;
      }
    });

    return ALL_CATEGORIES.map(cat => {
      const current = categoryMonthSpend[cat]['2026-10'] || 0;
      const previous = categoryMonthSpend[cat]['2026-09'] || 0;
      const prior2 = categoryMonthSpend[cat]['2026-08'] || 0;
      const delta = current - previous;
      const percentChange = previous > 0 
        ? ((current - previous) / previous) * 100 
        : current > 0 ? 100 : 0;

      // Abbreviate long category names for clean X-axis display
      const shortName = cat
        .replace('Ground Transport / Taxi', 'Ground / Taxi')
        .replace('Per Diem / Allowance', 'Per Diem')
        .replace('Software & Subscriptions', 'Software')
        .replace('Office & Equipment', 'Office / Gear')
        .replace('Meals & Entertainment', 'Meals');

      return {
        category: cat,
        shortName,
        currentMonth: parseFloat(current.toFixed(2)),
        previousMonth: parseFloat(previous.toFixed(2)),
        prior2Month: parseFloat(prior2.toFixed(2)),
        delta: parseFloat(delta.toFixed(2)),
        percentChange: parseFloat(percentChange.toFixed(1)),
        isIncrease: delta > 0,
      };
    }).filter(item => {
      if (activeCategoryFilter === 'ALL') return true;
      return item.category === activeCategoryFilter;
    });
  }, [claims, employees, selectedDepartment, activeCategoryFilter]);

  // 2. Monthly Trend Data for Line & Area Charts
  const monthlyTrendData = useMemo(() => {
    const months = ['2026-08', '2026-09', '2026-10'];
    return months.map(m => {
      const row: Record<string, any> = {
        month: monthLabels[m],
        monthKey: m,
        total: 0,
      };

      ALL_CATEGORIES.forEach(cat => {
        row[cat] = 0;
      });

      claims.forEach(c => {
        if (selectedDepartment !== 'ALL') {
          const emp = employees.find(e => e.id === c.employeeId);
          if (emp && emp.department !== selectedDepartment) return;
        }

        if (c.date.startsWith(m)) {
          row[c.category] = (row[c.category] || 0) + c.amount;
          row.total += c.amount;
        }
      });

      // Round values
      ALL_CATEGORIES.forEach(cat => {
        row[cat] = parseFloat(row[cat].toFixed(2));
      });
      row.total = parseFloat(row.total.toFixed(2));

      return row;
    });
  }, [claims, employees, selectedDepartment]);

  // Overall MoM Summary Metrics
  const currentTotalMonthSpend = categoryComparisonData.reduce((acc, curr) => acc + curr.currentMonth, 0);
  const previousTotalMonthSpend = categoryComparisonData.reduce((acc, curr) => acc + curr.previousMonth, 0);
  const totalMoMDelta = currentTotalMonthSpend - previousTotalMonthSpend;
  const totalMoMPercentChange = previousTotalMonthSpend > 0 
    ? ((totalMoMDelta) / previousTotalMonthSpend) * 100 
    : 0;

  // Highest spending category in current month
  const topSpendCategory = [...categoryComparisonData].sort((a, b) => b.currentMonth - a.currentMonth)[0];
  
  // Fastest growing category
  const fastestGrowingCategory = [...categoryComparisonData]
    .filter(c => c.previousMonth > 0 && c.delta > 0)
    .sort((a, b) => b.percentChange - a.percentChange)[0];

  // Group by Employee
  const employeeSpendMap = new Map<string, { name: string; grade: string; dept: string; count: number; total: number }>();
  filteredClaims.forEach(c => {
    const existing = employeeSpendMap.get(c.employeeId) || {
      name: c.employeeName,
      grade: c.employeeGrade,
      dept: employees.find(e => e.id === c.employeeId)?.department || 'Engineering',
      count: 0,
      total: 0,
    };
    existing.count += 1;
    existing.total += c.amount;
    employeeSpendMap.set(c.employeeId, existing);
  });
  const employeeSpendList = Array.from(employeeSpendMap.values()).sort((a, b) => b.total - a.total);

  // Group by Category
  const categorySpendMap = new Map<string, number>();
  filteredClaims.forEach(c => {
    categorySpendMap.set(c.category, (categorySpendMap.get(c.category) || 0) + c.amount);
  });
  const categorySpendList = Array.from(categorySpendMap.entries()).sort((a, b) => b[1] - a[1]);

  // What-If Simulation Calculation:
  const currentMealCap = 65;
  const deltaMeal = Math.max(0, simMealCap - currentMealCap);
  const estimatedQuarterlyMealImpact = 24 * 12 * deltaMeal;
  const deltaHotel = Math.max(0, simHotelCap - 220);
  const estimatedQuarterlyHotelImpact = 24 * 6 * deltaHotel;

  // Custom Tooltip for Grouped Bar Comparison Chart
  const CustomComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = categoryComparisonData.find(d => d.shortName === label || d.category === label);
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[220px] space-y-2">
          <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{dataItem?.category || label}</span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                <span>Oct 2026 (Current):</span>
              </span>
              <span className="font-bold">${dataItem?.currentMonth.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 inline-block"></span>
                <span>Sept 2026 (Previous):</span>
              </span>
              <span>${dataItem?.previousMonth.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-blue-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block"></span>
                <span>Aug 2026 (2 Mo Prior):</span>
              </span>
              <span>${dataItem?.prior2Month.toFixed(2)}</span>
            </div>
          </div>

          {dataItem && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">MoM Variance:</span>
              <span className={`font-mono font-bold flex items-center gap-0.5 ${
                dataItem.delta > 0 ? 'text-amber-400' : dataItem.delta < 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {dataItem.delta > 0 ? '+' : ''}${dataItem.delta.toFixed(2)} ({dataItem.percentChange > 0 ? '+' : ''}{dataItem.percentChange}%)
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Stacked and Trend Charts
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, p: any) => sum + (typeof p.value === 'number' ? p.value : 0), 0);
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[240px] space-y-2">
          <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-emerald-400 font-mono font-bold">Total: ${total.toFixed(2)}</span>
          </div>
          <div className="space-y-1 font-mono max-h-48 overflow-y-auto pr-1">
            {payload.map((entry: any, index: number) => {
              if (entry.dataKey === 'total') return null;
              if (entry.value === 0) return null;
              return (
                <div key={index} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 truncate max-w-[140px]" title={entry.name}>
                    <span 
                      className="w-2 h-2 rounded-full inline-block shrink-0" 
                      style={{ backgroundColor: entry.color }}
                    ></span>
                    <span className="text-slate-300 truncate">{entry.name}</span>
                  </span>
                  <span className="text-slate-100 font-bold">${entry.value.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              Recharts Analytics Engine
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-600">
              Category Trend Visualizer
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Spend Intelligence & Category Trend Visualizer
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Multi-month category comparisons with Recharts data visualizers. Compare current month spending velocity against previous months and analyze budget variances.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Department Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 py-0.5 px-1 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales & Growth">Sales & Growth</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          {/* Quarter Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedQuarter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedQuarter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setSelectedQuarter('Q3_2026')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedQuarter === 'Q3_2026' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Q3 2026
            </button>
            <button
              onClick={() => setSelectedQuarter('Q4_2026')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedQuarter === 'Q4_2026' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Q4 2026
            </button>
          </div>
        </div>
      </div>

      {/* Accounting State Separation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Authorized Company Spend</div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
            ${authorizedSpend.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Auto-authorized + Manager approved liabilities
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Pending Unapproved Spend</div>
          <div className="text-2xl font-bold font-mono text-amber-800 mt-1 tabular-nums">
            ${pendingSpend.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Advances, mileage & exceptions awaiting review
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Externally Confirmed Settled</div>
          <div className="text-2xl font-bold font-mono text-blue-800 mt-1 tabular-nums">
            ${settledSpend.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Completed payroll ACH distributions
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRIMARY FEATURE: RECHARTS SPENDING TREND & CATEGORY COMPARISON VISUALIZER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        {/* Visualizer Top Bar & Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Current vs. Previous Month Spend by Category
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing <strong>October 2026 (Current)</strong> against <strong>September 2026 (Previous)</strong> and August historical baselines.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Chart Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setChartMode('comparison')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  chartMode === 'comparison'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Category MoM Bar</span>
              </button>
              <button
                onClick={() => setChartMode('stacked')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  chartMode === 'stacked'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Monthly Composition</span>
              </button>
              <button
                onClick={() => setChartMode('trend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  chartMode === 'trend'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                <span>Spend Velocity Curves</span>
              </button>
            </div>
          </div>
        </div>

        {/* Highlight Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Current Month Total */}
          <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wide">
              Current Month (Oct 2026)
            </span>
            <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
              ${currentTotalMonthSpend.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-800 mt-0.5 flex items-center gap-1">
              {totalMoMDelta >= 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold text-amber-900">+${totalMoMDelta.toFixed(2)} (+{totalMoMPercentChange.toFixed(1)}%)</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">-${Math.abs(totalMoMDelta).toFixed(2)} ({totalMoMPercentChange.toFixed(1)}%)</span>
                </>
              )}
              <span className="text-slate-500">vs Sept</span>
            </div>
          </div>

          {/* Previous Month Total */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Previous Month (Sept 2026)
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ${previousTotalMonthSpend.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Baseline for MoM variance calculations
            </div>
          </div>

          {/* Top Category This Month */}
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200">
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wide">
              Top Category (Oct)
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={topSpendCategory?.category}>
              {topSpendCategory?.category || 'N/A'}
            </div>
            <div className="text-[11px] text-blue-900 font-mono font-semibold mt-0.5">
              ${(topSpendCategory?.currentMonth || 0).toFixed(2)}
              <span className="text-slate-500 font-normal ml-1">
                ({currentTotalMonthSpend > 0 ? (((topSpendCategory?.currentMonth || 0) / currentTotalMonthSpend) * 100).toFixed(0) : 0}% of Oct)
              </span>
            </div>
          </div>

          {/* Fastest Growing Category */}
          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wide">
              Highest MoM Increase
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={fastestGrowingCategory?.category}>
              {fastestGrowingCategory?.category || 'Office & Equipment'}
            </div>
            <div className="text-[11px] text-amber-900 font-mono font-semibold mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
              <span>+{fastestGrowingCategory?.percentChange.toFixed(0) || '0'}%</span>
              <span className="text-slate-500 font-normal">(+${(fastestGrowingCategory?.delta || 0).toFixed(2)})</span>
            </div>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Category Filter:
          </span>
          <button
            onClick={() => setActiveCategoryFilter('ALL')}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              activeCategoryFilter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({ALL_CATEGORIES.length})
          </button>
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat === activeCategoryFilter ? 'ALL' : cat)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                activeCategoryFilter === cat
                  ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: CATEGORY_COLORS[cat] || '#10b981' }}
              ></span>
              <span className="truncate max-w-[130px]">{cat}</span>
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RECHARTS VISUALIZATION CANVASES BASED ON SELECTED MODE */}
        {/* ------------------------------------------------------------------ */}
        <div className="h-80 w-full pt-2">
          {/* MODE 1: GROUPED BAR CHART (CURRENT OCT VS PREV SEPT VS AUG) */}
          {chartMode === 'comparison' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryComparisonData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="shortName" 
                  tick={{ fill: '#475569', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomComparisonTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
                />
                <Bar 
                  dataKey="previousMonth" 
                  name="Sept 2026 (Previous Month)" 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar 
                  dataKey="currentMonth" 
                  name="Oct 2026 (Current Month)" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                >
                  {categoryComparisonData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.delta > 0 ? '#10b981' : '#059669'} 
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey="prior2Month" 
                  name="Aug 2026 (2 Mo Prior)" 
                  fill="#cbd5e1" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* MODE 2: STACKED MONTHLY COMPOSITION */}
          {chartMode === 'stacked' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrendData}
                margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: 15, fontSize: 11 }}
                />
                {ALL_CATEGORIES.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    name={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat] || '#10b981'}
                    maxBarSize={60}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* MODE 3: SPEND VELOCITY CURVES (AREA / LINE) */}
          {chartMode === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrendData}
                margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: 15, fontSize: 11 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Total Workforce Spend" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                {activeCategoryFilter !== 'ALL' ? (
                  <Line 
                    type="monotone" 
                    dataKey={activeCategoryFilter} 
                    name={activeCategoryFilter}
                    stroke={CATEGORY_COLORS[activeCategoryFilter] || '#3b82f6'} 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                ) : (
                  <>
                    <Line type="monotone" dataKey="Meals & Entertainment" stroke={CATEGORY_COLORS['Meals & Entertainment']} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Hotel & Lodging" stroke={CATEGORY_COLORS['Hotel & Lodging']} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Office & Equipment" stroke={CATEGORY_COLORS['Office & Equipment']} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Software & Subscriptions" stroke={CATEGORY_COLORS['Software & Subscriptions']} strokeWidth={2} dot={{ r: 3 }} />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category MoM Variance Data Table */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Detailed Category MoM Variance Ledger
            </h3>
            <span className="text-[11px] text-slate-500">
              Oct 2026 vs Sept 2026 delta analysis
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-3">Expense Category</th>
                  <th className="py-2 px-3 text-right">Sept 2026 (Prev)</th>
                  <th className="py-2 px-3 text-right">Oct 2026 (Current)</th>
                  <th className="py-2 px-3 text-right">Net Dollar Delta</th>
                  <th className="py-2 px-3 text-center">MoM Variance</th>
                  <th className="py-2 px-3 text-center">Trend Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryComparisonData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-900 flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#10b981' }}
                      ></span>
                      <span>{item.category}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      ${item.previousMonth.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ${item.currentMonth.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      <span className={item.delta > 0 ? 'text-amber-700' : item.delta < 0 ? 'text-emerald-700' : 'text-slate-400'}>
                        {item.delta > 0 ? '+' : ''}${item.delta.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        item.delta > 0 
                          ? 'bg-amber-100 text-amber-900' 
                          : item.delta < 0 
                            ? 'bg-emerald-100 text-emerald-900' 
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.delta > 0 ? '+' : ''}{item.percentChange.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.delta > 0 ? (
                        <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Surge
                        </span>
                      ) : item.delta < 0 ? (
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Savings
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                          Stable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Employee Spending & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Employee Ranking Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Spend by Employee & Grade
            </h2>
            <span className="text-[11px] text-slate-500">
              {employeeSpendList.length} active submitters
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Grade & Dept</th>
                  <th className="py-2.5 px-4 text-center">Items</th>
                  <th className="py-2.5 px-4 text-right">Total Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeSpendList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{item.grade} · {item.dept}</td>
                    <td className="py-2.5 px-4 text-center font-mono">{item.count}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ${item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown & Department Distribution */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Spend by Category (Filtered Quarter)
            </h3>
            <div className="space-y-2 text-xs">
              {categorySpendList.map(([cat, amount], idx) => {
                const pct = authorizedSpend > 0 ? (amount / (authorizedSpend + pendingSpend)) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium text-slate-900">{cat}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        ${amount.toFixed(2)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Department Spend Distribution
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Array.from(new Set(employees.map(e => e.department))).map((dept, idx) => {
                const totalDept = filteredClaims
                  .filter(c => {
                    const emp = employees.find(e => e.id === c.employeeId);
                    return emp?.department === dept;
                  })
                  .reduce((sum, c) => sum + c.amount, 0);

                return (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">{dept}</span>
                    <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block tabular-nums">
                      ${totalDept.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* POLICY "WHAT-IF" SCENARIO SIMULATION */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Workforce Policy Limit Simulator (What-If Analysis)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Model budget impacts before publishing rule amendments to active policies.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            Active Workforce Model: 24 Engineers (Band B)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Simulate Daily Meal Limit:</span>
                <span className="font-mono font-bold text-emerald-400">${simMealCap}/day</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="110" 
                step="5"
                value={simMealCap}
                onChange={(e) => setSimMealCap(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Baseline: $65/day</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Simulate Nightly Lodging Cap:</span>
                <span className="font-mono font-bold text-emerald-400">${simHotelCap}/night</span>
              </div>
              <input 
                type="range" 
                min="180" 
                max="350" 
                step="10"
                value={simHotelCap}
                onChange={(e) => setSimHotelCap(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Baseline: $220/night</span>
            </div>
          </div>

          {/* Model Output Calculations */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase">
                Projected Quarterly Meal Delta
              </div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1 tabular-nums">
                +${estimatedQuarterlyMealImpact.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                For 24 Band B staff traveling an average of 12 days per quarter.
              </p>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase">
                Projected Quarterly Lodging Delta
              </div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1 tabular-nums">
                +${estimatedQuarterlyHotelImpact.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                For 24 Band B staff with 6 estimated conference hotel nights.
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Combined Estimated Quarterly Expense Impact:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                +${(estimatedQuarterlyMealImpact + estimatedQuarterlyHotelImpact).toFixed(2)} / quarter
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
