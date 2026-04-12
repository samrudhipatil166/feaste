import React, { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, MACRO_COLORS, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { EditEntryModal } from "@/components/EditEntryModal";
import { FoodEntry, MealType } from "@/types";

const MEAL_SLOTS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_EMOJI: Record<MealType, string> = {
  breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎",
};

function MacroBar({
  label, consumed, goal, color,
}: {
  label: string; consumed: number; goal: number; color: string;
}) {
  const pct = Math.min(consumed / goal, 1);
  const remaining = Math.max(goal - consumed, 0);
  const over = consumed > goal;
  return (
    <View style={styles.macroBarWrap}>
      <View style={styles.macroBarTop}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={styles.macroBarNums}>
          <Text style={styles.macroBarValue}>{consumed}g</Text>
          <Text style={styles.macroBarGoal}> / {goal}g</Text>
        </Text>
      </View>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.macroRemaining, over && { color: "#d97706" }]}>
        {over ? `${consumed - goal}g over` : `${remaining}g left`}
      </Text>
    </View>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const foodLog = useAppStore((s) => s.foodLog);
  const removeFoodEntry = useAppStore((s) => s.removeFoodEntry);
  const editFoodEntry = useAppStore((s) => s.editFoodEntry);
  const profile = useAppStore((s) => s.profile);
  const accentColor = useAppStore((s) => s.accentColor());

  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = foodLog.filter((f) => f.date === todayStr || !f.date);

  const consumed = {
    cal: todayLog.reduce((s, f) => s + f.calories, 0),
    protein: todayLog.reduce((s, f) => s + f.protein, 0),
    carbs: todayLog.reduce((s, f) => s + f.carbs, 0),
    fat: todayLog.reduce((s, f) => s + f.fat, 0),
  };

  const remaining = Math.max(profile.calorieGoal - consumed.cal, 0);
  const calPct = Math.min(consumed.cal / profile.calorieGoal, 1);
  const over = consumed.cal > profile.calorieGoal;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.title}>Today</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/log")}
            style={[styles.logBtn, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` }]}
          >
            <Ionicons name="add" size={16} color={accentColor} />
            <Text style={[styles.logBtnText, { color: accentColor }]}>Log food</Text>
          </Pressable>
        </Animated.View>

        {/* Calorie summary */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <GlowCard glowColor={over ? "#f87171" : accentColor} style={styles.card}>
            <View style={styles.calRow}>
              <View>
                <Text style={[styles.calRemaining, { color: over ? "#d97706" : accentColor }]}>
                  {over ? `${consumed.cal - profile.calorieGoal}` : `${remaining}`}
                </Text>
                <Text style={styles.calRemainingLabel}>
                  {over ? "kcal over goal" : "kcal remaining"}
                </Text>
              </View>
              <View style={styles.calRight}>
                <Text style={styles.calConsumed}>{consumed.cal}</Text>
                <Text style={styles.calConsumedLabel}>consumed</Text>
                <View style={styles.calDivider} />
                <Text style={styles.calGoalVal}>{profile.calorieGoal}</Text>
                <Text style={styles.calGoalLabel}>goal</Text>
              </View>
            </View>
            <View style={styles.calBarTrack}>
              <View style={[
                styles.calBarFill,
                { width: `${calPct * 100}%` as any, backgroundColor: over ? "#d97706" : accentColor },
              ]} />
            </View>
          </GlowCard>
        </Animated.View>

        {/* Macro bars */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlowCard style={styles.card}>
            <Text style={styles.sectionTitle}>Macros</Text>
            <MacroBar label="Protein" consumed={consumed.protein} goal={profile.proteinGoal} color={MACRO_COLORS.protein} />
            <MacroBar label="Carbs"   consumed={consumed.carbs}   goal={profile.carbsGoal}   color={MACRO_COLORS.carbs} />
            <MacroBar label="Fat"     consumed={consumed.fat}     goal={profile.fatGoal}     color={MACRO_COLORS.fat} />
          </GlowCard>
        </Animated.View>

        {/* Food entries */}
        {todayLog.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(140).duration(400)}>
            <Pressable onPress={() => router.push("/(tabs)/log")} style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyText}>Nothing logged yet</Text>
              <Text style={[styles.emptyAction, { color: accentColor }]}>Tap to log your first meal →</Text>
            </Pressable>
          </Animated.View>
        ) : (
          MEAL_SLOTS.map((slot, si) => {
            const entries = todayLog.filter((e) => e.meal === slot);
            if (entries.length === 0) return null;
            const slotCal = entries.reduce((s, e) => s + e.calories, 0);
            return (
              <Animated.View key={slot} entering={FadeInDown.delay(140 + si * 40).duration(400)}>
                <GlowCard style={styles.card}>
                  {/* Slot header */}
                  <View style={styles.slotHeader}>
                    <Text style={styles.slotEmoji}>{SLOT_EMOJI[slot]}</Text>
                    <Text style={styles.slotName}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
                    <Text style={[styles.slotCal, { color: accentColor }]}>{slotCal} kcal</Text>
                  </View>

                  {/* Entries */}
                  {entries.map((entry, idx) => (
                    <View key={entry.id}>
                      {idx > 0 && <View style={styles.divider} />}
                      <View style={styles.entryRow}>
                        <View style={styles.entryInfo}>
                          <Text style={styles.entryName} numberOfLines={1}>{entry.name}</Text>
                          <Text style={styles.entryMeta}>
                            {entry.time} · P:{entry.protein}g  C:{entry.carbs}g  F:{entry.fat}g
                          </Text>
                        </View>
                        <Text style={[styles.entryCal, { color: accentColor }]}>{entry.calories}</Text>
                        <View style={styles.entryActions}>
                          <Pressable onPress={() => setEditEntry(entry)} hitSlop={8} style={styles.actionBtn}>
                            <Ionicons name="pencil-outline" size={15} color={DARK_THEME.textMuted} />
                          </Pressable>
                          <Pressable onPress={() => removeFoodEntry(entry.id)} hitSlop={8} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={15} color="#f87171" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </GlowCard>
              </Animated.View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          accentColor={accentColor}
          onSave={(updates) => editFoodEntry(editEntry.id, updates)}
          onClose={() => setEditEntry(null)}
        />
      )}
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
  logBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1,
  },
  logBtnText: { fontSize: TYPE.sm, fontWeight: "600" },

  card: { marginBottom: 12 },
  sectionTitle: {
    fontFamily: "Georgia", fontSize: 15, color: DARK_THEME.textPrimary, marginBottom: 12,
  },

  // Calorie summary
  calRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  calRemaining: { fontSize: 40, fontWeight: "700", lineHeight: 44 },
  calRemainingLabel: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, marginTop: 2 },
  calRight: { alignItems: "flex-end", gap: 2 },
  calConsumed: { fontSize: 22, fontWeight: "700", color: DARK_THEME.textPrimary },
  calConsumedLabel: { fontSize: 10, color: DARK_THEME.textMuted },
  calDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", width: "100%", marginVertical: 4 },
  calGoalVal: { fontSize: 16, fontWeight: "600", color: DARK_THEME.textSecondary },
  calGoalLabel: { fontSize: 10, color: DARK_THEME.textMuted },
  calBarTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  calBarFill: { height: "100%", borderRadius: 4 },

  // Macro bars
  macroBarWrap: { marginBottom: 12 },
  macroBarTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  macroBarLabel: { fontSize: TYPE.sm, fontWeight: "600", color: DARK_THEME.textSecondary },
  macroBarNums: { fontSize: TYPE.sm },
  macroBarValue: { color: DARK_THEME.textPrimary, fontWeight: "700" },
  macroBarGoal: { color: DARK_THEME.textMuted },
  macroTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 3 },
  macroFill: { height: "100%", borderRadius: 3 },
  macroRemaining: { fontSize: 10, color: DARK_THEME.textMuted },

  // Meal slots
  slotHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  slotEmoji: { fontSize: 16 },
  slotName: { flex: 1, fontSize: TYPE.body, fontWeight: "600", color: DARK_THEME.textPrimary },
  slotCal: { fontSize: TYPE.body, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 6 },
  entryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: TYPE.body, color: DARK_THEME.textPrimary, fontWeight: "500" },
  entryMeta: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 2 },
  entryCal: { fontSize: TYPE.body, fontWeight: "700", minWidth: 32, textAlign: "right" },
  entryActions: { flexDirection: "row", gap: 6 },
  actionBtn: { padding: 4 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, marginBottom: 6 },
  emptyAction: { fontSize: TYPE.sm, fontWeight: "600" },
});
