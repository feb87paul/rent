import {
  AppSettings,
  AppNotification,
  DashboardStats,
  Payment,
  PaymentStatus,
  Tenant,
  TenantPortalData,
  TenantUserAccount,
  User,
  WeeklyRentRecord
} from '../types';

const API_BASE = '/api';

export async function loginApi(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Invalid credentials');
  }
  return res.json();
}

export async function fetchDashboardApi(weekStart?: string, weekEnd?: string) {
  const params = new URLSearchParams();
  if (weekStart) params.append('weekStart', weekStart);
  if (weekEnd) params.append('weekEnd', weekEnd);

  const res = await fetch(`${API_BASE}/dashboard?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load dashboard data');
  return res.json();
}

export async function fetchTenantsApi(): Promise<Tenant[]> {
  const res = await fetch(`${API_BASE}/tenants`);
  if (!res.ok) throw new Error('Failed to load tenants');
  return res.json();
}

export async function createTenantApi(tenant: Partial<Tenant>): Promise<Tenant> {
  const res = await fetch(`${API_BASE}/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tenant)
  });
  if (!res.ok) throw new Error('Failed to create tenant');
  return res.json();
}

export async function updateTenantApi(id: string, tenant: Partial<Tenant>): Promise<Tenant> {
  const res = await fetch(`${API_BASE}/tenants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tenant)
  });
  if (!res.ok) throw new Error('Failed to update tenant');
  return res.json();
}

export async function deleteTenantApi(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/tenants/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete tenant');
  return res.json();
}

export async function fetchWeeklyRentApi(weekStart?: string, weekEnd?: string): Promise<WeeklyRentRecord[]> {
  const params = new URLSearchParams();
  if (weekStart) params.append('weekStart', weekStart);
  if (weekEnd) params.append('weekEnd', weekEnd);

  const res = await fetch(`${API_BASE}/weekly-rent?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load weekly rent data');
  return res.json();
}

export async function recordPaymentApi(paymentData: {
  tenantId: string;
  weekStart: string;
  weekEnd: string;
  amountDue: number;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  if (!res.ok) throw new Error('Failed to record payment');
  return res.json();
}

export async function fetchPaymentHistoryApi(filters?: {
  tenantId?: string;
  status?: string;
  paymentMethod?: string;
  search?: string;
}): Promise<Payment[]> {
  const params = new URLSearchParams();
  if (filters?.tenantId) params.append('tenantId', filters.tenantId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/payments?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load payment history');
  return res.json();
}

export async function deletePaymentApi(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete payment record');
  return res.json();
}

export async function updatePaymentApi(id: string, paymentData: Partial<Payment>): Promise<{ success: boolean; payment: Payment }> {
  const res = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  if (!res.ok) throw new Error('Failed to update payment record');
  return res.json();
}

export async function bulkDeletePaymentsApi(ids: string[]): Promise<{ success: boolean; count: number; message: string }> {
  const res = await fetch(`${API_BASE}/payments/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  if (!res.ok) throw new Error('Failed to bulk delete payment records');
  return res.json();
}

export async function fetchOutstandingApi(weekStart?: string, weekEnd?: string) {
  const params = new URLSearchParams();
  if (weekStart) params.append('weekStart', weekStart);
  if (weekEnd) params.append('weekEnd', weekEnd);

  const res = await fetch(`${API_BASE}/outstanding?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load outstanding rent');
  return res.json();
}

export async function fetchReportsApi(weekStart?: string, weekEnd?: string) {
  const params = new URLSearchParams();
  if (weekStart) params.append('weekStart', weekStart);
  if (weekEnd) params.append('weekEnd', weekEnd);

  const res = await fetch(`${API_BASE}/reports?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load reports');
  return res.json();
}

export async function fetchSettingsApi(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export async function updateSettingsApi(settings: Partial<AppSettings> & { applyToAllTenants?: boolean }): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function applyAllTenantsDueDayApi(dueDay?: string): Promise<{ success: boolean; count: number; message: string }> {
  const res = await fetch(`${API_BASE}/settings/apply-all-tenants-due-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dueDay })
  });
  if (!res.ok) throw new Error('Failed to update tenant rent due days');
  return res.json();
}

export async function logWhatsAppApi(tenantId: string, type: string, message: string, paymentId?: string) {
  const res = await fetch(`${API_BASE}/whatsapp-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, type, message, paymentId })
  });
  if (!res.ok) throw new Error('Failed to log WhatsApp message');
  return res.json();
}

export async function fetchNotificationsApi(): Promise<AppNotification[]> {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) throw new Error('Failed to load notifications');
  return res.json();
}

export async function markNotificationReadApi(id: string) {
  await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
}

export async function fetchCalendarApi() {
  const res = await fetch(`${API_BASE}/calendar`);
  if (!res.ok) throw new Error('Failed to load calendar data');
  return res.json();
}

export async function fetchUsersApi(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export async function createUserApi(userData: {
  username: string;
  name: string;
  password: string;
  role?: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create user' }));
    throw new Error(error.message || 'Failed to create user');
  }
  return res.json();
}

export async function updateUserPasswordApi(
  userId: string,
  passwords: { currentPassword?: string; newPassword: string }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/users/${userId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwords)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update password' }));
    throw new Error(error.message || 'Failed to update password');
  }
  return res.json();
}

export async function deleteUserApi(userId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to delete user' }));
    throw new Error(error.message || 'Failed to delete user');
  }
  return res.json();
}

export async function fetchTenantPortalApi(tenantId: string): Promise<TenantPortalData> {
  const res = await fetch(`${API_BASE}/tenant/portal/${tenantId}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to load tenant portal data' }));
    throw new Error(error.message || 'Failed to load tenant portal data');
  }
  return res.json();
}

export async function fetchTenantUsersApi(): Promise<TenantUserAccount[]> {
  const res = await fetch(`${API_BASE}/tenant-users`);
  if (!res.ok) throw new Error('Failed to load tenant user accounts');
  return res.json();
}

export async function updateTenantCredentialsApi(
  tenantId: string,
  credentials: { username?: string; password?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/tenant-users/${tenantId}/credentials`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update credentials' }));
    throw new Error(error.message || 'Failed to update credentials');
  }
  return res.json();
}

export async function revokeTenantAccessApi(tenantId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/tenant-users/${tenantId}/revoke`, {
    method: 'POST'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to revoke tenant access' }));
    throw new Error(error.message || 'Failed to revoke tenant access');
  }
  return res.json();
}

export async function restoreTenantAccessApi(tenantId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/tenant-users/${tenantId}/restore`, {
    method: 'POST'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to restore tenant access' }));
    throw new Error(error.message || 'Failed to restore tenant access');
  }
  return res.json();
}
