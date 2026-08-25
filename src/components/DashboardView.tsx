import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchDashboardApi } from '../lib/api';
import { DashboardStats, Payment, WeeklyRentRecord } from '../types';
import { formatCurrency, formatDate, formatWeekRangeDisplay, parseWhatsAppTemplate } from '../lib/utils';
import {
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  MessageSquare,
  PlusCircle,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Building2
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    selectedWeek,
    settings,
    openRecordPaymentModal,
    openWhatsAppModal,
    setCurrentView,
    refreshTrigger,
    setSelectedTenantForDetail
  } = useApp();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [thisWeekRent, setThisWeekRent] = useState<WeeklyRentRecord[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardApi(selectedWeek.weekStart, selectedWeek.weekEnd);
      setStats(data.stats);
      setThisWeekRent(data.thisWeekRent || []);
      setRecentPayments(data.recentPayments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWeek.weekStart, refreshTrigger]);

  const handleWhatsAppClick = (rec: WeeklyRentRecord) => {
    if (rec.status === 'Received') {
      const msg = parseWhatsAppTemplate(settings.whatsappReceivedTemplate, {
        tenant_name: rec.tenantName,
        amount: rec.amountPaid || rec.weeklyRent,
        week_start: rec.weekStart,
        week_end: rec.weekEnd,
        payment_date: rec.paymentDate || rec.dueDate,
        room_number: rec.roomNumber,
        currency_symbol: settings.currencySymbol
      });
      openWhatsAppModal({
        tenantId: rec.tenantId,
        tenantName: rec.tenantName,
        phone: rec.whatsappNumber || rec.phone,
        type: 'Receipt',
        message: msg,
        paymentId: rec.paymentId
      });
    } else {
      const msg = parseWhatsAppTemplate(settings.whatsappReminderTemplate, {
        tenant_name: rec.tenantName,
        amount: rec.weeklyRent - rec.amountPaid,
        week_start: rec.weekStart,
        week_end: rec.weekEnd,
        due_date: rec.dueDate,
        room_number: rec.roomNumber,
        currency_symbol: settings.currencySymbol
      });
      openWhatsAppModal({
        tenantId: rec.tenantId,
        tenantName: rec.tenantName,
        phone: rec.whatsappNumber || rec.phone,
        type: 'Reminder',
        message: msg
      });
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const symbol = settings.currencySymbol || '$';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome & Overview Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Overview Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Property Rent Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Managing <strong className="text-slate-800 dark:text-slate-200">{settings.propertyName}</strong> • Week of{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatWeekRangeDisplay(selectedWeek.weekStart, selectedWeek.weekEnd)}</span>
          </p>
        </div>

        <button
          onClick={() => openRecordPaymentModal()}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Record Payment</span>
        </button>
      </div>

      {/* Professional Polish 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Card 1: Total Tenants */}
        <div
          onClick={() => setCurrentView('tenants')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Total Tenants</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-1 sm:mt-2 gap-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.totalTenants || 0}
            </h2>
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 text-[10px] px-2 py-0.5 sm:py-1 rounded font-bold uppercase w-fit">
              {stats?.activeTenantsCount} Active
            </span>
          </div>
        </div>

        {/* Card 2: Rent Expected (Blue Left Border Accent) */}
        <div
          onClick={() => setCurrentView('weekly')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-500 cursor-pointer"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Expected Rent</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-1 sm:mt-2 gap-1">
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(stats?.rentDueThisWeek || 0, symbol)}
            </h2>
            <span className="text-slate-400 text-[11px] sm:text-xs italic">Target</span>
          </div>
        </div>

        {/* Card 3: Rent Received (Green Left Border Accent) */}
        <div
          onClick={() => setCurrentView('weekly')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-green-500 cursor-pointer"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Rent Received</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-1 sm:mt-2 gap-1">
            <h2 className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats?.rentReceivedThisWeek || 0, symbol)}
            </h2>
            <span className="text-green-500 text-xs font-bold">
              +{stats?.percentageReceived || 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Outstanding (Rose Left Border Accent) */}
        <div
          onClick={() => setCurrentView('outstanding')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-rose-500 cursor-pointer"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Outstanding</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-1 sm:mt-2 gap-1">
            <h2 className="text-xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(stats?.rentOutstandingThisWeek || 0, symbol)}
            </h2>
            <span className="text-rose-400 text-[11px] sm:text-xs font-medium">Due now</span>
          </div>
        </div>
      </div>

      {/* Collection Progress Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Collection Progress</h3>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {stats?.percentageReceived || 0}% Completed
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats?.percentageReceived || 0)}%` }}
          />
        </div>
      </div>

      {/* Main Table & Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: This Week's Rent Records */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">This Week's Rent Records</h3>
            <button
              onClick={() => setCurrentView('weekly')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              + View All
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-100 dark:border-slate-800">
                <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-6 py-3">Tenant</th>
                  <th className="px-6 py-3">Room</th>
                  <th className="px-6 py-3 text-right">Rent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {thisWeekRent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No active tenant records for this week.
                    </td>
                  </tr>
                ) : (
                  thisWeekRent.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-default transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {rec.tenantName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {rec.roomNumber}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(rec.weeklyRent, symbol)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase ${
                          rec.status === 'Received'
                            ? 'bg-green-100 text-green-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : rec.status === 'Pending'
                            ? 'bg-orange-100 text-orange-700 dark:bg-amber-950 dark:text-amber-300'
                            : rec.status === 'Overdue'
                            ? 'bg-red-100 text-red-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-sky-950 dark:text-sky-300'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {rec.status !== 'Received' && (
                            <button
                              onClick={() => openRecordPaymentModal({ tenantId: rec.tenantId, amountDue: rec.weeklyRent })}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                            >
                              Record Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleWhatsAppClick(rec)}
                            className={`px-2 py-1 rounded border text-xs font-bold flex items-center space-x-1 transition-all ${
                              rec.status === 'Received'
                                ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-200 dark:hover:bg-emerald-950/60'
                                : 'text-red-600 hover:bg-red-50 border-red-200 dark:hover:bg-rose-950/60'
                            }`}
                          >
                            <span>💬 {rec.status === 'Received' ? 'Receipt' : 'Reminder'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {thisWeekRent.length === 0 ? (
              <p className="px-4 py-8 text-center text-slate-400 text-xs">
                No active tenant records for this week.
              </p>
            ) : (
              thisWeekRent.map(rec => (
                <div key={rec.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {rec.tenantName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Room {rec.roomNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(rec.weeklyRent, symbol)}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                        rec.status === 'Received'
                          ? 'bg-green-100 text-green-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : rec.status === 'Pending'
                          ? 'bg-orange-100 text-orange-700 dark:bg-amber-950 dark:text-amber-300'
                          : rec.status === 'Overdue'
                          ? 'bg-red-100 text-red-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-sky-950 dark:text-sky-300'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {rec.status !== 'Received' && (
                      <button
                        onClick={() => openRecordPaymentModal({ tenantId: rec.tenantId, amountDue: rec.weeklyRent })}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center active:scale-95 transition-all"
                      >
                        Record Pay
                      </button>
                    )}
                    <button
                      onClick={() => handleWhatsAppClick(rec)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold text-center active:scale-95 transition-all flex items-center justify-center gap-1 ${
                        rec.status === 'Received'
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : 'text-red-600 bg-red-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-800'
                      }`}
                    >
                      <span>💬 {rec.status === 'Received' ? 'Receipt' : 'Reminder'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Payments Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Recent Payments</h3>
            <button
              onClick={() => setCurrentView('history')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              History
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No recent payments recorded yet.
              </p>
            ) : (
              recentPayments.map(p => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {p.tenantName}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {p.roomNumber} • {p.paymentMethod}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      {formatDate(p.paymentDate, 'medium')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                      +{formatCurrency(p.amountPaid, symbol)}
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 dark:bg-emerald-950 dark:text-emerald-300 mt-1">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
