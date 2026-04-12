import React, { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { ACCENT, DARK_THEME, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { PHASE_INFO, getPhaseForDay, PHASE_VITAMINS, PCOS_VITAMINS, PHASE_GROCERY_FOODS } from "@/constants/cycle";
import { CyclePhase } from "@/types";

const PHASE_TAGLINE: Record<CyclePhase, string> = {
  menstrual:  "warming, restorative",
  follicular: "light and fresh",
  ovulatory:  "bright, energising",
  luteal:     "grounding, steady",
};

export default function PlanScreen() {
  const currentPhase = useAppStore((s) => s.currentPhase);
  const profile = useAppStore((s) => s.profile);
  const vitaminsTakenByDate = useAppStore((s) => s.vitaminsTakenByDate);
  const toggleVitaminTakenForDate = useAppStore((s) => s.toggleVitaminTakenForDate);
  const addGroceryItem = useAppStore((s) => s.addGroceryItem);
  const groceryItems = useAppStore((s) => s.groceryItems);
  const planGroceryItems = useAppStore((s) => s.planGroceryItems);
  const [weeklyVisible, setWeeklyVisible] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [groceryAdded, setGroceryAdded] = useState(false);

  const phase = PHASE_INFO[currentPhase];
  const todayStr = new Date().toISOString().slice(0, 10);
  const takenToday = vitaminsTakenByDate[todayStr] ?? [];

  const hasPCOS = profile.conditions.includes("PCOS");
  const phaseVitamins = hasPCOS ? PCOS_VITAMINS : PHASE_VITAMINS[currentPhase];

  const cycleDay = (() => {
    if (!profile.lastPeriodDate) return profile.cycleDay ?? 1;
    const diff = Math.floor((Date.now() - new Date(profile.lastPeriodDate).getTime()) / 86400000);
    return Math.min(Math.max(1, diff + 1), profile.cycleLength);
  })();

  const nextDay = (cycleDay % profile.cycleLength) + 1;
  const nextPhaseKey = getPhaseForDay(nextDay, profile.cycleLength);
  const nextPhase = PHASE_INFO[nextPhaseKey];
  const showTomorrow = nextPhaseKey !== currentPhase;

  const closeWeekly = () => {
    setWeeklyVisible(false);
    setExpandedDay(null);
    setGroceryAdded(false);
  };

  const handleAddWeeklyToGrocery = () => {
    const allSeen = new Set([...groceryItems, ...planGroceryItems].map((i) => i.name.toLowerCase()));
    const addedNames = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const day = ((cycleDay - 1 + i) % profile.cycleLength) + 1;
      const phaseKey = getPhaseForDay(day, profile.cycleLength);
      PHASE_GROCERY_FOODS[phaseKey].forEach((food) => {
        const key = food.name.toLowerCase();
        if (!allSeen.has(key) && !addedNames.has(key)) {
          addGroceryItem({ id: Date.now().toString() + Math.random(), name: food.name, category: food.category, checked: false });
          addedNames.add(key);
        }
      });
    }
    setGroceryAdded(true);
    setTimeout(() => setGroceryAdded(false), 4000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Plan</Text>
          <Text style={styles.subtitle}>what to focus on today</Text>
        </Animated.View>

        {/* Easy wins card */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <GlowCard style={styles.card}>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
              <Text style={styles.phaseName}>{phase.label}</Text>
              <View style={styles.todayPill}>
                <Text style={styles.todayPillText}>today</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>EASY WINS TODAY</Text>
            {phase.easyWins.slice(0, 5).map((win, i) => (
              <View key={i} style={[styles.winRow, i < 4 && styles.winRowGap]}>
                <Text style={styles.winPlus}>+</Text>
                <Text style={styles.winText}>{win}</Text>
              </View>
            ))}
          </GlowCard>
        </Animated.View>

        {/* Try to limit card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlowCard style={styles.card}>
            <Text style={styles.sectionLabel}>TRY TO LIMIT</Text>
            <View style={styles.avoidPillRow}>
              {phase.avoid.slice(0, 3).map((item, i) => (
                <View key={i} style={styles.avoidPill}>
                  <Text style={styles.avoidPillText}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.insightText}>{phase.insight}</Text>
          </GlowCard>
        </Animated.View>

        {/* Vitamins card */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)}>
          <GlowCard style={styles.card}>
            <Text style={styles.sectionLabel}>FOCUS SUPPLEMENTS TODAY</Text>
            {phaseVitamins.slice(0, 3).map((v) => {
              const taken = takenToday.includes(v.id);
              return (
                <Pressable
                  key={v.id}
                  onPress={() => toggleVitaminTakenForDate(v.id, todayStr)}
                  style={styles.vitaminRow}
                >
                  <View style={[styles.vitaminCheck, taken && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
                    {taken && <Ionicons name="checkmark" size={12} color="#0a0e1a" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.vitaminNameRow}>
                      <Text style={[styles.vitaminName, taken && styles.vitaminNameTaken]}>{v.name}</Text>
                      <Text style={styles.vitaminDose}>{v.dosage}</Text>
                    </View>
                    <Text style={styles.vitaminTiming}>{v.timing}</Text>
                    <Text style={styles.vitaminReason}>{v.reason}</Text>
                  </View>
                </Pressable>
              );
            })}
          </GlowCard>
        </Animated.View>

        {/* Tomorrow teaser */}
        {showTomorrow && (
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <View style={styles.tomorrowTeaser}>
              <Text style={styles.tomorrowLeft}>
                Tomorrow — {nextPhase.emoji} {nextPhase.label.replace(" Phase", "")}
              </Text>
              <Text style={styles.tomorrowRight}>{PHASE_TAGLINE[nextPhaseKey]}</Text>
            </View>
          </Animated.View>
        )}

        {/* Plan my week */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)}>
          <Pressable onPress={() => setWeeklyVisible(true)} style={styles.weekBtn}>
            <Text style={styles.weekBtnText}>Plan my week</Text>
            <Text style={[styles.weekBtnArrow, { color: ACCENT }]}>→</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Weekly plan modal */}
      <Modal visible={weeklyVisible} transparent animationType="slide" onRequestClose={closeWeekly}>
        <Pressable style={styles.modalOverlay} onPress={closeWeekly}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Next 7 days</Text>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {Array.from({ length: 7 }).map((_, i) => {
                const day = ((cycleDay - 1 + i) % profile.cycleLength) + 1;
                const phaseKey = getPhaseForDay(day, profile.cycleLength);
                const p = PHASE_INFO[phaseKey];
                const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow"
                  : new Date(Date.now() + i * 86400000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                const isExpanded = expandedDay === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setExpandedDay(isExpanded ? null : i)}
                    style={[styles.weekRow, i < 6 && styles.weekRowBorder]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.weekRowMain}>
                        <Text style={styles.weekRowLabel}>{dayLabel}</Text>
                        <View style={styles.weekRowRight}>
                          <Text style={styles.weekRowEmoji}>{p.emoji}</Text>
                          <Text style={styles.weekRowPhase}>{p.label.replace(" Phase", "")}</Text>
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={12}
                            color="rgba(255,255,255,0.25)"
                          />
                        </View>
                      </View>
                      {isExpanded && (
                        <View style={styles.weekDayExpanded}>
                          <Text style={styles.expandLabel}>EASY WINS</Text>
                          {p.easyWins.slice(0, 3).map((win, j) => (
                            <Text key={j} style={styles.expandWin}>+ {win}</Text>
                          ))}
                          <Text style={[styles.expandLabel, { marginTop: 10 }]}>LIMIT</Text>
                          <Text style={styles.expandAvoid}>↓ {p.avoid[0]}</Text>
                          <Text style={styles.expandInsight}>{p.insight}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={groceryAdded ? undefined : handleAddWeeklyToGrocery}
                style={[
                  styles.groceryAddBtn,
                  { backgroundColor: groceryAdded ? "rgba(255,255,255,0.06)" : ACCENT },
                ]}
              >
                <Text style={[styles.groceryAddBtnText, { color: groceryAdded ? DARK_THEME.textMuted : "#412402" }]}>
                  {groceryAdded ? "Added to your grocery list ✓" : "Add this week's foods to grocery list →"}
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK_THEME.bg },
  scroll: { padding: 16, paddingTop: 12 },

  header: { marginBottom: 20 },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  subtitle: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, marginTop: 3 },

  card: { marginBottom: 10 },

  phaseRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  phaseEmoji: { fontSize: 20 },
  phaseName: { flex: 1, fontSize: 15, fontWeight: "700", color: DARK_THEME.textPrimary },
  todayPill: {
    backgroundColor: `${ACCENT}18`, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  todayPillText: { fontSize: TYPE.xs, color: ACCENT, fontWeight: "600", letterSpacing: 0.3 },

  sectionLabel: {
    fontSize: 9, color: DARK_THEME.textMuted, fontWeight: "700",
    letterSpacing: 1.2, marginBottom: 12,
  },

  // Easy wins
  winRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  winRowGap: { marginBottom: 10 },
  winPlus: { fontSize: 14, color: ACCENT, fontWeight: "700", lineHeight: 20, width: 12 },
  winText: { flex: 1, fontSize: TYPE.body, color: DARK_THEME.textPrimary, lineHeight: 20 },

  // Avoid pills
  avoidPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  avoidPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  avoidPillText: { fontSize: TYPE.xs, color: "rgba(255,255,255,0.40)", fontWeight: "500" },
  insightText: {
    fontSize: TYPE.body, color: DARK_THEME.textMuted,
    fontStyle: "italic", lineHeight: 21,
  },

  // Vitamins
  vitaminRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  vitaminCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
    marginTop: 1, flexShrink: 0,
  },
  vitaminNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  vitaminName: { fontSize: TYPE.sm, color: DARK_THEME.textPrimary, fontWeight: "600" },
  vitaminNameTaken: { color: DARK_THEME.textMuted },
  vitaminDose: { fontSize: TYPE.xs, color: DARK_THEME.textMuted },
  vitaminTiming: { fontSize: TYPE.xs, color: "rgba(255,255,255,0.35)" },
  vitaminReason: { fontSize: TYPE.xs, color: "rgba(255,255,255,0.35)", marginTop: 2, fontStyle: "italic" },

  // Tomorrow teaser
  tomorrowTeaser: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 10,
  },
  tomorrowLeft: { fontSize: TYPE.sm, color: "rgba(255,255,255,0.30)", fontWeight: "500" },
  tomorrowRight: { fontSize: TYPE.sm, color: "rgba(255,255,255,0.22)", fontStyle: "italic" },

  // Plan my week button
  weekBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14,
  },
  weekBtnText: { fontSize: TYPE.body, color: "rgba(255,255,255,0.30)" },
  weekBtnArrow: { fontSize: 16, fontWeight: "600" },

  // Weekly modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    maxHeight: "82%",
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Georgia", fontSize: 18,
    color: DARK_THEME.textPrimary, marginBottom: 16, fontWeight: "600",
  },
  weekRow: { paddingVertical: 13 },
  weekRowMain: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  weekRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  weekRowLabel: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, width: 110 },
  weekRowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  weekRowEmoji: { fontSize: 16 },
  weekRowPhase: { fontSize: TYPE.body, color: DARK_THEME.textPrimary, fontWeight: "500" },

  // Expanded day
  weekDayExpanded: { paddingTop: 12, paddingBottom: 4, paddingLeft: 2 },
  expandLabel: {
    fontSize: 9, color: DARK_THEME.textMuted, fontWeight: "700",
    letterSpacing: 1.2, marginBottom: 6,
  },
  expandWin: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, lineHeight: 22, marginBottom: 2 },
  expandAvoid: { fontSize: TYPE.sm, color: "rgba(255,100,100,0.55)", marginBottom: 8 },
  expandInsight: {
    fontSize: TYPE.xs, color: "rgba(255,255,255,0.22)",
    fontStyle: "italic", lineHeight: 18,
  },

  // Grocery add button
  groceryAddBtn: {
    marginTop: 20, marginBottom: 4, paddingVertical: 15,
    borderRadius: 16, alignItems: "center",
  },
  groceryAddBtnText: { fontSize: TYPE.sm, fontWeight: "700" },
});
