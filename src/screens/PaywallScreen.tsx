import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { colors, radius, type } from '../theme';
import { PrimaryButton } from '../components/UI';
import Lantern from '../components/Lantern';
import { getPackages, purchase, restore, isCancelledError } from '../services/billing';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { demo } from '../dev/demo';

export const SITE = 'https://tryforma.app/lantern';

const BENEFITS: [string, string][] = [
  ['A 7-minute daily ritual', 'Stillness, a story, one small practice, a line to carry.'],
  ['21 stories that meet you where you are', 'Old stories, told plainly, for foggy and low days.'],
  ['Practices you can actually do', 'Rest twenty minutes. Text one thank-you. Walk ten minutes.'],
  ['A flame that grows with you', 'Every lamp you light makes the next day brighter.'],
];

type Plan = { id: string; title: string; sub: string; price: string; period: 'year' | 'month'; pkg: PurchasesPackage | null; best?: boolean };

export default function PaywallScreen({ navigation, route }: ScreenProps<'Paywall'>) {
  const { setPro } = useApp();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fromOnboarding = route.params?.fromOnboarding;

  useEffect(() => {
    getPackages().then((p) => {
      const annual = p.find((x) => x.packageType === 'ANNUAL' || x.identifier === '$rc_annual');
      const monthly = p.find((x) => x.packageType === 'MONTHLY' || x.identifier === '$rc_monthly');
      const list: Plan[] = [];
      if (annual) list.push({ id: annual.identifier, title: 'Yearly', sub: '7-day free trial, then yearly', price: annual.product.priceString, period: 'year', pkg: annual, best: true });
      if (monthly) list.push({ id: monthly.identifier, title: 'Monthly', sub: '7-day free trial, then monthly', price: monthly.product.priceString, period: 'month', pkg: monthly });
      // Web demo only: show representative plans so the screen can be captured.
      if (list.length === 0 && demo) {
        list.push({ id: '$rc_annual', title: 'Yearly', sub: '7-day free trial, then yearly', price: '$29.99', period: 'year', pkg: null, best: true });
        list.push({ id: '$rc_monthly', title: 'Monthly', sub: '7-day free trial, then monthly', price: '$5.99', period: 'month', pkg: null });
      }
      setPlans(list);
      setSelected(list[0]?.id ?? null);
      setLoaded(true);
    });
  }, []);

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Home');
  };

  const current = plans.find((p) => p.id === selected) ?? null;

  const onSubscribe = async () => {
    if (!current?.pkg) {
      Alert.alert('Not available yet', 'Plans could not be loaded right now. Please check your connection and try again.');
      return;
    }
    setBusy(true);
    try {
      const ok = await purchase(current.pkg);
      if (ok) {
        setPro(true);
        close();
      }
    } catch (e) {
      if (!isCancelledError(e)) Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const ok = await restore();
      if (ok) {
        setPro(true);
        close();
      } else {
        Alert.alert('Nothing to restore', 'No active subscription was found for this Apple ID.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {!fromOnboarding && (
        <Pressable onPress={close} hitSlop={12} style={styles.close}>
          <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '600' }}>✕</Text>
        </Pressable>
      )}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <Lantern size={150} stage={3} still={!!demo?.snap} />
        </View>
        <Text style={[type.display, { textAlign: 'center', marginTop: 10, fontSize: 30 }]}>Light one small lamp a day</Text>
        <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 8 }]}>
          Seven minutes. Twenty-one days. A way out of the fog that does not ask you to try harder.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map(([label, sub]) => (
            <View key={label} style={styles.benefitRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={type.h3}>{label}</Text>
                <Text style={[type.sub, { marginTop: 2 }]}>{sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 12, marginTop: 4 }}>
          {!loaded ? (
            <Text style={[type.caption, { textAlign: 'center' }]}>Loading plans…</Text>
          ) : plans.length === 0 ? (
            <View style={styles.plan}>
              <Text style={[type.bodySoft, { textAlign: 'center', flex: 1 }]}>
                Plans are not available right now. Day 1 is always free; please try again later.
              </Text>
            </View>
          ) : (
            plans.map((p) => {
              const active = p.id === selected;
              return (
                <Pressable key={p.id} onPress={() => setSelected(p.id)} style={[styles.plan, active && styles.planActive]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={type.h3}>{p.title}</Text>
                      {p.best && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Best value</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[type.caption, { marginTop: 3 }]}>{p.sub}</Text>
                  </View>
                  <Text style={[type.h3, { color: active ? colors.text : colors.soft }]}>
                    {p.price}
                    <Text style={type.caption}>/{p.period}</Text>
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        <PrimaryButton title="Start my 7-day free trial" onPress={onSubscribe} loading={busy} disabled={!selected} style={{ marginTop: 20 }} />
        <Text style={[type.caption, { textAlign: 'center', marginTop: 12, lineHeight: 17 }]}>
          {current
            ? `Free for 7 days, then ${current.price}/${current.period}. Cancel anytime in Settings.`
            : 'Free for 7 days, then the plan price. Cancel anytime in Settings.'}
          {' '}Payment is charged to your Apple ID after the trial. Subscriptions auto-renew unless cancelled at least 24 hours
          before the end of the current period.
        </Text>

        <View style={styles.links}>
          <Pressable onPress={onRestore}><Text style={styles.link}>Restore</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/terms.html`)}><Text style={styles.link}>Terms</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/privacy.html`)}><Text style={styles.link}>Privacy</Text></Pressable>
        </View>

        <Pressable onPress={close} style={{ alignItems: 'center', marginTop: 18, paddingVertical: 8 }}>
          <Text style={[type.sub, { color: colors.muted }]}>Just show me Day 1</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  close: { position: 'absolute', top: 54, right: 20, zIndex: 5, padding: 6 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30 },
  benefits: { marginTop: 24, marginBottom: 22, gap: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginTop: 7 },
  plan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: 10,
  },
  planActive: { borderColor: colors.gold, backgroundColor: colors.surface2 },
  badge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: colors.onGold, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 20 },
  link: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
