import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Animated, Easing, PanResponder, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';
import { PrimaryButton, GhostButton } from '../components/UI';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';
import { getDay } from '../content/days';
import { tap } from '../services/haptics';
import { demo } from '../dev/demo';

const STONE = 92;

type Ripple = { id: number; x: number; anim: Animated.Value };

function Stone({
  label,
  onChange,
  onDrop,
  dropped,
  waterY,
  index,
}: {
  label: string;
  onChange: (t: string) => void;
  onDrop: (x: number) => void;
  dropped: boolean;
  waterY: number;
  index: number;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const sink = useRef(new Animated.Value(dropped ? 1 : 0)).current; // already-dropped stones start sunk
  const xRef = useRef(0);
  const [editing, setEditing] = useState(false);
  const droppedRef = useRef(dropped);
  const editingRef = useRef(editing);
  const waterRef = useRef(waterY);
  const onDropRef = useRef(onDrop);
  droppedRef.current = dropped;
  editingRef.current = editing;
  waterRef.current = waterY;
  onDropRef.current = onDrop;

  const drop = () => {
    if (droppedRef.current) return;
    droppedRef.current = true;
    tap('medium');
    onDropRef.current(xRef.current);
    Animated.parallel([
      Animated.timing(pan.y, { toValue: waterRef.current + 30, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      Animated.timing(sink, { toValue: 1, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: false }),
    ]).start();
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !droppedRef.current && !editingRef.current,
      onMoveShouldSetPanResponder: (_, g) => !droppedRef.current && !editingRef.current && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 40 || (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6)) {
          drop();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  const opacity = sink.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.6, 0] });
  const scale = sink.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] });

  return (
    <Animated.View
      onLayout={(e) => {
        xRef.current = e.nativeEvent.layout.x + STONE / 2;
      }}
      style={[styles.stone, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }], opacity }]}
      {...(dropped ? {} : responder.panHandlers)}
    >
      {editing ? (
        <TextInput
          value={label}
          onChangeText={onChange}
          onBlur={() => setEditing(false)}
          autoFocus
          style={styles.stoneInput}
          multiline
          maxLength={40}
        />
      ) : (
        <Pressable onLongPress={() => setEditing(true)} onPress={drop} disabled={dropped} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.stoneText} numberOfLines={3}>
            {label || `stone ${index + 1}`}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

export default function LetGoScreen({ navigation }: ScreenProps<'LetGo'>) {
  const { state, logStonesDropped } = useApp();
  const day = getDay(state.currentDay);
  const [labels, setLabels] = useState<string[]>([...day.letGo]);
  const [dropped, setDropped] = useState<boolean[]>(demo?.name === 'letgo' ? [true, false, false] : [false, false, false]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [logged, setLogged] = useState(false);
  const stonesTop = 28;
  const waterTop = 210;
  const waterY = waterTop - stonesTop - STONE / 2;
  const allDone = dropped.every(Boolean);

  const onDrop = (i: number, x: number) => {
    const anim = new Animated.Value(0);
    const id = Date.now() + i;
    setRipples((r) => [...r, { id, x, anim }]);
    Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() =>
      setRipples((r) => r.filter((p) => p.id !== id)),
    );
    setDropped((d) => {
      const next = [...d];
      next[i] = true;
      if (next.every(Boolean) && !logged) {
        setLogged(true);
        logStonesDropped(3);
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 70 }}>
          <Text style={styles.back}>‹ Close</Text>
        </Pressable>
        <Text style={[type.caption, { flex: 1, textAlign: 'center', letterSpacing: 1 }]}>LET GO</Text>
        <View style={{ width: 70 }} />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 6 }}>
        <Text style={type.h1}>Three stones</Text>
        <Text style={[type.bodySoft, { marginTop: 4 }]}>Tap a stone to drop it in the water. Hold to rename it.</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={[styles.stones, { top: stonesTop }]}>
          {labels.map((l, i) => (
            <Stone
              key={i}
              index={i}
              label={l}
              dropped={dropped[i]}
              waterY={waterY}
              onChange={(t) => setLabels((ls) => ls.map((x, j) => (j === i ? t : x)))}
              onDrop={(x) => onDrop(i, x)}
            />
          ))}
        </View>

        <View style={[styles.water, { top: waterTop }]}>
          <View style={styles.waterLine} />
          <View style={[styles.wave, { top: 26, opacity: 0.35 }]} />
          <View style={[styles.wave, { top: 62, opacity: 0.22, marginLeft: 40 }]} />
          <View style={[styles.wave, { top: 104, opacity: 0.14 }]} />
          {ripples.map((r) => (
            <Animated.View
              key={r.id}
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  left: r.x - 60,
                  opacity: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                  transform: [{ scaleX: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 2.2] }) }, { scaleY: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.4] }) }],
                },
              ]}
            />
          ))}
          {allDone && (
            <View style={styles.endWrap}>
              <Text style={[type.quote, { textAlign: 'center', fontSize: 22, lineHeight: 32 }]}>Set down.{'\n'}Not solved — set down.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {allDone ? <PrimaryButton title="Back to the lamp" onPress={() => navigation.goBack()} /> : <GhostButton title="Not now" onPress={() => navigation.goBack()} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  back: { color: colors.soft, fontSize: 17, fontWeight: '600' },
  stones: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', zIndex: 2 },
  stone: {
    width: STONE,
    height: STONE,
    borderRadius: STONE / 2,
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  stoneText: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  stoneInput: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center', flex: 1, width: '100%' },
  water: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.water, overflow: 'hidden' },
  waterLine: { height: 2, backgroundColor: colors.water2, opacity: 0.9 },
  wave: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.soft },
  ripple: { position: 'absolute', top: -20, width: 120, height: 40, borderRadius: 60, borderWidth: 1.5, borderColor: colors.gold },
  endWrap: { position: 'absolute', left: 24, right: 24, top: 150 },
  footer: { paddingHorizontal: 24, paddingBottom: 4, paddingTop: 8, backgroundColor: colors.water },
});
