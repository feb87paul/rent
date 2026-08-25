import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { createTenantApi, updateTenantApi } from '../lib/api';
import { DayOfWeek, Tenant, TenantStatus } from '../types';
import { UserPlus, UserCheck, X, Key, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantToEdit?: Tenant | null;
}

export const TenantFormModal: React.FC<TenantFormModalProps> = ({
  isOpen,
  onClose,
  tenantToEdit
}) => {
  const { settings, addToast, triggerRefresh } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [weeklyRent, setWeeklyRent] = useState<number>(settings.defaultRent || 280);
  const [rentDueDay, setRentDueDay] = useState<DayOfWeek>(settings.defaultRentDueDay || 'Sunday');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TenantStatus>('Active');
  const [tenantUsername, setTenantUsername] = useState('');
  const [tenantPassword, setTenantPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tenantToEdit) {
      setName(tenantToEdit.name);
      setPhone(tenantToEdit.phone);
      setWhatsappNumber(tenantToEdit.whatsappNumber || tenantToEdit.phone);
      setRoomNumber(tenantToEdit.roomNumber);
      setWeeklyRent(tenantToEdit.weeklyRent);
      setRentDueDay(tenantToEdit.rentDueDay || 'Sunday');
      setStartDate(tenantToEdit.startDate);
      setStatus(tenantToEdit.status);
      setTenantUsername(tenantToEdit.username || '');
      setTenantPassword(tenantToEdit.password || '');
      setNotes(tenantToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setWhatsappNumber('');
      setRoomNumber('');
      setWeeklyRent(settings.defaultRent || 280);
      setRentDueDay(settings.defaultRentDueDay || 'Sunday');
      setStartDate(new Date().toISOString().split('T')[0]);
      setStatus('Active');
      setTenantUsername('');
      setTenantPassword('');
      setNotes('');
    }
  }, [tenantToEdit, isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (tenantToEdit) {
        await updateTenantApi(tenantToEdit.id, {
          name,
          phone,
          whatsappNumber: whatsappNumber || phone,
          roomNumber,
          weeklyRent: Number(weeklyRent),
          rentDueDay,
          startDate,
          status,
          username: tenantUsername,
          password: tenantPassword,
          notes
        });
        addToast('Tenant updated successfully', 'success');
      } else {
        await createTenantApi({
          name,
          phone,
          whatsappNumber: whatsappNumber || phone,
          roomNumber,
          weeklyRent: Number(weeklyRent),
          rentDueDay,
          startDate,
          status,
          username: tenantUsername,
          password: tenantPassword,
          notes
        });
        addToast('New tenant added successfully', 'success');
      }

      triggerRefresh();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Error saving tenant', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            {tenantToEdit ? <UserCheck className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {tenantToEdit ? 'Edit Tenant' : 'Add New Tenant'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {tenantToEdit ? `Updating ${tenantToEdit.id}` : 'Create a tenant profile and set weekly rent'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Smith"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Room Number & Weekly Rent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Room / Property *
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Room 1"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Weekly Rent ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                value={weeklyRent}
                onChange={(e) => setWeeklyRent(Number(e.target.value))}
                min={0}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Phone & WhatsApp Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (!whatsappNumber) setWhatsappNumber(e.target.value);
                }}
                placeholder="+1 555-123-4567"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+1 555-123-4567"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Rent Due Day & Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rent Due Day *
              </label>
              <select
                value={rentDueDay}
                onChange={(e) => setRentDueDay(e.target.value as DayOfWeek)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
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
                Tenancy Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={status === 'Active'}
                  onChange={() => setStatus('Active')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={status === 'Inactive'}
                  onChange={() => setStatus('Inactive')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-500">Inactive</span>
              </label>
            </div>
          </div>

          {/* Tenant Portal Login Credentials Section */}
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Tenant Portal Login Credentials
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Optional</span>
            </div>
            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
              Set a username and password so this tenant can log in to view paid vs pending weeks and receipts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenant Login Username
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tenantUsername}
                    onChange={(e) => setTenantUsername(e.target.value)}
                    placeholder="e.g. john_smith or phone"
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenant Login Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={tenantPassword}
                    onChange={(e) => setTenantPassword(e.target.value)}
                    placeholder="e.g. tenant123"
                    className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes / Agreements
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Deposit details, special rules..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving...' : tenantToEdit ? 'Update Tenant' : 'Add Tenant'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
