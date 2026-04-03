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
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, MACRO_COLORS } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 140;
const BAR_MAX = 2400;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAILY_NOTES: Record<number, string> = {
  0: "Great protein day 💪",
  1: "Slightly over on carbs",
  2: "Perfect balance ✨",
  3: "Ovulation energy boost 🔥",
  4: "On track",
  5: "Light eating day",
  6: "Today — in progress...",
};

// Stub macro breakdown per day (in production this comes from food_log)
const DAILY_MACROS = [
  { p: 98, c: 180, f: 52 },
  { p: 88, c: 195, f: 62 },
  { p: 102, c: 155, f: 55 },
  { p: 95, c: 190, f: 65 },
  { p: 90, c: 175, f: 58 },
  { p: 82, c: 160, f: 54 },
  { p: 42, c: 88,  f: 32 },
];

function CalorieChart({
  data,
  goal,
  accentColor,
  selectedIndex,
  onSelect,
}: {
  data: number[];
  goal: number;
  accentColor: string;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const barCount = data.length;
  const totalPadding = 8 * (barCount - 1);
  const barWidth = (CHART_WIDTH - totalPadding) / barCount;
  const goalY = CHART_HEIGHT - (goal / BAR_MAX) * CHART_HEIGHT;

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
        {/* Goal line */}
        <Line
          x1={0} y1={goalY} x2={CHART_WIDTH} y2={goalY}
          stroke={`${accentColor}40`} strokeWidth={1} strokeDasharray="4,4"
        />

        {data.map((val, i) => {
          const barH = Math.max((val / BAR_MAX) * CHART_HEIGHT, 4);
          const x = i * (barWidth + 8);
          const y = CHART_HEIGHT - barH;
          const isToday = i === barCount - 1;
          const isSelected = i === selectedIndex;
          const color = isSelected ? accentColor : isToday ? `${accentColor}80` : `${accentColor}35`;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x} y={y} width={barWidth} height={barH}
                rx={6} fill={color}
                onPress={() => onSelect(i)}
              />
              <SvgText
                x={x + barWidth / 2} y={CHART_HEIGHT + 16}
                textAnchor="middle" fill={isSelected ? accentColor : DARK_THEME.textMuted}
                fontSize={10}
              >
                {DAY_LABELS[i]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function MacroAverageCard({ accentColor }: { accentColor: string }) {
  const profile = useAppStore((s) => s.profile);
  const weeklyCalories = useAppStore((s) => s.weeklyCalories);

  const avgP = Math.round(DAILY_MACROS.reduce((s, d) => s + d.p, 0) / 7);
  const avgC = Math.round(DAILY_MACROS.reduce((s, d) => s + d.c, 0) / 7);
  const avgF = Math.round(DAILY_MACROS.reduce((s, d) => s + d.f, 0) / 7);

  const macros = [
    { label: "Protein", avg: avgP, goal: profile.proteinGoal, color: MACRO_COLORS.protein },
    { label: "Carbs",   avg: avgC, goal: profile.carbsGoal,   color: MACRO_COLORS.carbs   },
    { label: "Fat",     avg: avgF, goal: profile.fatGoal,     color: MACRO_COLORS.fat     },
  ];

  return (
    <GlowCard style={styles.card}>
      <Text style={styles.cardTitle}>Weekly Macro Averages</Text>
      <View style={styles.macroGrid}>
        {macros.map((m) => {
          const pct = Math.min(m.avg / m.goal, 1);
          const diff = m.avg - m.goal;
          return (
            <View key={m.label} style={styles.macroGridCell}>
              <Text style={[styles.macroGridValue, { color: m.color }]}>{m.avg}g</Text>
              <Text style={styles.macroGridLabel}>{m.label}</Text>
              <View style={styles.macroGridTrack}>
                <View style={[styles.macroGridFill, { width: `${pct * 100}%` as any, backgroundColor: m.color }]} />
              </View>
              <Text style={[styles.macroGridDiff, { color: diff > 0 ? "#f87171" : "#4ade80" }]}>
                {diff > 0 ? `+${diff}g` : `${diff}g`} vs goal
              </Text>
            </View>
          );
        })}
      </View>
    </GlowCard>
  );
}

export default function HistoryScreen() {
  const weeklyCalories = useAppStore((s) => s.weeklyCalories);
  const profile = useAppStore((s) => s.profile);
  const accentColor = useAppStore((s) => s.accentColor());

  const [selectedDay, setSelectedDay] = useState(6); // today

  const avg = Math.round(weeklyCalories.reduce((a, b) => a + b, 0) / weeklyCalories.filter((c) => c > 0).length);
  const best = Math.max(...weeklyCalories);
  const bestDay = DAY_LABELS[weeklyCalories.indexOf(best)];
  const selectedCal = weeklyCalories[selectedDay];
  const selectedMacros = DAILY_MACROS[selectedDay];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Your week at a glance 📊</Text>
          </View>
        </Animated.View>

        {/* Stats strip */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.statsStrip}>
          {[
            { label: "Daily avg", value: `${avg}`, unit: "kcal", color: accentColor },
            { label: "Goal",      value: `${profile.calorieGoal}`, unit: "kcal", color: DARK_THEME.textSecondary },
            { label: "Best day",  value: bestDay, unit: `${best} kcal`, color: "#4ade80" },
          ].map((s) => (
            <View key={s.label} style={styles.statCell}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statUnit}>{s.unit}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Bar chart */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlowCard glowColor={accentColor} style={styles.card}>
            <View style={styles.chartHeader}>
              <Text style={styles.cardTitle}>Calories This Week</Text>
              <Text style={[styles.goalLine, { color: `${accentColor}80` }]}>
                — {profile.calorieGoal} goal
              </Text>
            </View>
            <CalorieChart
              data={weeklyCalories}
              goal={profile.calorieGoal}
              accentColor={accentColor}
              selectedIndex={selectedDay}
              onSelect={setSelectedDay}
            />
            <Text style={styles.chartHint}>Tap a bar to see that day's breakdown</Text>
          </GlowCard>
        </Animated.View>

        {/* Selected day detail */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <GlowCard glowColor={accentColor} style={styles.card}>
            <View style={styles.dayDetailHeader}>
              <View>
                <Text style={styles.cardTitle}>{DAY_LABELS[selectedDay]}'s Breakdown</Text>
                <Text style={styles.dayNote}>{DAILY_NOTES[selectedDay]}</Text>
              </View>
              <Text style={[styles.dayDetailCal, { color: accentColor }]}>{selectedCal} kcal</Text>
            </View>
            <View style={styles.dayMacroRow}>
              {[
                { label: "Protein", val: selectedMacros.p, color: MACRO_COLORS.protein, goal: profile.proteinGoal },
                { label: "Carbs",   val: selectedMacros.c, color: MACRO_COLORS.carbs,   goal: profile.carbsGoal   },
                { label: "Fat",     val: selectedMacros.f, color: MACRO_COLORS.fat,     goal: profile.fatGoal     },
              ].map((m) => (
                <View key={m.label} style={styles.dayMacroCell}>
                  <Text style={[styles.dayMacroVal, { color: m.color }]}>{m.val}g</Text>
                  <View style={styles.dayMacroTrack}>
                    <View
                      style={[
                        styles.dayMacroFill,
                        { width: `${Math.min(m.val / m.goal, 1) * 100}%` as any, backgroundColor: m.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.dayMacroLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
            {/* Calorie bar */}
            <View style={styles.dayCalBarTrack}>
              <View
                style={[
                  styles.dayCalBarFill,
                  {
                    width: `${Math.min((selectedCal / profile.calorieGoal) * 100, 100)}%` as any,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
            <View style={styles.dayCalBarLabels}>
              <Text style={styles.dayCalBarLeft}>
                {selectedCal < profile.calorieGoal
                  ? `${profile.calorieGoal - selectedCal} kcal under goal`
                  : selectedCal === profile.calorieGoal
                  ? "Exactly on goal 🎯"
                  : `${selectedCal - profile.calorieGoal} kcal over goal`}
              </Text>
              <Text style={[styles.dayCalBarRight, { color: accentColor }]}>
                {Math.round((selectedCal / profile.calorieGoal) * 100)}%
              </Text>
            </View>
          </GlowCard>
        </Animated.View>

        {/* Macro averages */}
        <MacroAverageCard accentColor={accentColor} />

        {/* Day-by-day list */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Day by Day</Text>
          <View style={styles.dayList}>
            {DAY_LABELS.map((day, i) => {
              const cal = weeklyCalories[i];
              const macros = DAILY_MACROS[i];
              const isToday = i === 6;
              const isSelected = i === selectedDay;
              return (
                <Pressable key={i} onPress={() => setSelectedDay(i)}>
                  <GlowCard
                    glowColor={isSelected ? accentColor : undefined}
                    style={[styles.dayCard, isSelected && { borderColor: `${accentColor}30` }]}
                  >
                    <View style={styles.dayCardRow}>
                      <View style={styles.dayCardLeft}>
                        <Text style={[styles.dayCardDay, isSelected && { color: accentColor }]}>
                          {day} {isToday ? "· Today" : ""}
                        </Text>
                        <Text style={styles.dayCardNote}>{DAILY_NOTES[i]}</Text>
                      </View>
                      <View style={styles.dayCardRight}>
                        <Text style={[styles.dayCardCal, { color: isSelected ? accentColor : DARK_THEME.textPrimary }]}>
                          {cal > 0 ? `${cal}` : "—"} <Text style={styles.dayCardCalUnit}>kcal</Text>
                        </Text>
                        <Text style={styles.dayCardMacros}>
                          P{macros.p} C{macros.c} F{macros.f}
                        </Text>
                      </View>
                    </View>
                  </GlowCard>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DARK_THEME.bg },
  scrollContent: { padding: 16, paddingTop: 12 },
  header: { marginBottom: 16 },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  subtitle: { fontSize: 13, color: DARK_THEME.textSecondary, marginTop: 4 },
  card: { marginBottom: 12 },
  cardTitle: { fontFamily: "Georgia", fontSize: 15, color: DARK_THEME.textPrimary },

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

  // Selected day detail
  dayDetailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  dayNote: { fontSize: 12, color: DARK_THEME.textMuted, marginTop: 3 },
  dayDetailCal: { fontSize: 22, fontWeight: "700" },
  dayMacroRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  dayMacroCell: { flex: 1, alignItems: "center", gap: 4 },
  dayMacroVal: { fontSize: 16, fontWeight: "700" },
  dayMacroTrack: { width: "100%", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  dayMacroFill: { height: "100%", borderRadius: 2 },
  dayMacroLabel: { fontSize: 11, color: DARK_THEME.textMuted },
  dayCalBarTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 6 },
  dayCalBarFill: { height: "100%", borderRadius: 4 },
  dayCalBarLabels: { flexDirection: "row", justifyContent: "space-between" },
  dayCalBarLeft: { fontSize: 11, color: DARK_THEME.textMuted },
  dayCalBarRight: { fontSize: 11, fontWeight: "600" },

  // Macro grid
  macroGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  macroGridCell: { flex: 1, alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 12 },
  macroGridValue: { fontSize: 20, fontWeight: "700" },
  macroGridLabel: { fontSize: 11, color: DARK_THEME.textMuted, marginTop: 2 },
  macroGridTrack: { width: "100%", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 8 },
  macroGridFill: { height: "100%", borderRadius: 2 },
  macroGridDiff: { fontSize: 10, marginTop: 4 },

  // Day list
  sectionTitle: { fontFamily: "Georgia", fontSize: 15, color: DARK_THEME.textPrimary, marginBottom: 10 },
  dayList: { gap: 8 },
  dayCard: { marginBottom: 0 },
  dayCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayCardLeft: { flex: 1 },
  dayCardDay: { fontSize: 14, color: DARK_THEME.textPrimary, fontWeight: "600" },
  dayCardNote: { fontSize: 11, color: DARK_THEME.textMuted, marginTop: 2 },
  dayCardRight: { alignItems: "flex-end" },
  dayCardCal: { fontSize: 16, fontWeight: "700" },
  dayCardCalUnit: { fontSize: 11, fontWeight: "400" },
  dayCardMacros: { fontSize: 10, color: DARK_THEME.textMuted, marginTop: 2 },
});
