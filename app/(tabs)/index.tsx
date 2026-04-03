import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, MACRO_COLORS, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { MacroRing } from "@/components/MacroRing";
import { CycleCard } from "@/components/CycleCard";
import { FoodEntry } from "@/types";

function CalorieBar({
  current,
  goal,
  accentColor,
}: {
  current: number;
  goal: number;
  accentColor: string;
}) {
  const pct = Math.min(current / goal, 1);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  const remaining = goal - current;
  const pctDisplay = Math.round(pct * 100);

  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: accentColor, shadowColor: accentColor },
            animStyle,
          ]}
        />
      </View>
      <View style={styles.barLabels}>
        <Text style={styles.barLabelLeft}>
          {remaining > 0 ? `${remaining} kcal remaining` : "Goal reached! 🎉"}
        </Text>
        <Text style={[styles.barLabelRight, { color: accentColor }]}>
          {pctDisplay}%
        </Text>
      </View>
    </View>
  );
}

function WaterTracker() {
  const water = useAppStore((s) => s.waterGlasses);
  const setWater = useAppStore((s) => s.setWater);

  return (
    <GlowCard style={styles.sectionCard} delay={0.2}>
      <View style={styles.waterHeader}>
        <View style={styles.waterTitleRow}>
          <Ionicons name="water-outline" size={18} color={MACRO_COLORS.water} />
          <Text style={styles.cardTitle}>Water</Text>
        </View>
        <View style={styles.waterControls}>
          <Pressable
            onPress={() => setWater(water - 1)}
            style={styles.waterBtn}
          >
            <Ionicons name="remove" size={16} color={DARK_THEME.textSecondary} />
          </Pressable>
          <Text style={styles.waterCount}>{water}/8</Text>
          <Pressable
            onPress={() => setWater(water + 1)}
            style={[styles.waterBtn, { backgroundColor: "rgba(96,165,250,0.15)" }]}
          >
            <Ionicons name="add" size={16} color={MACRO_COLORS.water} />
          </Pressable>
        </View>
      </View>
      <View style={styles.waterDots}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.waterDot,
              {
                backgroundColor:
                  i < water
                    ? MACRO_COLORS.water
                    : "rgba(255,255,255,0.06)",
                shadowColor: i < water ? MACRO_COLORS.water : "transparent",
                shadowOpacity: i < water ? 0.4 : 0,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          />
        ))}
      </View>
    </GlowCard>
  );
}

