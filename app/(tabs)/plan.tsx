import React from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { PHASE_INFO } from "@/constants/cycle";

export default function PlanScreen() {
  const router = useRouter();
  const currentPhase = useAppStore((s) => s.currentPhase);
  const profile = useAppStore((s) => s.profile);
  const accentColor = useAppStore((s) => s.accentColor());

  const phase = PHASE_INFO[currentPhase];

  const cycleDay = (() => {
    if (!profile.lastPeriodDate) return profile.cycleDay ?? 1;
    const diff = Math.floor(
      (Date.now() - new Date(profile.lastPeriodDate).getTime()) / 86400000
    );
    return Math.min(Math.max(1, diff + 1), profile.cycleLength);
  })();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.title}>Daily Brief</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/grocery")}
            style={[styles.groceryBtn, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` }]}
          >
            <Ionicons name="cart-outline" size={15} color={accentColor} />
            <Text style={[styles.groceryBtnText, { color: accentColor }]}>Grocery</Text>
          </Pressable>
        </Animated.View>

        {/* Phase card */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <GlowCard style={styles.card}>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
              <View style={styles.phaseText}>
                <Text style={styles.phaseName}>{phase.label}</Text>
                <Text style={styles.phaseDay}>Day {cycleDay} of {profile.cycleLength}</Text>
              </View>
            </View>
            <View style={styles.pillRow}>
              {phase.foodFocus.map((f) => (
                <View key={f} style={styles.pill}>
                  <Text style={styles.pillText}>{f}</Text>
                </View>
              ))}
            </View>
          </GlowCard>
        </Animated.View>

        {/* Easy wins */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <GlowCard style={styles.card}>
            <Text style={styles.sectionTitle}>Easy wins today</Text>
            <Text style={styles.sectionSubtitle}>Whether you're cooking, eating out, or grabbing something quick</Text>
            <View style={styles.winsList}>
              {phase.easyWins.map((win, i) => (
                <View key={i} style={[styles.winRow, i < phase.easyWins.length - 1 && styles.winBorder]}>
                  <View style={[styles.winDot, { backgroundColor: `${accentColor}50` }]} />
                  <Text style={styles.winText}>{win}</Text>
                </View>
              ))}
            </View>
          </GlowCard>
        </Animated.View>

        {/* Try to limit */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <GlowCard style={styles.card}>
            <Text style={styles.sectionTitle}>Try to limit</Text>
            <View style={styles.avoidList}>
              {phase.avoid.map((item, i) => (
                <View key={i} style={styles.avoidRow}>
                  <Ionicons name="remove-circle-outline" size={14} color="#f87171" style={{ marginTop: 1 }} />
                  <Text style={styles.avoidText}>{item}</Text>
                </View>
              ))}
            </View>
          </GlowCard>
        </Animated.View>

        {/* Insight */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <GlowCard style={styles.card}>
            <View style={styles.insightRow}>
              <Ionicons name="bulb-outline" size={16} color={accentColor} />
              <Text style={[styles.insightText, { color: accentColor }]}>{phase.insight}</Text>
            </View>
          </GlowCard>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK_THEME.bg },
  scroll: { padding: 16, paddingTop: 12 },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  date: { fontSize: 12, color: DARK_THEME.textSecondary, marginTop: 3 },
  groceryBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1,
  },
  groceryBtnText: { fontSize: TYPE.sm, fontWeight: "600" },

  card: { marginBottom: 12 },

  phaseRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  phaseEmoji: { fontSize: 28 },
  phaseText: { flex: 1 },
  phaseName: { fontSize: 17, fontWeight: "700", color: DARK_THEME.textPrimary },
  phaseDay: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, marginTop: 2 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)",
  },
  pillText: { fontSize: TYPE.sm, fontWeight: "500", color: "rgba(255,255,255,0.60)" },

  sectionTitle: {
    fontFamily: "Georgia", fontSize: 16,
    color: DARK_THEME.textPrimary, marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginBottom: 14, lineHeight: 16,
  },

  winsList: { gap: 0 },
  winRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 11,
  },
  winBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  winDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  winText: { fontSize: TYPE.body, color: DARK_THEME.textPrimary, flex: 1 },

  avoidList: { gap: 10, marginTop: 10 },
  avoidRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  avoidText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, flex: 1 },

  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  insightText: { flex: 1, fontSize: TYPE.body, lineHeight: 22, fontStyle: "italic" },
});
