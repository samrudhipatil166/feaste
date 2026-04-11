import React, { useEffect, useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, Modal, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, FadeInDown, Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppStore } from "@/store/useAppStore";
import { ACCENT, DARK_THEME, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { ProfileSheet } from "@/components/ProfileSheet";
import { PHASE_INFO, PHASE_VITAMINS, PCOS_VITAMINS, PhaseVitamin } from "@/constants/cycle";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BTN_TEXT  = "#412402";
const MUTED     = "#ffffff50";
const SECONDARY = "#ffffffc0";
const ZERO_NUM  = "#ffffff30";
const DIVIDER   = "#ffffff08";
const CARD_BG   = "#ffffff08";
const CARD_BORDER = "#ffffff12";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract 1-2 meaningful words from an easyWin string for chip display */
function chipLabel(easyWin: string): string {
  const stop = new Set(["or", "on", "in", "as", "for", "any", "a", "an", "the", "to"]);
  const words = easyWin.split(" ");
  const result: string[] = [];
  for (const w of words) {
    if (result.length > 0 && stop.has(w.toLowerCase())) break;
    result.push(w);
    if (result.length >= 2) break;
  }
  return result.join(" ");
}

/** Pick the single most time-relevant untaken vitamin */
function getTimelyVitamin(
  vitamins: PhaseVitamin[],
  takenToday: string[],
  hour: number,
): PhaseVitamin | null {
  const untaken = vitamins.filter((v) => !takenToday.includes(v.id));
  if (untaken.length === 0) return null;
  if (hour < 12) return untaken.find((v) => v.timing.toLowerCase().includes("morning")) ?? untaken[0];
  if (hour >= 17) return untaken.find((v) => v.timing.toLowerCase().includes("evening")) ?? untaken[0];
  return untaken[0];
}

/** Format a "HH:MM" time string to "8:42 am" */
function fmtTime(timeStr: string): string {
  if (!timeStr) return "";
  try {
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch { return timeStr; }
}

// ── MacroBar ───────────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, accentColor }: {
  label: string; value: number; goal: number; accentColor: string;
}) {
  const pct = Math.min(value / Math.max(goal, 1), 1);
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [pct]);
  const animStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` as any }));
  return (
    <View style={mbStyles.row}>
      <Text style={mbStyles.label}>{label}</Text>
      <View style={mbStyles.track}>
        <Animated.View style={[mbStyles.fill, { backgroundColor: accentColor }, animStyle]} />
      </View>
      <Text style={mbStyles.value}>{value}g</Text>
    </View>
  );
}
const mbStyles = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  label: { width: 54, fontSize: TYPE.sm, color: MUTED },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 3 },
  value: { width: 36, fontSize: TYPE.sm, color: SECONDARY, textAlign: "right" },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  const profile                  = useAppStore((s) => s.profile);
  const foodLog                  = useAppStore((s) => s.foodLog);
  const accentColor              = useAppStore((s) => s.accentColor());
  const currentPhase             = useAppStore((s) => s.currentPhase);
  const privacyAccepted          = useAppStore((s) => s.privacyAccepted);
  const setPrivacyAccepted       = useAppStore((s) => s.setPrivacyAccepted);
  const vitaminsTakenByDate      = useAppStore((s) => s.vitaminsTakenByDate);
  const toggleVitaminTakenForDate = useAppStore((s) => s.toggleVitaminTakenForDate);
  const setLogPrefill            = useAppStore((s) => s.setLogPrefill);

  const [calExpanded, setCalExpanded]     = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileSection, setProfileSection] = useState<string | undefined>(undefined);

  // ── Derived data ───────────────────────────────────────────────────────────
  const todayStr  = new Date().toISOString().slice(0, 10);
  const todayLog  = foodLog.filter((f) => f.date === todayStr || !f.date);
  const hasMeals  = todayLog.length > 0;

  const totalCal   = todayLog.reduce((s, f) => s + f.calories, 0);
  const totalP     = todayLog.reduce((s, f) => s + f.protein, 0);
  const totalC     = todayLog.reduce((s, f) => s + f.carbs, 0);
  const totalF     = todayLog.reduce((s, f) => s + f.fat, 0);
  const totalFibre = todayLog.reduce((s, f) => s + (f.fibre ?? 0), 0);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr  = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const cycleDay = (() => {
    if (!profile.lastPeriodDate) return profile.cycleDay ?? 1;
    const diff = Math.floor((Date.now() - new Date(profile.lastPeriodDate).getTime()) / 86400000);
    return Math.min(Math.max(1, diff + 1), profile.cycleLength);
  })();

  const phase    = PHASE_INFO[currentPhase];
  const cyclePct = Math.min(cycleDay / profile.cycleLength, 1);

  const hasPCOS       = profile.conditions.includes("PCOS");
  const phaseVitamins = hasPCOS ? PCOS_VITAMINS : PHASE_VITAMINS[currentPhase];
  const takenToday    = vitaminsTakenByDate[todayStr] ?? [];
  const timelyVitamin = getTimelyVitamin(phaseVitamins, takenToday, hour);
  const allVitaminsTaken = phaseVitamins.every((v) => takenToday.includes(v.id));

  const macroColor = hasMeals ? accentColor : ZERO_NUM;
  const easyWins   = phase.easyWins.slice(0, 4);

  // ── Animated bars ──────────────────────────────────────────────────────────
  const calPct    = Math.min(totalCal / Math.max(profile.calorieGoal, 1), 1);
  const calWidth  = useSharedValue(0);
  useEffect(() => {
    calWidth.value = withTiming(calPct, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [calPct]);
  const calAnimStyle = useAnimatedStyle(() => ({ width: `${calWidth.value * 100}%` as any }));

  const cycleWidth = useSharedValue(0);
  useEffect(() => {
    cycleWidth.value = withTiming(cyclePct, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [cyclePct]);
  const cycleAnimStyle = useAnimatedStyle(() => ({ width: `${cycleWidth.value * 100}%` as any }));

  // ── Actions ────────────────────────────────────────────────────────────────
  const tapChip = (win: string) => {
    setLogPrefill(win);
    router.navigate("/(tabs)/log");
  };

  const vitaminNudgeTimingLabel =
    hour < 12 ? " this morning" : hour >= 17 ? " this evening" : " today";

  return (
    <SafeAreaView style={styles.safe}>

      {/* Privacy consent modal */}
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Top bar ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dateStr}>{dateStr}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable
              onPress={() => { setProfileSection("cycle"); setProfileVisible(true); }}
              style={styles.profileBtn}
            >
              <Ionicons name="calendar-outline" size={18} color={DARK_THEME.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => { setProfileSection(undefined); setProfileVisible(true); }}
              style={styles.profileBtn}
            >
              <Ionicons name="person" size={18} color={DARK_THEME.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Phase card ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <GlowCard style={styles.card} noPadding>
            <View style={styles.phaseInner}>
              <View style={styles.phaseTopRow}>
                <View style={styles.phaseLeft}>
                  <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
                  <View>
                    <Text style={styles.phaseName}>{phase.label}</Text>
                    <Text style={styles.phaseDay}>Day {cycleDay} of {profile.cycleLength}</Text>
                  </View>
                </View>
                <Pressable onPress={() => router.navigate("/(tabs)/plan")}>
                  <Text style={styles.seePlanText}>see plan →</Text>
                </Pressable>
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
            </View>
          </GlowCard>
        </Animated.View>

        {/* ── Calorie card ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Pressable onPress={() => setCalExpanded(!calExpanded)}>
            <GlowCard style={styles.card} noPadding>
              <View style={styles.calInner}>

                {/* Header row */}
                <View style={styles.calHeaderRow}>
                  <Text style={styles.calLabel}>CALORIES</Text>
                  <Text>
                    <Text style={[styles.calTotalNum, { color: accentColor }]}>{totalCal}</Text>
                    <Text style={styles.calGoal}> / {profile.calorieGoal} kcal</Text>
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, { backgroundColor: accentColor }, calAnimStyle]} />
                </View>

                {/* 4 macro numbers */}
                <View style={styles.macroNumRow}>
                  {([
                    ["protein", totalP],
                    ["carbs",   totalC],
                    ["fat",     totalF],
                    ["fibre",   totalFibre],
                  ] as [string, number][]).map(([label, val], idx) => (
                    <React.Fragment key={label}>
                      {idx > 0 && <View style={styles.macroNumSep} />}
                      <View style={styles.macroNumCell}>
                        <Text style={[styles.macroNum, { color: macroColor }]}>{val}g</Text>
                        <Text style={styles.macroNumLabel}>{label}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>

                {/* Tap hint */}
                <Text style={styles.calHint}>
                  tap to see full breakdown & vitamins {calExpanded ? "▴" : "▾"}
                </Text>

                {/* Expanded section */}
                {calExpanded && (
                  <View style={styles.expandedSection}>
                    <View style={styles.expandDivider} />

                    <Text style={styles.expandLabel}>MACROS</Text>
                    <MacroBar label="Protein" value={totalP} goal={profile.proteinGoal} accentColor={accentColor} />
                    <MacroBar label="Carbs"   value={totalC} goal={profile.carbsGoal}   accentColor={accentColor} />
                    <MacroBar label="Fat"     value={totalF} goal={profile.fatGoal}      accentColor={accentColor} />

                    <View style={styles.expandDivider} />

                    <Text style={styles.expandLabel}>VITAMINS TODAY</Text>
                    {phaseVitamins.slice(0, 3).map((v) => {
                      const taken = takenToday.includes(v.id);
                      return (
                        <Pressable
                          key={v.id}
                          onPress={() => toggleVitaminTakenForDate(v.id, todayStr)}
                          style={styles.vitaminRow}
                        >
                          <View style={[styles.vitaminCheck, taken && { backgroundColor: accentColor, borderColor: accentColor }]}>
                            {taken && <Ionicons name="checkmark" size={11} color="#0a0e1a" />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.vitaminName, taken && { color: MUTED }]}>{v.name}</Text>
                            <Text style={styles.vitaminDose}>{v.dosage} · {v.timing}</Text>
                          </View>
                        </Pressable>
                      );
                    })}

                    <View style={styles.expandDivider} />

                    <Text style={styles.expandLabel}>MEALS LOGGED</Text>
                    {todayLog.length === 0 ? (
                      <Text style={styles.emptyText}>Nothing logged yet</Text>
                    ) : (
                      todayLog.slice().reverse().map((entry) => (
                        <View key={entry.id} style={styles.expandMealRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.expandMealName} numberOfLines={1}>{entry.name}</Text>
                            <Text style={styles.expandMealMacros}>
                              {fmtTime(entry.time)} · {entry.protein}P {entry.carbs}C {entry.fat}F
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.expandMealCal, { color: accentColor }]}>{entry.calories} kcal</Text>
                            {entry.badge && (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>{entry.badge}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            </GlowCard>
          </Pressable>
        </Animated.View>

        {/* ══ EMPTY STATE ══ */}
        {!hasMeals && (
          <>
            {/* Start your day well card */}
            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <GlowCard style={styles.card} noPadding>
                <View style={styles.emptyCardInner}>
                  <Text style={styles.emptyCardTitle}>Start your day well</Text>
                  <Text style={styles.emptyCardGuidance}>{phase.insight}</Text>

                  <Text style={styles.quickLogLabel}>QUICK LOG</Text>
                  <View style={styles.chipsRow}>
                    {easyWins.map((win) => (
                      <Pressable key={win} onPress={() => tapChip(win)} style={styles.chip}>
                        <Text style={styles.chipText}>{chipLabel(win)}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => router.navigate("/(tabs)/log")}
                    style={[styles.logMealBtn, { backgroundColor: accentColor }]}
                  >
                    <Text style={[styles.logMealBtnText, { color: BTN_TEXT }]}>📷  Log a meal</Text>
                  </Pressable>
                </View>
              </GlowCard>
            </Animated.View>

            {/* Vitamin nudge */}
            {timelyVitamin && (
              <Animated.View entering={FadeInDown.delay(240).duration(400)}>
                <GlowCard style={styles.card} noPadding>
                  <Pressable
                    onPress={() => toggleVitaminTakenForDate(timelyVitamin.id, todayStr)}
                    style={styles.vitaminNudgeRow}
                  >
                    <Text style={styles.vitaminNudgeText} numberOfLines={1}>
                      Remember your {timelyVitamin.name}{vitaminNudgeTimingLabel}
                    </Text>
                    <View style={[
                      styles.vitaminNudgeCheck,
                      takenToday.includes(timelyVitamin.id) && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}>
                      {takenToday.includes(timelyVitamin.id) && <Ionicons name="checkmark" size={11} color="#0a0e1a" />}
                    </View>
                  </Pressable>
                </GlowCard>
              </Animated.View>
            )}
          </>
        )}

        {/* ══ FILLED STATE ══ */}
        {hasMeals && (
          <>
            {/* Today's meals compact list */}
            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <GlowCard style={styles.card} noPadding>
                <View style={styles.mealsListInner}>
                  <Text style={styles.mealsListLabel}>TODAY'S MEALS</Text>
                  {todayLog.slice().reverse().map((entry, idx) => (
                    <View key={entry.id}>
                      {idx > 0 && <View style={styles.mealDivider} />}
                      <View style={styles.mealCompactRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mealCompactName} numberOfLines={1}>{entry.name}</Text>
                          <Text style={styles.mealCompactSub}>
                            {fmtTime(entry.time)} · {entry.protein}P {entry.carbs}C {entry.fat}F
                          </Text>
                        </View>
                        <Text style={[styles.mealCompactCal, { color: accentColor }]}>{entry.calories}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlowCard>
            </Animated.View>

            {/* Action row */}
            <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.actionRow}>
              <Pressable
                onPress={() => router.navigate("/(tabs)/log")}
                style={[styles.actionLogBtn, { backgroundColor: accentColor }]}
              >
                <Text style={[styles.actionLogBtnText, { color: BTN_TEXT }]}>📷  Log meal</Text>
              </Pressable>

              <Pressable
                onPress={() => timelyVitamin && toggleVitaminTakenForDate(timelyVitamin.id, todayStr)}
                style={styles.actionVitaminBtn}
              >
                {allVitaminsTaken || !timelyVitamin ? (
                  <Text style={styles.allTakenText}>all vitamins taken ✓</Text>
                ) : (
                  <View style={styles.actionVitaminInner}>
                    <Text style={styles.actionVitaminName} numberOfLines={1}>
                      {timelyVitamin.name}
                    </Text>
                    <View style={[
                      styles.actionVitaminCheck,
                      takenToday.includes(timelyVitamin.id) && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}>
                      {takenToday.includes(timelyVitamin.id) && <Ionicons name="checkmark" size={10} color="#0a0e1a" />}
                    </View>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </>
        )}

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
  safe:   { flex: 1, backgroundColor: "#0f0a1e" },
  scroll: { padding: 16, paddingTop: 12 },

  // Privacy modal
  privacyOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  privacySheet: {
    backgroundColor: "#0f1525", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  privacyTitle:     { fontFamily: "Georgia", fontSize: 22, color: "#fff", fontWeight: "600", marginBottom: 12 },
  privacyBody:      { fontSize: 14, color: SECONDARY, lineHeight: 22, marginBottom: 16 },
  privacyPoints:    { gap: 8, marginBottom: 24 },
  privacyPoint:     { flexDirection: "row", gap: 8 },
  privacyDot:       { fontSize: 18, lineHeight: 20 },
  privacyPointText: { flex: 1, fontSize: 13, color: SECONDARY, lineHeight: 20 },
  privacyBtn:       { paddingVertical: 14, borderRadius: 16, alignItems: "center", marginBottom: 14 },
  privacyBtnText:   { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  privacyFooter:    { fontSize: 12, color: MUTED, textAlign: "center" },
  privacyLink:      { fontWeight: "600" },

  // Top bar
  topBar:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  greeting:   { fontFamily: "Georgia", fontSize: 22, color: "#fff", fontWeight: "600" },
  dateStr:    { fontSize: TYPE.sm, color: MUTED, marginTop: 3 },
  profileBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },

  card: { marginBottom: 12 },

  // Phase card
  phaseInner:   { padding: 16 },
  phaseTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  phaseLeft:    { flexDirection: "row", alignItems: "center", gap: 10 },
  phaseEmoji:   { fontSize: 22 },
  phaseName:    { fontSize: 16, fontWeight: "700", color: "#fff" },
  phaseDay:     { fontSize: TYPE.xs, color: MUTED, marginTop: 2 },
  seePlanText:  { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600" },
  progressTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden", marginBottom: 12,
  },
  progressFill:  { height: "100%", borderRadius: 2 },
  focusPillRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  focusPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  focusPillText: { fontSize: TYPE.xs, color: "rgba(255,255,255,0.70)", fontWeight: "500" },

  // Calorie card
  calInner:     { padding: 16 },
  calHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  calLabel:     { fontSize: 10, color: MUTED, fontWeight: "700", letterSpacing: 0.8 },
  calTotalNum:  { fontSize: 20, fontWeight: "700" },
  calGoal:      { fontSize: 13, color: MUTED, fontWeight: "400" },
  macroNumRow:  { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 8 },
  macroNumCell: { flex: 1, alignItems: "center" },
  macroNumSep:  { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.08)" },
  macroNum:     { fontSize: 16, fontWeight: "700" },
  macroNumLabel:{ fontSize: 9, color: MUTED, marginTop: 2, letterSpacing: 0.3 },
  calHint:      { fontSize: 10, color: MUTED, textAlign: "center", marginTop: 2 },

  // Expanded section
  expandedSection: { marginTop: 4 },
  expandDivider:   { height: 1, backgroundColor: DIVIDER, marginVertical: 14 },
  expandLabel: {
    fontSize: 9, color: MUTED, fontWeight: "700",
    letterSpacing: 1.2, marginBottom: 10,
  },
  emptyText:       { fontSize: TYPE.sm, color: MUTED, fontStyle: "italic" },
  expandMealRow:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  expandMealName:  { fontSize: TYPE.sm, color: "#fff", fontWeight: "500" },
  expandMealMacros:{ fontSize: TYPE.xs, color: MUTED, marginTop: 2 },
  expandMealCal:   { fontSize: TYPE.sm, fontWeight: "600" },
  badge: {
    marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: { fontSize: 9, color: MUTED, fontWeight: "600" },

  // Vitamin rows (in expanded calorie card)
  vitaminRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  vitaminCheck: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
  },
  vitaminName: { fontSize: TYPE.sm, color: "#fff", fontWeight: "500" },
  vitaminDose: { fontSize: TYPE.xs, color: MUTED, marginTop: 1 },

  // Empty state card
  emptyCardInner:    { padding: 18 },
  emptyCardTitle:    { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 6 },
  emptyCardGuidance: { fontSize: TYPE.sm, color: SECONDARY, lineHeight: 20, marginBottom: 18 },
  quickLogLabel:     { fontSize: 9, color: MUTED, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  chipsRow:          { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  chipText:        { fontSize: TYPE.sm, color: SECONDARY, fontWeight: "500" },
  logMealBtn:      { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  logMealBtnText:  { fontSize: TYPE.body, fontWeight: "700" },

  // Vitamin nudge (empty state)
  vitaminNudgeRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  vitaminNudgeText:{ flex: 1, fontSize: TYPE.sm, color: MUTED, fontStyle: "italic" },
  vitaminNudgeCheck: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  // Filled state meals list
  mealsListInner: { padding: 16 },
  mealsListLabel: { fontSize: 9, color: MUTED, fontWeight: "700", letterSpacing: 1.2, marginBottom: 12 },
  mealDivider:    { height: 1, backgroundColor: DIVIDER, marginVertical: 8 },
  mealCompactRow: { flexDirection: "row", alignItems: "center" },
  mealCompactName:{ fontSize: TYPE.sm, color: "#fff", fontWeight: "500" },
  mealCompactSub: { fontSize: TYPE.xs, color: MUTED, marginTop: 2 },
  mealCompactCal: { fontSize: TYPE.sm, fontWeight: "700", marginLeft: 8 },

  // Filled state action row
  actionRow:          { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionLogBtn:       { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLogBtnText:   { fontSize: TYPE.sm, fontWeight: "700" },
  actionVitaminBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER,
  },
  actionVitaminInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 },
  actionVitaminName:  { flex: 1, fontSize: TYPE.sm, color: SECONDARY, fontWeight: "500" },
  actionVitaminCheck: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
  },
  allTakenText: { fontSize: TYPE.sm, color: MUTED },
});