function StreakBanner({ streak, accentColor }: { streak: number; accentColor: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 750 }),
        withTiming(1, { duration: 750 })
      ),
      -1
    );
  }, []);
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (streak === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(50).duration(400)}
      style={[styles.streakBanner, { backgroundColor: `${accentColor}08`, borderColor: `${accentColor}15` }]}
    >
      <Animated.Text style={[styles.streakEmoji, emojiStyle]}>🔥</Animated.Text>
      <Text style={styles.streakText} numberOfLines={1}>
        <Text style={{ fontWeight: "700" }}>{streak}-day streak!</Text>
        {"  "}You're on fire (not literally)
      </Text>
      <View style={styles.streakDots}>
        {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.streakDot,
              {
                backgroundColor: accentColor,
                opacity: 0.3 + (i / 7) * 0.7,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function FoodLogEntry({ entry, accentColor }: { entry: FoodEntry; accentColor: string }) {
  const removeFoodEntry = useAppStore((s) => s.removeFoodEntry);

  return (
    <View style={styles.logEntry}>
      <View style={{ flex: 1 }}>
        <Text style={styles.logName}>{entry.name}</Text>
        <Text style={styles.logMeta}>
          {entry.time} · {entry.meal}
        </Text>
      </View>
      <View style={styles.logRight}>
        <Text style={[styles.logCal, { color: accentColor }]}>
          {entry.calories} kcal
        </Text>
        <Text style={styles.logMacros}>
          P:{entry.protein} C:{entry.carbs} F:{entry.fat}
        </Text>
      </View>
    </View>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const foodLog = useAppStore((s) => s.foodLog);
  const streak = useAppStore((s) => s.streak);
  const accentColor = useAppStore((s) => s.accentColor());
  const privacyAccepted = useAppStore((s) => s.privacyAccepted);
  const setPrivacyAccepted = useAppStore((s) => s.setPrivacyAccepted);

  const totalCal = foodLog.reduce((s, f) => s + f.calories, 0);
  const totalProtein = foodLog.reduce((s, f) => s + f.protein, 0);
  const totalCarbs = foodLog.reduce((s, f) => s + f.carbs, 0);
  const totalFat = foodLog.reduce((s, f) => s + f.fat, 0);

  const today = new Date();
  const greeting = today.getHours() < 12
    ? "Good morning"
    : today.getHours() < 17
    ? "Good afternoon"
    : "Good evening";

  const dayStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Privacy consent — shown once, blocks use until accepted */}
      <Modal visible={!privacyAccepted} transparent animationType="slide">
        <View style={styles.privacyOverlay}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.privacySheet}>
            <Text style={styles.privacyTitle}>Before we begin 🌿</Text>
            <Text style={styles.privacyBody}>
              Feaste collects and processes health-related information — including your menstrual cycle, dietary habits, and nutritional data — to personalise your experience.
            </Text>
            <View style={styles.privacyPoints}>
              {[
                "Your data is stored securely and never sold to third parties.",
                "Health insights are for informational purposes only, not medical advice.",
                "Always consult a healthcare professional for medical decisions.",
                "You can delete your data at any time from Settings.",
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {greeting}{" "}
              {today.getHours() < 12 ? "🌤️" : today.getHours() < 17 ? "☀️" : "🌙"}
            </Text>
            <Text style={styles.dateStr}>{dayStr}</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/settings")} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color={DARK_THEME.textMuted} />
          </Pressable>
        </Animated.View>

        {/* Streak */}
        <StreakBanner streak={streak} accentColor={accentColor} />

        {/* Cycle card */}
        <View style={styles.sectionCard}>
          <CycleCard />
        </View>

        {/* Macro rings */}
        <GlowCard style={styles.sectionCard} delay={0.1}>
          <View style={styles.macroHeader}>
            <Text style={styles.cardTitle}>Today's Macros</Text>
            <Text style={[styles.calDisplay, { color: accentColor }]}>
              {totalCal} / {profile.calorieGoal} kcal
            </Text>
          </View>
          <View style={styles.ringsRow}>
            <MacroRing
              value={totalProtein}
              max={profile.proteinGoal}
              color={MACRO_COLORS.protein}
              label="Protein"
              unit="g"
            />
            <MacroRing
              value={totalCarbs}
              max={profile.carbsGoal}
              color={MACRO_COLORS.carbs}
              label="Carbs"
              unit="g"
            />
            <MacroRing
              value={totalFat}
              max={profile.fatGoal}
              color={MACRO_COLORS.fat}
              label="Fat"
              unit="g"
            />
          </View>
          <CalorieBar
            current={totalCal}
            goal={profile.calorieGoal}
            accentColor={accentColor}
          />
        </GlowCard>

        {/* Recent food log */}
        <GlowCard style={styles.sectionCard} delay={0.3}>
          <View style={styles.recentEatsHeader}>
            <Text style={styles.cardTitle}>Recent Eats</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/log")}
              style={[styles.logShortcut, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` }]}
            >
              <Ionicons name="add" size={14} color={accentColor} />
              <Text style={[styles.logShortcutText, { color: accentColor }]}>Log food</Text>
            </Pressable>
          </View>
          {foodLog.length === 0 ? (
            <Pressable onPress={() => router.push("/(tabs)/log")} style={styles.emptyLog}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyText}>No food logged yet today</Text>
              <Text style={styles.emptySubtext}>Tap here or use the Log tab to add a meal</Text>
            </Pressable>
          ) : (
            <View>
              {foodLog.slice().reverse().slice(0, 5).map((entry, idx) => (
                <Animated.View
                  key={entry.id}
                  entering={FadeInDown.delay(0.4 + idx * 0.08).duration(300)}
                >
                  <FoodLogEntry entry={entry} accentColor={accentColor} />
                  {idx < Math.min(foodLog.length, 5) - 1 && (
                    <View style={styles.logDivider} />
                  )}
                </Animated.View>
              ))}
            </View>
          )}
        </GlowCard>

        {/* Bottom padding — extra to clear FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating log button */}
      <Pressable
        onPress={() => router.push("/(tabs)/log")}
        style={[styles.fab, { backgroundColor: accentColor }]}
      >
        <Ionicons name="camera" size={22} color="#0a0e1a" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Privacy modal
  privacyOverlay: {
    flex: 1, justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  privacySheet: {
    backgroundColor: DARK_THEME.cardBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  privacyTitle: {
    fontFamily: "Georgia", fontSize: 22,
    color: DARK_THEME.textPrimary, fontWeight: "600",
    marginBottom: 12,
  },
  privacyBody: {
    fontSize: 14, color: DARK_THEME.textSecondary,
    lineHeight: 22, marginBottom: 16,
  },
  privacyPoints: { gap: 8, marginBottom: 24 },
  privacyPoint: { flexDirection: "row", gap: 8 },
  privacyDot: { fontSize: 18, lineHeight: 20 },
  privacyPointText: { flex: 1, fontSize: 13, color: DARK_THEME.textSecondary, lineHeight: 20 },
  privacyBtn: {
    paddingVertical: 14, borderRadius: 16,
    alignItems: "center", marginBottom: 14,
  },
  privacyBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  privacyFooter: { fontSize: 12, color: DARK_THEME.textMuted, textAlign: "center" },
  privacyLink: { fontWeight: "600" },

  safeArea: {
    flex: 1,
    backgroundColor: DARK_THEME.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greeting: {
    fontFamily: "Georgia",
    fontSize: 22,
    color: DARK_THEME.textPrimary,
    fontWeight: "600",
  },
  dateStr: {
    fontSize: 12,
    color: DARK_THEME.textSecondary,
    marginTop: 4,
  },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  allergyBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    maxWidth: 160,
    justifyContent: "flex-end",
  },
  allergyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  allergyText: {
    fontSize: 11,
    color: DARK_THEME.textSecondary,
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    fontSize: 13,
    color: DARK_THEME.textPrimary,
    flex: 1,
  },
  streakDots: {
    flexDirection: "row",
    gap: 2,
  },
  streakDot: {
    width: 5,
    height: 12,
    borderRadius: 3,
  },
  sectionCard: {
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: "Georgia",
    fontSize: TYPE.lg,
    color: DARK_THEME.textPrimary,
    fontWeight: "600",
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calDisplay: {
    fontSize: TYPE.sm,
    fontWeight: "600",
  },
  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  barLabelLeft: {
    fontSize: TYPE.sm,
    color: DARK_THEME.textMuted,
  },
  barLabelRight: {
    fontSize: TYPE.sm,
    fontWeight: "600",
  },
  waterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  waterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  waterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  waterCount: {
    fontSize: 15,
    color: DARK_THEME.textPrimary,
    minWidth: 36,
    textAlign: "center",
    fontWeight: "600",
  },
  waterDots: {
    flexDirection: "row",
    gap: 6,
  },
  waterDot: {
    flex: 1,
    height: 10,
    borderRadius: 5,
  },
  logEntry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  logName: {
    fontSize: TYPE.body,
    color: DARK_THEME.textPrimary,
    fontWeight: "500",
  },
  logMeta: {
    fontSize: TYPE.sm,
    color: DARK_THEME.textMuted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  logRight: {
    alignItems: "flex-end",
  },
  logCal: {
    fontSize: TYPE.body,
    fontWeight: "600",
  },
  logMacros: {
    fontSize: TYPE.xs,
    color: DARK_THEME.textMuted,
    marginTop: 2,
  },
  logDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  recentEatsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  logShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  logShortcutText: {
    fontSize: TYPE.sm,
    fontWeight: "600",
  },
  emptyLog: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: TYPE.body,
    color: DARK_THEME.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: TYPE.md,
    color: DARK_THEME.textMuted,
  },
  fab: {
    position: "absolute",
    bottom: 96,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
