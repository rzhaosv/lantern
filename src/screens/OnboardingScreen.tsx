import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';
import { PrimaryButton, GhostButton, OptionButton, Chip, ProgressDots } from '../components/UI';
import Lantern from '../components/Lantern';
import { useApp } from '../store/AppContext';
import {
  Feeling,
  Duration,
  Tried,
  Slot,
  FEELING_LABELS,
  DURATION_LABELS,
  TRIED_LABELS,
  SLOT_LABELS,
  SLOT_DEFAULT_TIME,
} from '../logic/types';
import { formatTime } from '../logic';

const STEPS = 5;
const TIMES: Record<Slot, string[]> = {
  morning: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'],
  midday: ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00'],
  evening: ['19:00', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'],
};

export default function OnboardingScreen({ onDone, initialStep, still }: { onDone: () => void; initialStep?: number; still?: boolean }) {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(initialStep ?? 0);
  const [feelings, setFeelings] = useState<Feeling[]>([]);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [tried, setTried] = useState<Tried[]>([]);
  const [slot, setSlot] = useState<Slot>('morning');
  const [time, setTime] = useState('07:30');
  const [name, setName] = useState('');

  const toggle = <T,>(list: T[], v: T, set: (l: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canContinue = step === 0 ? feelings.length > 0 : step === 1 ? duration !== null : true;

  const finish = () => {
    completeOnboarding({ feelings, duration, tried, slot, reminderTime: time, remindersEnabled: false, name: name.trim() });
    onDone();
  };

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());
  const back = () => step > 0 && setStep(step - 1);

  const pickSlot = (s: Slot) => {
    setSlot(s);
    setTime(SLOT_DEFAULT_TIME[s]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.top}>
          <ProgressDots count={STEPS} index={step} />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <>
              <Text style={type.label}>First</Text>
              <Text style={styles.q}>What feels off lately?</Text>
              <Text style={[type.bodySoft, { marginTop: 6 }]}>Pick everything that fits. There is no wrong answer and nobody else sees this.</Text>
              <View style={{ gap: 10, marginTop: 22 }}>
                {(Object.keys(FEELING_LABELS) as Feeling[]).map((f) => (
                  <OptionButton key={f} label={FEELING_LABELS[f]} selected={feelings.includes(f)} onPress={() => toggle(feelings, f, setFeelings)} multi />
                ))}
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={type.label}>Second</Text>
              <Text style={styles.q}>How long has it felt like this?</Text>
              <Text style={[type.bodySoft, { marginTop: 6 }]}>A rough sense is enough.</Text>
              <View style={{ gap: 12, marginTop: 22 }}>
                {(Object.keys(DURATION_LABELS) as Duration[]).map((d) => (
                  <OptionButton key={d} label={DURATION_LABELS[d]} selected={duration === d} onPress={() => setDuration(d)} />
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={type.label}>Third</Text>
              <Text style={styles.q}>What have you tried?</Text>
              <Text style={[type.bodySoft, { marginTop: 6 }]}>
                None of these are wrong. Lantern is something different: seven minutes a day, one story, one small thing to do.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {(Object.keys(TRIED_LABELS) as Tried[]).map((t) => (
                  <Chip key={t} text={TRIED_LABELS[t]} selected={tried.includes(t)} onPress={() => toggle(tried, t, setTried)} />
                ))}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={type.label}>Fourth</Text>
              <Text style={styles.q}>When do you have 7 quiet minutes?</Text>
              <Text style={[type.bodySoft, { marginTop: 6 }]}>We will keep that slot for you. You can change it any time.</Text>
              <View style={{ gap: 12, marginTop: 22 }}>
                {(Object.keys(SLOT_LABELS) as Slot[]).map((s) => (
                  <OptionButton key={s} label={SLOT_LABELS[s][0]} sub={SLOT_LABELS[s][1]} selected={slot === s} onPress={() => pickSlot(s)} />
                ))}
              </View>
              <View style={styles.block}>
                <Text style={[type.caption, { marginBottom: 10 }]}>AROUND · {formatTime(time)}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {TIMES[slot].map((t) => (
                    <Chip key={t} text={formatTime(t)} selected={time === t} onPress={() => setTime(t)} />
                  ))}
                </View>
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={type.label}>Last</Text>
              <Text style={styles.q}>What should we call you?</Text>
              <Text style={[type.bodySoft, { marginTop: 6 }]}>Optional. First name, a nickname, or nothing at all.</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="done"
              />
              <View style={{ alignItems: 'center', marginTop: 26 }}>
                <Lantern size={190} stage={1} still={still} />
              </View>
              <Text style={[type.h1, { textAlign: 'center', marginTop: 18 }]}>Day 1 is ready.</Text>
              <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 6 }]}>It won't ask much of you.</Text>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton title={step === STEPS - 1 ? 'Light the lamp' : 'Continue'} onPress={next} disabled={!canContinue} />
          {step > 0 ? <GhostButton title="Back" onPress={back} /> : <View style={{ height: 48 }} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { paddingTop: 14, paddingBottom: 6 },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  q: { ...type.display, fontSize: 30, marginTop: 8 },
  block: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: { paddingHorizontal: 24, paddingBottom: 4 },
});
