import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  AppSettings,
  AppNotification,
  DashboardStats,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Tenant,
  TenantPortalData,
  TenantUserAccount,
  User,
  WeeklyRentRecord,
  WhatsAppMessageLog
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Memory Database Schema
interface DatabaseSchema {
  users: User[];
  tenants: Tenant[];
  payments: Payment[];
  weeklyRecords: WeeklyRentRecord[];
  whatsappLogs: WhatsAppMessageLog[];
  settings: AppSettings;
  notifications: AppNotification[];
}

// Initial Default Settings
const defaultSettings: AppSettings = {
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
};

// Initial Seed Data (12 active tenants for Aug 2026 - Rent due in advance on Sunday)
const initialTenants: Tenant[] = [
  { id: 'TNT-001', name: 'John Smith', phone: '+1 555-123-4567', whatsappNumber: '+1 555-123-4567', roomNumber: 'Room 1', weeklyRent: 250, rentDueDay: 'Sunday', startDate: '2025-01-10', status: 'Active', notes: 'Long-term reliable tenant', createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'TNT-002', name: 'David Brown', phone: '+1 555-234-5678', whatsappNumber: '+1 555-234-5678', roomNumber: 'Room 2', weeklyRent: 300, rentDueDay: 'Sunday', startDate: '2025-02-01', status: 'Active', notes: 'Prefers bank transfer', createdAt: '2025-02-01T08:00:00.000Z' },
  { id: 'TNT-003', name: 'Sarah Jenkins', phone: '+1 555-345-6789', whatsappNumber: '+1 555-345-6789', roomNumber: 'Room 3', weeklyRent: 275, rentDueDay: 'Sunday', startDate: '2025-03-15', status: 'Active', notes: 'Quiet tenant', createdAt: '2025-03-15T08:00:00.000Z' },
  { id: 'TNT-004', name: 'Michael Johnson', phone: '+1 555-456-7890', whatsappNumber: '+1 555-456-7890', roomNumber: 'Room 4', weeklyRent: 250, rentDueDay: 'Sunday', startDate: '2025-04-01', status: 'Active', notes: 'Requires weekly reminder', createdAt: '2025-04-01T08:00:00.000Z' },
  { id: 'TNT-005', name: 'Emma Davis', phone: '+1 555-567-8901', whatsappNumber: '+1 555-567-8901', roomNumber: 'Room 5', weeklyRent: 320, rentDueDay: 'Sunday', startDate: '2025-05-10', status: 'Active', notes: 'Spacious corner room', createdAt: '2025-05-10T08:00:00.000Z' },
  { id: 'TNT-006', name: 'Robert Wilson', phone: '+1 555-678-9012', whatsappNumber: '+1 555-678-9012', roomNumber: 'Room 6', weeklyRent: 280, rentDueDay: 'Sunday', startDate: '2025-06-01', status: 'Active', notes: 'Cash payment', createdAt: '2025-06-01T08:00:00.000Z' },
  { id: 'TNT-007', name: 'Lisa Anderson', phone: '+1 555-789-0123', whatsappNumber: '+1 555-789-0123', roomNumber: 'Room 7', weeklyRent: 310, rentDueDay: 'Sunday', startDate: '2025-07-01', status: 'Active', notes: 'Online transfer', createdAt: '2025-07-01T08:00:00.000Z' },
  { id: 'TNT-008', name: 'James Taylor', phone: '+1 555-890-1234', whatsappNumber: '+1 555-890-1234', roomNumber: 'Room 8', weeklyRent: 260, rentDueDay: 'Sunday', startDate: '2025-08-01', status: 'Active', notes: 'Partially paid this week', createdAt: '2025-08-01T08:00:00.000Z' },
  { id: 'TNT-009', name: 'Maria Garcia', phone: '+1 555-901-2345', whatsappNumber: '+1 555-901-2345', roomNumber: 'Room 9', weeklyRent: 290, rentDueDay: 'Sunday', startDate: '2025-09-01', status: 'Active', notes: 'Always pays on time', createdAt: '2025-09-01T08:00:00.000Z' },
  { id: 'TNT-010', name: 'Daniel Martinez', phone: '+1 555-012-3456', whatsappNumber: '+1 555-012-3456', roomNumber: 'Room 10', weeklyRent: 350, rentDueDay: 'Sunday', startDate: '2025-10-01', status: 'Active', notes: 'Studio room', createdAt: '2025-10-01T08:00:00.000Z' },
  { id: 'TNT-011', name: 'Jessica White', phone: '+1 555-111-2222', whatsappNumber: '+1 555-111-2222', roomNumber: 'Room 11', weeklyRent: 270, rentDueDay: 'Sunday', startDate: '2025-11-01', status: 'Active', notes: 'Student', createdAt: '2025-11-01T08:00:00.000Z' },
  { id: 'TNT-012', name: 'William Thomas', phone: '+1 555-333-4444', whatsappNumber: '+1 555-333-4444', roomNumber: 'Room 12', weeklyRent: 300, rentDueDay: 'Sunday', startDate: '2025-12-01', status: 'Active', notes: 'Senior resident', createdAt: '2025-12-01T08:00:00.000Z' }
];

