import { AppSettings, DayOfWeek } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format currency
export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Clean phone number for WhatsApp wa.me link (e.g. +1 (555) 012-3456 -> 15550123456)
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// Generate WhatsApp Click-to-Chat URL
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

// Format local date object to YYYY-MM-DD string without UTC shift
export function formatToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD safely into local midnight Date
export function parseDateLocal(dateInput?: Date | string): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }
  const str = String(dateInput).trim();
  const ymdPart = str.includes('T') ? str.split('T')[0] : str;
  const parts = ymdPart.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

// Get Sunday (start) and Saturday (end) for any given date string or Date object
export function getWeekRange(dateInput?: Date | string): { weekStart: string; weekEnd: string } {
  const date = parseDateLocal(dateInput);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, 2 is Tuesday ... 6 is Saturday
  
  // Calculate distance to current week's Sunday:
  // If Sunday (0), diff is 0
  // If Monday (1), diff is -1
  // If Tuesday (2), diff is -2
  // If Wednesday (3), diff is -3
  // If Thursday (4), diff is -4
  // If Friday (5), diff is -5
  // If Saturday (6), diff is -6
  const diffToSunday = -day;
  
  const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToSunday, 0, 0, 0, 0);
  const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6, 0, 0, 0, 0);
  
  return {
    weekStart: formatToYMD(sunday),
    weekEnd: formatToYMD(saturday)
  };
}

// Format week range for display: e.g. "10 Aug 2026 – 16 Aug 2026"
export function formatWeekRangeDisplay(weekStartStr: string, weekEndStr: string): string {
  if (!weekStartStr || !weekEndStr) return '';
  const start = parseDateLocal(weekStartStr);
  const end = parseDateLocal(weekEndStr);
  
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const startFormatted = start.toLocaleDateString('en-GB', options);
  const endFormatted = end.toLocaleDateString('en-GB', options);
  
  return `${startFormatted} – ${endFormatted}`;
}

// Shift week start by N weeks
export function shiftWeek(weekStartStr: string, weeks: number): { weekStart: string; weekEnd: string } {
  const start = parseDateLocal(weekStartStr);
  const shifted = new Date(start.getFullYear(), start.getMonth(), start.getDate() + weeks * 7, 0, 0, 0, 0);
  return getWeekRange(shifted);
}

// Format date to human readable e.g. "10/08/2026" or "10 Aug 2026"
export function formatDate(dateStr?: string, style: 'short' | 'medium' = 'short'): string {
  if (!dateStr) return '—';
  const d = parseDateLocal(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  if (style === 'short') {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } else {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

// Template parser for WhatsApp messages
export function parseWhatsAppTemplate(
  template: string,
  data: {
    tenant_name?: string;
    amount?: string | number;
    week_start?: string;
    week_end?: string;
    payment_date?: string;
    room_number?: string;
    due_date?: string;
    currency_symbol?: string;
  }
): string {
  let result = template;
  const symbol = data.currency_symbol || '$';
  
  const replacements: Record<string, string> = {
    '{tenant_name}': data.tenant_name || 'Tenant',
    '{amount}': typeof data.amount === 'number' ? formatCurrency(data.amount, symbol) : (data.amount || '$0'),
    '{week_start}': data.week_start ? formatDate(data.week_start, 'medium') : '',
    '{week_end}': data.week_end ? formatDate(data.week_end, 'medium') : '',
    '{payment_date}': data.payment_date ? formatDate(data.payment_date, 'medium') : formatDate(new Date().toISOString().split('T')[0], 'medium'),
    '{room_number}': data.room_number || 'Room',
    '{due_date}': data.due_date ? formatDate(data.due_date, 'medium') : ''
  };

  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }

  return result;
}

// Calculate days overdue given a due date
export function getDaysOverdue(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const due = parseDateLocal(dueDateStr);
  const today = parseDateLocal(new Date());
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// Calculate prorated 1st week rent based on tenant's move-in / start date
export function calculateFirstWeekRent(
  tenantStartDateStr?: string,
  targetWeekStartStr?: string,
  targetWeekEndStr?: string,
  weeklyRent: number = 0
): {
  isFirstWeek: boolean;
  activeDays: number;
  dailyRate: number;
  calculatedRent: number;
  reason: string;
} {
  if (!tenantStartDateStr || !targetWeekStartStr || !targetWeekEndStr || !weeklyRent) {
    return {
      isFirstWeek: false,
      activeDays: 7,
      dailyRate: Math.round((weeklyRent / 7) * 100) / 100,
      calculatedRent: weeklyRent,
      reason: ''
    };
  }

  const startDate = parseDateLocal(tenantStartDateStr);
  const wStart = parseDateLocal(targetWeekStartStr);
  const wEnd = parseDateLocal(targetWeekEndStr);

  // Check if tenant's start date falls in this selected week
  if (startDate >= wStart && startDate <= wEnd) {
    const msInDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((wEnd.getTime() - startDate.getTime()) / msInDay) + 1;
    const activeDays = Math.max(1, Math.min(7, diffDays));
    const dailyRate = Math.round((weeklyRent / 7) * 100) / 100;
    const calculatedRent = Math.round(((weeklyRent * activeDays) / 7) * 100) / 100;

    return {
      isFirstWeek: true,
      activeDays,
      dailyRate,
      calculatedRent,
      reason: `Tenant started on ${formatDate(tenantStartDateStr, 'medium')}. Living ${activeDays} of 7 days in 1st week.`
    };
  }

  return {
    isFirstWeek: false,
    activeDays: 7,
    dailyRate: Math.round((weeklyRent / 7) * 100) / 100,
    calculatedRent: weeklyRent,
    reason: ''
  };
}

// Export to CSV helper
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF helper using jsPDF & autoTable
export function exportReportToPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  summaryStats?: { label: string; value: string }[]
) {
  const doc = new jsPDF();

  // Header design
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(subtitle, 14, 24);

  let currentY = 36;

  // Summary Cards section if provided
  if (summaryStats && summaryStats.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Overview', 14, currentY);
    currentY += 6;

    const cardWidth = 42;
    const cardHeight = 16;
    let x = 14;

    summaryStats.slice(0, 4).forEach(stat => {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label, x + 4, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(stat.value, x + 4, currentY + 12);

      x += cardWidth + 4;
    });

    currentY += cardHeight + 10;
  }

  // Table
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 10, left: 14, right: 14 },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}
