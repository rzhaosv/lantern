import { Platform, TextStyle } from 'react-native';

/** Deep indigo night with a warm lamp. */
export const colors = {
  bg: '#0E0B1F',
  surface: '#1A1533',
  surface2: '#251E45',
  gold: '#F5C26B',
  ember: '#F28C5B',
  soft: '#CFC7EA',
  text: '#FBF7EE',
  muted: '#8F86B3',
  line: 'rgba(251,247,238,0.08)',
  lineStrong: 'rgba(251,247,238,0.16)',
  water: '#0B1633',
  water2: '#132247',
  danger: '#FF8A9B',
  overlay: 'rgba(8,5,20,0.82)',
  /** Text on gold buttons. */
  onGold: '#1E1435',
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

export const space = (n: number) => n * 4;

export const serif = Platform.select({ ios: 'Georgia', default: 'serif' }) as string;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type: Record<string, TextStyle> = {
  display: { fontSize: 32, fontWeight: '700', color: colors.text, letterSpacing: -0.5, fontFamily: serif },
  h1: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.3, fontFamily: serif },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, fontWeight: '400', color: colors.text, lineHeight: 24 },
  bodySoft: { fontSize: 15, fontWeight: '400', color: colors.soft, lineHeight: 22 },
  story: { fontSize: 18, fontWeight: '400', color: colors.text, lineHeight: 30, fontFamily: serif },
  quote: { fontSize: 24, fontWeight: '400', color: colors.text, lineHeight: 34, fontFamily: serif, fontStyle: 'italic' },
  label: { fontSize: 12, fontWeight: '700', color: colors.gold, letterSpacing: 1.4, textTransform: 'uppercase' },
  sub: { fontSize: 13, fontWeight: '500', color: colors.soft },
  caption: { fontSize: 12, fontWeight: '500', color: colors.muted },
  num: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.8, ...tabular },
};