// Helper to seed payments for week 2026-08-09 to 2026-08-15 (Sunday to Saturday)
function createInitialSeedData(): DatabaseSchema {
  const weekStart = '2026-08-09';
  const weekEnd = '2026-08-15';

  const initialPayments: Payment[] = [
    { id: 'PAY-1001', tenantId: 'TNT-001', tenantName: 'John Smith', roomNumber: 'Room 1', weekStart, weekEnd, amountDue: 250, amountPaid: 250, paymentDate: '2026-08-10', paymentMethod: 'Bank Transfer', reference: 'TRX-8821', status: 'Received', whatsappSent: true, whatsappSentAt: '2026-08-10T10:15:00.000Z', createdAt: '2026-08-10T10:15:00.000Z' },
    { id: 'PAY-1002', tenantId: 'TNT-003', tenantName: 'Sarah Jenkins', roomNumber: 'Room 3', weekStart, weekEnd, amountDue: 275, amountPaid: 275, paymentDate: '2026-08-10', paymentMethod: 'Cash', reference: 'CSH-002', status: 'Received', whatsappSent: true, whatsappSentAt: '2026-08-10T14:30:00.000Z', createdAt: '2026-08-10T14:30:00.000Z' },
    { id: 'PAY-1003', tenantId: 'TNT-005', tenantName: 'Emma Davis', roomNumber: 'Room 5', weekStart, weekEnd, amountDue: 320, amountPaid: 320, paymentDate: '2026-08-11', paymentMethod: 'Online', reference: 'ONL-9941', status: 'Received', whatsappSent: true, whatsappSentAt: '2026-08-11T09:00:00.000Z', createdAt: '2026-08-11T09:00:00.000Z' },
    { id: 'PAY-1004', tenantId: 'TNT-007', tenantName: 'Lisa Anderson', roomNumber: 'Room 7', weekStart, weekEnd, amountDue: 310, amountPaid: 310, paymentDate: '2026-08-11', paymentMethod: 'Bank Transfer', reference: 'TRX-4412', status: 'Received', whatsappSent: true, whatsappSentAt: '2026-08-11T11:20:00.000Z', createdAt: '2026-08-11T11:20:00.000Z' },
    { id: 'PAY-1005', tenantId: 'TNT-008', tenantName: 'James Taylor', roomNumber: 'Room 8', weekStart, weekEnd, amountDue: 260, amountPaid: 150, paymentDate: '2026-08-10', paymentMethod: 'Cash', reference: 'CSH-088', status: 'Partially Paid', notes: 'Paid $150 cash, remaining $110 promised by Wednesday', whatsappSent: false, createdAt: '2026-08-10T16:00:00.000Z' },
    { id: 'PAY-1006', tenantId: 'TNT-009', tenantName: 'Maria Garcia', roomNumber: 'Room 9', weekStart, weekEnd, amountDue: 290, amountPaid: 290, paymentDate: '2026-08-11', paymentMethod: 'Online', reference: 'ONL-7712', status: 'Received', whatsappSent: true, whatsappSentAt: '2026-08-11T12:00:00.000Z', createdAt: '2026-08-11T12:00:00.000Z' },
    { id: 'PAY-1007', tenantId: 'TNT-012', tenantName: 'William Thomas', roomNumber: 'Room 12', weekStart, weekEnd, amountDue: 300, amountPaid: 300, paymentDate: '2026-08-10', paymentMethod: 'Bank Transfer', reference: 'TRX-0092', status: 'Received', whatsappSent: true, whatsappSentAt: '2026-08-10T18:00:00.000Z', createdAt: '2026-08-10T18:00:00.000Z' },

    // Previous Week Seed (2026-08-02 to 2026-08-08)
    { id: 'PAY-0901', tenantId: 'TNT-001', tenantName: 'John Smith', roomNumber: 'Room 1', weekStart: '2026-08-02', weekEnd: '2026-08-08', amountDue: 250, amountPaid: 250, paymentDate: '2026-08-03', paymentMethod: 'Bank Transfer', reference: 'TRX-7712', status: 'Received', whatsappSent: true, createdAt: '2026-08-03T10:00:00.000Z' },
    { id: 'PAY-0902', tenantId: 'TNT-002', tenantName: 'David Brown', roomNumber: 'Room 2', weekStart: '2026-08-02', weekEnd: '2026-08-08', amountDue: 300, amountPaid: 300, paymentDate: '2026-08-04', paymentMethod: 'Bank Transfer', reference: 'TRX-7713', status: 'Received', whatsappSent: true, createdAt: '2026-08-04T11:00:00.000Z' },
    { id: 'PAY-0903', tenantId: 'TNT-003', tenantName: 'Sarah Jenkins', roomNumber: 'Room 3', weekStart: '2026-08-02', weekEnd: '2026-08-08', amountDue: 275, amountPaid: 275, paymentDate: '2026-08-03', paymentMethod: 'Cash', reference: 'CSH-001', status: 'Received', whatsappSent: true, createdAt: '2026-08-03T15:00:00.000Z' },
    { id: 'PAY-0904', tenantId: 'TNT-004', tenantName: 'Michael Johnson', roomNumber: 'Room 4', weekStart: '2026-08-02', weekEnd: '2026-08-08', amountDue: 250, amountPaid: 250, paymentDate: '2026-08-05', paymentMethod: 'Online', reference: 'ONL-8821', status: 'Received', whatsappSent: true, createdAt: '2026-08-05T09:30:00.000Z' }
  ];

  const initialWeeklyRecords: WeeklyRentRecord[] = [
    { id: 'WREC-001', tenantId: 'TNT-001', tenantName: 'John Smith', roomNumber: 'Room 1', phone: '+1 555-123-4567', whatsappNumber: '+1 555-123-4567', weeklyRent: 250, rentDueDay: 'Monday', dueDate: '2026-08-10', weekStart, weekEnd, status: 'Received', paymentDate: '2026-08-10', amountPaid: 250, paymentId: 'PAY-1001' },
    { id: 'WREC-002', tenantId: 'TNT-002', tenantName: 'David Brown', roomNumber: 'Room 2', phone: '+1 555-234-5678', whatsappNumber: '+1 555-234-5678', weeklyRent: 300, rentDueDay: 'Monday', dueDate: '2026-08-10', weekStart, weekEnd, status: 'Pending', amountPaid: 0 },
    { id: 'WREC-003', tenantId: 'TNT-003', tenantName: 'Sarah Jenkins', roomNumber: 'Room 3', phone: '+1 555-345-6789', whatsappNumber: '+1 555-345-6789', weeklyRent: 275, rentDueDay: 'Monday', dueDate: '2026-08-10', weekStart, weekEnd, status: 'Received', paymentDate: '2026-08-10', amountPaid: 275, paymentId: 'PAY-1002' },
    { id: 'WREC-004', tenantId: 'TNT-004', tenantName: 'Michael Johnson', roomNumber: 'Room 4', phone: '+1 555-456-7890', whatsappNumber: '+1 555-456-7890', weeklyRent: 250, rentDueDay: 'Tuesday', dueDate: '2026-08-11', weekStart, weekEnd, status: 'Overdue', amountPaid: 0 },
    { id: 'WREC-005', tenantId: 'TNT-005', tenantName: 'Emma Davis', roomNumber: 'Room 5', phone: '+1 555-567-8901', whatsappNumber: '+1 555-567-8901', weeklyRent: 320, rentDueDay: 'Wednesday', dueDate: '2026-08-12', weekStart, weekEnd, status: 'Received', paymentDate: '2026-08-11', amountPaid: 320, paymentId: 'PAY-1003' },
    { id: 'WREC-006', tenantId: 'TNT-006', tenantName: 'Robert Wilson', roomNumber: 'Room 6', phone: '+1 555-678-9012', whatsappNumber: '+1 555-678-9012', weeklyRent: 280, rentDueDay: 'Thursday', dueDate: '2026-08-13', weekStart, weekEnd, status: 'Pending', amountPaid: 0 },
    { id: 'WREC-007', tenantId: 'TNT-007', tenantName: 'Lisa Anderson', roomNumber: 'Room 7', phone: '+1 555-789-0123', whatsappNumber: '+1 555-789-0123', weeklyRent: 310, rentDueDay: 'Friday', dueDate: '2026-08-14', weekStart, weekEnd, status: 'Received', paymentDate: '2026-08-11', amountPaid: 310, paymentId: 'PAY-1004' },
    { id: 'WREC-008', tenantId: 'TNT-008', tenantName: 'James Taylor', roomNumber: 'Room 8', phone: '+1 555-890-1234', whatsappNumber: '+1 555-890-1234', weeklyRent: 260, rentDueDay: 'Monday', dueDate: '2026-08-10', weekStart, weekEnd, status: 'Partially Paid', paymentDate: '2026-08-10', amountPaid: 150, paymentId: 'PAY-1005' },
    { id: 'WREC-009', tenantId: 'TNT-009', tenantName: 'Maria Garcia', roomNumber: 'Room 9', phone: '+1 555-901-2345', whatsappNumber: '+1 555-901-2345', weeklyRent: 290, rentDueDay: 'Tuesday', dueDate: '2026-08-11', weekStart, weekEnd, status: 'Received', paymentDate: '2026-08-11', amountPaid: 290, paymentId: 'PAY-1006' },
    { id: 'WREC-010', tenantId: 'TNT-010', tenantName: 'Daniel Martinez', roomNumber: 'Room 10', phone: '+1 555-012-3456', whatsappNumber: '+1 555-012-3456', weeklyRent: 350, rentDueDay: 'Wednesday', dueDate: '2026-08-12', weekStart, weekEnd, status: 'Pending', amountPaid: 0 },
    { id: 'WREC-011', tenantId: 'TNT-011', tenantName: 'Jessica White', roomNumber: 'Room 11', phone: '+1 555-111-2222', whatsappNumber: '+1 555-111-2222', weeklyRent: 270, rentDueDay: 'Thursday', dueDate: '2026-08-13', weekStart, weekEnd, status: 'Overdue', amountPaid: 0 },
    { id: 'WREC-012', tenantId: 'TNT-012', tenantName: 'William Thomas', roomNumber: 'Room 12', phone: '+1 555-333-4444', whatsappNumber: '+1 555-333-4444', weeklyRent: 300, rentDueDay: 'Friday', dueDate: '2026-08-14', weekStart, weekEnd, status: 'Received', paymentDate: '2026-08-10', amountPaid: 300, paymentId: 'PAY-1007' }
  ];

  const initialNotifications: AppNotification[] = [
    { id: 'NOTIF-1', title: 'Rent Overdue Alert', message: 'Michael Johnson (Room 4) rent is overdue by 1 day', type: 'warning', linkTarget: 'outstanding', read: false, timestamp: '2026-08-11T08:00:00.000Z' },
    { id: 'NOTIF-2', title: 'Rent Overdue Alert', message: 'Jessica White (Room 11) rent is overdue by 1 day', type: 'warning', linkTarget: 'outstanding', read: false, timestamp: '2026-08-11T08:05:00.000Z' },
    { id: 'NOTIF-3', title: 'Payment Received', message: 'Maria Garcia paid $290 for Room 9 via Online Transfer', type: 'success', linkTarget: 'weekly', read: false, timestamp: '2026-08-11T12:00:00.000Z' },
    { id: 'NOTIF-4', title: 'Weekly Rent Summary', message: '3 tenants have outstanding payments this week', type: 'info', linkTarget: 'weekly', read: true, timestamp: '2026-08-10T09:00:00.000Z' }
  ];

  return {
    users: [
      { id: 'USR-001', username: 'admin', name: 'System Administrator', role: 'admin', password: 'admin', createdAt: new Date().toISOString() }
    ],
    tenants: initialTenants,
    payments: initialPayments,
    weeklyRecords: initialWeeklyRecords,
    whatsappLogs: [],
    settings: defaultSettings,
    notifications: initialNotifications
  };
}

