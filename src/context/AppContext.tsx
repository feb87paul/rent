import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, DayOfWeek, Tenant, WeeklyRentRecord } from '../types';
import { getWeekRange, shiftWeek } from '../lib/utils';
import { fetchSettingsApi, updateSettingsApi } from '../lib/api';

export type ViewType =
  | 'dashboard'
  | 'tenants'
  | 'weekly'
  | 'history'
  | 'outstanding'
  | 'calendar'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface WhatsAppModalData {
  isOpen: boolean;
  tenantId: string;
  tenantName: string;
  phone: string;
  type: 'Receipt' | 'Reminder' | 'Custom';
  message: string;
  paymentId?: string;
}

export interface RecordPaymentModalData {
  isOpen: boolean;
  tenantId?: string;
  weekStart?: string;
  weekEnd?: string;
  amountDue?: number;
}

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedWeek: { weekStart: string; weekEnd: string };
  setSelectedWeek: (week: { weekStart: string; weekEnd: string }) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  resetToCurrentWeek: () => void;
  settings: AppSettings;
  reloadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings> & { applyToAllTenants?: boolean }) => Promise<void>;
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // WhatsApp Modal
  whatsappModal: WhatsAppModalData;
  openWhatsAppModal: (data: Omit<WhatsAppModalData, 'isOpen'>) => void;
  closeWhatsAppModal: () => void;
  
  // Record Payment Modal
  recordPaymentModal: RecordPaymentModalData;
  openRecordPaymentModal: (data?: Omit<RecordPaymentModalData, 'isOpen'>) => void;
  closeRecordPaymentModal: () => void;
  
  // Global Data Refresh Counter
  refreshTrigger: number;
  triggerRefresh: () => void;

  // Selected tenant for detail view
  selectedTenantForDetail: Tenant | null;
  setSelectedTenantForDetail: (tenant: Tenant | null) => void;
}

const defaultWeek = getWeekRange(); // Dynamic current week (Sunday to Saturday, rent in advance)

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<Tenant | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    propertyName: 'Sunset Apartments',
    propertyAddress: '123 Ocean View Drive, Bay City',
    contactNumber: '+1 555-019-2831',
    email: 'rentals@sunsetapartments.com',
    defaultRent: 280,
    defaultRentDueDay: 'Sunday',
    currency: 'USD',
    currencySymbol: '$',
    whatsappReceivedTemplate: `Hi {tenant_name}, this is to confirm that we have received your weekly rent of {amount} for the week of {week_start} to {week_end}. Thank you. - Sunset Apartments`,
    whatsappReminderTemplate: `Hi {tenant_name}, this is a friendly reminder that your weekly rent of {amount} is currently outstanding for the week of {week_start} to {week_end}. Please arrange payment when convenient. Thank you.`
  });

  const reloadSettings = async () => {
    try {
      const s = await fetchSettingsApi();
      if (s) setSettings(s);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    reloadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings> & { applyToAllTenants?: boolean }) => {
    const updated = await updateSettingsApi(newSettings);
    setSettings(updated);
    addToast('Settings updated successfully', 'success');
    triggerRefresh();
  };

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const nextWeek = () => {
    setSelectedWeek(shiftWeek(selectedWeek.weekStart, 1));
  };

  const prevWeek = () => {
    setSelectedWeek(shiftWeek(selectedWeek.weekStart, -1));
  };

  const resetToCurrentWeek = () => {
    setSelectedWeek(defaultWeek);
  };

  // WhatsApp Modal State
  const [whatsappModal, setWhatsappModal] = useState<WhatsAppModalData>({
    isOpen: false,
    tenantId: '',
    tenantName: '',
    phone: '',
    type: 'Receipt',
    message: ''
  });

  const openWhatsAppModal = (data: Omit<WhatsAppModalData, 'isOpen'>) => {
    setWhatsappModal({ ...data, isOpen: true });
  };

  const closeWhatsAppModal = () => {
    setWhatsappModal(prev => ({ ...prev, isOpen: false }));
  };

  // Record Payment Modal State
  const [recordPaymentModal, setRecordPaymentModal] = useState<RecordPaymentModalData>({
    isOpen: false
  });

  const openRecordPaymentModal = (data?: Omit<RecordPaymentModalData, 'isOpen'>) => {
    setRecordPaymentModal({
      isOpen: true,
      tenantId: data?.tenantId,
      weekStart: data?.weekStart || selectedWeek.weekStart,
      weekEnd: data?.weekEnd || selectedWeek.weekEnd,
      amountDue: data?.amountDue
    });
  };

  const closeRecordPaymentModal = () => {
    setRecordPaymentModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedWeek,
        setSelectedWeek,
        nextWeek,
        prevWeek,
        resetToCurrentWeek,
        settings,
        reloadSettings,
        updateSettings,
        toasts,
        addToast,
        removeToast,
        whatsappModal,
        openWhatsAppModal,
        closeWhatsAppModal,
        recordPaymentModal,
        openRecordPaymentModal,
        closeRecordPaymentModal,
        refreshTrigger,
        triggerRefresh,
        selectedTenantForDetail,
        setSelectedTenantForDetail
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
