export type Story = {
  title: string;
  /** 180-320 words, retold in plain modern language. No proper nouns from the source. */
  body: string;
  /** Hidden field. Shown only as a muted footnote after the Day 7 reveal when `showSources` is on. */
  source: string;
};

export type Practice = {
  title: string;
  body: string;
};

export type Day = {
  day: number;
  title: string;
  theme: string;
  /** Shown during the 60-second stillness breath. */
  stillnessLine: string;
  story: Story;
  practice: Practice;
  /** One reflection question. */
  prompt: string;
  /** A single carryable line, 14 words or fewer. */
  anchor: string;
  /** Three short "stones" for the Let go mini-game. */
  letGo: [string, string, string];
};

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export type FogCheckIn = {
  value: MoodValue;
  label: string;
  face: string;
  /** One-line response after tapping. */
  line: string;
};
