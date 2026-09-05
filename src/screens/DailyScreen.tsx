import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Animated, Easing, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';
import { PrimaryButton, GhostButton, ProgressBar, Card } from '../components/UI';
import Lantern from '../components/Lantern';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { getDay, REVEAL_DAY, REVEAL_TITLE, REVEAL_BODY, ABOUT_NOTE, TOTAL_DAYS } from '../content/days';
import { completedCount, flameStage } from '../logic';
import { tap } from '../services/haptics';
import { demo } from '../dev/demo';

const STEPS = ['Stillness', 'Story', 'Practice', 'Reflect', 'Anchor'] as const;
const STILL_SECONDS = 60;
const SKIP_AFTER = 20;

/** "The lost sheep — Luke 15" -> "from an old story, The lost sheep, in the book of Luke" */
function footnote(source: string): string {
  const [name, ref] = source.split(' — ');
  const book = (ref ?? '').replace(/[\d\s/]+$/g, '').split(' / ')[0].trim();
  if (!book) return `from an old song, ${name}`;
  return `from an old story, "${name}", in the book of ${book}`;
}

export default function DailyScreen({ navigation, route }: ScreenProps<'Daily'>) {
  const { state, completeDay, saveJournal, setPracticeCommitted, update } = useApp();
  const dayNum = Math.max(1, Math.min(TOTAL_DAYS, route.params?.day ?? state.currentDay));
  const day = getDay(dayNum);
  const key = String(dayNum);
  const still = !!demo?.snap;

  const [step, setStep] = useState(route.params?.step ?? 0);
  const [seconds, setSeconds] = useState(STILL_SECONDS);
  const [journal, setJournal] = useState(state.journal[key] ?? '');
  const [committed, setCommitted] = useState(!!state.practiceCommitted[key]);
  const [carried, setCarried] = useState(false);
  const [showReveal, setShowReveal] = useState(!!route.params?.reveal);
  const [sourcesDraft, setSourcesDraft] = useState(state.showSources);

  const breath = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(route.params?.reveal ? 1 : 0)).current;
  const native = Platform.OS !== 'web';

  // Stillness countdown
  useEffect(() => {
    if (step !== 0 || still) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step, still]);

  // Breathing circle: 4s in, 4s out
  useEffect(() => {
    if (step !== 0 || still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(breath, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [step, still, breath, native]);

  const persist = () => {
    if (journal !== (state.journal[key] ?? '')) saveJournal(dayNum, journal);
    if (committed !== !!state.practiceCommitted[key]) setPracticeCommitted(dayNum, committed);
  };

  const next = () => {
    persist();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => {
    persist();
    if (step === 0) navigation.goBack();
    else setStep((s) => s - 1);
  };

  const carry = () => {
    persist();
    setCarried(true);
    tap('success');
    Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: native }).start();
    completeDay(dayNum);
    if (dayNum === REVEAL_DAY && !state.revealSeen) setTimeout(() => setShowReveal(true), 900);
  };

  const finishReveal = () => {
    update({ revealSeen: true, showSources: sourcesDraft });
    navigation.navigate('Home');
  };

  const elapsed = STILL_SECONDS - seconds;
  const canSkip = elapsed >= SKIP_AFTER || seconds === 0 || still;
  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] });
  const breathLabel = breath.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] });
  const stageAfter = flameStage(completedCount(state) + (state.completedDays[key] ? 0 : 1));
  const showFootnote = state.revealSeen && state.showSources;

  if (showReveal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Lantern size={140} stage={3} still={still} />
          </View>
          <Card style={styles.reveal}>
            <Text style={type.label}>Day 7</Text>
            <Text style={[type.h1, { marginTop: 4 }]}>{REVEAL_TITLE}</Text>
            <Text style={[type.story, { fontSize: 17, lineHeight: 27, marginTop: 14 }]}>{REVEAL_BODY}</Text>
            <View style={styles.divider} />
            <Text style={[type.bodySoft, { fontSize: 14 }]}>{ABOUT_NOTE}</Text>
            <View style={styles.toggleRow}>
              <Text style={[type.body, { fontWeight: '600', flex: 1 }]}>Show me the original sources</Text>
              <Switch value={sourcesDraft} onValueChange={setSourcesDraft} trackColor={{ true: colors.gold, false: colors.surface2 }} thumbColor="#fff" />
            </View>
          </Card>
          <PrimaryButton title="Keep going" onPress={finishReveal} style={{ marginTop: 20 }} />
          <Text style={[type.caption, { textAlign: 'center', marginTop: 12 }]}>You can read this again any time in Settings.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={back} hitSlop={12} style={{ width: 70 }}>
            <Text style={styles.back}>{step === 0 ? '‹ Close' : '‹ Back'}</Text>
          </Pressable>
          <Text style={[type.caption, { flex: 1, textAlign: 'center', letterSpacing: 1 }]}>
            DAY {dayNum} · {STEPS[step].toUpperCase()}
          </Text>
          <View style={{ width: 70 }} />
        </View>
        <ProgressBar value={(step + 1) / STEPS.length} style={{ marginHorizontal: 24, marginTop: 4 }} />

        {step === 0 && (
          <View style={[styles.body, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
            <View style={styles.breathWrap}>
              <Animated.View style={[styles.breathOuter, { transform: [{ scale: breathScale }] }]} />
              <View style={styles.breathInner}>
                <Animated.Text style={[type.caption, { opacity: breathLabel, letterSpacing: 1.5 }]}>BREATHE</Animated.Text>
              </View>
            </View>
            <Text style={[type.quote, { textAlign: 'center', marginTop: 40, paddingHorizontal: 8 }]}>{day.stillnessLine}</Text>
            <Text style={[type.caption, { marginTop: 24 }]}>{seconds > 0 ? `${seconds}s` : 'Ready when you are'}</Text>
          </View>
        )}

        {step === 1 && (
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={type.label}>{day.theme}</Text>
            <Text style={[type.h1, { marginTop: 4, marginBottom: 18 }]}>{day.story.title}</Text>
            {day.story.body.split('\n\n').map((p, i) => (
              <Text key={i} style={[type.story, { marginBottom: 18 }]}>
                {p}
              </Text>
            ))}
            {showFootnote && <Text style={[type.caption, { fontStyle: 'italic', marginTop: 4 }]}>{footnote(day.story.source)}</Text>}
          </ScrollView>
        )}

        {step === 2 && (
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={type.label}>One small thing</Text>
            <Text style={[type.h1, { marginTop: 4 }]}>{day.practice.title}</Text>
            <Card style={{ marginTop: 18 }}>
              <Text style={[type.body, { fontSize: 17, lineHeight: 26 }]}>{day.practice.body}</Text>
            </Card>
            <Pressable
              onPress={() => {
                setCommitted(!committed);
                tap('light');
              }}
              style={[styles.commit, committed && styles.commitActive]}
            >
              <View style={[styles.check, committed && styles.checkActive]}>{committed && <Text style={{ color: colors.onGold, fontWeight: '800' }}>✓</Text>}</View>
              <Text style={[type.body, { fontWeight: '600', flex: 1 }, committed && { color: colors.gold }]}>I'll do this today</Text>
            </Pressable>
            <Text style={[type.caption, { marginTop: 12 }]}>No tracking, no proof needed. Just a decision.</Text>
          </ScrollView>
        )}

        {step === 3 && (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={type.label}>Reflect</Text>
            <Text style={[type.h1, { marginTop: 4, lineHeight: 34 }]}>{day.prompt}</Text>
            <Text style={[type.bodySoft, { marginTop: 10 }]}>
              Write a little, or a lot. If it helps, address it to whoever you believe is listening.
            </Text>
            <TextInput
              value={journal}
              onChangeText={setJournal}
              onBlur={persist}
              multiline
              placeholder="Start anywhere…"
              placeholderTextColor={colors.muted}
              style={styles.journal}
              textAlignVertical="top"
            />
          </ScrollView>
        )}

        {step === 4 && (
          <View style={[styles.body, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
            <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />
            <Lantern size={150} stage={carried ? stageAfter : flameStage(completedCount(state))} still={still} />
            <Text style={[type.label, { marginTop: 26 }]}>Carry this</Text>
            <Text style={[type.quote, { textAlign: 'center', marginTop: 8, fontSize: 28, lineHeight: 38 }]}>{day.anchor}</Text>
            {carried && (
              <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 18 }]}>
                {state.completedDays[key] ? 'Lamp lit. Day ' + dayNum + ' is yours.' : 'Lamp lit.'}
              </Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          {step < 4 ? (
            <PrimaryButton title={step === 0 ? (seconds === 0 ? 'Next' : canSkip ? 'Skip ahead' : `${seconds}s`) : 'Next'} onPress={next} disabled={step === 0 && !canSkip} />
          ) : carried ? (
            <PrimaryButton title="Back to the lamp" onPress={() => navigation.navigate('Home')} />
          ) : (
            <PrimaryButton title="Carry this" onPress={carry} />
          )}
          {step === 0 && !canSkip ? (
            <Text style={[type.caption, { textAlign: 'center', marginTop: 10 }]}>You can skip after {SKIP_AFTER} seconds</Text>
          ) : step > 0 && step < 4 ? (
            <GhostButton title="Back" onPress={back} />
          ) : (
            <View style={{ height: 48 }} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  back: { color: colors.soft, fontSize: 17, fontWeight: '600' },
  body: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 4, paddingTop: 8 },
  breathWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  breathOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(245,194,107,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,107,0.35)',
  },
  breathInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  commit: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  commitActive: { borderColor: colors.gold, backgroundColor: colors.surface2 },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  journal: {
    marginTop: 18,
    minHeight: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: 16,
    color: colors.text,
    fontSize: 17,
    lineHeight: 25,
  },
  glow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(245,194,107,0.14)',
    borderWidth: 40,
    borderColor: 'rgba(242,140,91,0.08)',
  },
  reveal: { marginTop: 18, backgroundColor: colors.surface2, borderColor: 'rgba(245,194,107,0.3)' },
  divider: { height: 1, backgroundColor: colors.lineStrong, marginVertical: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
});
