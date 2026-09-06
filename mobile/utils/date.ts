/**
 * Date Utility Functions for FocusTrack Mobile.
 * Uses the device IANA timezone so the client and Supabase
 * enforce the same local calendar day.
 */

export function getDeviceTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Returns YYYY-MM-DD for the current instant in the requested IANA timezone. */
export function getTodayYMD(timeZone: string = getDeviceTimeZone()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const values: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== 'literal') values[part.type] = part.value;
    }

    if (values.year && values.month && values.day) {
      return `${values.year}-${values.month}-${values.day}`;
    }
  } catch {
    // Invalid timezone or unavailable Intl timezone data: use device-local time.
  }

  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatYMD(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseYMD(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

export function isToday(dateStr: string, timeZone?: string): boolean {
  return dateStr === getTodayYMD(timeZone);
}

export function isPast(dateStr: string, timeZone?: string): boolean {
  return dateStr < getTodayYMD(timeZone);
}

export function isFuture(dateStr: string, timeZone?: string): boolean {
  return dateStr > getTodayYMD(timeZone);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getElapsedDaysInMonth(year: number, month: number): number {
  const today = getTodayYMD();
  const [currentYear, currentMonth, currentDay] = today.split('-').map(Number);

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return getDaysInMonth(year, month);
  } else if (year === currentYear && month === currentMonth) {
    return Math.min(currentDay, getDaysInMonth(year, month));
  }
  return 0;
}

export function getFocusTrackDayIndex(date: Date): number {
  const jsDay = date.getDay();
  return (jsDay + 6) % 7;
}
