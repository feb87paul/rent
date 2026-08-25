import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchWeeklyRentApi } from '../lib/api';
import { WeeklyRentRecord } from '../types';
import { formatCurrency, formatDate, formatWeekRangeDisplay, parseWhatsAppTemplate } from '../lib/utils';
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  MessageSquare,
  Search,
  Check
} from 'lucide-react';

export const WeeklyRentView: React.FC = () => {
  const {
    selectedWeek,
    prevWeek,
    nextWeek,
    resetToCurrentWeek,
    settings,
    openRecordPaymentModal,
    openWhatsAppModal,
    refreshTrigger,
    setSelectedTenantForDetail,
    fetchTenants
  } = useApp();

  const [records, setRecords] = useState<WeeklyRentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchWeeklyRentApi(selectedWeek.weekStart, selectedWeek.weekEnd);
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWeek.weekStart, refreshTrigger]);

  const filtered = records.filter(r => {
    const matchesSearch =
      r.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalExpected = records.reduce((acc, r) => acc + r.weeklyRent, 0);
  const totalReceived = records.reduce((acc, r) => acc + r.amountPaid, 0);
  const totalOutstanding = Math.max(0, totalExpected - totalReceived);
  const paidCount = records.filter(r => r.status === 'Received').length;
  const unpaidCount = records.filter(r => r.status === 'Pending' || r.status === 'Overdue' || r.status === 'Partially Paid').length;

  const symbol = settings.currencySymbol || '$';

  const handleWhatsAppAction = (r: WeeklyRentRecord) => {
    if (r.status === 'Received') {
      const msg = parseWhatsAppTemplate(settings.whatsappReceivedTemplate, {
        tenant_name: r.tenantName,
        amount: r.amountPaid || r.weeklyRent,
        week_start: r.weekStart,
        week_end: r.weekEnd,
        payment_date: r.paymentDate || r.dueDate,
        room_number: r.roomNumber,
        currency_symbol: symbol
      });
      openWhatsAppModal({
        tenantId: r.tenantId,
        tenantName: r.tenantName,
        phone: r.whatsappNumber || r.phone,
        type: 'Receipt',
        message: msg,
        paymentId: r.paymentId
      });
    } else {
      const msg = parseWhatsAppTemplate(settings.whatsappReminderTemplate, {
        tenant_name: r.tenantName,
        amount: r.weeklyRent - r.amountPaid,
        week_start: r.weekStart,
        week_end: r.weekEnd,
        due_date: r.dueDate,
        room_number: r.roomNumber,
        currency_symbol: symbol
      });
      openWhatsAppModal({
        tenantId: r.tenantId,
        tenantName: r.tenantName,
        phone: r.whatsappNumber || r.phone,
        type: 'Reminder',
        message: msg
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Week Switcher */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Weekly Rent Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Weekly payment status breakdown and action controls
          </p>
        </div>

        {/* Week Picker */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={prevWeek}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-3 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
            {formatWeekRangeDisplay(selectedWeek.weekStart, selectedWeek.weekEnd)}
          </div>

          <button
            onClick={nextWeek}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={resetToCurrentWeek}
            title="Reset to current week"
            className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-Calculated Summary Cards for Selected Week */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expected</span>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(totalExpected, symbol)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Received</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalReceived, symbol)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalOutstanding, symbol)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tenants Paid</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{paidCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tenants Unpaid</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{unpaidCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name or room..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-full sm:w-auto overflow-x-auto">
          {['All', 'Received', 'Pending', 'Overdue', 'Partially Paid'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Weekly Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading weekly records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No rent records found for this week.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tenant</th>
                    <th className="py-3.5 px-4">Room</th>
                    <th className="py-3.5 px-4 text-right">Weekly Rent</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filtered.map(rec => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {rec.tenantName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {rec.roomNumber}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(rec.weeklyRent, symbol)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {rec.rentDueDay} ({formatDate(rec.dueDate, 'short')})
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          rec.status === 'Received'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : rec.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : rec.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                        }`}>
                          {rec.status === 'Received' && '🟢 '}
                          {rec.status === 'Pending' && '🟠 '}
                          {rec.status === 'Overdue' && '🔴 '}
                          {rec.status === 'Partially Paid' && '🔵 '}
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {rec.paymentDate ? formatDate(rec.paymentDate, 'short') : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {rec.status !== 'Received' && (
                            <button
                              onClick={() => openRecordPaymentModal({ tenantId: rec.tenantId, amountDue: rec.weeklyRent, weekStart: rec.weekStart, weekEnd: rec.weekEnd })}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                            >
                              Record Payment
                            </button>
                          )}

                          <button
                            onClick={() => handleWhatsAppAction(rec)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map(rec => (
                <div key={rec.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {rec.tenantName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Room {rec.roomNumber} • Due {rec.rentDueDay} ({formatDate(rec.dueDate, 'short')})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(rec.weeklyRent, symbol)}
                      </p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                        rec.status === 'Received'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : rec.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : rec.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  </div>

                  {rec.paymentDate && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Paid on: {formatDate(rec.paymentDate, 'medium')}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {rec.status !== 'Received' && (
                      <button
                        onClick={() => openRecordPaymentModal({ tenantId: rec.tenantId, amountDue: rec.weeklyRent, weekStart: rec.weekStart, weekEnd: rec.weekEnd })}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold text-center shadow-sm active:scale-95 transition-all"
                      >
                        Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleWhatsAppAction(rec)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold text-center shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
