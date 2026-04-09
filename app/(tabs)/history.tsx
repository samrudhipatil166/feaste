import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, MACRO_COLORS, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { EditEntryModal } from "@/components/EditEntryModal";
import { FoodEntry, MealType } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 140;
const BAR_MAX = 2400;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_SLOTS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_EMOJI: Record<MealType, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

// ── Today's log ───────────────────────────────────────────────────────────────

function TodayLog({ accentColor }: { accentColor: string }) {
  const foodLog = useAppStore((s) => s.foodLog);
  const removeFoodEntry = useAppStore((s) => s.removeFoodEntry);
  const editFoodEntry = useAppStore((s) => s.editFoodEntry);
  const profile = useAppStore((s) => s.profile);

  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = foodLog.filter((f) => f.date === todayStr || !f.date);

  const totalCal = todayLog.reduce((s, f) => s + f.calories, 0);
  const totalP = todayLog.reduce((s, f) => s + f.protein, 0);
  const totalC = todayLog.reduce((s, f) => s + f.carbs, 0);
  const totalF = todayLog.reduce((s, f) => s + f.fat, 0);

  if (todayLog.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🍽️</Text>
        <Text style={styles.emptyText}>Nothing logged yet today</Text>
        <Text style={styles.emptySubtext}>Use the Log tab to add meals</Text>
      </View>
    );
  }

  return (
    <>
      {/* Day totals */}
      <GlowCard glowColor={accentColor} style={styles.card}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.cardTitle}>Today's Totals</Text>
            <Text style={styles.entryCount}>{todayLog.length} item{todayLog.length !== 1 ? "s" : ""} logged</Text>
          </View>
          <Text style={[styles.totalCal, { color: accentColor }]}>{totalCal} kcal</Text>
        </View>
        <View style={styles.macroSummaryRow}>
          {[
            { label: "P", val: totalP, goal: profile.proteinGoal, color: MACRO_COLORS.protein },
            { label: "C", val: totalC, goal: profile.carbsGoal,   color: MACRO_COLORS.carbs },
            { label: "F", val: totalF, goal: profile.fatGoal,     color: MACRO_COLORS.fat },
          ].map((m) => (
            <View key={m.label} style={styles.macroSummaryCell}>
              <Text style={[styles.macroSummaryVal, { color: m.color }]}>{m.val}g</Text>
              <View style={styles.macroSummaryTrack}>
                <View style={[styles.macroSummaryFill, {
                  width: `${Math.min(m.val / m.goal, 1) * 100}%` as any,
                  backgroundColor: m.color,
                }]} />
              </View>
              <Text style={styles.macroSummaryLabel}>{m.label} / {m.goal}g</Text>
            </View>
          ))}
        </View>
      </GlowCard>

      {/* Grouped by meal slot */}
      {MEAL_SLOTS.map((slot) => {
        const entries = todayLog.filter((e) => e.meal === slot);
        if (entries.length === 0) return null;
        const slotCal = entries.reduce((s, e) => s + e.calories, 0);
        return (
          <GlowCard key={slot} style={styles.card}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotEmoji}>{SLOT_EMOJI[slot]}</Text>
              <Text style={styles.slotName}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
              <Text style={[styles.slotCal, { color: accentColor }]}>{slotCal} kcal</Text>
            </View>
            {entries.map((entry, idx) => (
              <View key={entry.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryName} numberOfLines={1}>{entry.name}</Text>
                    <Text style={styles.entryMeta}>
                      {entry.time} · P:{entry.protein}g C:{entry.carbs}g F:{entry.fat}g
                    </Text>
                  </View>
                  <View style={styles.entryRight}>
                    <Text style={[styles.entryCal, { color: accentColor }]}>{entry.calories}</Text>
                    <Text style={styles.entryCalUnit}>kcal</Text>
                  </View>
                  <View style={styles.entryActions}>
                    <Pressable onPress={() => setEditEntry(entry)} style={styles.actionBtn} hitSlop={8}>
                      <Ionicons name="pencil-outline" size={15} color={DARK_THEME.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => removeFoodEntry(entry.id)} style={styles.actionBtn} hitSlop={8}>
                      <Ionicons name="trash-outline" size={15} color="#f87171" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </GlowCard>
        );
      })}

      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          accentColor={accentColor}
          onSave={(updates) => editFoodEntry(editEntry.id, updates)}
          onClose={() => setEditEntry(null)}
        />
      )}
    </>
  );
}