// Ensure database file exists
function loadDB(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const seed = createInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }

  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.tenants || !parsed.settings) {
      const seed = createInitialSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
      return seed;
    }
    return parsed;
  } catch (err) {
    const seed = createInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
}

function saveDB(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

let db = loadDB();

// Helper functions for date handling
function formatToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateLocal(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [ymd] = dateStr.split('T');
  const parts = ymd.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  return new Date(dateStr);
}

// Helper to calculate due date for a tenant in a given week (Sunday -> Saturday)
function calculateDueDateForWeek(rentDueDay: string, weekStartStr: string): string {
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  const offset = dayMap[rentDueDay] ?? 0;
  const start = parseDateLocal(weekStartStr);
  const due = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset, 0, 0, 0, 0);
  return formatToYMD(due);
}

// Helper: Ensure weekly records exist for active tenants for a given weekStart
function ensureWeeklyRecordsForWeek(weekStart: string, weekEnd: string) {
  let updated = false;
  const activeTenants = db.tenants.filter(t => t.status === 'Active');

  for (const tenant of activeTenants) {
    const existing = db.weeklyRecords.find(r => r.tenantId === tenant.id && r.weekStart === weekStart);
    if (!existing) {
      const dueDate = calculateDueDateForWeek(tenant.rentDueDay, weekStart);
      
      // Check if there is an existing payment recorded for this week
      const payment = db.payments.find(p => p.tenantId === tenant.id && p.weekStart === weekStart);
      
      let status: PaymentStatus = 'Pending';
      let amountPaid = 0;
      let paymentId: string | undefined = undefined;
      let paymentDate: string | undefined = undefined;

      if (payment) {
        status = payment.status;
        amountPaid = payment.amountPaid;
        paymentId = payment.id;
        paymentDate = payment.paymentDate;
      } else {
        // If today > dueDate, mark as Overdue
        const todayStr = '2026-08-11'; // Simulated current date
        if (dueDate < todayStr) {
          status = 'Overdue';
        }
      }

      // Calculate prorated weekly rent if tenant's start date falls in this week
      let weeklyRent = tenant.weeklyRent;
      if (tenant.startDate && tenant.startDate >= weekStart && tenant.startDate <= weekEnd) {
        const startDate = parseDateLocal(tenant.startDate);
        const wEnd = parseDateLocal(weekEnd);
        const msInDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.floor((wEnd.getTime() - startDate.getTime()) / msInDay) + 1;
        const activeDays = Math.max(1, Math.min(7, diffDays));
        weeklyRent = Math.round(((tenant.weeklyRent * activeDays) / 7) * 100) / 100;
      }

      const newRecord: WeeklyRentRecord = {
        id: `WREC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        roomNumber: tenant.roomNumber,
        phone: tenant.phone,
        whatsappNumber: tenant.whatsappNumber,
        weeklyRent,
        rentDueDay: tenant.rentDueDay,
        dueDate,
        weekStart,
        weekEnd,
        status,
        amountPaid,
        paymentDate,
        paymentId
      };

      db.weeklyRecords.push(newRecord);
      updated = true;
    }
  }

  if (updated) {
    saveDB(db);
  }
}

function getCurrentSundaySaturdayWeek(): { weekStart: string; weekEnd: string } {
  const date = new Date();
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  const diffToSunday = -day;
  const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToSunday, 0, 0, 0, 0);
  const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6, 0, 0, 0, 0);

  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dNum = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dNum}`;
  };

  return {
    weekStart: formatYMD(sunday),
    weekEnd: formatYMD(saturday)
  };
}

// Ensure records exist for current week
const currentCycle = getCurrentSundaySaturdayWeek();
ensureWeeklyRecordsForWeek(currentCycle.weekStart, currentCycle.weekEnd);
ensureWeeklyRecordsForWeek('2026-08-09', '2026-08-15');

// ================= API ROUTES =================

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();

  // 1. Check in db.users (Admin or Tenant users)
  const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);
  if (user) {
    if (user.accessRevoked) {
      return res.status(403).json({ success: false, message: 'Your tenant portal access has been revoked by property manager.' });
    }
    const expectedPassword = user.password || 'admin';
    if (expectedPassword === password) {
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        token: `jwt-session-token-${user.id}-${Date.now()}`,
        user: userWithoutPassword
      });
    }
  }

  // 2. Check in db.tenants
  const tenant = db.tenants.find(t =>
    (t.username && t.username.toLowerCase() === cleanUsername) ||
    (t.phone && t.phone.replace(/[^0-9]/g, '') === cleanUsername.replace(/[^0-9]/g, ''))
  );

  if (tenant) {
    if (tenant.accessRevoked) {
      return res.status(403).json({ success: false, message: 'Your tenant portal access has been revoked by property manager.' });
    }
    const expectedPassword = tenant.password || 'tenant123';
    if (expectedPassword === password) {
      const tenantUser: User = {
        id: tenant.id,
        username: tenant.username || tenant.phone || tenant.id,
        name: tenant.name,
        role: 'tenant',
        tenantId: tenant.id,
        accessRevoked: tenant.accessRevoked,
        createdAt: tenant.createdAt
      };
      return res.json({
        success: true,
        token: `jwt-session-token-${tenant.id}-${Date.now()}`,
        user: tenantUser
      });
    }
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

app.get('/api/auth/me', (req, res) => {
  const user = db.users[0];
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password: _, ...userWithoutPassword } = user;
  return res.json({ user: userWithoutPassword });
});

