import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TenantUserAccount } from '../types';
import {
  fetchTenantUsersApi,
  updateTenantCredentialsApi,
  revokeTenantAccessApi,
  restoreTenantAccessApi
} from '../lib/api';
import {
  UserCheck,
  UserX,
  Key,
  ShieldAlert,
  ShieldCheck,
  Search,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Home,
  Phone,
  RefreshCw,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const TenantAccountsManagement: React.FC = () => {
  const { addToast } = useApp();

  const [tenantAccounts, setTenantAccounts] = useState<TenantUserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive' | 'Revoked'>('All');

  // Modal state for editing password/credentials
  const [editingTarget, setEditingTarget] = useState<TenantUserAccount | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modal state for revoking access confirmation
  const [revokingAccount, setRevokingAccount] = useState<TenantUserAccount | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await fetchTenantUsersApi();
      setTenantAccounts(data);
    } catch (err: any) {
      addToast('Failed to load tenant user accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (account: TenantUserAccount) => {
    setEditingTarget(account);
    setNewUsername(account.username || account.phone || '');
    setNewPassword(account.password || '');
    setConfirmPassword(account.password || '');
    setModalError('');
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    if (!newUsername.trim()) {
      setModalError('Username is required');
      return;
    }
    if (newPassword.length < 3) {
      setModalError('Password must be at least 3 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTenantCredentialsApi(editingTarget.id, {
        username: newUsername.trim(),
        password: newPassword.trim()
      });
      addToast(`Updated credentials for ${editingTarget.name}!`, 'success');
      setEditingTarget(null);
      loadAccounts();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevokeAccess = async () => {
    if (!revokingAccount) return;

    setIsRevoking(true);
    try {
      await revokeTenantAccessApi(revokingAccount.id);
      addToast(`Portal access revoked for ${revokingAccount.name}`, 'info');
      setRevokingAccount(null);
      loadAccounts();
    } catch (err: any) {
      addToast(err.message || 'Failed to revoke access', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRestoreAccess = async (account: TenantUserAccount) => {
    try {
      await restoreTenantAccessApi(account.id);
      addToast(`Portal access restored for ${account.name}`, 'success');
      loadAccounts();
    } catch (err: any) {
      addToast(err.message || 'Failed to restore access', 'error');
    }
  };

  const filteredAccounts = tenantAccounts.filter(acc => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.username && acc.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      acc.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterStatus === 'Active') return acc.status === 'Active';
    if (filterStatus === 'Inactive') return acc.status === 'Inactive';
    if (filterStatus === 'Revoked') return acc.accessRevoked === true;

    return true;
  });

  const totalTenants = tenantAccounts.length;
  const activeTenants = tenantAccounts.filter(a => a.status === 'Active').length;
  const revokedTenants = tenantAccounts.filter(a => a.accessRevoked).length;
  const configuredAccounts = tenantAccounts.filter(a => a.username && a.password && !a.accessRevoked).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 4 Summary Stats Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Tenants</span>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalTenants}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Active Tenants</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeTenants}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Portal Enabled</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{configuredAccounts}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Access Revoked</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{revokedTenants}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tenant User Accounts Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Tenant User Accounts & Portal Access</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              View tenant login accounts, set custom passwords, or revoke access for inactive tenants
            </p>
          </div>

          <button
            onClick={loadAccounts}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenant, room, or username..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto text-xs">
            {(['All', 'Active', 'Inactive', 'Revoked'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 md:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {status === 'All' && 'All Tenants'}
                {status === 'Active' && 'Active Tenants'}
                {status === 'Inactive' && 'Inactive Tenants'}
                {status === 'Revoked' && 'Revoked Access'}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Tenant & Room</th>
                <th className="py-3 px-4">Tenancy Status</th>
                <th className="py-3 px-4">Portal Username</th>
                <th className="py-3 px-4 text-center">Portal Access State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading tenant accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No tenant user accounts match the current filter.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const isRevoked = account.accessRevoked;
                  const isInactive = account.status === 'Inactive';

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Tenant Name & Room */}
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-bold">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                            isRevoked
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isInactive
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{account.name}</p>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-normal">
                              <Home className="w-3 h-3 text-slate-400" />
                              <span>Room {account.roomNumber}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tenancy Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          account.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {account.status === 'Active' ? 'Active Tenant' : 'Inactive / Moved Out'}
                        </span>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {account.username ? (
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">
                            {account.username}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not configured</span>
                        )}
                      </td>

                      {/* Portal Access State */}
                      <td className="py-3.5 px-4 text-center">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Access Revoked</span>
                          </span>
                        ) : account.username && account.password ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Portal Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Pending Setup</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(account)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                            title="Update Password / Login Credentials"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Update Password</span>
                          </button>

                          {isRevoked ? (
                            <button
                              onClick={() => handleRestoreAccess(account)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                              title="Restore Portal Access"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Restore Access</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setRevokingAccount(account)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                              title="Revoke Portal Access"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Revoke Access</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {loading ? (
            <p className="p-6 text-center text-slate-400 text-xs">Loading tenant accounts...</p>
          ) : filteredAccounts.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-xs">No tenant user accounts match the current filter.</p>
          ) : (
            filteredAccounts.map((account) => {
              const isRevoked = account.accessRevoked;
              const isInactive = account.status === 'Inactive';

              return (
                <div key={account.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        isRevoked
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : isInactive
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{account.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Room {account.roomNumber}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      account.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {account.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Username:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {account.username || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Access:</span>
                      {isRevoked ? (
                        <span className="text-rose-600 font-bold">Access Revoked</span>
                      ) : account.username && account.password ? (
                        <span className="text-emerald-600 font-bold">Portal Active</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Pending Setup</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenEditModal(account)}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Password</span>
                    </button>

                    {isRevoked ? (
                      <button
                        onClick={() => handleRestoreAccess(account)}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setRevokingAccount(account)}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Update Password & Credentials for Tenant */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Update Tenant Login Credentials</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTarget.name} (Room {editingTarget.roomNumber})
                </p>
              </div>
              <button
                onClick={() => setEditingTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenant Portal Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. john_smith or phone"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Tenant Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Tenant Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Revoke Access */}
      {revokingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Revoke Portal Access?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tenant will no longer be able to log in
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
              Are you sure you want to revoke tenant portal login access for{' '}
              <strong className="text-slate-900 dark:text-slate-100">{revokingAccount.name}</strong> ({revokingAccount.roomNumber})?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setRevokingAccount(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={handleConfirmRevokeAccess}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRevoking ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
