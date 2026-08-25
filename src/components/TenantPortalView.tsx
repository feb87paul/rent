import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { TenantPortalData, WeeklyRentRecord, Payment } from '../types';
import { fetchTenantPortalApi, updateUserPasswordApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Receipt,
  MessageSquare,
  LogOut,
  Key,
  Eye,
  EyeOff,
  X,
  Printer,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  Home
} from 'lucide-react';

export const TenantPortalView: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, addToast } = useApp();

  const [portalData, setPortalData] = useState<TenantPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'receipts'>('schedule');
  const [scheduleFilter, setScheduleFilter] = useState<'All' | 'Received' | 'Pending' | 'Overdue'>('All');

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // Selected Receipt for Printable Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    if (user?.tenantId || user?.id) {
      loadPortalData(user.tenantId || user.id);
    }
  }, [user]);

  const loadPortalData = async (tenantId: string) => {
    setLoading(true);
    try {
      const data = await fetchTenantPortalApi(tenantId);
      setPortalData(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load tenant portal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 3) {
      addToast('New password must be at least 3 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsUpdatingPass(true);
    try {
      await updateUserPasswordApi(user.id, {
        currentPassword,
        newPassword
      });
      addToast('Your login password has been updated!', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto animate-pulse">
            <Home className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading your tenant dashboard...</p>
        </div>
      </div>
    );
  }

  if (!portalData) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Portal Access Error</h2>
          <p className="text-xs text-slate-500">Could not retrieve tenant account records. Please contact your property manager.</p>
          <button
            onClick={logout}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const { tenant, stats, weeklySchedule, payments } = portalData;

  const filteredSchedule = weeklySchedule.filter(s => {
    if (scheduleFilter === 'All') return true;
    return s.status === scheduleFilter;
  });

  const whatsappPhone = settings.contactNumber || '15551234567';
  const whatsappUrl = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=Hi%20Landlord,%20this%20is%20${encodeURIComponent(tenant.name)}%20from%20${encodeURIComponent(tenant.roomNumber)}.`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-12 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {settings.propertyName || 'Tenant Portal'}
              </h1>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block -mt-0.5">
                Tenant Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Password</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Welcome & Room Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-lg border border-indigo-800/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Active Tenancy
                </span>
                <span className="text-xs text-indigo-300 font-medium">
                  Started {formatDate(tenant.startDate)}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {tenant.name}!
              </h2>
              <p className="text-xs text-indigo-200 max-w-lg">
                View your weekly rent breakdown, payment history, paid vs. pending weeks, and digital receipts.
              </p>
            </div>

            {/* Room Info Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[240px] flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs text-indigo-200 font-medium">Room / Property</span>
                <span className="text-sm font-bold text-white bg-indigo-600/80 px-2.5 py-0.5 rounded-lg">
                  {tenant.roomNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-200 font-medium">Weekly Rent Rate</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {formatCurrency(tenant.weeklyRent, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-indigo-300">
                <span>Rent Due Day</span>
                <span className="font-bold text-white">{tenant.rentDueDay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Weeks Paid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Weeks Paid</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {stats.paidWeeksCount} Weeks
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Paid:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.totalAmountPaid, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* 2. Weeks Pending / Overdue */}
          <div className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-l-4 ${
            stats.pendingWeeksCount + stats.overdueWeeksCount > 0 ? 'border-l-rose-500' : 'border-l-emerald-500'
          } flex flex-col justify-between`}>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Weeks Pending</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {stats.pendingWeeksCount + stats.overdueWeeksCount} Weeks
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Balance Pending:</span>
              <span className={`font-bold ${stats.totalAmountPending > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'}`}>
                {formatCurrency(stats.totalAmountPending, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* 3. Total Amount Paid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-l-4 border-l-indigo-500 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Rent Paid</span>
              <div className="mt-1">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(stats.totalAmountPaid, settings.currencySymbol)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>All-time total payments</span>
            </div>
          </div>

          {/* 4. Current Week Status */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-l-4 border-l-slate-400 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Week Status</span>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  stats.currentWeekStatus === 'Received'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : stats.currentWeekStatus === 'Overdue'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                }`}>
                  {stats.currentWeekStatus === 'Received' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {stats.currentWeekStatus === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                  {stats.currentWeekStatus === 'Overdue' && <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{stats.currentWeekStatus}</span>
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Due Day: <strong className="text-slate-700 dark:text-slate-300">{tenant.rentDueDay}</strong></span>
            </div>
          </div>
        </div>

        {/* Landlord Contact Action Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Need to submit a payment receipt or contact landlord?
              </h4>
              <p className="text-[11px] text-slate-500">
                Contact {settings.propertyName || 'Property Manager'} via WhatsApp or phone.
              </p>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'schedule'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Weekly Rent Schedule ({weeklySchedule.length} Weeks)
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'receipts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Payment Receipts ({payments.length})
            </button>
          </div>

          {activeTab === 'schedule' && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
              {(['All', 'Received', 'Pending', 'Overdue'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setScheduleFilter(filter)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                    scheduleFilter === filter
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: Weekly Rent Schedule Table */}
        {activeTab === 'schedule' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {filteredSchedule.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No rent records match the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Week Period</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4 text-right">Rent Due</th>
                      <th className="py-3.5 px-4 text-right">Amount Paid</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredSchedule.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {formatDate(s.weekStart)} – {formatDate(s.weekEnd)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {formatDate(s.dueDate)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(s.weeklyRent, settings.currencySymbol)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {s.amountPaid > 0 ? formatCurrency(s.amountPaid, settings.currencySymbol) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : s.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {s.status === 'Received' && '✓ Paid'}
                            {s.status === 'Pending' && '⏳ Pending'}
                            {s.status === 'Overdue' && '⚠️ Overdue'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {s.paymentDate ? formatDate(s.paymentDate) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Payment Receipts */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
                No payment receipts found yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">
                          Receipt #{p.id}
                        </span>
                        <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                          {formatCurrency(p.amountPaid, settings.currencySymbol)}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Paid for week {formatDate(p.weekStart)} – {formatDate(p.weekEnd)}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {p.paymentMethod}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Date: <strong>{formatDate(p.paymentDate)}</strong></span>
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl font-bold flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Change Login Password</span>
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isUpdatingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Payment Receipt #{selectedReceipt.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{settings.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReceipt.tenantName} ({selectedReceipt.roomNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rent Week:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatDate(selectedReceipt.weekStart)} – {formatDate(selectedReceipt.weekEnd)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatDate(selectedReceipt.paymentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReceipt.paymentMethod}</span>
              </div>
              {selectedReceipt.reference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedReceipt.reference}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 dark:border-slate-800 pt-2">
                <span className="text-slate-900 dark:text-slate-100">Amount Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedReceipt.amountPaid, settings.currencySymbol)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
