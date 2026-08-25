import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchReportsApi } from '../lib/api';
import { WeeklyRentRecord } from '../types';
import { exportReportToPDF, exportToCSV, formatCurrency, formatDate, formatWeekRangeDisplay } from '../lib/utils';
import {
  BarChart3,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    selectedWeek,
    prevWeek,
    nextWeek,
    resetToCurrentWeek,
    settings,
    addToast,
    refreshTrigger
  } = useApp();

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchReportsApi(selectedWeek.weekStart, selectedWeek.weekEnd);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWeek.weekStart, refreshTrigger]);

  const symbol = settings.currencySymbol || '$';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.records) return;

    const headers = ['Tenant Name', 'Room', 'Weekly Rent', 'Due Date', 'Status', 'Amount Paid', 'Payment Date'];
    const rows = reportData.records.map((r: WeeklyRentRecord) => [
      r.tenantName,
      r.roomNumber,
      r.weeklyRent,
      r.dueDate,
      r.status,
      r.amountPaid || 0,
      r.paymentDate || ''
    ]);

    exportToCSV(`Weekly_Rent_Report_${selectedWeek.weekStart}`, headers, rows);
    addToast('Report exported to CSV file', 'success');
  };

  const handleExportPDF = () => {
    if (!reportData || !reportData.records) return;

    const title = 'Weekly Rent Report';
    const subtitle = `Property: ${settings.propertyName} | Week: ${formatWeekRangeDisplay(selectedWeek.weekStart, selectedWeek.weekEnd)}`;

    const summaryStats = [
      { label: 'Total Expected', value: formatCurrency(reportData.rentExpected, symbol) },
      { label: 'Total Received', value: formatCurrency(reportData.rentReceived, symbol) },
      { label: 'Outstanding', value: formatCurrency(reportData.outstanding, symbol) },
      { label: 'Collection Rate', value: `${reportData.paymentPercentage}%` }
    ];

    const headers = ['Tenant', 'Room', 'Rent', 'Due Day', 'Status', 'Paid'];
    const rows = reportData.records.map((r: WeeklyRentRecord) => [
      r.tenantName,
      r.roomNumber,
      formatCurrency(r.weeklyRent, symbol),
      r.rentDueDay,
      r.status,
      formatCurrency(r.amountPaid || 0, symbol)
    ]);

    exportReportToPDF(title, subtitle, headers, rows, summaryStats);
    addToast('Report PDF generated', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in print:p-0">
      {/* Print Hide Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Weekly Financial Reports</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export or print structured weekly rent breakdown statements
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={prevWeek}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold font-mono">
              {formatWeekRangeDisplay(selectedWeek.weekStart, selectedWeek.weekEnd)}
            </span>
            <button
              onClick={nextWeek}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      {loading || !reportData ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading report...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Report Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {settings.propertyName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {settings.propertyAddress} • Contact: {settings.contactNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-full">
                WEEKLY RENT STATEMENT
              </span>
              <p className="text-xs text-slate-500 font-mono mt-2">
                Week: {formatWeekRangeDisplay(selectedWeek.weekStart, selectedWeek.weekEnd)}
              </p>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Expected Rent</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {formatCurrency(reportData.rentExpected, symbol)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Collected</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(reportData.rentReceived, symbol)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Outstanding</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(reportData.outstanding, symbol)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Payment Ratio</span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {reportData.paymentPercentage}% ({reportData.numberPaid}/{reportData.totalTenants})
              </p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">
              Tenant Breakdown Statement
            </h3>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tenant Name</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4 text-right">Rent Amount</th>
                  <th className="py-3 px-4">Due Day</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {reportData.records.map((r: WeeklyRentRecord) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {r.tenantName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {r.roomNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(r.weeklyRent, symbol)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {r.rentDueDay}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Received'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : r.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.amountPaid || 0, symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
