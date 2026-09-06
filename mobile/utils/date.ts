/**
 * Date Utility Functions for FocusTrack Mobile
 * Handles local date formatting, comparisons, and month day counts safely
 * without UTC offset drift.
 */

/**
 * Returns today's date in local 'YYYY-MM-DD' format.
 */
export function getTodayYMD(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
 * Returns true if dateStr matches today's local 'YYYY-MM-DD'.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayYMD();
}

/**
 * Returns true if dateStr is strictly before today's local 'YYYY-MM-DD'.
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getTodayYMD();
}

/**
 * Returns true if dateStr is strictly after today's local 'YYYY-MM-DD'.
 */
export function isFuture(dateStr: string): boolean {
  return dateStr > getTodayYMD();
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
export function getElapsedDaysInMonth(year: number, month: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based
  const currentDay = now.getDate();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return getDaysInMonth(year, month);
  } else if (year === currentYear && month === currentMonth) {
    return Math.min(currentDay, getDaysInMonth(year, month));
  } else {
    return 0;
  }
}

/**
 * Convert Date day (0=Sun, 1=Mon, ..., 6=Sat) to FocusTrack schedule index (0=Mon, ..., 6=Sun)
 */
export function getFocusTrackDayIndex(date: Date): number {
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return (jsDay + 6) % 7; // 0=Mon, 1=Tue, ..., 6=Sun
}
