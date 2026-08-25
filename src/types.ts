export type PaymentStatus = 'Received' | 'Pending' | 'Overdue' | 'Partially Paid';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Online' | 'Other';
export type TenantStatus = 'Active' | 'Inactive';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'tenant';
  tenantId?: string;
  password?: string;
  accessRevoked?: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  whatsappNumber: string;
  roomNumber: string;
  weeklyRent: number;
  rentDueDay: DayOfWeek;
  startDate: string;
  status: TenantStatus;
  username?: string;
  password?: string;
  accessRevoked?: boolean;
  notes?: string;
  createdAt: string;
}

export interface TenantUserAccount {
  id: string;
  name: string;
  roomNumber: string;
  phone: string;
  status: TenantStatus;
  username?: string;
  password?: string;
  accessRevoked?: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  amountDue: number;
  amountPaid: number;
  paymentDate: string; // YYYY-MM-DD or ISO string
  paymentMethod: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
  notes?: string;
  whatsappSent?: boolean;
  whatsappSentAt?: string;
  createdAt: string;
}

export interface WeeklyRentRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  phone: string;
  whatsappNumber: string;
  weeklyRent: number;
  rentDueDay: DayOfWeek;
  dueDate: string; // e.g. "2026-08-10"
  weekStart: string; // "2026-08-10"
  weekEnd: string;   // "2026-08-16"
  status: PaymentStatus;
  paymentDate?: string;
  amountPaid: number;
  paymentId?: string;
}

export interface WhatsAppMessageLog {
  id: string;
  tenantId: string;
  tenantName: string;
  phone: string;
  type: 'Receipt' | 'Reminder' | 'Custom';
  message: string;
  sentAt: string;
  status: 'Sent' | 'Failed';
}

export interface AppSettings {
  propertyName: string;
  propertyAddress: string;
  contactNumber: string;
  email: string;
  defaultRent: number;
  defaultRentDueDay: DayOfWeek;
  currency: string;
  currencySymbol: string;
  whatsappReceivedTemplate: string;
  whatsappReminderTemplate: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'success' | 'info';
  linkTarget?: string; // view identifier or tenant ID
  read: boolean;
  timestamp: string;
}

export interface DashboardStats {
  totalTenants: number;
  activeTenantsCount: number;
  rentDueThisWeek: number;
  rentReceivedThisWeek: number;
  rentOutstandingThisWeek: number;
  paymentsReceivedCount: number;
  paymentsPendingCount: number;
  paymentsOverdueCount: number;
  percentageReceived: number;
  currentWeekStart: string;
  currentWeekEnd: string;
}

export interface TenantPortalData {
  tenant: Tenant;
  stats: {
    totalWeeks: number;
    paidWeeksCount: number;
    pendingWeeksCount: number;
    overdueWeeksCount: number;
    totalAmountPaid: number;
    totalAmountPending: number;
    totalAmountDue: number;
    currentWeekStatus: PaymentStatus;
  };
  weeklySchedule: WeeklyRentRecord[];
  payments: Payment[];
}
