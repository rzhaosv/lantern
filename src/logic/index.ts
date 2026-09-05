import { AppState } from './types';
import { TOTAL_DAYS } from '../content/days';

export * from './types';

/** YYYY-MM-DD in local time. */
export function dateKey(t: number | Date = Date.now()): string {
  const d = typeof t === 'number' ? new Date(t) : t;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dateKey(dt);
}

export function completedCount(state: AppState): number {
  return Object.keys(state.completedDays).length;
}

/**
 * Flame stage 0..4 from the number of lamps lit. 0 = unlit (nothing done), 1 = a spark (1-3),
 * 2 = a small flame (4-7), 3 = a steady flame (8-14), 4 = a bright lamp (15-21).
 */
export function flameStage(completed: number): 0 | 1 | 2 | 3 | 4 {
  if (completed <= 0) return 0;
  if (completed <= 3) return 1;
  if (completed <= 7) return 2;
  if (completed <= 14) return 3;
  return 4;
}

export const FLAME_NAMES = ['Unlit', 'A spark', 'A small flame', 'A steady flame', 'A bright lamp'] as const;

/** Consecutive calendar days with a completion, ending today or yesterday. */
export function streak(completedDays: Record<string, string>, now = Date.now()): number {
  const days = new Set(Object.values(completedDays).map((iso) => dateKey(new Date(iso))));
  if (days.size === 0) return 0;
  let key = dateKey(now);
  if (!days.has(key)) {
    key = addDaysKey(key, -1);
    if (!days.has(key)) return 0;
  }
  let n = 0;
  while (days.has(key)) {
    n++;
    key = addDaysKey(key, -1);
  }
  return n;
}

export type TodayStatus = 'not-started' | 'in-progress' | 'done' | 'complete';

/**
 * Status of the current day. `in-progress` when the user has saved journal text or a practice
 * commitment for the current day without finishing it; `complete` when all 21 lamps are lit.
 */
export function todayStatus(state: AppState, now = Date.now()): TodayStatus {
  const d = String(state.currentDay);
  if (completedCount(state) >= TOTAL_DAYS) return 'complete';
  if (completedToday(state, now)) return 'done';
  if (state.journal[d] || state.practiceCommitted[d]) return 'in-progress';
  return 'not-started';
}

/** Day number of the most recently completed day, or null. */
export function latestCompletedDay(completedDays: Record<string, string>): number | null {
  let latest: number | null = null;
  let latestAt = '';
  for (const [d, at] of Object.entries(completedDays)) {
    if (at > latestAt) {
      latestAt = at;
      latest = Number(d);
    }
  }
  return latest;
}

/** The first day (1..21) that is not completed; 21 when everything is done. */
export function nextDay(completedDays: Record<string, string>): number {
  for (let d = 1; d <= TOTAL_DAYS; d++) if (!completedDays[String(d)]) return d;
  return TOTAL_DAYS;
}

/** Whether the day was completed today (so Home says "Revisit" rather than moving on). */
export function completedToday(state: AppState, now = Date.now()): boolean {
  const today = dateKey(now);
  return Object.values(state.completedDays).some((iso) => dateKey(new Date(iso)) === today);
}

/** A day is available when it is Day 1, or the user is Pro, or it is already completed. */
export function dayUnlocked(day: number, isPro: boolean, completedDays: Record<string, string>): boolean {
  if (day === 1 || isPro) return true;
  return !!completedDays[String(day)];
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 7, minute: Number.isFinite(m) ? m : 30 };
}

export function lastMood(state: AppState, now = Date.now()): number | null {
  const today = dateKey(now);
  const m = [...state.moods].reverse().find((x) => dateKey(new Date(x.at)) === today);
  return m ? m.value : null;
}
