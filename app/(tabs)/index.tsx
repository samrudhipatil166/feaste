import React, { useEffect, useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, Modal, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, FadeInDown, Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { ACCENT, DARK_THEME, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { ProfileSheet } from "@/components/ProfileSheet";
import { PHASE_INFO, PHASE_VITAMINS, PCOS_VITAMINS } from "@/constants/cycle";
import { FoodEntry } from "@/types";

function MacroBar({
  label, value, goal, accentColor,
}: { label: string; value: number; goal: number; accentColor: string }) {
  const pct = Math.min(value / Math.max(goal, 1), 1);
  const width = useSharedValue(0);
  useEffect(() => { width.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) }); }, [pct]);
  const animStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` as any }));
  return (
    <View style={macroBarStyles.row}>
      <Text style={macroBarStyles.label}>{label}</Text>
      <View style={macroBarStyles.track}>
        <Animated.View style={[macroBarStyles.fill, { backgroundColor: accentColor }, animStyle]} />
      </View>
      <Text style={macroBarStyles.value}>{value}g</Text>
    </View>
  );
}
const macroBarStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  label: { width: 50, fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  value: { width: 36, fontSize: TYPE.sm, color: DARK_THEME.textSecondary, textAlign: "right" },
});

export default function HomeScreen() {
  const profile = useAppStore((s) => s.profile);
  const foodLog = useAppStore((s) => s.foodLog);
  const accentColor = useAppStore((s) => s.accentColor());
  const currentPhase = useAppStore((s) => s.currentPhase);
  const privacyAccepted = useAppStore((s) => s.privacyAccepted);
  const setPrivacyAccepted = useAppStore((s) => s.setPrivacyAccepted);
  const vitaminsTakenByDate = useAppStore((s) => s.vitaminsTakenByDate);
  const toggleVitaminTakenForDate = useAppStore((s) => s.toggleVitaminTakenForDate);

  const [calExpanded, setCalExpanded] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileSection, setProfileSection] = useState<string | undefined>(undefined);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = foodLog.filter((f) => f.date === todayStr || !f.date);

  const totalCal = todayLog.reduce((s, f) => s + f.calories, 0);
  const totalP   = todayLog.reduce((s, f) => s + f.protein, 0);
  const totalC   = todayLog.reduce((s, f) => s + f.carbs, 0);
  const totalF   = todayLog.reduce((s, f) => s + f.fat, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const cycleDay = (() => {
    if (!profile.lastPeriodDate) return profile.cycleDay ?? 1;
    const diff = Math.floor((Date.now() - new Date(profile.lastPeriodDate).getTime()) / 86400000);
    return Math.min(Math.max(1, diff + 1), profile.cycleLength);
  })();

  const phase = PHASE_INFO[currentPhase];
  const cyclePct = Math.min(cycleDay / profile.cycleLength, 1);

  // Vitamins for today
  const hasPCOS = profile.conditions.includes("PCOS");
  const phaseVitamins = hasPCOS ? PCOS_VITAMINS : PHASE_VITAMINS[currentPhase];
  const takenToday = vitaminsTakenByDate[todayStr] ?? [];

  const openProfileSection = (section: string) => {
    setProfileSection(section);
    setProfileVisible(true);
  };

  // Calorie progress bar animated
  const calPct = Math.min(totalCal / Math.max(profile.calorieGoal, 1), 1);
  const calWidth = useSharedValue(0);
  useEffect(() => { calWidth.value = withTiming(calPct, { duration: 900, easing: Easing.out(Easing.cubic) }); }, [calPct]);
  const calAnimStyle = useAnimatedStyle(() => ({ width: `${calWidth.value * 100}%` as any }));

  // Cycle progress bar animated
  const cycleWidth = useSharedValue(0);
  useEffect(() => { cycleWidth.value = withTiming(cyclePct, { duration: 900, easing: Easing.out(Easing.cubic) }); }, [cyclePct]);
  const cycleAnimStyle = useAnimatedStyle(() => ({ width: `${cycleWidth.value * 100}%` as any }));

  const SLOT_EMOJI: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Privacy consent */}
      <Modal visible={!privacyAccepted} transparent animationType="slide">
        <View style={styles.privacyOverlay}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.privacySheet}>
            <Text style={styles.privacyTitle}>Before we begin 🌿</Text>
            <Text style={styles.privacyBody}>
              Feaste processes health-related information — your cycle, dietary habits, and nutritional data — to personalise your experience.
            </Text>
            <View style={styles.privacyPoints}>
              {[
                "Your data is stored securely and never sold to third parties.",
                "Health insights are for informational purposes only, not medical advice.",
                "Always consult a healthcare professional for medical decisions.",
                "You can delete your data at any time from your profile.",
              ].map((pt) => (
                <View key={pt} style={styles.privacyPoint}>
                  <Text style={[styles.privacyDot, { color: accentColor }]}>·</Text>
                  <Text style={styles.privacyPointText}>{pt}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={setPrivacyAccepted} style={[styles.privacyBtn, { backgroundColor: accentColor }]}>
              <Text style={styles.privacyBtnText}>I understand & agree</Text>
            </Pressable>
            <Text style={styles.privacyFooter}>
              By continuing you accept our{" "}
              <Text style={[styles.privacyLink, { color: accentColor }]} onPress={() => Linking.openURL("https://feaste.app/privacy")}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dateStr}>{dateStr}</Text>
          </View>
          <Pressable onPress={() => { setProfileSection(undefined); setProfileVisible(true); }} style={styles.profileBtn}>
            <Ionicons name="person" size={18} color={DARK_THEME.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* Phase card */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <GlowCard style={styles.card} noPadding>
            <View style={styles.phaseInner}>
              <View style={styles.phaseTopRow}>
                <View style={styles.phaseLeft}>
                  <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
                  <Text style={styles.phaseName}>{phase.label}</Text>
                </View>
                <Text style={styles.phaseDay}>Day {cycleDay} of {profile.cycleLength}</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { backgroundColor: accentColor }, cycleAnimStyle]} />
              </View>
              <View style={styles.focusPillRow}>
                {phase.foodFocus.slice(0, 3).map((f) => (
                  <View key={f} style={styles.focusPill}>
                    <Text style={styles.focusPillText}>{f}</Text>
                  </View>
                ))}
              </View>
              <Pressable onPress={() => openProfileSection("cycle")} style={styles.editLink}>
                <Text style={styles.editLinkText}>edit</Text>
              </Pressable>
            </View>
          </GlowCard>
        </Animated.View>

        {/* Calorie card — tappable, expands inline */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Pressable onPress={() => setCalExpanded(!calExpanded)}>
            <GlowCard style={styles.card} noPadding>
              <View style={styles.calInner}>
                {/* Collapsed header — always visible */}
                <View style={styles.calHeaderRow}>
                  <Text style={styles.calLabel}>Calories</Text>
                  <Ionicons name={calExpanded ? "chevron-up" : "chevron-down"} size={16} color={DARK_THEME.textMuted} />
                </View>
                <Text style={styles.calNumbers}>
                  <Text style={{ color: accentColor, fontWeight: "700", fontSize: 22 }}>{totalCal}</Text>
                  <Text style={styles.calGoal}> / {profile.calorieGoal} kcal</Text>
                </Text>
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, { backgroundColor: accentColor }, calAnimStyle]} />
                </View>
                <View style={styles.macroSmallRow}>
                  <Text style={styles.macroSmall}>P: {totalP}g</Text>
                  <Text style={styles.macroSmallDot}>·</Text>
                  <Text style={styles.macroSmall}>C: {totalC}g</Text>
                  <Text style={styles.macroSmallDot}>·</Text>
                  <Text style={styles.macroSmall}>F: {totalF}g</Text>
                </View>

                {/* Expanded content */}
                {calExpanded && (
                  <View style={styles.expandedSection}>
                    <View style={styles.expandDivider} />

                    {/* Macro progress bars */}
                    <Text style={styles.expandLabel}>Macros</Text>
                    <MacroBar label="Protein" value={totalP} goal={profile.proteinGoal} accentColor={accentColor} />
                    <MacroBar label="Carbs" value={totalC} goal={profile.carbsGoal} accentColor={accentColor} />
                    <MacroBar label="Fat" value={totalF} goal={profile.fatGoal} accentColor={accentColor} />

                    <View style={styles.expandDivider} />

                    {/* Meals logged today */}
                    <Text style={styles.expandLabel}>Meals today</Text>
                    {todayLog.length === 0 ? (
                      <Text style={styles.emptyText}>Nothing logged yet</Text>
                    ) : (
                      todayLog.slice().reverse().map((entry) => (
                        <View key={entry.id} style={styles.mealRow}>
                          <Text style={styles.mealSlotEmoji}>{SLOT_EMOJI[entry.meal] ?? "🍽️"}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.mealName} numberOfLines={1}>{entry.name}</Text>
                            <Text style={styles.mealMacros}>P:{entry.protein}g · C:{entry.carbs}g · F:{entry.fat}g</Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.mealCal, { color: accentColor }]}>{entry.calories} kcal</Text>
                            {entry.badge && (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>{entry.badge}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))
                    )}

                    <View style={styles.expandDivider} />

                    {/* Vitamins */}
                    <Text style={styles.expandLabel}>Vitamins today</Text>
                    {phaseVitamins.slice(0, 3).map((v) => {
                      const taken = takenToday.includes(v.id);
                      return (
                        <Pressable
                          key={v.id}
                          onPress={() => toggleVitaminTakenForDate(v.id, todayStr)}
                          style={styles.vitaminRow}
                        >
                          <View style={[styles.vitaminCheck, taken && { backgroundColor: accentColor, borderColor: accentColor }]}>
                            {taken && <Ionicons name="checkmark" size={12} color="#0a0e1a" />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.vitaminName, taken && styles.vitaminNameTaken]}>{v.name}</Text>
                            <Text style={styles.vitaminDose}>{v.dosage} · {v.timing}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </GlowCard>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ProfileSheet
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        initialSection={profileSection}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK_THEME.bg },
  scroll: { padding: 16, paddingTop: 12 },

  // Privacy modal
  privacyOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  privacySheet: {
    backgroundColor: "#0f1525", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  privacyTitle: { fontFamily: "Georgia", fontSize: 22, color: DARK_THEME.textPrimary, fontWeight: "600", marginBottom: 12 },
  privacyBody: { fontSize: 14, color: DARK_THEME.textSecondary, lineHeight: 22, marginBottom: 16 },
  privacyPoints: { gap: 8, marginBottom: 24 },
  privacyPoint: { flexDirection: "row", gap: 8 },
  privacyDot: { fontSize: 18, lineHeight: 20 },
  privacyPointText: { flex: 1, fontSize: 13, color: DARK_THEME.textSecondary, lineHeight: 20 },
  privacyBtn: { paddingVertical: 14, borderRadius: 16, alignItems: "center", marginBottom: 14 },
  privacyBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  privacyFooter: { fontSize: 12, color: DARK_THEME.textMuted, textAlign: "center" },
  privacyLink: { fontWeight: "600" },

  // Top bar
  topBar: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  greeting: { fontFamily: "Georgia", fontSize: 22, color: DARK_THEME.textPrimary, fontWeight: "600" },
  dateStr: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, marginTop: 3 },
  profileBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },

  card: { marginBottom: 12 },

  // Phase card
  phaseInner: { padding: 16 },
  phaseTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  phaseLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  phaseEmoji: { fontSize: 22 },
  phaseName: { fontSize: 16, fontWeight: "700", color: DARK_THEME.textPrimary },
  phaseDay: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  progressTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden", marginBottom: 12,
  },
  progressFill: { height: "100%", borderRadius: 2 },
  focusPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  focusPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
  },
  focusPillText: { fontSize: TYPE.xs, color: "rgba(255,255,255,0.55)", fontWeight: "500" },
  editLink: { alignSelf: "flex-end" },
  editLinkText: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, letterSpacing: 0.2 },

  // Calorie card
  calInner: { padding: 16 },
  calHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  calLabel: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, fontWeight: "600", letterSpacing: 0.5 },
  calNumbers: { marginBottom: 8 },
  calGoal: { fontSize: 14, color: DARK_THEME.textMuted, fontWeight: "400" },
  macroSmallRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  macroSmall: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  macroSmallDot: { fontSize: TYPE.sm, color: "rgba(255,255,255,0.20)" },

  // Expanded section
  expandedSection: { marginTop: 4 },
  expandDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 14 },
  expandLabel: {
    fontSize: 9, color: DARK_THEME.textMuted, fontWeight: "700",
    letterSpacing: 1.2, marginBottom: 10, textTransform: "uppercase",
  },
  emptyText: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, fontStyle: "italic" },

  mealRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  mealSlotEmoji: { fontSize: 14, marginTop: 2 },
  mealName: { fontSize: TYPE.sm, color: DARK_THEME.textPrimary, fontWeight: "500" },
  mealMacros: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 2 },
  mealCal: { fontSize: TYPE.sm, fontWeight: "600" },
  badge: {
    marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: { fontSize: 9, color: "rgba(255,255,255,0.50)", fontWeight: "600" },

  vitaminRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  vitaminCheck: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
  },
  vitaminName: { fontSize: TYPE.sm, color: DARK_THEME.textPrimary, fontWeight: "500" },
  vitaminNameTaken: { color: DARK_THEME.textMuted },
  vitaminDose: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 1 },
});
