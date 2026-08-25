import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchOutstandingApi } from '../lib/api';
import { WeeklyRentRecord } from '../types';
import { formatCurrency, formatDate, getDaysOverdue, parseWhatsAppTemplate } from '../lib/utils';
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Phone,
  Building2,
  DollarSign
} from 'lucide-react';

export const OutstandingRentView: React.FC = () => {
  const {
    selectedWeek,
    settings,
    openRecordPaymentModal,
    openWhatsAppModal,
    refreshTrigger
  } = useApp();

  const [outstandingList, setOutstandingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchOutstandingApi(selectedWeek.weekStart, selectedWeek.weekEnd);
      setOutstandingList(data || []);
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
  const totalOutstandingSum = outstandingList.reduce((acc, item) => acc + item.amountOutstanding, 0);

  const handleSendReminder = (item: any) => {
    const msg = parseWhatsAppTemplate(settings.whatsappReminderTemplate, {
      tenant_name: item.tenantName,
      amount: item.amountOutstanding,
      week_start: item.weekStart,
      week_end: item.weekEnd,
      due_date: item.dueDate,
      room_number: item.roomNumber,
      currency_symbol: symbol
    });

    openWhatsAppModal({
      tenantId: item.tenantId,
      tenantName: item.tenantName,
      phone: item.whatsappNumber || item.phone,
      type: 'Reminder',
      message: msg
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Overview Card */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 p-6 lg:p-8 rounded-3xl border border-rose-900/50 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue & Pending Collection</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Outstanding Rent Track
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Tenants with pending or overdue weekly rent balances
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-right">
          <span className="text-[10px] font-bold uppercase text-slate-300">Total Outstanding</span>
          <p className="text-2xl font-black text-rose-400 mt-0.5">
            {formatCurrency(totalOutstandingSum, symbol)}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading outstanding tenant balances...
          </div>
        ) : outstandingList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              All weekly rent has been collected!
            </p>
            <p className="text-slate-400">No overdue or pending tenants for this week.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tenant Name</th>
                    <th className="py-3.5 px-4">Room</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4 text-right">Rent Due</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Days Overdue</th>
                    <th className="py-3.5 px-4 text-right">Amount Outstanding</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {outstandingList.map((item) => {
                    const overdueDays = getDaysOverdue(item.dueDate);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {item.tenantName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {item.roomNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                          {item.phone || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.weeklyRent, symbol)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {item.rentDueDay} ({formatDate(item.dueDate, 'short')})
                        </td>
                        <td className="py-3.5 px-4">
                          {overdueDays > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              <Clock className="w-3 h-3" /> {overdueDays} day{overdueDays > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                              Due Soon
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                          {formatCurrency(item.amountOutstanding, symbol)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openRecordPaymentModal({ tenantId: item.tenantId, amountDue: item.amountOutstanding, weekStart: item.weekStart, weekEnd: item.weekEnd })}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                            >
                              Record Payment
                            </button>
                            <button
                              onClick={() => handleSendReminder(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>💬 Send Reminder</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {outstandingList.map((item) => {
                const overdueDays = getDaysOverdue(item.dueDate);
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {item.tenantName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Room {item.roomNumber} • Due {item.rentDueDay} ({formatDate(item.dueDate, 'short')})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-base text-rose-600 dark:text-rose-400">
                          {formatCurrency(item.amountOutstanding, symbol)}
                        </p>
                        {overdueDays > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 mt-0.5">
                            <Clock className="w-2.5 h-2.5" /> {overdueDays}d overdue
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px] block mt-0.5">
                            Due Soon
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => openRecordPaymentModal({ tenantId: item.tenantId, amountDue: item.amountOutstanding, weekStart: item.weekStart, weekEnd: item.weekEnd })}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold text-center shadow-sm active:scale-95 transition-all"
                      >
                        Record Payment
                      </button>
                      <button
                        onClick={() => handleSendReminder(item)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold text-center shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send Reminder</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
