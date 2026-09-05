export type Feeling = 'foggy' | 'low' | 'numb' | 'restless' | 'stuck' | 'lonely' | 'tired';
export type Duration = 'weeks' | 'months' | 'longer';
export type Tried = 'therapy' | 'meds' | 'exercise' | 'meditation' | 'nothing' | 'everything';
export type Slot = 'morning' | 'midday' | 'evening';

export type Mood = { at: string; value: number };

export type AppState = {
  onboarded: boolean;
  startedAt: string;
  name: string;
  feelings: Feeling[];
  duration: Duration | null;
  tried: Tried[];
  slot: Slot;
  /** "HH:MM" 24h. */
  reminderTime: string;
  remindersEnabled: boolean;
  /** 1..21: the day the user is currently on (the first not-yet-completed day, capped at 21). */
  currentDay: number;
  /** day -> ISO date completed. */
  completedDays: Record<string, string>;
  journal: Record<string, string>;
  practiceCommitted: Record<string, boolean>;
  moods: Mood[];
  stonesDropped: number;
  revealSeen: boolean;
  showSources: boolean;
  longestStreak: number;
};

export const DEFAULT_STATE: AppState = {
  onboarded: false,
  startedAt: new Date(0).toISOString(),
  name: '',
  feelings: [],
  duration: null,
  tried: [],
  slot: 'morning',
  reminderTime: '07:30',
  remindersEnabled: false,
  currentDay: 1,
  completedDays: {},
  journal: {},
  practiceCommitted: {},
  moods: [],
  stonesDropped: 0,
  revealSeen: false,
  showSources: false,
  longestStreak: 0,
};

export const FEELING_LABELS: Record<Feeling, string> = {
  foggy: 'Foggy',
  low: 'Low',
  numb: 'Numb',
  restless: 'Restless',
  stuck: 'Stuck',
  lonely: 'Lonely',
  tired: 'Tired of trying',
};

export const DURATION_LABELS: Record<Duration, string> = {
  weeks: 'Weeks',
  months: 'Months',
  longer: 'Longer than I would like to say',
};

export const TRIED_LABELS: Record<Tried, string> = {
  therapy: 'Therapy',
  meds: 'Medication',
  exercise: 'Exercise',
  meditation: 'Meditation apps',
  nothing: 'Nothing yet',
  everything: 'Everything',
};

export const SLOT_LABELS: Record<Slot, [string, string]> = {
  morning: ['Morning', 'Before the day starts asking things of you'],
  midday: ['Midday', 'A pause in the middle'],
  evening: ['Evening', 'When it is finally quiet'],
};

export const SLOT_DEFAULT_TIME: Record<Slot, string> = {
  morning: '07:30',
  midday: '12:30',
  evening: '21:00',
};
