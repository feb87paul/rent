import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchTenantsApi, recordPaymentApi } from '../lib/api';
import { Tenant } from '../types';
import { parseWhatsAppTemplate, formatWeekRangeDisplay, shiftWeek, getWeekRange, calculateFirstWeekRent, formatDate } from '../lib/utils';
import confetti from 'canvas-confetti';
import { CheckCircle2, DollarSign, Calendar, CreditCard, FileText, X, MessageSquare, History, Clock } from 'lucide-react';

export const RecordPaymentModal: React.FC = () => {
  const {
    recordPaymentModal,
    closeRecordPaymentModal,
    selectedWeek,
    settings,
    addToast,
    triggerRefresh,
    openWhatsAppModal
  } = useApp();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [amountDue, setAmountDue] = useState<number>(280);
  const [amountPaid, setAmountPaid] = useState<number>(280);
  const [paymentDate, setPaymentDate] = useState('2026-08-11');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Online' | 'Other'>('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target week selection state
  const [weekOffset, setWeekOffset] = useState<string>('0');
  const [targetWeekStart, setTargetWeekStart] = useState<string>('');
  const [targetWeekEnd, setTargetWeekEnd] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const data = await fetchTenantsApi();
        const activeOnly = data.filter(t => t.status === 'Active');
        setTenants(activeOnly);

        if (recordPaymentModal.tenantId) {
          const t = activeOnly.find(item => item.id === recordPaymentModal.tenantId);
          if (t) {
            setSelectedTenantId(t.id);
            setAmountDue(recordPaymentModal.amountDue || t.weeklyRent);
            setAmountPaid(recordPaymentModal.amountDue || t.weeklyRent);
            return;
          }
        }

        if (activeOnly.length > 0 && !selectedTenantId) {
          setSelectedTenantId(activeOnly[0].id);
          setAmountDue(activeOnly[0].weeklyRent);
          setAmountPaid(activeOnly[0].weeklyRent);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (recordPaymentModal.isOpen) {
      loadTenants();
      const initialStart = recordPaymentModal.weekStart || selectedWeek.weekStart;
      const initialEnd = recordPaymentModal.weekEnd || selectedWeek.weekEnd;
      setTargetWeekStart(initialStart);
      setTargetWeekEnd(initialEnd);
      setWeekOffset('0');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [recordPaymentModal.isOpen, recordPaymentModal.tenantId, recordPaymentModal.weekStart]);

  const handleWeekOffsetChange = (val: string) => {
    setWeekOffset(val);
    const baseWeekStart = recordPaymentModal.weekStart || selectedWeek.weekStart;
    
    if (val === 'custom') {
      if (customDate) {
        const range = getWeekRange(customDate);
        setTargetWeekStart(range.weekStart);
        setTargetWeekEnd(range.weekEnd);
      }
    } else {
      const offset = parseInt(val, 10);
      const range = shiftWeek(baseWeekStart, offset);
      setTargetWeekStart(range.weekStart);
      setTargetWeekEnd(range.weekEnd);
    }
  };

  const handleCustomDateChange = (dateVal: string) => {
    setCustomDate(dateVal);
    if (dateVal) {
      const range = getWeekRange(dateVal);
      setTargetWeekStart(range.weekStart);
      setTargetWeekEnd(range.weekEnd);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      const firstW = calculateFirstWeekRent(
        tenant.startDate,
        targetWeekStart,
        targetWeekEnd,
        tenant.weeklyRent
      );
      if (firstW.isFirstWeek && firstW.activeDays < 7) {
        setAmountDue(firstW.calculatedRent);
        setAmountPaid(firstW.calculatedRent);
      } else {
        setAmountDue(tenant.weeklyRent);
        setAmountPaid(tenant.weeklyRent);
      }
    }
  };

  const currentTenant = tenants.find(t => t.id === selectedTenantId);

  const firstWeekCalc = calculateFirstWeekRent(
    currentTenant?.startDate,
    targetWeekStart,
    targetWeekEnd,
    currentTenant?.weeklyRent || 0
  );

  // Auto adjust amount when week or tenant changes if it's the 1st week prorated
  useEffect(() => {
    if (recordPaymentModal.isOpen && currentTenant) {
      if (firstWeekCalc.isFirstWeek && firstWeekCalc.activeDays < 7) {
        setAmountDue(firstWeekCalc.calculatedRent);
        setAmountPaid(firstWeekCalc.calculatedRent);
      } else {
        // If not custom prorated, default to tenant weekly rent
        setAmountDue(currentTenant.weeklyRent);
        setAmountPaid(currentTenant.weeklyRent);
      }
    }
  }, [recordPaymentModal.isOpen, selectedTenantId, targetWeekStart, targetWeekEnd]);

  if (!recordPaymentModal.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      addToast('Please select a tenant', 'error');
      return;
    }

    const tenant = tenants.find(t => t.id === selectedTenantId);
    if (!tenant) return;

    setIsSubmitting(true);

    try {
      const weekStart = targetWeekStart || recordPaymentModal.weekStart || selectedWeek.weekStart;
      const weekEnd = targetWeekEnd || recordPaymentModal.weekEnd || selectedWeek.weekEnd;

      const result = await recordPaymentApi({
        tenantId: selectedTenantId,
        weekStart,
        weekEnd,
        amountDue,
        amountPaid,
        paymentDate,
        paymentMethod,
        reference,
        notes
      });

      // Fire confetti effect
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // Fallback
      }

      addToast(`Payment recorded successfully for ${tenant.name} ✅`, 'success');
      triggerRefresh();
      closeRecordPaymentModal();

      // Automatically generate WhatsApp template
      const formattedMessage = parseWhatsAppTemplate(settings.whatsappReceivedTemplate, {
        tenant_name: tenant.name,
        amount: amountPaid,
        week_start: weekStart,
        week_end: weekEnd,
        payment_date: paymentDate,
        room_number: tenant.roomNumber,
        currency_symbol: settings.currencySymbol
      });

      // Prompt WhatsApp confirmation modal
      openWhatsAppModal({
        tenantId: tenant.id,
        tenantName: tenant.name,
        phone: tenant.whatsappNumber || tenant.phone,
        type: 'Receipt',
        message: formattedMessage,
        paymentId: result.payment?.id
      });
    } catch (err: any) {
      addToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Base range for preset options generator
  const baseStart = recordPaymentModal.weekStart || selectedWeek.weekStart;

  const weekOptions = [
    { offset: '0', label: 'Current Week (Sun–Sat)' },
    { offset: '-1', label: 'Last Week (1 Week Ago)' },
    { offset: '-2', label: '2 Weeks Ago' },
    { offset: '-3', label: '3 Weeks Ago' },
    { offset: '-4', label: '4 Weeks Ago' },
    { offset: '-5', label: '5 Weeks Ago' },
    { offset: '-6', label: '6 Weeks Ago' },
    { offset: '-7', label: '7 Weeks Ago' },
    { offset: '-8', label: '8 Weeks Ago' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeRecordPaymentModal}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Record Rent Payment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Record current or past week rent for tenants
            </p>
          </div>
        </div>

        {/* Selected Rent Week Preview Card */}
        <div className="mb-5 bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Target Rent Period
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {formatWeekRangeDisplay(targetWeekStart, targetWeekEnd)}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
            weekOffset === '0'
              ? 'bg-indigo-600 text-white'
              : 'bg-amber-500 text-white'
          }`}>
            {weekOffset === '0' ? 'Current Week' : `Past Week (${weekOffset})`}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Rent Period Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Select Rent Week *</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Current & Past Weeks
              </span>
            </label>
            <select
              value={weekOffset}
              onChange={(e) => handleWeekOffsetChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
            >
              {weekOptions.map(opt => {
                const range = shiftWeek(baseStart, parseInt(opt.offset, 10));
                return (
                  <option key={opt.offset} value={opt.offset}>
                    {opt.label} ({formatWeekRangeDisplay(range.weekStart, range.weekEnd)})
                  </option>
                );
              })}
              <option value="custom">📅 Custom Date in Past Week...</option>
            </select>
          </div>

          {/* Custom Date Selector if Custom Week chosen */}
          {weekOffset === 'custom' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                Pick Any Date within the Target Week:
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => handleCustomDateChange(e.target.value)}
                required={weekOffset === 'custom'}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {/* Tenant Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Select Tenant *</span>
              {currentTenant && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Moved in: {formatDate(currentTenant.startDate, 'medium')}
                </span>
              )}
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.roomNumber}) — {settings.currencySymbol}{t.weeklyRent}/wk
                </option>
              ))}
            </select>
          </div>

          {/* 1st Week Prorated Rent Banner */}
          {firstWeekCalc.isFirstWeek && (
            <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      1st Week Prorated Rent Notice
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold">
                      {firstWeekCalc.activeDays} / 7 Days Active
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200 mt-0.5 leading-relaxed">
                    Tenant start date is <strong>{formatDate(currentTenant?.startDate, 'medium')}</strong>. Living <strong>{firstWeekCalc.activeDays} of 7 days</strong> in 1st week @ {settings.currencySymbol}{firstWeekCalc.dailyRate}/day.
                  </p>
                </div>
              </div>

              {firstWeekCalc.activeDays < 7 && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-amber-900 dark:text-amber-200">
                    Prorated Amount: <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">{settings.currencySymbol}{firstWeekCalc.calculatedRent}</strong>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 ml-1">(Full: {settings.currencySymbol}{currentTenant?.weeklyRent})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAmountDue(firstWeekCalc.calculatedRent);
                        setAmountPaid(firstWeekCalc.calculatedRent);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                    >
                      Apply Prorated ({settings.currencySymbol}{firstWeekCalc.calculatedRent})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentTenant) {
                          setAmountDue(currentTenant.weeklyRent);
                          setAmountPaid(currentTenant.weeklyRent);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      Full ({settings.currencySymbol}{currentTenant?.weeklyRent})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount Due & Received Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount Due ({settings.currencySymbol})
              </label>
              <input
                type="number"
                value={amountDue}
                onChange={(e) => setAmountDue(Number(e.target.value))}
                min={0}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount Received ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                min={0}
                required
                className="w-full px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Payment Date & Method Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reference / Transaction No. (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TRX-99214 or Cash Receipt #12"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes / Comments (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Paid back-rent for previous week..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeRecordPaymentModal}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

