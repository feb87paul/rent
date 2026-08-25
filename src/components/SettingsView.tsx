import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DayOfWeek } from '../types';
import { Settings, Building2, DollarSign, MessageSquare, Save, Tag, Users, ShieldCheck, UserCheck, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { TenantAccountsManagement } from './TenantAccountsManagement';
import { applyAllTenantsDueDayApi } from '../lib/api';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, addToast, triggerRefresh } = useApp();

  const [activeTab, setActiveTab] = useState<'property' | 'adminUsers' | 'tenantUsers'>('property');

  const [propertyName, setPropertyName] = useState(settings.propertyName);
  const [propertyAddress, setPropertyAddress] = useState(settings.propertyAddress);
  const [contactNumber, setContactNumber] = useState(settings.contactNumber);
  const [email, setEmail] = useState(settings.email);
  const [defaultRent, setDefaultRent] = useState(settings.defaultRent);
  const [defaultRentDueDay, setDefaultRentDueDay] = useState<DayOfWeek>(settings.defaultRentDueDay || 'Sunday');
  const [applyToAllTenants, setApplyToAllTenants] = useState(true);
  const [currency, setCurrency] = useState(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '$');
  const [whatsappReceivedTemplate, setWhatsappReceivedTemplate] = useState(settings.whatsappReceivedTemplate);
  const [whatsappReminderTemplate, setWhatsappReminderTemplate] = useState(settings.whatsappReminderTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  useEffect(() => {
    setPropertyName(settings.propertyName);
    setPropertyAddress(settings.propertyAddress);
    setContactNumber(settings.contactNumber);
    setEmail(settings.email);
    setDefaultRent(settings.defaultRent);
    setDefaultRentDueDay(settings.defaultRentDueDay || 'Sunday');
    setCurrency(settings.currency);
    setCurrencySymbol(settings.currencySymbol || '$');
    setWhatsappReceivedTemplate(settings.whatsappReceivedTemplate);
    setWhatsappReminderTemplate(settings.whatsappReminderTemplate);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        propertyName,
        propertyAddress,
        contactNumber,
        email,
        defaultRent: Number(defaultRent),
        defaultRentDueDay,
        applyToAllTenants,
        currency,
        currencySymbol,
        whatsappReceivedTemplate,
        whatsappReminderTemplate
      });
      addToast({
        title: 'Settings Saved',
        message: applyToAllTenants
          ? `Property settings updated & all active tenants updated to ${defaultRentDueDay} advance rent.`
          : 'Property settings have been updated successfully.',
        type: 'success'
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({
        title: 'Save Failed',
        message: err.message || 'Could not update settings',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkApplySunday = async () => {
    setIsApplyingBulk(true);
    try {
      const res = await applyAllTenantsDueDayApi('Sunday');
      addToast({
        title: 'Advance Rent Applied',
        message: res.message || 'All active tenants updated to Sunday advance rent due day.',
        type: 'success'
      });
      setDefaultRentDueDay('Sunday');
      triggerRefresh();
    } catch (err: any) {
      addToast({
        title: 'Failed to update',
        message: err.message || 'Could not apply bulk due day update',
        type: 'error'
      });
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const placeholders = [
    '{tenant_name}',
    '{amount}',
    '{week_start}',
    '{week_end}',
    '{payment_date}',
    '{room_number}',
    '{due_date}'
  ];

  const insertPlaceholderToReceived = (ph: string) => {
    setWhatsappReceivedTemplate(prev => prev + ' ' + ph);
  };

  const insertPlaceholderToReminder = (ph: string) => {
    setWhatsappReminderTemplate(prev => prev + ' ' + ph);
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      {/* Settings Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Admin Settings & Account Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure property defaults, WhatsApp templates, admin user accounts, and tenant portal logins
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl self-stretch sm:self-auto text-xs">
          <button
            onClick={() => setActiveTab('property')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'property'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Property & Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('tenantUsers')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'tenantUsers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tenant Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('adminUsers')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'adminUsers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admin Users</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Property Settings */}
      {activeTab === 'property' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Property Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Property Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Property Name
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Property Address
                </label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Rent Defaults */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Rent Defaults & Advance Collection</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sunday Advance Rent Active</span>
              </span>
            </div>

            {/* Advance Rent Info Notice */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-start gap-3">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-semibold">Advance Rent Schedule: Sunday to Saturday</p>
                <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  Rent is payable <strong>in advance on Sunday</strong> at the start of each weekly rental period. When recording payments or generating weekly summaries, the rental cycle runs strictly from Sunday to Saturday.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Weekly Rent Amount
                </label>
                <input
                  type="number"
                  value={defaultRent}
                  onChange={(e) => setDefaultRent(Number(e.target.value))}
                  min={0}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Rent Due Day
                </label>
                <select
                  value={defaultRentDueDay}
                  onChange={(e) => setDefaultRentDueDay(e.target.value as DayOfWeek)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="Sunday">Sunday (In Advance - Start of Week)</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="$ or € or £"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={applyToAllTenants}
                  onChange={(e) => setApplyToAllTenants(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span>Automatically sync all active tenants to this due day when saving</span>
              </label>

              <button
                type="button"
                onClick={handleBulkApplySunday}
                disabled={isApplyingBulk}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isApplyingBulk ? (
                  <span>Syncing...</span>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Set All Active Tenants to Sunday (Advance)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: WhatsApp Templates */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp Message Templates</span>
            </h3>

            {/* Rent Received Template */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rent Received / Confirmation Message Template
              </label>

              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Insert Tag:</span>
                {placeholders.map(ph => (
                  <button
                    type="button"
                    key={ph}
                    onClick={() => insertPlaceholderToReceived(ph)}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-mono font-bold transition-colors"
                  >
                    {ph}
                  </button>
                ))}
              </div>

              <textarea
                value={whatsappReceivedTemplate}
                onChange={(e) => setWhatsappReceivedTemplate(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 resize-none font-sans"
              />
            </div>

            {/* Rent Reminder Template */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rent Outstanding / Reminder Message Template
              </label>

              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Insert Tag:</span>
                {placeholders.map(ph => (
                  <button
                    type="button"
                    key={ph}
                    onClick={() => insertPlaceholderToReminder(ph)}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-mono font-bold transition-colors"
                  >
                    {ph}
                  </button>
                ))}
              </div>

              <textarea
                value={whatsappReminderTemplate}
                onChange={(e) => setWhatsappReminderTemplate(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 resize-none font-sans"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Tenant User Accounts Management */}
      {activeTab === 'tenantUsers' && (
        <TenantAccountsManagement />
      )}

      {/* Tab 3: Admin Accounts Management */}
      {activeTab === 'adminUsers' && (
        <UserManagement />
      )}
    </div>
  );
};
