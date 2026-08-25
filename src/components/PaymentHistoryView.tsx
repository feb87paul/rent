import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  fetchPaymentHistoryApi,
  fetchTenantsApi,
  deletePaymentApi,
  updatePaymentApi,
  bulkDeletePaymentsApi
} from '../lib/api';
import { Payment, Tenant, PaymentMethod } from '../types';
import { formatCurrency, formatDate, parseWhatsAppTemplate } from '../lib/utils';
import {
  History,
  Search,
  MessageSquare,
  CheckCircle,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Save,
  DollarSign,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';

export const PaymentHistoryView: React.FC = () => {
  const { settings, openWhatsAppModal, refreshTrigger, addToast, triggerRefresh } = useApp();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  // Selection state for error correction / bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals for correction/editing
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editAmountPaid, setEditAmountPaid] = useState<number>(0);
  const [editPaymentDate, setEditPaymentDate] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('Cash');
  const [editReference, setEditReference] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, tData] = await Promise.all([
        fetchPaymentHistoryApi(),
        fetchTenantsApi()
      ]);
      setPayments(pData || []);
      setTenants(tData || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load payment history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const filtered = payments.filter(p => {
    const matchesSearch =
      p.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      p.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(search.toLowerCase())) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    const matchesTenant = tenantFilter === 'All' || p.tenantId === tenantFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesTenant && matchesStatus && matchesMethod;
  });

  const symbol = settings.currencySymbol || '$';

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Payment) => {
    setEditingPayment(p);
    setEditAmountPaid(p.amountPaid);
    setEditPaymentDate(p.paymentDate);
    setEditPaymentMethod(p.paymentMethod);
    setEditReference(p.reference || '');
    setEditNotes(p.notes || '');
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      setIsSubmitting(true);
      await updatePaymentApi(editingPayment.id, {
        amountPaid: editAmountPaid,
        paymentDate: editPaymentDate,
        paymentMethod: editPaymentMethod,
        reference: editReference,
        notes: editNotes
      });

      addToast(`Payment ${editingPayment.id} updated successfully!`, 'success');
      setEditingPayment(null);
      triggerRefresh();
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Single Delete
  const handleConfirmSingleDelete = async () => {
    if (!deletingPayment) return;

    try {
      setIsSubmitting(true);
      await deletePaymentApi(deletingPayment.id);
      addToast(`Payment ${deletingPayment.id} deleted. Weekly record status reverted.`, 'success');
      setDeletingPayment(null);
      setSelectedIds(selectedIds.filter(id => id !== deletingPayment.id));
      triggerRefresh();
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await bulkDeletePaymentsApi(selectedIds);
      addToast(`${res.count} payment record(s) deleted and rent status recalculated.`, 'success');
      setIsBulkDeleting(false);
      setSelectedIds([]);
      triggerRefresh();
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to bulk delete payments', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendReceipt = (p: Payment) => {
    const tenant = tenants.find(t => t.id === p.tenantId);
    const phone = tenant ? tenant.whatsappNumber || tenant.phone : '';

    const msg = parseWhatsAppTemplate(settings.whatsappReceivedTemplate, {
      tenant_name: p.tenantName,
      amount: p.amountPaid,
      week_start: p.weekStart,
      week_end: p.weekEnd,
      payment_date: p.paymentDate,
      room_number: p.roomNumber,
      currency_symbol: symbol
    });

    openWhatsAppModal({
      tenantId: p.tenantId,
      tenantName: p.tenantName,
      phone,
      type: 'Receipt',
      message: msg,
      paymentId: p.id
    });
  };

  const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Payment History & Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select, edit, or delete any payment history record if an error occurred during entry
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
              {selectedIds.length} Selected
            </span>
            <button
              onClick={() => setIsBulkDeleting(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar Grid */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payment ID, tenant name, room number, or reference..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Tenant Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter Tenant
            </label>
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="All">All Tenants</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} (Room {t.roomNumber})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Partially Paid">Partially Paid</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Payment Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="All">All Methods</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading payment history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No matching payment history records found.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">
                      <button
                        onClick={handleToggleSelectAll}
                        title={isAllSelected ? "Deselect All" : "Select All"}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Payment ID</th>
                    <th className="py-3.5 px-4">Tenant</th>
                    <th className="py-3.5 px-4">Room</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Receipt</th>
                    <th className="py-3.5 px-4 text-center">Actions (Correct Error)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filtered.map(p => {
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleSelectOne(p.id)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {p.id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {p.tenantName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {p.roomNumber}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.amountPaid, symbol)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                          {formatDate(p.paymentDate, 'medium')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {p.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {p.reference || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleResendReceipt(p)}
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Edit / Correct Payment Details"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setDeletingPayment(p)}
                              title="Delete Payment (Revert Week Status)"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>Delete</span>
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
              {filtered.map(p => {
                const isSelected = selectedIds.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleSelectOne(p.id)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {p.tenantName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Room {p.roomNumber} • {p.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(p.amountPaid, symbol)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {p.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>Date: {formatDate(p.paymentDate, 'medium')}</span>
                      {p.reference && <span>Ref: {p.reference}</span>}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleResendReceipt(p)}
                        className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingPayment(p)}
                        className="py-2 px-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal: Edit Payment Details */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingPayment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                <Pencil className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Correct Payment Record
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {editingPayment.tenantName} (Room {editingPayment.roomNumber}) • {editingPayment.id}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Paid ({symbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={editPaymentDate}
                  onChange={(e) => setEditPaymentDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online">Online</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference ID / Txn Number
                </label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="e.g. TXN-98421"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correction Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Reason for correcting payment history entry..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Single Delete Confirmation */}
      {deletingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDeletingPayment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Payment Entry?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {deletingPayment.tenantName} • {deletingPayment.id}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-800/60 mb-5 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-bold">⚠️ Warning: Payment Correction Action</p>
              <p>
                Deleting payment of <strong>{symbol}{deletingPayment.amountPaid}</strong> will recalculate and revert the rent record for week <strong>{deletingPayment.weekStart} to {deletingPayment.weekEnd}</strong> back to unpaid or partial balance.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingPayment(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Deleting...' : 'Delete & Revert Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsBulkDeleting(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete {selectedIds.length} Selected Payment(s)?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Bulk Payment Error Correction
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to permanently remove these <strong>{selectedIds.length}</strong> payment history entry/entries? Corresponding weekly tenant rent status will be automatically recalculated.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsBulkDeleting(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Deleting...' : `Delete ${selectedIds.length} Entries`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
