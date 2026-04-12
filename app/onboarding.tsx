import React, { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { useRouter } from "expo-router";

import { useAppStore } from "@/store/useAppStore";
import { ACCENT, DARK_THEME, TYPE } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const DIET_OPTIONS = [
  { key: "Omnivore",     emoji: "🍗" },
  { key: "Vegetarian",  emoji: "🥗" },
  { key: "Vegan",       emoji: "🌱" },
  { key: "Pescatarian", emoji: "🐟" },
  { key: "Gluten-Free", emoji: "🌾" },
];

const ALLERGY_OPTIONS = [
  "Gluten", "Dairy", "Eggs", "Nuts", "Peanuts", "Soy", "Shellfish", "Fish", "Sesame",
];

const TOTAL_STEPS = 4; // diet, allergies, calorie goal, period date

export default function OnboardingScreen() {
  const router = useRouter();
  const updateProfile = useAppStore((s) => s.updateProfile);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const userId = useAppStore((s) => s.userId);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [dietStyle, setDietStyle] = useState("Omnivore");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [calorieGoal, setCalorieGoal] = useState("1900");
  const [lastPeriodDate, setLastPeriodDate] = useState("");

  const toggleAllergy = (a: string) => {
    setAllergies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    const cal = Math.max(1200, parseInt(calorieGoal) || 1900);
    updateProfile({
      dietStyle,
      allergies,
      calorieGoal: cal,
      lastPeriodDate: lastPeriodDate.match(/^\d{4}-\d{2}-\d{2}$/) ? lastPeriodDate : null,
    });

    if (userId) {
      try {
        await supabase.auth.updateUser({
          data: {
            onboarded: true,
            lastPeriodDate: lastPeriodDate || null,
          },
        });
      } catch (_) {}
    }

    setOnboarded(true);
    setSaving(false);
    router.replace("/(tabs)");
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleFinish();
  };

  const goBack = () => { if (step > 0) setStep(step - 1); };

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 0 — Dietary style */}
        {step === 0 && (
          <Animated.View entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🍽️</Text>
            <Text style={styles.stepTitle}>Any dietary requirements?</Text>
            <Text style={styles.stepSubtitle}>We'll tailor food suggestions to suit you</Text>
            <View style={styles.onboardingNote}>
              <Text style={styles.onboardingNoteText}>
                We will never tell you your body is wrong. Bloating, cravings, low energy — these are messages from your body, not failures.
              </Text>
              <Text style={styles.onboardingNoteSmall}>Feaste is not a weight loss app. It is a feel better app.</Text>
            </View>
            <View style={styles.optionGrid}>
              {DIET_OPTIONS.map(({ key, emoji }) => {
                const active = dietStyle === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setDietStyle(key)}
                    style={[styles.optionBtn, active && styles.optionBtnActive]}
                  >
                    <Text style={styles.optionEmoji}>{emoji}</Text>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 1 — Allergies */}
        {step === 1 && (
          <Animated.View entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={styles.stepContent}>
            <Text style={styles.stepEmoji}>⚠️</Text>
            <Text style={styles.stepTitle}>Any allergies?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply — skip if none</Text>
            <View style={styles.chipGrid}>
              {ALLERGY_OPTIONS.map((a) => {
                const active = allergies.includes(a);
                return (
                  <Pressable
                    key={a}
                    onPress={() => toggleAllergy(a)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{a}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 2 — Calorie goal */}
        {step === 2 && (
          <Animated.View entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>What's your daily calorie goal?</Text>
            <Text style={styles.stepSubtitle}>Not sure? 1500–2000 is a good starting point</Text>
            <View style={styles.calorieInputWrap}>
              <TextInput
                style={styles.calorieInput}
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="number-pad"
                placeholder="1900"
                placeholderTextColor={DARK_THEME.textMuted}
              />
              <Text style={styles.calorieUnit}>kcal / day</Text>
            </View>
            <View style={styles.calorieSuggestions}>
              {["1500", "1700", "1900", "2100", "2300"].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setCalorieGoal(v)}
                  style={[styles.calSuggestion, calorieGoal === v && styles.calSuggestionActive]}
                >
                  <Text style={[styles.calSuggestionText, calorieGoal === v && styles.calSuggestionTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Step 3 — Last period date */}
        {step === 3 && (
          <Animated.View entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🌺</Text>
            <Text style={styles.stepTitle}>When did your last period start?</Text>
            <Text style={styles.stepSubtitle}>This helps us track your cycle phase. You can skip this.</Text>
            <TextInput
              style={styles.dateInput}
              value={lastPeriodDate}
              onChangeText={setLastPeriodDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={DARK_THEME.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.dateHint}>e.g. {new Date().toISOString().slice(0, 10)}</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <Pressable onPress={goNext} style={styles.nextBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#0a0e1a" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS - 1 ? (lastPeriodDate ? "Let's go" : "Skip") : "Continue"}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_THEME.bg },

  progressTrack: {
    height: 3, backgroundColor: "rgba(255,255,255,0.07)",
  },
  progressFill: {
    height: "100%", backgroundColor: ACCENT, borderRadius: 2,
  },

  scroll: { flexGrow: 1, padding: 24, paddingTop: 48, paddingBottom: 20 },

  stepContent: { flex: 1 },
  stepEmoji: { fontSize: 40, marginBottom: 16 },
  stepTitle: {
    fontFamily: "Georgia", fontSize: 26,
    color: DARK_THEME.textPrimary, fontWeight: "600",
    marginBottom: 8, lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: TYPE.body, color: DARK_THEME.textSecondary,
    marginBottom: 16, lineHeight: 20,
  },
  onboardingNote: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14, marginBottom: 28,
  },
  onboardingNoteText: {
    fontSize: TYPE.sm, color: DARK_THEME.textSecondary,
    lineHeight: 20, marginBottom: 6,
  },
  onboardingNoteSmall: {
    fontSize: TYPE.xs, color: DARK_THEME.textMuted, fontStyle: "italic",
  },

  // Diet grid
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  optionBtn: {
    width: "47%", alignItems: "center", paddingVertical: 16, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", gap: 6,
  },
  optionBtnActive: {
    backgroundColor: `${ACCENT}12`,
    borderColor: `${ACCENT}50`,
  },
  optionEmoji: { fontSize: 26 },
  optionLabel: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, fontWeight: "500" },
  optionLabelActive: { color: ACCENT, fontWeight: "700" },

  // Allergy chips
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
  },
  chipActive: { backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}50` },
  chipText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary },
  chipTextActive: { color: ACCENT, fontWeight: "600" },

  // Calorie input
  calorieInputWrap: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  calorieInput: {
    flex: 1, backgroundColor: DARK_THEME.inputBg, borderRadius: 16,
    borderWidth: 1, borderColor: `${ACCENT}40`,
    paddingHorizontal: 20, paddingVertical: 16,
    fontSize: 32, fontWeight: "700", color: DARK_THEME.textPrimary, textAlign: "center",
  },
  calorieUnit: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  calorieSuggestions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  calSuggestion: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  calSuggestionActive: { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}40` },
  calSuggestionText: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  calSuggestionTextActive: { color: ACCENT, fontWeight: "600" },

  // Period date
  dateInput: {
    backgroundColor: DARK_THEME.inputBg, borderRadius: 16,
    borderWidth: 1, borderColor: `${ACCENT}30`,
    paddingHorizontal: 20, paddingVertical: 16,
    fontSize: 18, color: DARK_THEME.textPrimary, letterSpacing: 1,
    marginBottom: 8,
  },
  dateHint: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },

  // Navigation
  navRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 24, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  backBtnText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary },
  nextBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 16, alignItems: "center",
    backgroundColor: ACCENT,
  },
  nextBtnText: { fontSize: TYPE.lg, fontWeight: "700", color: "#0a0e1a" },
});
