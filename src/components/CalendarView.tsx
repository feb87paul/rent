import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchCalendarApi } from '../lib/api';
import { Payment, WeeklyRentRecord } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { settings, openRecordPaymentModal, refreshTrigger, setSelectedTenantForDetail } = useApp();

  const [records, setRecords] = useState<WeeklyRentRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation (defaults dynamically to current month)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCalendarApi();
      setRecords(data.weeklyRecords || []);
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells (offset + 1..daysInMonth) where week starts on Sunday (0)
  const gridCells = [];
  const startOffset = firstDayOfMonth; // 0 is Sun, 1 is Mon, etc.

  for (let i = 0; i < startOffset; i++) {
    gridCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    gridCells.push(day);
  }

  const symbol = settings.currencySymbol || '$';

  const getEntriesForDay = (day: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateFormatted = `${year}-${monthStr}-${dayStr}`;

    const dueEntries = records.filter(r => r.dueDate === dateFormatted);
    const paidEntries = payments.filter(p => p.paymentDate === dateFormatted);

    return { dueEntries, paidEntries };
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Rent Due & Payment Calendar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Color-coded rent schedules and payment logs
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 px-3">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
        <span className="text-slate-400 font-bold uppercase text-[10px]">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Received (Paid)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Pending Due</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span>Overdue</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 overflow-x-auto">
        {/* Day Headers (Sunday to Saturday) */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2 min-w-[600px]">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 min-w-[600px]">
          {gridCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-28 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl" />;
            }

            const { dueEntries } = getEntriesForDay(day);

            return (
              <div
                key={`day-${day}`}
                className="h-28 p-2 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex flex-col overflow-y-auto"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {day}
                </span>

                <div className="space-y-1 flex-1">
                  {dueEntries.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => {
                        if (rec.status !== 'Received') {
                          openRecordPaymentModal({ tenantId: rec.tenantId, amountDue: rec.weeklyRent });
                        }
                      }}
                      className={`p-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-transform hover:scale-[1.02] shadow-sm ${
                        rec.status === 'Received'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : rec.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}
                    >
                      <div className="truncate font-bold">{rec.tenantName}</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span>{rec.roomNumber}</span>
                        <span>{symbol}{rec.weeklyRent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