// User Management API
app.get('/api/users', (req, res) => {
  const usersList = db.users.map(({ password, ...u }) => u);
  res.json(usersList);
});

app.post('/api/users', (req, res) => {
  const { username, name, password, role } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ message: 'Username is required' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ message: 'Password is required' });
  }

  const existing = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  const newUser: User = {
    id: `USR-${Date.now().toString().slice(-6)}`,
    username: username.trim(),
    name: name.trim(),
    role: role || 'admin',
    password: password.trim(),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.put('/api/users/:id/password', (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ message: 'New password must be at least 3 characters long' });
  }

  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = db.users[userIndex];

  // If currentPassword is provided, verify it
  if (currentPassword) {
    const existingPassword = user.password || 'admin';
    if (existingPassword !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
  }

  db.users[userIndex].password = newPassword.trim();
  saveDB(db);

  res.json({ success: true, message: 'Password updated successfully' });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  const userIndex = db.users.findIndex(
    u => u.id === id || u.username.toLowerCase() === id.toLowerCase()
  );
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User account not found' });
  }

  const userToDelete = db.users[userIndex];
  const adminUsers = db.users.filter(u => u.role === 'admin');

  if (userToDelete.role === 'admin' && adminUsers.length <= 1) {
    return res.status(400).json({ message: 'Cannot delete the only remaining admin user account' });
  }

  // If user is linked to a tenant, sync tenant record
  if (userToDelete.tenantId) {
    const tenantIdx = db.tenants.findIndex(t => t.id === userToDelete.tenantId);
    if (tenantIdx >= 0) {
      db.tenants[tenantIdx].username = undefined;
      db.tenants[tenantIdx].password = undefined;
    }
  }

  db.users.splice(userIndex, 1);
  saveDB(db);

  res.json({ success: true, message: 'User account deleted successfully' });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const current = getCurrentSundaySaturdayWeek();
  const weekStart = (req.query.weekStart as string) || current.weekStart;
  const weekEnd = (req.query.weekEnd as string) || current.weekEnd;

  ensureWeeklyRecordsForWeek(weekStart, weekEnd);

  const records = db.weeklyRecords.filter(r => r.weekStart === weekStart);
  const activeTenants = db.tenants.filter(t => t.status === 'Active');

  const rentDueThisWeek = records.reduce((acc, r) => acc + r.weeklyRent, 0);
  const rentReceivedThisWeek = records.reduce((acc, r) => acc + r.amountPaid, 0);
  const rentOutstandingThisWeek = Math.max(0, rentDueThisWeek - rentReceivedThisWeek);

  const paymentsReceivedCount = records.filter(r => r.status === 'Received').length;
  const paymentsPendingCount = records.filter(r => r.status === 'Pending').length;
  const paymentsOverdueCount = records.filter(r => r.status === 'Overdue').length;

  const percentageReceived = rentDueThisWeek > 0 ? Math.round((rentReceivedThisWeek / rentDueThisWeek) * 100) : 0;

  // Recent payments
  const recentPayments = [...db.payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const stats: DashboardStats = {
    totalTenants: db.tenants.length,
    activeTenantsCount: activeTenants.length,
    rentDueThisWeek,
    rentReceivedThisWeek,
    rentOutstandingThisWeek,
    paymentsReceivedCount,
    paymentsPendingCount,
    paymentsOverdueCount,
    percentageReceived,
    currentWeekStart: weekStart,
    currentWeekEnd: weekEnd
  };

  res.json({
    stats,
    thisWeekRent: records,
    recentPayments,
    notifications: db.notifications
  });
});