// ── Weekly history ────────────────────────────────────────────────────────────

function WeeklyHistory({ accentColor }: { accentColor: string }) {
  const weeklyCalories = useAppStore((s) => s.weeklyCalories);
  const profile = useAppStore((s) => s.profile);
  const [selectedDay, setSelectedDay] = useState(6);

  const validDays = weeklyCalories.filter((c) => c > 0);
  const avg = validDays.length > 0 ? Math.round(validDays.reduce((a, b) => a + b, 0) / validDays.length) : 0;
  const best = Math.max(...weeklyCalories);
  const bestDay = DAY_LABELS[weeklyCalories.indexOf(best)];
  const selectedCal = weeklyCalories[selectedDay];

  const goalY = CHART_HEIGHT - (profile.calorieGoal / BAR_MAX) * CHART_HEIGHT;
  const barCount = weeklyCalories.length;
  const totalPadding = 8 * (barCount - 1);
  const barWidth = (CHART_WIDTH - totalPadding) / barCount;

  return (
    <>
      {/* Stats strip */}
      <View style={styles.statsStrip}>
        {[
          { label: "Daily avg", value: avg > 0 ? `${avg}` : "—", unit: "kcal", color: accentColor },
          { label: "Goal",      value: `${profile.calorieGoal}`, unit: "kcal", color: DARK_THEME.textSecondary },
          { label: "Best day",  value: best > 0 ? bestDay : "—", unit: best > 0 ? `${best} kcal` : "", color: "#4ade80" },
        ].map((s) => (
          <View key={s.label} style={styles.statCell}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statUnit}>{s.unit}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Bar chart */}
      <GlowCard glowColor={accentColor} style={styles.card}>
        <View style={styles.chartHeader}>
          <Text style={styles.cardTitle}>Calories This Week</Text>
          <Text style={[styles.goalLine, { color: `${accentColor}80` }]}>— {profile.calorieGoal} goal</Text>
        </View>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
          <Line x1={0} y1={goalY} x2={CHART_WIDTH} y2={goalY}
            stroke={`${accentColor}40`} strokeWidth={1} strokeDasharray="4,4" />
          {weeklyCalories.map((val, i) => {
            const barH = Math.max((val / BAR_MAX) * CHART_HEIGHT, val > 0 ? 4 : 0);
            const x = i * (barWidth + 8);
            const y = CHART_HEIGHT - barH;
            const isSelected = i === selectedDay;
            const isToday = i === barCount - 1;
            const color = isSelected ? accentColor : isToday ? `${accentColor}80` : `${accentColor}35`;
            return (
              <React.Fragment key={i}>
                <Rect x={x} y={y} width={barWidth} height={barH} rx={6} fill={color}
                  onPress={() => setSelectedDay(i)} />
                <SvgText x={x + barWidth / 2} y={CHART_HEIGHT + 16} textAnchor="middle"
                  fill={isSelected ? accentColor : DARK_THEME.textMuted} fontSize={10}>
                  {DAY_LABELS[i]}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
        <Text style={styles.chartHint}>Tap a bar to see that day</Text>
      </GlowCard>

      {/* Selected day */}
      <GlowCard glowColor={accentColor} style={styles.card}>
        <View style={styles.dayDetailHeader}>
          <Text style={styles.cardTitle}>{DAY_LABELS[selectedDay]}{selectedDay === 6 ? " · Today" : ""}</Text>
          <Text style={[styles.dayDetailCal, { color: accentColor }]}>
            {selectedCal > 0 ? `${selectedCal} kcal` : "—"}
          </Text>
        </View>
        <View style={styles.dayCalBarTrack}>
          <View style={[styles.dayCalBarFill, {
            width: `${Math.min((selectedCal / profile.calorieGoal) * 100, 100)}%` as any,
            backgroundColor: accentColor,
          }]} />
        </View>
        <View style={styles.dayCalBarLabels}>
          <Text style={styles.dayCalBarLeft}>
            {selectedCal === 0 ? "No data"
              : selectedCal < profile.calorieGoal ? `${profile.calorieGoal - selectedCal} kcal under goal`
              : selectedCal === profile.calorieGoal ? "Exactly on goal 🎯"
              : `${selectedCal - profile.calorieGoal} kcal over goal`}
          </Text>
          <Text style={[styles.dayCalBarRight, { color: accentColor }]}>
            {selectedCal > 0 ? `${Math.round((selectedCal / profile.calorieGoal) * 100)}%` : ""}
          </Text>
        </View>
      </GlowCard>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const accentColor = useAppStore((s) => s.accentColor());
  const [tab, setTab] = useState<"today" | "history">("today");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Food Log</Text>
        </Animated.View>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          {(["today", "history"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && { backgroundColor: accentColor }]}
            >
              <Text style={[styles.tabLabel, tab === t && { color: "#0a0e1a" }]}>
                {t === "today" ? "Today" : "This Week"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "today" ? (
          <TodayLog accentColor={accentColor} />
        ) : (
          <WeeklyHistory accentColor={accentColor} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DARK_THEME.bg },
  scrollContent: { padding: 16, paddingTop: 12 },
  header: { marginBottom: 16 },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  card: { marginBottom: 12 },
  cardTitle: { fontFamily: "Georgia", fontSize: 15, color: DARK_THEME.textPrimary, marginBottom: 4 },

  // Tabs
  tabRow: {
    flexDirection: "row", gap: 8, marginBottom: 16,
    backgroundColor: DARK_THEME.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: DARK_THEME.borderColor, padding: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center",
  },
  tabLabel: { fontSize: TYPE.body, fontWeight: "600", color: DARK_THEME.textSecondary },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, marginBottom: 4 },
  emptySubtext: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },

  // Today totals
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  totalCal: { fontSize: 24, fontWeight: "700" },
  entryCount: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, marginTop: 2 },
  macroSummaryRow: { flexDirection: "row", gap: 10 },
  macroSummaryCell: { flex: 1, gap: 4 },
  macroSummaryVal: { fontSize: 14, fontWeight: "700" },
  macroSummaryTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  macroSummaryFill: { height: "100%", borderRadius: 2 },
  macroSummaryLabel: { fontSize: 10, color: DARK_THEME.textMuted },

  // Meal slots
  slotHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  slotEmoji: { fontSize: 16 },
  slotName: { flex: 1, fontSize: TYPE.body, fontWeight: "600", color: DARK_THEME.textPrimary },
  slotCal: { fontSize: TYPE.body, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 6 },
  entryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  entryLeft: { flex: 1 },
  entryName: { fontSize: TYPE.body, color: DARK_THEME.textPrimary, fontWeight: "500" },
  entryMeta: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 2 },
  entryRight: { alignItems: "flex-end" },
  entryCal: { fontSize: TYPE.body, fontWeight: "700" },
  entryCalUnit: { fontSize: 10, color: DARK_THEME.textMuted },
  entryActions: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 4 },

  // Stats strip
  statsStrip: {
    flexDirection: "row", backgroundColor: DARK_THEME.cardBg,
    borderRadius: 20, borderWidth: 1, borderColor: DARK_THEME.borderColor,
    marginBottom: 12, overflow: "hidden",
  },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 4 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statUnit: { fontSize: 10, color: DARK_THEME.textMuted, marginTop: 1 },
  statLabel: { fontSize: 11, color: DARK_THEME.textMuted, marginTop: 3 },

  // Chart
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  goalLine: { fontSize: 11 },
  chartHint: { fontSize: 11, color: DARK_THEME.textMuted, textAlign: "center", marginTop: 6 },

  // Day detail
  dayDetailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dayDetailCal: { fontSize: 22, fontWeight: "700" },
  dayCalBarTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 6 },
  dayCalBarFill: { height: "100%", borderRadius: 4 },
  dayCalBarLabels: { flexDirection: "row", justifyContent: "space-between" },
  dayCalBarLeft: { fontSize: 11, color: DARK_THEME.textMuted },
  dayCalBarRight: { fontSize: 11, fontWeight: "600" },
});
