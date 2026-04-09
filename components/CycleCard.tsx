import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { PHASE_INFO } from "@/constants/cycle";
import { DARK_THEME } from "@/constants/theme";
import { GlowCard } from "./GlowCard";


export function CycleCard() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const currentPhase = useAppStore((s) => s.currentPhase);
  const currentCycleDay = useAppStore((s) => s.currentCycleDay());
  const phase = PHASE_INFO[currentPhase];
  const progress = currentCycleDay / profile.cycleLength;

  // Pulsing emoji
  const emojiScale = useSharedValue(1);
  useEffect(() => {
    emojiScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  return (
    <GlowCard glowColor={phase.color}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.Text style={[styles.emoji, emojiStyle]}>
            {phase.emoji}
          </Animated.Text>
          <View>
            <Text style={[styles.phaseLabel, { color: phase.color }]}>
              {phase.label}
            </Text>
            <Text style={styles.dayLabel}>
              Day {currentCycleDay} of {profile.cycleLength}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push("/period-log")}
            style={[styles.iconBtn, { backgroundColor: `${phase.color}15`, borderColor: `${phase.color}25` }]}
          >
            <Ionicons name="calendar-outline" size={14} color={phase.color} />
          </Pressable>
        </View>
      </View>

      {/* Progress bar — markers at real phase boundaries: 18%, 50%, 60% */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: phase.color,
              shadowColor: phase.color,
            },
          ]}
        />
        {[0.18, 0.5, 0.6].map((p) => (
          <View
            key={p}
            style={[styles.progressMarker, { left: `${p * 100}%` as any }]}
          />
        ))}
      </View>

      {/* Phase minimap — labels centered on each phase segment */}
      <View style={[styles.phaseRow, { position: "relative", height: 16 }]}>
        {([
          { label: "🌺 Men", mid: 0.09 },
          { label: "🌱 Foll", mid: 0.34 },
          { label: "✨ Ovu", mid: 0.55 },
          { label: "🌙 Lut", mid: 0.8 },
        ] as const).map(({ label, mid }) => (
          <Text
            key={label}
            style={[
              styles.phaseMinilabel,
              {
                position: "absolute",
                left: `${mid * 100}%` as any,
                transform: [{ translateX: -18 }],
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Food focus pills */}
      <View style={styles.pillRow}>
        {phase.foodFocus.map((f, i) => (
          <View
            key={f}
            style={[styles.pill, { backgroundColor: `${phase.color}15`, borderColor: `${phase.color}25` }]}
          >
            <Text style={[styles.pillText, { color: phase.color }]}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Expanded content */}
      <View style={styles.expandedContent}>
        <View style={styles.expandDivider} />
        {/* Eat */}
        <View style={styles.expandSection}>
          <Text style={styles.eatLabel}>✅ Focus on eating</Text>
          <View style={styles.pillRow}>
            {phase.eat.map((f) => (
              <View key={f} style={styles.eatPill}>
                <Text style={styles.eatPillText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Avoid */}
        <View style={[styles.expandSection, { marginTop: 12 }]}>
          <Text style={styles.avoidLabel}>⚠️ Try to limit</Text>
          <View style={styles.pillRow}>
            {phase.avoid.map((f) => (
              <View key={f} style={styles.avoidPill}>
                <Text style={styles.avoidPillText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 28,
  },
  phaseLabel: {
    fontFamily: "Georgia",
    fontSize: 15,
    fontWeight: "600",
  },
  dayLabel: {
    fontSize: 12,
    color: DARK_THEME.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginBottom: 8,
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  progressMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  phaseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  phaseMinilabel: {
    fontSize: 10,
    color: DARK_THEME.textMuted,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "500",
  },
  expandedContent: {
    marginTop: 4,
  },
  expandDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 12,
  },
  expandSection: {},
  eatLabel: {
    fontSize: 12,
    color: "#8A9E98",
    marginBottom: 8,
  },
  eatPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(138,158,152,0.10)",
  },
  eatPillText: {
    fontSize: 11,
    color: "#8A9E98",
  },
  avoidLabel: {
    fontSize: 12,
    color: "#9E8A8A",
    marginBottom: 8,
  },
  avoidPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(158,138,138,0.10)",
  },
  avoidPillText: {
    fontSize: 11,
    color: "#9E8A8A",
  },
});
