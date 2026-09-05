import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Code-drawn lantern. `stage` 0..4 sets flame size and brightness; the flame and glow flicker
 * gently via Animated unless `still` is set (demo screenshots).
 */
export default function Lantern({ size = 160, stage = 1, still = false }: { size?: number; stage?: 0 | 1 | 2 | 3 | 4; still?: boolean }) {
  const flicker = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== 'web';

  useEffect(() => {
    if (still || stage === 0) return;
    const seq = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(flicker, { toValue: 0.35, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(flicker, { toValue: 0.8, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(flicker, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    seq.start();
    return () => seq.stop();
  }, [flicker, still, stage, native]);

  const W = 120;
  const H = 170;
  const scale = size / H;
  const w = Math.round(W * scale);
  const h = size;

  // Flame geometry by stage
  const flameH = [0, 12, 18, 24, 30][stage];
  const flameW = [0, 7, 10, 13, 16][stage];
  const glowR = [0, 18, 30, 44, 60][stage];
  const glowOpacity = [0, 0.25, 0.4, 0.55, 0.7][stage];
  const bodyGlow = [0, 0.08, 0.16, 0.26, 0.36][stage];

  const fx = 60;
  const fy = 112; // flame base y
  const flamePath = (fh: number, fw: number) =>
    `M ${fx} ${fy} C ${fx - fw} ${fy - fh * 0.35}, ${fx - fw * 0.7} ${fy - fh * 0.85}, ${fx} ${fy - fh} C ${fx + fw * 0.7} ${fy - fh * 0.85}, ${fx + fw} ${fy - fh * 0.35}, ${fx} ${fy} Z`;

  const flameOpacity = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const flameScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] });
  const glowScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });

  return (
    <View style={{ width: w, height: h }}>
      {/* Glow (animated, behind) */}
      {stage > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: flameOpacity, transform: [{ scale: glowScale }] }}
        >
          <Svg width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
            <Defs>
              <RadialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={colors.gold} stopOpacity={glowOpacity} />
                <Stop offset="0.55" stopColor={colors.ember} stopOpacity={glowOpacity * 0.35} />
                <Stop offset="1" stopColor={colors.ember} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={fx} cy={fy - flameH * 0.4} r={glowR} fill="url(#lanternGlow)" />
          </Svg>
        </Animated.View>
      )}

      {/* Lantern body (static) */}
      <Svg width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <RadialGradient id="windowGlow" cx="50%" cy="70%" r="60%">
            <Stop offset="0" stopColor={colors.gold} stopOpacity={bodyGlow} />
            <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* Handle */}
        <Path d="M 40 30 C 40 6, 80 6, 80 30" stroke="#C9A25C" strokeWidth={4} fill="none" strokeLinecap="round" />
        {/* Cap */}
        <Path d="M 44 42 L 50 28 L 70 28 L 76 42 Z" fill="#B58D48" />
        <Rect x={38} y={40} width={44} height={6} rx={3} fill="#D9B267" />
        {/* Body */}
        <Rect x={32} y={46} width={56} height={84} rx={12} fill={colors.surface2} stroke="#C9A25C" strokeWidth={2.5} />
        {/* Window */}
        <Rect x={41} y={55} width={38} height={66} rx={8} fill="#0B0820" />
        <Rect x={41} y={55} width={38} height={66} rx={8} fill="url(#windowGlow)" />
        {/* Bars */}
        <Rect x={59} y={55} width={2} height={66} fill={colors.surface2} opacity={0.9} />
        {/* Wick */}
        <Rect x={58.5} y={fy - 1} width={3} height={5} rx={1} fill="#4A3A2A" />
        {/* Base */}
        <Rect x={28} y={130} width={64} height={10} rx={5} fill="#D9B267" />
        <Rect x={36} y={140} width={48} height={8} rx={4} fill="#B58D48" />
        {/* Ground shadow */}
        <Ellipse cx={60} cy={156} rx={40} ry={5} fill="#000" opacity={0.28} />
      </Svg>

      {/* Flame (animated, on top) */}
      {stage > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: w,
            height: h,
            opacity: flameOpacity,
            transform: [{ translateY: (fy * scale - h / 2) }, { scaleY: flameScale }, { translateY: -(fy * scale - h / 2) }],
          }}
        >
          <Svg width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
            <Path d={flamePath(flameH, flameW)} fill={colors.ember} opacity={0.9} />
            <Path d={flamePath(flameH * 0.68, flameW * 0.62)} fill={colors.gold} />
            <Path d={flamePath(flameH * 0.36, flameW * 0.32)} fill="#FFF3D6" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