// Tenants API
app.get('/api/tenants', (req, res) => {
  res.json(db.tenants);
});

app.post('/api/tenants', (req, res) => {
  const { name, phone, whatsappNumber, roomNumber, weeklyRent, rentDueDay, startDate, status, notes, username, password } = req.body;

  if (!name || !roomNumber || !weeklyRent) {
    return res.status(400).json({ message: 'Name, room number, and weekly rent are required' });
  }

  const nextNum = db.tenants.length + 1;
  const id = `TNT-${String(nextNum).padStart(3, '0')}`;

  const newTenant: Tenant = {
    id,
    name,
    phone: phone || '',
    whatsappNumber: whatsappNumber || phone || '',
    roomNumber,
    weeklyRent: Number(weeklyRent),
    rentDueDay: rentDueDay || 'Monday',
    startDate: startDate || new Date().toISOString().split('T')[0],
    status: status || 'Active',
    username: username ? username.trim() : undefined,
    password: password ? password.trim() : undefined,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.tenants.push(newTenant);

  // Sync user credentials if username and password were set
  if (newTenant.username && newTenant.password) {
    const existingUserIdx = db.users.findIndex(u => u.tenantId === id || u.username.toLowerCase() === newTenant.username!.toLowerCase());
    if (existingUserIdx >= 0) {
      db.users[existingUserIdx].username = newTenant.username;
      db.users[existingUserIdx].password = newTenant.password;
      db.users[existingUserIdx].name = newTenant.name;
    } else {
      db.users.push({
        id: `USR-T-${Date.now().toString().slice(-5)}`,
        username: newTenant.username,
        name: newTenant.name,
        role: 'tenant',
        tenantId: id,
        password: newTenant.password,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Automatically add weekly record for current week if active
  if (newTenant.status === 'Active') {
    const currentWeek = getCurrentSundaySaturdayWeek();
    const dueDate = calculateDueDateForWeek(newTenant.rentDueDay, currentWeek.weekStart);
    db.weeklyRecords.push({
      id: `WREC-${Date.now()}`,
      tenantId: newTenant.id,
      tenantName: newTenant.name,
      roomNumber: newTenant.roomNumber,
      phone: newTenant.phone,
      whatsappNumber: newTenant.whatsappNumber,
      weeklyRent: newTenant.weeklyRent,
      rentDueDay: newTenant.rentDueDay,
      dueDate,
      weekStart: currentWeek.weekStart,
      weekEnd: currentWeek.weekEnd,
      status: 'Pending',
      amountPaid: 0
    });
  }

  saveDB(db);
  res.status(201).json(newTenant);
});

app.put('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  const index = db.tenants.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  const updatedTenant: Tenant = {
    ...db.tenants[index],
    ...req.body,
    id // preserve id
  };

  if (req.body.username !== undefined) updatedTenant.username = req.body.username ? req.body.username.trim() : undefined;
  if (req.body.password !== undefined) updatedTenant.password = req.body.password ? req.body.password.trim() : undefined;

  db.tenants[index] = updatedTenant;

  // Sync user account if username and password exist
  if (updatedTenant.username && updatedTenant.password) {
    const existingUserIdx = db.users.findIndex(u => u.tenantId === id || u.username.toLowerCase() === updatedTenant.username!.toLowerCase());
    if (existingUserIdx >= 0) {
      db.users[existingUserIdx].username = updatedTenant.username;
      db.users[existingUserIdx].password = updatedTenant.password;
      db.users[existingUserIdx].name = updatedTenant.name;
    } else {
      db.users.push({
        id: `USR-T-${Date.now().toString().slice(-5)}`,
        username: updatedTenant.username,
        name: updatedTenant.name,
        role: 'tenant',
        tenantId: id,
        password: updatedTenant.password,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Also update corresponding weekly records for this tenant
  db.weeklyRecords = db.weeklyRecords.map(r => {
    if (r.tenantId === id) {
      return {
        ...r,
        tenantName: updatedTenant.name,
        roomNumber: updatedTenant.roomNumber,
        phone: updatedTenant.phone,
        whatsappNumber: updatedTenant.whatsappNumber,
        weeklyRent: updatedTenant.weeklyRent,
        rentDueDay: updatedTenant.rentDueDay
      };
    }
    return r;
  });

  saveDB(db);
  res.json(updatedTenant);
});

// Tenant Portal Overview Endpoint
app.get('/api/tenant/portal/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const tenant = db.tenants.find(t => t.id === tenantId);

  if (!tenant) {
    return res.status(404).json({ message: 'Tenant record not found' });
  }

  // Ensure current week records are generated
  const currentWeek = getCurrentSundaySaturdayWeek();
  const currentStart = currentWeek.weekStart;
  const currentEnd = currentWeek.weekEnd;
  ensureWeeklyRecordsForWeek(currentStart, currentEnd);

  // Get all weekly records for this tenant
  const tenantRecords = db.weeklyRecords.filter(r => r.tenantId === tenantId);

  let paidWeeksCount = 0;
  let pendingWeeksCount = 0;
  let overdueWeeksCount = 0;
  let totalAmountPaid = 0;
  let totalAmountPending = 0;
  let totalAmountDue = 0;

  tenantRecords.forEach(rec => {
    totalAmountDue += rec.weeklyRent;
    totalAmountPaid += rec.amountPaid;

    if (rec.status === 'Received') {
      paidWeeksCount += 1;
    } else if (rec.status === 'Overdue') {
      overdueWeeksCount += 1;
      totalAmountPending += (rec.weeklyRent - rec.amountPaid);
    } else {
      pendingWeeksCount += 1;
      totalAmountPending += (rec.weeklyRent - rec.amountPaid);
    }
  });

  const currentRecord = tenantRecords.find(r => r.weekStart === currentStart);
  const currentWeekStatus: PaymentStatus = currentRecord ? currentRecord.status : 'Pending';

  const tenantPayments = db.payments
    .filter(p => p.tenantId === tenantId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const sortedWeeklySchedule = [...tenantRecords].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );

  const portalData: TenantPortalData = {
    tenant,
    stats: {
      totalWeeks: tenantRecords.length,
      paidWeeksCount,
      pendingWeeksCount,
      overdueWeeksCount,
      totalAmountPaid,
      totalAmountPending,
      totalAmountDue,
      currentWeekStatus
    },
    weeklySchedule: sortedWeeklySchedule,
    payments: tenantPayments
  };

  res.json(portalData);
});

app.delete('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  db.tenants = db.tenants.filter(t => t.id !== id);
  db.weeklyRecords = db.weeklyRecords.filter(r => r.tenantId !== id);
  db.users = db.users.filter(u => u.tenantId !== id);
  saveDB(db);
  res.json({ success: true, message: 'Tenant deleted successfully' });
});

// Tenant User Accounts Management API
app.get('/api/tenant-users', (req, res) => {
  const tenantAccounts = db.tenants.map(t => {
    const user = db.users.find(u => u.tenantId === t.id);
    return {
      id: t.id,
      name: t.name,
      roomNumber: t.roomNumber,
      phone: t.phone,
      status: t.status,
      username: t.username || user?.username || t.phone || t.id,
      password: t.password || user?.password,
      accessRevoked: t.accessRevoked || user?.accessRevoked || false,
      createdAt: t.createdAt
    };
  });
  res.json(tenantAccounts);
});

app.put('/api/tenant-users/:tenantId/credentials', (req, res) => {
  const { tenantId } = req.params;
  const { username, password } = req.body;

  const tenantIndex = db.tenants.findIndex(t => t.id === tenantId);
  if (tenantIndex === -1) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  if (username !== undefined) db.tenants[tenantIndex].username = username.trim();
  if (password !== undefined) db.tenants[tenantIndex].password = password.trim();
  db.tenants[tenantIndex].accessRevoked = false;

  const tenant = db.tenants[tenantIndex];

  // Sync db.users
  const userIdx = db.users.findIndex(u => u.tenantId === tenantId || (tenant.username && u.username.toLowerCase() === tenant.username.toLowerCase()));
  if (userIdx >= 0) {
    db.users[userIdx].username = tenant.username || tenant.phone || tenant.id;
    if (tenant.password) db.users[userIdx].password = tenant.password;
    db.users[userIdx].accessRevoked = false;
    db.users[userIdx].name = tenant.name;
  } else {
    db.users.push({
      id: `USR-T-${Date.now().toString().slice(-5)}`,
      username: tenant.username || tenant.phone || tenant.id,
      name: tenant.name,
      role: 'tenant',
      tenantId: tenant.id,
      password: tenant.password,
      accessRevoked: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDB(db);
  res.json({ success: true, message: 'Tenant portal login credentials updated successfully' });
});

app.post('/api/tenant-users/:tenantId/revoke', (req, res) => {
  const { tenantId } = req.params;
  const tenantIndex = db.tenants.findIndex(t => t.id === tenantId);
  if (tenantIndex === -1) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  db.tenants[tenantIndex].accessRevoked = true;

  // Sync db.users
  db.users.forEach(u => {
    if (u.tenantId === tenantId || (db.tenants[tenantIndex].username && u.username.toLowerCase() === db.tenants[tenantIndex].username?.toLowerCase())) {
      u.accessRevoked = true;
    }
  });

  saveDB(db);
  res.json({ success: true, message: 'Tenant portal access revoked successfully' });
});

app.post('/api/tenant-users/:tenantId/restore', (req, res) => {
  const { tenantId } = req.params;
  const tenantIndex = db.tenants.findIndex(t => t.id === tenantId);
  if (tenantIndex === -1) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  db.tenants[tenantIndex].accessRevoked = false;

  // Sync db.users
  db.users.forEach(u => {
    if (u.tenantId === tenantId || (db.tenants[tenantIndex].username && u.username.toLowerCase() === db.tenants[tenantIndex].username?.toLowerCase())) {
      u.accessRevoked = false;
    }
  });

  saveDB(db);
  res.json({ success: true, message: 'Tenant portal access restored successfully' });
});

// Weekly Rent Records
app.get('/api/weekly-rent', (req, res) => {
  const current = getCurrentSundaySaturdayWeek();
  const weekStart = (req.query.weekStart as string) || current.weekStart;
  const weekEnd = (req.query.weekEnd as string) || current.weekEnd;

  ensureWeeklyRecordsForWeek(weekStart, weekEnd);

  const records = db.weeklyRecords.filter(r => r.weekStart === weekStart);
  res.json(records);
});

// Record Payment
app.post('/api/payments', (req, res) => {
  const { tenantId, weekStart, weekEnd, amountDue, amountPaid, paymentDate, paymentMethod, reference, notes } = req.body;

  const tenant = db.tenants.find(t => t.id === tenantId);
  if (!tenant) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  const paidAmount = Number(amountPaid);
  const dueAmount = Number(amountDue || tenant.weeklyRent);

  let status: PaymentStatus = 'Received';
  if (paidAmount < dueAmount) {
    status = paidAmount > 0 ? 'Partially Paid' : 'Pending';
  }

  const current = getCurrentSundaySaturdayWeek();
  const wStart = weekStart || current.weekStart;
  const wEnd = weekEnd || current.weekEnd;

  const newPayment: Payment = {
    id: `PAY-${Date.now().toString().slice(-6)}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    roomNumber: tenant.roomNumber,
    weekStart: wStart,
    weekEnd: wEnd,
    amountDue: dueAmount,
    amountPaid: paidAmount,
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: (paymentMethod as PaymentMethod) || 'Cash',
    reference: reference || '',
    status,
    notes: notes || '',
    whatsappSent: false,
    createdAt: new Date().toISOString()
  };

  db.payments.push(newPayment);

  // Update corresponding weekly record
  ensureWeeklyRecordsForWeek(wStart, wEnd);
  let recIndex = db.weeklyRecords.findIndex(r => r.tenantId === tenantId && r.weekStart === wStart);
  if (recIndex !== -1) {
    db.weeklyRecords[recIndex] = {
      ...db.weeklyRecords[recIndex],
      status,
      amountPaid: paidAmount,
      paymentDate: newPayment.paymentDate,
      paymentId: newPayment.id
    };
  } else {
    const dueDate = calculateDueDateForWeek(tenant.rentDueDay, wStart);
    const newRecord: WeeklyRentRecord = {
      id: `WREC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      roomNumber: tenant.roomNumber,
      phone: tenant.phone,
      whatsappNumber: tenant.whatsappNumber,
      weeklyRent: dueAmount,
      rentDueDay: tenant.rentDueDay,
      dueDate,
      weekStart: wStart,
      weekEnd: wEnd,
      status,
      amountPaid: paidAmount,
      paymentDate: newPayment.paymentDate,
      paymentId: newPayment.id
    };
    db.weeklyRecords.push(newRecord);
    recIndex = db.weeklyRecords.length - 1;
  }

  // Create success notification
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Payment Recorded',
    message: `${tenant.name} (${tenant.roomNumber}) paid $${paidAmount} via ${newPayment.paymentMethod}`,
    type: 'success',
    linkTarget: 'weekly',
    read: false,
    timestamp: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json({ payment: newPayment, record: recIndex !== -1 ? db.weeklyRecords[recIndex] : null });
});

// Get Payment History
app.get('/api/payments', (req, res) => {
  let list = [...db.payments];

  const { tenantId, status, paymentMethod, search } = req.query;

  if (tenantId) {
    list = list.filter(p => p.tenantId === tenantId);
  }
  if (status) {
    list = list.filter(p => p.status === status);
  }
  if (paymentMethod) {
    list = list.filter(p => p.paymentMethod === paymentMethod);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(p => p.tenantName.toLowerCase().includes(q) || p.roomNumber.toLowerCase().includes(q) || (p.reference && p.reference.toLowerCase().includes(q)));
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

// Delete Payment
app.delete('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  const pIndex = db.payments.findIndex(p => p.id === id);
  if (pIndex === -1) {
    return res.status(404).json({ message: 'Payment record not found' });
  }

  const payment = db.payments[pIndex];
  db.payments.splice(pIndex, 1);

  // Recalculate weekly record for this tenant and week
  const remainingPayments = db.payments.filter(
    p => p.tenantId === payment.tenantId && p.weekStart === payment.weekStart
  );
  const recIndex = db.weeklyRecords.findIndex(
    r => r.tenantId === payment.tenantId && r.weekStart === payment.weekStart
  );

  if (recIndex !== -1) {
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const weeklyRent = db.weeklyRecords[recIndex].weeklyRent;

    if (totalPaid === 0) {
      db.weeklyRecords[recIndex].amountPaid = 0;
      db.weeklyRecords[recIndex].status = 'Pending';
      db.weeklyRecords[recIndex].paymentDate = undefined;
      db.weeklyRecords[recIndex].paymentId = undefined;
    } else {
      db.weeklyRecords[recIndex].amountPaid = totalPaid;
      db.weeklyRecords[recIndex].status = totalPaid >= weeklyRent ? 'Received' : 'Partially Paid';
      db.weeklyRecords[recIndex].paymentDate = remainingPayments[remainingPayments.length - 1].paymentDate;
      db.weeklyRecords[recIndex].paymentId = remainingPayments[remainingPayments.length - 1].id;
    }
  }

  saveDB(db);
  res.json({ success: true, message: 'Payment record deleted and week status reverted' });
});

// Update Payment
app.put('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  const pIndex = db.payments.findIndex(p => p.id === id);
  if (pIndex === -1) {
    return res.status(404).json({ message: 'Payment record not found' });
  }

  const { amountPaid, paymentDate, paymentMethod, reference, notes } = req.body;
  const current = db.payments[pIndex];

  if (amountPaid !== undefined) current.amountPaid = Number(amountPaid);
  if (paymentDate) current.paymentDate = paymentDate;
  if (paymentMethod) current.paymentMethod = paymentMethod;
  if (reference !== undefined) current.reference = reference;
  if (notes !== undefined) current.notes = notes;

  const dueAmount = current.amountDue;
  if (current.amountPaid >= dueAmount) {
    current.status = 'Received';
  } else if (current.amountPaid > 0) {
    current.status = 'Partially Paid';
  } else {
    current.status = 'Pending';
  }

  // Recalculate weekly record for this tenant and week
  const remainingPayments = db.payments.filter(
    p => p.tenantId === current.tenantId && p.weekStart === current.weekStart
  );
  const recIndex = db.weeklyRecords.findIndex(
    r => r.tenantId === current.tenantId && r.weekStart === current.weekStart
  );

  if (recIndex !== -1) {
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const weeklyRent = db.weeklyRecords[recIndex].weeklyRent;

    db.weeklyRecords[recIndex].amountPaid = totalPaid;
    db.weeklyRecords[recIndex].status = totalPaid >= weeklyRent ? 'Received' : (totalPaid > 0 ? 'Partially Paid' : 'Pending');
    db.weeklyRecords[recIndex].paymentDate = current.paymentDate;
  }

  saveDB(db);
  res.json({ success: true, payment: current });
});

// Bulk Delete Payments
app.post('/api/payments/bulk-delete', (req, res) => {
  const { ids } = req.body as { ids: string[] };
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'No payment IDs provided' });
  }

  const affectedWeeks = new Set<string>();

  ids.forEach(id => {
    const pIndex = db.payments.findIndex(p => p.id === id);
    if (pIndex !== -1) {
      const p = db.payments[pIndex];
      affectedWeeks.add(`${p.tenantId}___${p.weekStart}`);
      db.payments.splice(pIndex, 1);
    }
  });

  affectedWeeks.forEach(key => {
    const [tenantId, weekStart] = key.split('___');
    const remainingPayments = db.payments.filter(
      p => p.tenantId === tenantId && p.weekStart === weekStart
    );
    const recIndex = db.weeklyRecords.findIndex(
      r => r.tenantId === tenantId && r.weekStart === weekStart
    );

    if (recIndex !== -1) {
      const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const weeklyRent = db.weeklyRecords[recIndex].weeklyRent;

      if (totalPaid === 0) {
        db.weeklyRecords[recIndex].amountPaid = 0;
        db.weeklyRecords[recIndex].status = 'Pending';
        db.weeklyRecords[recIndex].paymentDate = undefined;
        db.weeklyRecords[recIndex].paymentId = undefined;
      } else {
        db.weeklyRecords[recIndex].amountPaid = totalPaid;
        db.weeklyRecords[recIndex].status = totalPaid >= weeklyRent ? 'Received' : 'Partially Paid';
        db.weeklyRecords[recIndex].paymentDate = remainingPayments[remainingPayments.length - 1].paymentDate;
        db.weeklyRecords[recIndex].paymentId = remainingPayments[remainingPayments.length - 1].id;
      }
    }
  });

  saveDB(db);
  res.json({ success: true, count: ids.length, message: `Successfully deleted ${ids.length} payment record(s)` });
});

// WhatsApp log
app.post('/api/whatsapp-logs', (req, res) => {
  const { tenantId, type, message, paymentId } = req.body;
  const tenant = db.tenants.find(t => t.id === tenantId);

  const log: WhatsAppMessageLog = {
    id: `WA-${Date.now()}`,
    tenantId: tenantId || '',
    tenantName: tenant ? tenant.name : 'Unknown',
    phone: tenant ? tenant.phone : '',
    type: type || 'Receipt',
    message: message || '',
    sentAt: new Date().toISOString(),
    status: 'Sent'
  };

  db.whatsappLogs.push(log);

  if (paymentId) {
    const pIndex = db.payments.findIndex(p => p.id === paymentId);
    if (pIndex !== -1) {
      db.payments[pIndex].whatsappSent = true;
      db.payments[pIndex].whatsappSentAt = new Date().toISOString();
    }
  }

  saveDB(db);
  res.json({ success: true, log });
});

// Outstanding Rent
app.get('/api/outstanding', (req, res) => {
  const current = getCurrentSundaySaturdayWeek();
  const weekStart = (req.query.weekStart as string) || current.weekStart;
  const weekEnd = (req.query.weekEnd as string) || current.weekEnd;

  ensureWeeklyRecordsForWeek(weekStart, weekEnd);

  const outstanding = db.weeklyRecords
    .filter(r => r.weekStart === weekStart && (r.status === 'Overdue' || r.status === 'Pending' || r.status === 'Partially Paid'))
    .map(r => {
      const tenant = db.tenants.find(t => t.id === r.tenantId);
      const amountOutstanding = r.weeklyRent - r.amountPaid;
      return {
        ...r,
        phone: tenant ? tenant.phone : r.phone,
        whatsappNumber: tenant ? tenant.whatsappNumber : r.whatsappNumber,
        amountOutstanding
      };
    });

  res.json(outstanding);
});

// Reports API
app.get('/api/reports', (req, res) => {
  const current = getCurrentSundaySaturdayWeek();
  const weekStart = (req.query.weekStart as string) || current.weekStart;
  const weekEnd = (req.query.weekEnd as string) || current.weekEnd;

  ensureWeeklyRecordsForWeek(weekStart, weekEnd);

  const records = db.weeklyRecords.filter(r => r.weekStart === weekStart);
  const totalTenants = records.length;
  const rentExpected = records.reduce((acc, r) => acc + r.weeklyRent, 0);
  const rentReceived = records.reduce((acc, r) => acc + r.amountPaid, 0);
  const outstanding = Math.max(0, rentExpected - rentReceived);

  const numberPaid = records.filter(r => r.status === 'Received').length;
  const numberUnpaid = records.filter(r => r.status === 'Pending' || r.status === 'Overdue').length;
  const paymentPercentage = rentExpected > 0 ? Math.round((rentReceived / rentExpected) * 100) : 0;

  res.json({
    weekStart,
    weekEnd,
    totalTenants,
    rentExpected,
    rentReceived,
    outstanding,
    numberPaid,
    numberUnpaid,
    paymentPercentage,
    records,
    settings: db.settings
  });
});

// Settings API
app.get('/api/settings', (req, res) => {
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json(db.settings);
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  res.json(db.notifications);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  db.notifications = db.notifications.map(n => n.id === id ? { ...n, read: true } : n);
  saveDB(db);
  res.json({ success: true });
});

// Calendar API
app.get('/api/calendar', (req, res) => {
  // Return records and payments formatted for month calendar
  res.json({
    weeklyRecords: db.weeklyRecords,
    payments: db.payments
  });
});

// ================= VITE & SERVER LAUNCH =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Weekly Rent Management Server listening on http://localhost:${PORT}`);
  });
}

startServer();
