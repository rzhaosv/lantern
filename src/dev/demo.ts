/**
 * Web-only demo seeding for App Store screenshots.
 *
 * When the app runs on web with `?demo=<name>` in the URL, a canned AppState is written to
 * localStorage under the AsyncStorage key *before* AppContext hydrates, and `demo.screen` /
 * `demo.params` / `demo.onboardStep` tell App.tsx which screen to open.
 *
 * Everything is guarded by `Platform.OS === 'web'`; on iOS/Android `demo` is always `null`.
 */
import { Platform } from 'react-native';
import { AppState, DEFAULT_STATE } from '../logic/types';
import { RootStackParamList } from '../navigation';

const STORAGE_KEY = 'lantern.state.v1';

export type DemoName = 'home' | 'story' | 'practice' | 'anchor' | 'journey' | 'letgo' | 'paywall' | 'onboard' | 'reveal';
const VALID: DemoName[] = ['home', 'story', 'practice', 'anchor', 'journey', 'letgo', 'paywall', 'onboard', 'reveal'];

export type Demo = {
  name: DemoName;
  screen: keyof RootStackParamList | null;
  params: RootStackParamList['Daily'];
  onboardStep: number;
  snap: boolean;
};

const DAY_MS = 86_400_000;

/** Days 1..n completed on consecutive calendar days ending yesterday (so the streak is n). */
function completed(n: number, now: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (let d = 1; d <= n; d++) {
    const at = new Date(now - (n - d + 1) * DAY_MS);
    at.setHours(7, 40, 0, 0);
    out[String(d)] = at.toISOString();
  }
  return out;
}

function base(now: number, doneDays: number, extra: Partial<AppState> = {}): AppState {
  const completedDays = completed(doneDays, now);
  return {
    ...DEFAULT_STATE,
    onboarded: true,
    startedAt: new Date(now - (doneDays + 1) * DAY_MS).toISOString(),
    name: 'Sam',
    feelings: ['foggy', 'stuck'],
    duration: 'months',
    tried: ['meditation', 'exercise'],
    slot: 'morning',
    reminderTime: '07:30',
    remindersEnabled: true,
    currentDay: doneDays + 1,
    completedDays,
    journal: { '2': 'My sister, after the move. She just kept texting until I answered.' },
    practiceCommitted: { '1': true, '2': true },
    moods: [{ at: new Date(now - DAY_MS).toISOString(), value: 2 }],
    stonesDropped: 9,
    revealSeen: doneDays >= 7,
    showSources: false,
    longestStreak: doneDays,
    ...extra,
  };
}

function buildState(name: DemoName, now: number): AppState | null {
  switch (name) {
    case 'onboard':
      return null;
    case 'home':
      return base(now, 8); // Day 9, 8 lamps lit -> flame stage 3, streak 8
    case 'story':
    case 'practice':
    case 'anchor':
      return base(now, 1, { journal: {} }); // Day 2: the lost sheep
    case 'journey':
      return base(now, 8);
    case 'letgo':
      return base(now, 5);
    case 'paywall':
      return base(now, 1);
    case 'reveal':
      return base(now, 6, { revealSeen: false });
  }
}

function screenFor(name: DemoName): { screen: keyof RootStackParamList | null; params: RootStackParamList['Daily'] } {
  switch (name) {
    case 'home':
      return { screen: 'Home', params: undefined };
    case 'story':
      return { screen: 'Daily', params: { day: 2, step: 1 } };
    case 'practice':
      return { screen: 'Daily', params: { day: 2, step: 2 } };
    case 'anchor':
      return { screen: 'Daily', params: { day: 2, step: 4 } };
    case 'journey':
      return { screen: 'Journey', params: undefined };
    case 'letgo':
      return { screen: 'LetGo', params: undefined };
    case 'paywall':
      return { screen: 'Paywall', params: undefined };
    case 'reveal':
      return { screen: 'Daily', params: { day: 7, step: 4, reveal: true } };
    case 'onboard':
      return { screen: null, params: undefined };
  }
}

function read(): Demo | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined' || !window.location || !window.localStorage) return null;
  const params = new URLSearchParams(window.location.search);
  const name = params.get('demo') as DemoName | null;
  if (!name || !VALID.includes(name)) return null;
  const now = Date.now();
  const state = buildState(name, now);
  try {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const { screen, params: p } = screenFor(name);
  return {
    name,
    screen,
    params: p,
    onboardStep: name === 'onboard' ? Number(params.get('step') ?? 0) : 0,
    snap: params.get('snap') === '1',
  };
}

/** Null everywhere except web with `?demo=`. Evaluated once at module load, before hydration. */
export const demo: Demo | null = read();
