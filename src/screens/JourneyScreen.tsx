import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen, Header } from '../components/UI';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { DAYS, TOTAL_DAYS } from '../content/days';
import { completedCount, dayUnlocked, streak } from '../logic';

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function JourneyScreen({ navigation }: ScreenProps<'Journey'>) {
  const { state, isPro } = useApp();
  const done = completedCount(state);
  const s = streak(state.completedDays);

  return (
    <Screen scroll>
      <Header title="Journey" onBack={() => navigation.goBack()} />
      <View style={styles.summary}>
        <Text style={type.h1}>{done} of {TOTAL_DAYS} lamps lit</Text>
        <Text style={[type.sub, { marginTop: 4 }]}>
          {s > 0 ? `${s}-day streak · ` : ''}longest {state.longestStreak}
        </Text>
      </View>

      <View style={{ gap: 10, marginTop: 8 }}>
        {DAYS.map((d) => {
          const key = String(d.day);
          const doneAt = state.completedDays[key];
          const isCurrent = d.day === state.currentDay && !doneAt;
          const unlocked = dayUnlocked(d.day, isPro, state.completedDays);
          const future = !doneAt && !isCurrent;
          const tappable = !!doneAt || isCurrent;
          const onPress = () => {
            if (doneAt) return navigation.navigate('Daily', { day: d.day });
            if (isCurrent) return unlocked ? navigation.navigate('Daily', { day: d.day }) : navigation.navigate('Paywall');
          };
          return (
            <Pressable
              key={key}
              onPress={onPress}
              disabled={!tappable}
              style={({ pressed }) => [styles.row, isCurrent && styles.rowCurrent, future && { opacity: 0.55 }, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.num, doneAt ? styles.numDone : isCurrent ? styles.numCurrent : null]}>
                <Text style={[styles.numText, doneAt && { color: colors.onGold }, isCurrent && { color: colors.gold }]}>{future ? '·' : d.day}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.h3, future && { color: colors.soft }]}>{d.title}</Text>
                <Text style={[type.caption, { marginTop: 2 }]}>{d.theme}</Text>
              </View>
              <Text style={type.caption}>{doneAt ? fmt(doneAt) : isCurrent ? (unlocked ? 'Today' : 'Waiting') : ''}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { paddingVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowCurrent: { borderColor: colors.gold, backgroundColor: colors.surface2 },
  num: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  numDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  numCurrent: { borderColor: colors.gold, backgroundColor: colors.surface },
  numText: { color: colors.soft, fontSize: 15, fontWeight: '800' },
});
