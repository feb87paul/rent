import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { deleteTenantApi, fetchTenantsApi, fetchWeeklyRentApi } from '../lib/api';
import { Tenant, WeeklyRentRecord } from '../types';
import { formatCurrency, formatDate, parseWhatsAppTemplate } from '../lib/utils';
import { TenantFormModal } from './TenantFormModal';
import { TenantDetailDrawer } from './TenantDetailDrawer';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  MessageSquare,
  Building2,
  Phone,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';

export const TenantsView: React.FC = () => {
  const {
    settings,
    selectedWeek,
    openRecordPaymentModal,
    openWhatsAppModal,
    addToast,
    refreshTrigger,
    triggerRefresh,
    selectedTenantForDetail,
    setSelectedTenantForDetail
  } = useApp();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [weeklyRecords, setWeeklyRecords] = useState<WeeklyRentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, weeklyData] = await Promise.all([
        fetchTenantsApi(),
        fetchWeeklyRentApi(selectedWeek.weekStart, selectedWeek.weekEnd)
      ]);
      setTenants(tenantsData || []);
      setWeeklyRecords(weeklyData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger, selectedWeek.weekStart]);

  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      t.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;
    try {
      await deleteTenantApi(tenantToDelete.id);
      addToast(`Tenant ${tenantToDelete.name} deleted`, 'info');
      triggerRefresh();
      setTenantToDelete(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete tenant', 'error');
    }
  };

  const handleOpenWhatsApp = (tenant: Tenant) => {
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
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header Bar & Add Tenant Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Tenant Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage occupants, room assignments, and weekly rates
          </p>
        </div>

        <button
          onClick={() => {
            setTenantToEdit(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Tenant</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tenant name, room number, phone, or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-full sm:w-auto">
          {(['All', 'Active', 'Inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-1 sm:flex-none ${
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

      {/* Tenants Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading tenant list...
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-semibold">No tenants found matching criteria.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Full Name</th>
                    <th className="py-3.5 px-4">Room</th>
                    <th className="py-3.5 px-4 text-right">Weekly Rent</th>
                    <th className="py-3.5 px-4">Rent Status</th>
                    <th className="py-3.5 px-4">Due Day</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredTenants.map(tenant => {
                    const currentWeekRecord = weeklyRecords.find(r => r.tenantId === tenant.id);
                    return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {tenant.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <button
                          onClick={() => setSelectedTenantForDetail(tenant)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left"
                        >
                          {tenant.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {tenant.roomNumber}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(tenant.weeklyRent, settings.currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4">
                        {currentWeekRecord ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            currentWeekRecord.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : currentWeekRecord.status === 'Partially Paid'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : currentWeekRecord.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {currentWeekRecord.status === 'Received' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {currentWeekRecord.status === 'Overdue' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {currentWeekRecord.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                            <span>{currentWeekRecord.status}</span>
                            {currentWeekRecord.amountPaid > 0 && (
                              <span className="opacity-80">({formatCurrency(currentWeekRecord.amountPaid, settings.currencySymbol)})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {tenant.rentDueDay}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {tenant.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          tenant.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedTenantForDetail(tenant)}
                            title="View Details"
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTenantToEdit(tenant);
                              setIsFormOpen(true);
                            }}
                            title="Edit Tenant"
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRecordPaymentModal({ tenantId: tenant.id, amountDue: currentWeekRecord?.weeklyRent || tenant.weeklyRent })}
                            title="Record Payment"
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenWhatsApp(tenant)}
                            title="WhatsApp"
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTenantToDelete(tenant)}
                            title="Delete Tenant"
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
              {filteredTenants.map(tenant => {
                const currentWeekRecord = weeklyRecords.find(r => r.tenantId === tenant.id);
                return (
                <div key={tenant.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shadow-sm">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <h4
                          onClick={() => setSelectedTenantForDetail(tenant)}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer"
                        >
                          {tenant.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Room {tenant.roomNumber} • Due {tenant.rentDueDay}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(tenant.weeklyRent, settings.currencySymbol)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {currentWeekRecord && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            currentWeekRecord.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : currentWeekRecord.status === 'Partially Paid'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : currentWeekRecord.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {currentWeekRecord.status}
                          </span>
                        )}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tenant.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{tenant.phone || 'No phone'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => setSelectedTenantForDetail(tenant)}
                      className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold text-center transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setTenantToEdit(tenant);
                        setIsFormOpen(true);
                      }}
                      className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold text-center transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openRecordPaymentModal({ tenantId: tenant.id, amountDue: currentWeekRecord?.weeklyRent || tenant.weeklyRent })}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold text-center transition-colors shadow-sm"
                    >
                      Pay
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(tenant)}
                      className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTenantToDelete(tenant)}
                      className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Tenant Add / Edit Form Modal */}
      <TenantFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTenantToEdit(null);
        }}
        tenantToEdit={tenantToEdit}
      />

      {/* Tenant Detail Drawer */}
      <TenantDetailDrawer
        tenant={selectedTenantForDetail}
        onClose={() => setSelectedTenantForDetail(null)}
        onEdit={(t) => {
          setTenantToEdit(t);
          setIsFormOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-200">{tenantToDelete.name}</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setTenantToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Delete Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
