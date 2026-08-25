import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatWeekRangeDisplay } from '../lib/utils';
import { fetchNotificationsApi, markNotificationReadApi } from '../lib/api';
import { AppNotification } from '../types';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bell,
  Plus,
  CheckCircle,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    currentView,
    setCurrentView,
    selectedWeek,
    prevWeek,
    nextWeek,
    resetToCurrentWeek,
    openRecordPaymentModal,
    refreshTrigger
  } = useApp();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotificationsApi();
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [refreshTrigger]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationReadApi(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    if (notif.linkTarget) {
      if (notif.linkTarget === 'outstanding') setCurrentView('outstanding');
      else if (notif.linkTarget === 'weekly') setCurrentView('weekly');
    }
    setShowNotifications(false);
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'tenants': return 'Tenant Directory';
      case 'weekly': return 'Weekly Rent Management';
      case 'history': return 'Payment History & Records';
      case 'outstanding': return 'Outstanding & Overdue Rent';
      case 'calendar': return 'Rent Payment Calendar';
      case 'reports': return 'Weekly Financial Reports';
      case 'settings': return 'Application & WhatsApp Settings';
      default: return 'Weekly Rent Manager';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 transition-colors">
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden active:scale-95 transition-transform"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              {getPageTitle()}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Week: {formatWeekRangeDisplay(selectedWeek.weekStart, selectedWeek.weekEnd)}
            </p>
          </div>
        </div>

        {/* Mobile Header Actions (Notifications & Quick Pay) */}
        <div className="flex items-center gap-1.5 sm:hidden">
          <button
            onClick={() => openRecordPaymentModal()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Record Rent"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pay</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Week Selector Bar & Actions */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-2 sm:pt-0 sm:border-t-0">
        {/* Responsive Week Switcher */}
        <div className="flex items-center justify-between w-full sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <button
            onClick={prevWeek}
            title="Previous Week"
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="px-2 sm:px-3 py-1 font-mono font-bold text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs">
            {formatWeekRangeDisplay(selectedWeek.weekStart, selectedWeek.weekEnd)}
          </span>

          <button
            onClick={nextWeek}
            title="Next Week"
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={resetToCurrentWeek}
            title="Current Week"
            className="p-1.5 ml-0.5 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Quick Record Payment Action */}
        <button
          onClick={() => openRecordPaymentModal()}
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Rent</span>
        </button>

        {/* Desktop Notifications Bell & Popover */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>
        </div>

        {/* Notifications Popover Modal / Dropdown */}
        {showNotifications && (
          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-auto sm:right-0 mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in max-w-sm mx-auto sm:mx-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Notifications ({unreadCount} unread)
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                Close
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto my-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No notifications</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`py-3 px-2 flex items-start gap-3 cursor-pointer rounded-xl transition-colors ${
                      !n.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {n.type === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    ) : n.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 text-xs">
                      <p className="text-slate-900 dark:text-slate-100 font-semibold">{n.title}</p>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
