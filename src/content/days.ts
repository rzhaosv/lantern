import { Day, FogCheckIn } from './types';
import { DAYS_1_7 } from './days1';
import { DAYS_8_14 } from './days2';
import { DAYS_15_21 } from './days3';

export * from './types';

export const TOTAL_DAYS = 21;
export const REVEAL_DAY = 7;

/** The 21-day arc, in order. */
export const DAYS: Day[] = [...DAYS_1_7, ...DAYS_8_14, ...DAYS_15_21];

export function getDay(n: number): Day {
  const i = Math.max(1, Math.min(TOTAL_DAYS, Math.round(n))) - 1;
  return DAYS[i];
}

/**
 * Fog check-in responses. Twelve one-liners across the five moods; a random one from the
 * matching mood is shown after a tap. No labels, no lecture.
 */
export const FOG_CHECKINS: FogCheckIn[] = [
  { value: 1, label: 'Foggy', face: '🌫️', line: 'Foggy is allowed. You still showed up, which is the only part that counts today.' },
  { value: 1, label: 'Foggy', face: '🌫️', line: 'You do not have to see the whole road. Just the next few steps are lit.' },
  { value: 1, label: 'Foggy', face: '🌫️', line: 'Fog lifts on its own schedule. Your job is only to keep the lamp burning.' },
  { value: 2, label: 'Low', face: '🌧️', line: 'Low days are honest days. Nothing here needs you to be better than you are.' },
  { value: 2, label: 'Low', face: '🌧️', line: 'It is fine to be down. It is also fine to say "we are not finished yet."' },
  { value: 3, label: 'Okay', face: '🌥️', line: 'Okay is a real place to stand. A lot of good things start from okay.' },
  { value: 3, label: 'Okay', face: '🌥️', line: 'Steady counts. Not every day has to be a breakthrough to be a lamp-lit day.' },
  { value: 3, label: 'Okay', face: '🌥️', line: 'Somewhere in the middle. That is exactly where seven quiet minutes do their best work.' },
  { value: 4, label: 'Clearer', face: '🌤️', line: 'Clearer. Notice it, so you remember what it feels like on a foggier day.' },
  { value: 4, label: 'Clearer', face: '🌤️', line: 'Something is lifting. You did not force it; you just kept showing up.' },
  { value: 5, label: 'Bright', face: '☀️', line: 'Bright. Carry a little of this to someone who is still in the fog today.' },
  { value: 5, label: 'Bright', face: '☀️', line: 'Good. Put it on the stand where people can see it.' },
];

export const MOOD_OPTIONS: { value: 1 | 2 | 3 | 4 | 5; label: string; face: string }[] = [
  { value: 1, label: 'Foggy', face: '🌫️' },
  { value: 2, label: 'Low', face: '🌧️' },
  { value: 3, label: 'Okay', face: '🌥️' },
  { value: 4, label: 'Clearer', face: '🌤️' },
  { value: 5, label: 'Bright', face: '☀️' },
];

export function fogLine(value: number, seed = Date.now()): string {
  const pool = FOG_CHECKINS.filter((c) => c.value === value);
  if (!pool.length) return '';
  return pool[Math.abs(Math.floor(seed / 1000)) % pool.length].line;
}

/** Shown on Day 7 after the anchor, and always from Settings -> About the stories. */
export const REVEAL_TITLE = 'Where the light comes from';
export const REVEAL_BODY =
  'For seven days you have been sitting with stories: a lamp under a bowl, a lost sheep, a quiet field, a son who came home. You may have recognised some of them.\n\nThey are retold from the Bible. Its parables, its psalms, its teachings, put into plain modern language, without the verse numbers or the church words, because we wanted them to reach you before any label did.\n\nNothing about Lantern changes now. The next fourteen days are the same shape: stillness, a story, one small thing to do, a line to carry. You do not have to believe anything to keep going, and you never will.\n\nWe just thought you should know where the light comes from.';

export const ABOUT_NOTE =
  'If you would like to see where each story is drawn from, you can turn on source notes below. They appear as a small line under each story, with the book it comes from, and never anything more.';
