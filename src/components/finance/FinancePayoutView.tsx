import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { PayoutReport, ExpenseClaim } from '../../types';
import { 
  DollarSign, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  CreditCard,
  FileCheck,
  Sparkles
} from 'lucide-react';

export const FinancePayoutView: React.FC = () => {
  const { 
    currentEmployee, 
    setCurrentEmployeeId,
    claims, 
    payoutReports, 
    generatePayoutReport, 
    markPayoutReportSettled,
    confirmAdvanceDisbursement 
  } = useExpenses();

  const [activeSubTab, setActiveSubTab] = useState<'payout_generator' | 'advance_ledger' | 'historical_reports'>('payout_generator');
  const [periodStart, setPeriodStart] = useState('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState('2026-10-31');
  const [reportTitle, setReportTitle] = useState('October 2026 Primary Payout Handoff');
  const [, setInspectReport] = useState<PayoutReport | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Eligible claims pending inclusion in a payout report
  const payableClaims = claims.filter(c => 
    c.payableStatus === 'payable_pending_report' &&
    c.date >= periodStart && c.date <= periodEnd
  );

  // Approved claims overall (either auto-authorized or approved by manager)
  const allApprovedClaims = claims.filter(c => 
    c.approvalStatus === 'auto_authorized' || c.approvalStatus === 'approved_by_manager'
  );

  // Travel advances tracking
  const allAdvances = claims.filter(c => c.type === 'travel_advance');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (payableClaims.length === 0) {
      alert('No authorized payable claims found in the selected date range.');
      return;
    }
    const report = generatePayoutReport(periodStart, periodEnd, reportTitle);
    setInspectReport(report);
    showToast(`Created payout snapshot ${report.reportNumber} with ${report.employeeCount} employees ($${report.totalPayableAmount.toFixed(2)})`);
  };

  /**
   * Export approved expense reports as CSV files for payroll systems (ADP, Gusto, Workday, Paychex).
   * Generates standard payroll format with Employee ID, Name, Department, Earning Code, Net Pay, etc.
   */
  const exportApprovedExpenseReportsForPayrollCSV = (report?: PayoutReport) => {
    // If a specific report is provided, export that report; otherwise export all available payout reports
    const targetReports = report ? [report] : payoutReports;

    if (targetReports.length === 0) {
      alert('No approved payout reports available to export. Generate a snapshot first.');
      return;
    }

    const headers = [
      'Payroll_Record_ID',
      'Report_Number',
      'Report_Title',
      'Pay_Period_Start',
      'Pay_Period_End',
      'Employee_ID',
      'Employee_Name',
      'Employee_Grade',
      'Legal_Entity',
      'Gross_Reimbursements',
      'Mileage_Total',
      'Allowances_Total',
      'Advance_Offsets_Deducted',
      'Net_Payroll_Payable',
      'Currency',
      'Payroll_Earnings_Code',
      'Tax_Treatment',
      'Disbursement_Method',
      'Status',
      'Export_Timestamp'
    ];

    const timestamp = new Date().toISOString();
    const rows: string[][] = [];

    targetReports.forEach((rep) => {
      rep.entries.forEach((e, idx) => {
        rows.push([
          `PAY-${rep.reportNumber}-${idx + 1}`,
          `"${rep.reportNumber}"`,
          `"${rep.title.replace(/"/g, '""')}"`,
          rep.periodStart,
          rep.periodEnd,
          `"${e.employeeId}"`,
          `"${e.employeeName.replace(/"/g, '""')}"`,
          `"${e.employeeGrade}"`,
          `"${e.legalEntity}"`,
          e.reimbursementsTotal.toFixed(2),
          e.mileageTotal.toFixed(2),
          e.allowancesTotal.toFixed(2),
          e.advancesOffsetDeducted.toFixed(2),
          e.netPayableAmount.toFixed(2),
          'USD',
          'EXP_REIMB_NONTAX',
          'NON_TAXABLE',
          'Direct Deposit / ACH',
          rep.status === 'marked_settled' ? 'SETTLED' : 'APPROVED_FOR_PAYROLL',
          timestamp
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = report 
      ? `payroll_export_${report.reportNumber}.csv`
      : `payroll_approved_expense_reports_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const totalExportedAmount = targetReports.reduce((s, r) => s + r.totalPayableAmount, 0);
    showToast(`Successfully exported ${rows.length} payroll line items ($${totalExportedAmount.toFixed(2)}) as ${filename}`);
  };

  /**
   * Export individual approved expense claims itemized for payroll auditing.
   */
  const exportApprovedClaimsItemizedForPayrollCSV = () => {
    const claimsToExport = payableClaims.length > 0 ? payableClaims : allApprovedClaims;

    if (claimsToExport.length === 0) {
      alert('No approved expense claims available to export.');
      return;
    }

    const headers = [
      'Claim_Reference',
      'Employee_ID',
      'Employee_Name',
      'Employee_Grade',
      'Legal_Entity',
      'Expense_Date',
      'Expense_Category',
      'Merchant_Vendor',
      'Business_Purpose',
      'Trip_Reference',
      'Gross_Amount',
      'Currency',
      'Approval_Status',
      'Payable_Status',
      'Payroll_Earnings_Code',
      'Taxable_Status'
    ];

    const rows = claimsToExport.map(c => [
      `"${c.claimNumber}"`,
      `"${c.employeeId}"`,
      `"${c.employeeName.replace(/"/g, '""')}"`,
      `"${c.employeeGrade}"`,
      `"${c.legalEntity}"`,
      c.date,
      `"${c.category}"`,
      `"${(c.merchantName || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.businessPurpose || '').replace(/"/g, '""')}"`,
      `"${c.tripNumber || 'None'}"`,
      c.amount.toFixed(2),
      c.currency,
      `"${c.approvalStatus}"`,
      `"${c.payableStatus}"`,
      c.type === 'mileage' ? 'MILEAGE_REIMB' : c.type === 'allowance' ? 'PER_DIEM' : 'EXPENSE_REIMB',
      'NON_TAXABLE'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `payroll_itemized_approved_claims_${periodStart}_to_${periodEnd}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${claimsToExport.length} itemized approved claims for payroll accounting (${filename})`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Finance Payout Handoff & Advance Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Consolidates authorized reimbursements, mileage logs, and allowances into immutable versioned payout reports for payroll or bank transfer. Reconciles externally confirmed travel advances.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Main CSV Export Action Button for Payroll Systems */}
          <button
            onClick={() => exportApprovedExpenseReportsForPayrollCSV()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Approved Reports for Payroll (CSV)</span>
          </button>

          {currentEmployee.id !== 'emp-005' && (
            <button
              onClick={() => setCurrentEmployeeId('emp-005')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs"
            >
              Switch to Sarah Jenkins (Finance)
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveSubTab('payout_generator')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeSubTab === 'payout_generator'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Generate Payout Snapshot
        </button>
        <button
          onClick={() => setActiveSubTab('advance_ledger')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeSubTab === 'advance_ledger'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Advance Reconciliation Ledger ({allAdvances.length})
        </button>
        <button
          onClick={() => setActiveSubTab('historical_reports')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeSubTab === 'historical_reports'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Versioned Payout Reports ({payoutReports.length})
        </button>
      </div>

      {/* 1. PAYOUT GENERATOR VIEW */}
      {activeSubTab === 'payout_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Config and run */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Payout Run Configuration
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a snapshot of all authorized claims within the date range. Patty will automatically apply advance deductions where applicable.
            </p>

            <form onSubmit={handleGenerateReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Report Description</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Period Cutoff Start</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Period Cutoff End</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full border border-slate-200 rounded-md p-2"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Eligible Authorized Claims:</span>
                  <strong className="font-mono text-slate-900">{payableClaims.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Gross Authorized Sum:</span>
                  <strong className="font-mono text-slate-900">
                    ${payableClaims.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                disabled={payableClaims.length === 0}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Payout Snapshot Report
              </button>
            </form>
          </div>

          {/* Right panel: Preview eligible queue */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Authorized Claims Ready for Inclusion ({payableClaims.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Only claims fully authorized (either auto-authorized or manager-approved) appear here.
                </p>
              </div>

              {/* Action to export itemized approved claims as CSV for payroll systems */}
              <button
                onClick={exportApprovedClaimsItemizedForPayrollCSV}
                disabled={payableClaims.length === 0}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Claims as Payroll CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Ref</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Authorization Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payableClaims.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No pending authorized claims in this date window.
                      </td>
                    </tr>
                  ) : (
                    payableClaims.map(claim => (
                      <tr key={claim.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{claim.claimNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{claim.employeeName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{claim.category}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{claim.date}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ${claim.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-emerald-800">
                          {claim.approvalStatus === 'auto_authorized' ? 'Auto-Rule' : 'Manager Sign-off'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADVANCE RECONCILIATION LEDGER */}
      {activeSubTab === 'advance_ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Travel Advance Requests & External Disbursement Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks requested vs approved vs externally confirmed disbursements. Disbursed advances are reconciled and deducted once against trip claims.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-950 font-medium">
              <strong className="text-amber-900 font-bold">Policy Note:</strong> Travel advance can ONLY be given for approved travel.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                <tr>
                  <th className="py-2.5 px-3">Advance Ref</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Trip Link</th>
                  <th className="py-2.5 px-3 text-right">Requested</th>
                  <th className="py-2.5 px-3">Manager Status</th>
                  <th className="py-2.5 px-3">Finance Disbursement Confirmation</th>
                  <th className="py-2.5 px-3 text-right">Offset Balance</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allAdvances.map(adv => {
                  const isManagerApproved = adv.approvalStatus === 'approved_by_manager';
                  const isDisbursed = adv.advanceDetails?.externallyConfirmed;

                  return (
                    <tr key={adv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-medium text-slate-900">{adv.claimNumber}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{adv.employeeName}</td>
                      <td className="py-3 px-3 font-mono text-emerald-800">{adv.tripNumber || '—'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ${adv.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          isManagerApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {adv.approvalStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {isDisbursed ? (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Disbursed (${adv.advanceDetails?.disbursedAmount?.toFixed(2)})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isManagerApproved ? 'Awaiting Bank/Cash Release' : 'Awaiting Manager Sign-off'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                        ${(adv.advanceDetails?.remainingOffsetBalance || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isManagerApproved && !isDisbursed && (
                          <button
                            onClick={() => confirmAdvanceDisbursement(adv.id, adv.amount)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                          >
                            Confirm Disbursed
                          </button>
                        )}
                        {isDisbursed && (
                          <span className="text-[10px] text-slate-400 font-mono">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. HISTORICAL VERSIONED PAYOUT REPORTS */}
      {activeSubTab === 'historical_reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase">Versioned Expense Payout Reports</h2>
              <p className="text-[11px] text-slate-500">
                Immutable snapshots exported to corporate payroll or external ACH banking systems.
              </p>
            </div>
            <button
              onClick={() => exportApprovedExpenseReportsForPayrollCSV()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Reports as Payroll CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payoutReports.map(report => (
              <div 
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">{report.reportNumber}</span>
                    <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{report.title}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Cutoff: {report.periodStart} → {report.periodEnd}
                    </div>
                  </div>

                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    report.status === 'marked_settled'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {report.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="text-[10px] text-slate-500">Net Payable</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      ${report.totalPayableAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="text-[10px] text-slate-500">Recipients</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {report.employeeCount}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="text-[10px] text-slate-500">Total Items</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {report.itemCount}
                    </div>
                  </div>
                </div>

                {/* Per employee entries */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Employee Breakdown:</span>
                  {report.entries.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700 border-b border-slate-50 pb-1">
                      <div>
                        <span className="font-medium text-slate-900">{entry.employeeName}</span>
                        {entry.advancesOffsetDeducted > 0 && (
                          <span className="text-[10px] text-emerald-700 block">
                            (Offset -${entry.advancesOffsetDeducted.toFixed(2)} advance)
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        ${entry.netPayableAmount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Report Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {/* Payroll Systems CSV Export Button */}
                  <button
                    onClick={() => exportApprovedExpenseReportsForPayrollCSV(report)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Export Payroll CSV</span>
                  </button>

                  {report.status !== 'marked_settled' && (
                    <button
                      onClick={() => markPayoutReportSettled(report.id, currentEmployee.name)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors shadow-2xs"
                    >
                      Record Bank Settlement
                    </button>
                  )}
                  {report.status === 'marked_settled' && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Settled by {report.settledBy}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
