import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchPaymentHistoryApi } from '../lib/api';
import { Payment, Tenant } from '../types';
import { formatCurrency, formatDate, formatWeekRangeDisplay, parseWhatsAppTemplate } from '../lib/utils';
import {
  User,
  Home,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  PlusCircle,
  Edit,
  X,
  History,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface TenantDetailDrawerProps {
  tenant: Tenant | null;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
}

export const TenantDetailDrawer: React.FC<TenantDetailDrawerProps> = ({
  tenant,
  onClose,
  onEdit
}) => {
  const {
    settings,
    openRecordPaymentModal,
    openWhatsAppModal,
    refreshTrigger
  } = useApp();

  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);

  useEffect(() => {
    if (tenant) {
      fetchPaymentHistoryApi({ tenantId: tenant.id })
        .then(data => setPaymentHistory(data || []))
        .catch(err => console.error(err));
    }
  }, [tenant, refreshTrigger]);

  if (!tenant) return null;

  const totalPaidAllTime = paymentHistory.reduce((acc, p) => acc + p.amountPaid, 0);

  const handleSendReminder = () => {
    const msg = parseWhatsAppTemplate(settings.whatsappReminderTemplate, {
      tenant_name: tenant.name,
      amount: tenant.weeklyRent,
      room_number: tenant.roomNumber,
      currency_symbol: settings.currencySymbol
    });

    openWhatsAppModal({
      tenantId: tenant.id,
      tenantName: tenant.name,
      phone: tenant.whatsappNumber || tenant.phone,
      type: 'Reminder',
      message: msg
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-600/20">
              {tenant.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{tenant.name}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  tenant.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {tenant.status}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {tenant.id} • {tenant.roomNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Action Button Bar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onClose();
                openRecordPaymentModal({ tenantId: tenant.id, amountDue: tenant.weeklyRent });
              }}
              className="flex flex-col items-center justify-center p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5 mb-1" />
              <span>Record Rent</span>
            </button>

            <button
              onClick={handleSendReminder}
              className="flex flex-col items-center justify-center p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <MessageSquare className="w-5 h-5 mb-1" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(tenant);
              }}
              className="flex flex-col items-center justify-center p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition-all"
            >
              <Edit className="w-5 h-5 mb-1 text-slate-500" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Tenant Details Card */}
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tenant Overview
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Weekly Rent</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {formatCurrency(tenant.weeklyRent, settings.currencySymbol)}/wk
                </p>
              </div>
              <div>
                <span className="text-slate-400">Due Day</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {tenant.rentDueDay}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Phone</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {tenant.phone || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Tenancy Start</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(tenant.startDate, 'medium')}
                </p>
              </div>
            </div>

            {tenant.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">Notes:</span>
                <p className="text-slate-600 dark:text-slate-300 italic mt-0.5">{tenant.notes}</p>
              </div>
            )}
          </div>

          {/* Payment History List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500" />
                <span>Payment History ({paymentHistory.length})</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Total Paid: {formatCurrency(totalPaidAllTime, settings.currencySymbol)}
              </span>
            </div>

            <div className="space-y-2.5">
              {paymentHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  No payment records found for this tenant.
                </p>
              ) : (
                paymentHistory.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(p.amountPaid, settings.currencySymbol)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Received'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : p.status === 'Partially Paid'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                        Rent Week: {formatWeekRangeDisplay(p.weekStart, p.weekEnd)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.paymentMethod} • Paid on {formatDate(p.paymentDate, 'medium')}
                      </p>
                      {p.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          Note: {p.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-mono">{p.id}</p>
                      {p.reference && (
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">
                          {p.reference}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
