import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Screen, Header, Card } from '../components/UI';
import { colors, type } from '../theme';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { DAYS, REVEAL_TITLE, REVEAL_BODY, ABOUT_NOTE } from '../content/days';

export default function AboutScreen({ navigation }: ScreenProps<'About'>) {
  const { state, update } = useApp();
  return (
    <Screen scroll>
      <Header title="About the stories" onBack={() => navigation.goBack()} />
      <Card style={{ marginTop: 8, backgroundColor: colors.surface2, borderColor: 'rgba(245,194,107,0.3)' }}>
        <Text style={[type.h1]}>{REVEAL_TITLE}</Text>
        <Text style={[type.story, { fontSize: 17, lineHeight: 27, marginTop: 14 }]}>{REVEAL_BODY}</Text>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[type.bodySoft, { fontSize: 14 }]}>{ABOUT_NOTE}</Text>
        <View style={styles.toggleRow}>
          <Text style={[type.body, { fontWeight: '600', flex: 1 }]}>Show source notes under stories</Text>
          <Switch
            value={state.showSources}
            onValueChange={(v) => update({ showSources: v, revealSeen: true })}
            trackColor={{ true: colors.gold, false: colors.surface2 }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {state.showSources && (
        <Card style={{ marginTop: 12 }}>
          <Text style={type.label}>The 21 sources</Text>
          {DAYS.map((d) => (
            <View key={d.day} style={styles.srcRow}>
              <Text style={[type.caption, { width: 44 }]}>Day {d.day}</Text>
              <Text style={[type.sub, { flex: 1 }]}>{d.story.source}</Text>
            </View>
          ))}
        </Card>
      )}

      <Text style={[type.caption, { marginTop: 20, lineHeight: 17 }]}>
        Every story in Lantern is a retelling, not a translation. The words are ours; the shape of each story is old. We use
        no verse references anywhere in the daily flow, and we never ask you to believe anything to use the app.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  srcRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
});
