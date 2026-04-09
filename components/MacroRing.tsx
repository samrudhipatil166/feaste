import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { DARK_THEME } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroRingProps {
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
  size?: number;
}

export function MacroRing({
  value,
  max,
  color,
  label,
  unit,
  size = 72,
}: MacroRingProps) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(pct, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - progress.value),
  }));

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={5}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      </Svg>
      {/* Center text */}
      <View style={[styles.centerText, { width: size, height: size }]}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
  },
  centerText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK_THEME.textPrimary,
  },
  unit: {
    fontSize: 9,
    color: DARK_THEME.textMuted,
    marginTop: 1,
  },
  label: {
    fontSize: 11,
    color: DARK_THEME.textSecondary,
    marginTop: 4,
  },
});
