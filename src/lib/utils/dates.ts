import { format, differenceInDays, parseISO, isValid, parse } from 'date-fns';
import { it } from 'date-fns/locale';
import { LegalStatus } from '@/types/vehicle';

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return format(parsed, formatStr, { locale: it });
}

export function parseDateInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const d = parse(trimmed, 'dd/MM/yyyy', new Date(), { locale: it });
  if (!isValid(d)) return null;
  return d;
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function calculateLegalStatus(endDate: string): LegalStatus {
  const end = parseISO(endDate);
  if (!isValid(end)) return 'scaduto';
  
  const daysUntilExpiry = differenceInDays(end, new Date());
  
  if (daysUntilExpiry < 0) return 'scaduto';
  if (daysUntilExpiry <= 30) return 'in_scadenza';
  return 'ok';
}

export function getDaysUntilExpiry(endDate: string): number {
  const end = parseISO(endDate);
  if (!isValid(end)) return -999;
  return differenceInDays(end, new Date());
}

export function formatCurrency(amount: number, currency: string = '€'): string {
  return `${currency} ${amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('it-IT')} km`;
}
