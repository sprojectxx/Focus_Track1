/**
 * Date Utility Functions for FocusTrack (Web & Mobile Parity)
 * Handles local date formatting, comparisons, and month day counts safely
 * without UTC offset drift, incorporating user's IANA timezone.
 */

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Returns today's date in local 'YYYY-MM-DD' format for given timezone.
 */
export function getTodayYMD(timeZone: string = getDeviceTimeZone()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Converts a TIMESTAMPTZ / ISO timestamp string or Date object into a logical 'YYYY-MM-DD'
 * in the specified IANA timezone using Intl.DateTimeFormat('en-CA').
 */
export function getYMDInTimeZone(
  timestamp: string | Date,
  timeZone: string = getDeviceTimeZone()
): string {
  try {
    if (typeof timestamp === 'string') {
      const trimmed = timestamp.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
    }
    const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(dateObj.getTime())) return getTodayYMD(timeZone);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(dateObj);
  } catch {
    return getTodayYMD(timeZone);
  }
}

/**
 * Formats given year, 1-based month, and day into 'YYYY-MM-DD'.
 */
export function formatYMD(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Parses 'YYYY-MM-DD' into local components without UTC timezone shifting.
 */
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

/**
 * Parses 'YYYY-MM-DD' into a local Date object at midnight (00:00:00 local time).
 */
export function parseYMDToLocalDate(dateStr: string): Date | null {
  const parsed = parseYMD(dateStr);
  if (!parsed) return null;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

/**
 * Returns true if dateStr matches today's local 'YYYY-MM-DD'.
 */
export function isToday(dateStr: string, timeZone: string = getDeviceTimeZone()): boolean {
  return dateStr === getTodayYMD(timeZone);
}

/**
 * Returns true if dateStr is strictly before today's local 'YYYY-MM-DD'.
 */
export function isPast(dateStr: string, timeZone: string = getDeviceTimeZone()): boolean {
  return dateStr < getTodayYMD(timeZone);
}

/**
 * Returns true if dateStr is strictly after today's local 'YYYY-MM-DD'.
 */
export function isFuture(dateStr: string, timeZone: string = getDeviceTimeZone()): boolean {
  return dateStr > getTodayYMD(timeZone);
}

/**
 * Returns the exact number of days in a given year and 1-based month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns how many days have elapsed up to today for the specified month/year.
 */
export function getElapsedDaysInMonth(year: number, month: number, timeZone: string = getDeviceTimeZone()): number {
  const todayStr = getTodayYMD(timeZone);
  const parsed = parseYMD(todayStr);
  if (!parsed) return getDaysInMonth(year, month);

  const { year: currentYear, month: currentMonth, day: currentDay } = parsed;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return getDaysInMonth(year, month);
  } else if (year === currentYear && month === currentMonth) {
    return Math.min(currentDay, getDaysInMonth(year, month));
  } else {
    return 0;
  }
}
