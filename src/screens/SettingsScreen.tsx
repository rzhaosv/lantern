import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Switch, TextInput, Alert, Modal } from 'react-native';
import { Screen, Header, PrimaryButton, Card, Chip } from '../components/UI';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { restore } from '../services/billing';
import { ScreenProps } from '../navigation';
import { SITE } from './PaywallScreen';
import { formatTime } from '../logic';

function Row({ label, value, onPress, danger }: { label: string; value?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[type.body, { fontWeight: '600' }, danger && { color: colors.danger }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text style={type.sub}>{value}</Text> : null}
        <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
}

const HOURS = [6, 7, 8, 9, 12, 13, 18, 20, 21, 22];
const MINUTES = [0, 15, 30, 45];

export default function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const { state, isPro, setPro, update, setReminders, setReminderTime, resetAll } = useApp();
  const [nameOpen, setNameOpen] = useState(false);
  const [draft, setDraft] = useState(state.name);
  const [timeOpen, setTimeOpen] = useState(false);
  const [h, m] = state.reminderTime.split(':').map(Number);

  const onReminders = async (v: boolean) => {
    const ok = await setReminders(v);
    if (v && !ok) Alert.alert('Notifications are off', 'Enable notifications for Lantern in iOS Settings to get a daily reminder.');
  };

  const onReset = () =>
    Alert.alert('Reset everything?', 'This clears your journey, journal and settings. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetAll() },
    ]);

  const setTime = (hour: number, minute: number) => setReminderTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);

  return (
    <Screen scroll>
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <Card style={{ marginTop: 8 }}>
        <Text style={type.label}>Plan</Text>
        <Text style={[type.h2, { marginTop: 6 }]}>{isPro ? 'Lantern · all 21 days' : 'Free · Day 1'}</Text>
        {!isPro && <PrimaryButton title="Start free trial" onPress={() => navigation.navigate('Paywall')} style={{ marginTop: 14, height: 46 }} />}
      </Card>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>YOU</Text>
      <View style={styles.group}>
        <Row
          label="Name"
          value={state.name || 'Not set'}
          onPress={() => {
            setDraft(state.name);
            setNameOpen(true);
          }}
        />
        <Row label="About the stories" onPress={() => navigation.navigate('About')} />
      </View>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>REMINDER</Text>
      <View style={styles.group}>
        <Row label="Time" value={formatTime(state.reminderTime)} onPress={() => setTimeOpen(true)} />
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { fontWeight: '600' }]}>Daily reminder</Text>
            <Text style={type.caption}>"Your 7 minutes are ready", once a day</Text>
          </View>
          <Switch value={state.remindersEnabled} onValueChange={onReminders} trackColor={{ true: colors.gold, false: colors.surface2 }} thumbColor="#fff" />
        </View>
      </View>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>SUBSCRIPTION</Text>
      <View style={styles.group}>
        <Row
          label="Restore purchases"
          onPress={async () => {
            const ok = await restore().catch(() => false);
            if (ok) setPro(true);
            else Alert.alert('Nothing to restore', 'No active subscription was found for this Apple ID.');
          }}
        />
        <Row label="Manage subscription" onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')} />
        <Row label="Privacy policy" onPress={() => Linking.openURL(`${SITE}/privacy.html`)} />
        <Row label="Terms of use" onPress={() => Linking.openURL(`${SITE}/terms.html`)} />
        <Row label="Support" onPress={() => Linking.openURL('mailto:ray@thezenithlabs.com?subject=Lantern%20support')} />
      </View>

      <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>DANGER ZONE</Text>
      <View style={styles.group}>
        <Row label="Reset everything" onPress={onReset} danger />
      </View>

      <Text style={[type.caption, { marginTop: 20, lineHeight: 17 }]}>
        Lantern is a daily reflection companion, not therapy or medical care. If you are in crisis or thinking about harming
        yourself, please contact local emergency services or a crisis line now. Everything you write stays on this phone.
      </Text>

      <Modal visible={nameOpen} transparent animationType="fade" onRequestClose={() => setNameOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setNameOpen(false)} />
        <View style={styles.sheet}>
          <Text style={type.h3}>Your name</Text>
          <TextInput value={draft} onChangeText={setDraft} autoFocus style={styles.input} placeholder="Optional" placeholderTextColor={colors.muted} />
          <PrimaryButton
            title="Save"
            onPress={() => {
              update({ name: draft.trim() });
              setNameOpen(false);
            }}
            style={{ marginTop: 14 }}
          />
          <Pressable onPress={() => setNameOpen(false)} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={type.sub}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={timeOpen} transparent animationType="fade" onRequestClose={() => setTimeOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setTimeOpen(false)} />
        <View style={styles.sheet}>
          <Text style={type.h3}>Reminder · {formatTime(state.reminderTime)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {HOURS.map((hh) => (
              <Chip key={hh} text={formatTime(`${String(hh).padStart(2, '0')}:00`).replace(':00', '')} selected={h === hh} onPress={() => setTime(hh, m)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {MINUTES.map((mm) => (
              <Chip key={mm} text={`:${String(mm).padStart(2, '0')}`} selected={m === mm} onPress={() => setTime(h, mm)} />
            ))}
          </View>
          <PrimaryButton title="Done" onPress={() => setTimeOpen(false)} style={{ marginTop: 18 }} />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 10,
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 22,
    paddingBottom: 30,
  },
  input: {
    marginTop: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
