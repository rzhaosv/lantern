import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen, PrimaryButton, SecondaryButton, Card, StatTile } from '../components/UI';
import Lantern from '../components/Lantern';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { getDay, MOOD_OPTIONS, fogLine, TOTAL_DAYS } from '../content/days';
import { completedCount, flameStage, FLAME_NAMES, streak, todayStatus, lastMood, dayUnlocked, latestCompletedDay } from '../logic';
import { demo } from '../dev/demo';

function greeting(name: string) {
  const h = new Date().getHours();
  const g = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${g}, ${name}` : g;
}

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { state, isPro, logMood } = useApp();
  const [moodLine, setMoodLine] = useState<string | null>(demo?.name === 'home' ? fogLine(3, 1000) : null);
  const [moodPick, setMoodPick] = useState<number | null>(demo?.name === 'home' ? 3 : lastMood(state));

  const status = todayStatus(state);
  const latest = latestCompletedDay(state.completedDays);
  const showDay = status === 'done' && latest ? latest : state.currentDay;
  const day = getDay(showDay);
  const done = completedCount(state);
  const stage = flameStage(done);
  const s = streak(state.completedDays);
  const unlocked = dayUnlocked(state.currentDay, isPro, state.completedDays);
  const allDone = status === 'complete';

  const statusText =
    status === 'complete' ? 'All 21 lamps lit' : status === 'done' ? 'Done for today' : status === 'in-progress' ? 'In progress' : 'Not started';

  const ctaTitle = allDone
    ? 'Revisit any day'
    : status === 'done'
      ? 'Revisit today'
      : !unlocked
        ? `Unlock Day ${state.currentDay}`
        : status === 'in-progress'
          ? "Continue today's light"
          : "Begin today's light";

  const onCta = () => {
    if (allDone) return navigation.navigate('Journey');
    if (status === 'done') return navigation.navigate('Daily', { day: showDay });
    if (!unlocked) return navigation.navigate('Paywall');
    navigation.navigate('Daily', { day: state.currentDay });
  };

  const onMood = (v: number) => {
    setMoodPick(v);
    logMood(v);
    setMoodLine(fogLine(v));
  };

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.navigate('Journey')} hitSlop={10}>
          <Text style={styles.topLink}>Journey</Text>
        </Pressable>
        <Text style={[type.caption, { letterSpacing: 1.6 }]}>LANTERN</Text>
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10}>
          <Text style={styles.topLink}>Settings</Text>
        </Pressable>
      </View>

      <Text style={[type.sub, { textAlign: 'center', marginTop: 8 }]}>{greeting(state.name)}</Text>

      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Lantern size={200} stage={stage} still={!!demo?.snap} />
        <Text style={[type.caption, { marginTop: 4 }]}>{FLAME_NAMES[stage]}</Text>
      </View>

      <Card style={{ marginTop: 16 }}>
        <Text style={type.label}>
          Day {showDay} of {TOTAL_DAYS} · {day.title}
        </Text>
        <Text style={[type.h1, { marginTop: 4 }]}>{day.theme}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              status === 'done' || allDone ? { backgroundColor: colors.gold } : status === 'in-progress' ? { backgroundColor: colors.ember } : null,
            ]}
          />
          <Text style={type.sub}>{statusText}</Text>
        </View>
        {!unlocked && status !== 'done' && (
          <View style={styles.lock}>
            <Text style={[type.body, { fontWeight: '600' }]}>Day {state.currentDay} is waiting</Text>
            <Text style={[type.caption, { marginTop: 2 }]}>Start a free trial to keep the lamp going.</Text>
          </View>
        )}
        <PrimaryButton title={ctaTitle} onPress={onCta} style={{ marginTop: 16 }} />
      </Card>

      {(status === 'done' || allDone) && latest && (
        <Card style={styles.carry}>
          <Text style={type.label}>Carry line</Text>
          <Text style={[type.quote, { fontSize: 20, lineHeight: 28 }]}>{getDay(latest).anchor}</Text>
        </Card>
      )}

      <Card style={{ marginTop: 12 }}>
        <Text style={type.label}>Fog check-in</Text>
        <Text style={[type.bodySoft, { marginTop: 2 }]}>How is the fog right now?</Text>
        <View style={styles.moods}>
          {MOOD_OPTIONS.map((m) => {
            const active = moodPick === m.value;
            return (
              <Pressable key={m.value} onPress={() => onMood(m.value)} style={[styles.mood, active && styles.moodActive]}>
                <Text style={{ fontSize: 24 }}>{m.face}</Text>
                <Text style={[type.caption, { marginTop: 4 }, active && { color: colors.gold }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {moodLine ? <Text style={[type.bodySoft, { marginTop: 12, fontStyle: 'italic' }]}>{moodLine}</Text> : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <StatTile label="STREAK" value={`${s} day${s === 1 ? '' : 's'}`} sub={state.longestStreak > s ? `best ${state.longestStreak}` : undefined} color={colors.gold} />
        <StatTile label="LAMPS LIT" value={`${done} / ${TOTAL_DAYS}`} />
        <StatTile label="SET DOWN" value={String(state.stonesDropped)} sub="stones" />
      </View>

      <SecondaryButton title="Let go of something" onPress={() => navigation.navigate('LetGo')} style={{ marginTop: 12 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  topLink: { color: colors.soft, fontSize: 15, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.muted },
  lock: {
    marginTop: 14,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  carry: { marginTop: 12, backgroundColor: colors.surface2, borderColor: 'rgba(245,194,107,0.25)' },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 4 },
  mood: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  moodActive: { backgroundColor: colors.surface2, borderColor: colors.gold },
});
