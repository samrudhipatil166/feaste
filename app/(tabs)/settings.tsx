import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, TextInput,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { ACCENT, DARK_THEME, GOAL_LABELS, TYPE } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { GlowCard } from "@/components/GlowCard";
import { GoalType } from "@/types";

// ── Option data (mirrors onboarding) ─────────────────────────────────────────

const GOALS: { key: GoalType; label: string; emoji: string }[] = [
  { key: "wellness",   label: "General Wellness",   emoji: "🌿" },
  { key: "muscle",     label: "Muscle Gain",         emoji: "💪" },
  { key: "weightloss", label: "Weight Loss",          emoji: "🔥" },
  { key: "hormonal",   label: "Hormonal Balance",    emoji: "🌸" },
];

const CONDITIONS = [
  "PCOS", "Hypothyroidism", "Hyperthyroidism", "Perimenopause",
  "Endometriosis", "Amenorrhea", "Irregular periods", "None",
];

const DIET_STYLES = [
  "Balanced", "Plant-Based", "Keto-ish",
  "High Protein", "Anti-Inflammatory", "No Preference",
];

const ALLERGIES = [
  "Gluten", "Dairy", "Nuts", "Soy", "Eggs", "Shellfish", "Nightshades", "None",
];

const AVOID_FOODS = [
  "Beef", "Pork", "Lamb", "Fish", "Shellfish",
  "Chicken", "Turkey", "Red meat", "Mushrooms",
  "Onions", "Garlic", "Spicy food", "Raw food",
];

const CUISINES = [
  "Italian", "Japanese", "Mexican", "Indian", "Thai",
  "Korean", "Middle Eastern", "American", "Mediterranean",
  "Chinese", "Jamaican", "Caribbean", "Ethiopian", "Greek",
  "French", "Vietnamese", "Turkish", "Spanish", "Peruvian",
];

const COOKING_TIMES = ["15 min", "30 min", "45 min", "60+ min"];

// ── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({
  title, open, onToggle, accentColor,
}: { title: string; open: boolean; onToggle: () => void; accentColor: string }) {
  return (
    <Pressable onPress={onToggle} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons
        name={open ? "chevron-up" : "chevron-down"}
        size={16}
        color={open ? accentColor : DARK_THEME.textMuted}
      />
    </Pressable>
  );
}

function ChipRow({
  options, selected, onToggle, accentColor, single,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  accentColor: string;
  single?: boolean;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() => onToggle(o)}
            style={[styles.chip, active && { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}50` }]}
          >
            <Text style={[styles.chipText, active && { color: accentColor }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({
  value, min, max, onChange, label, accentColor,
}: { value: number; min: number; max: number; onChange: (v: number) => void; label: string; accentColor: string }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.stepperBtn}
          hitSlop={8}
        >
          <Ionicons name="remove" size={16} color={DARK_THEME.textSecondary} />
        </Pressable>
        <Text style={[styles.stepperVal, { color: accentColor }]}>{value}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.stepperBtn}
          hitSlop={8}
        >
          <Ionicons name="add" size={16} color={accentColor} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const accentColor = useAppStore((s) => s.accentColor());

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // Local macro state (need explicit save since they're text inputs)
  const [calories, setCalories] = useState(String(profile.calorieGoal));
  const [protein, setProtein] = useState(String(profile.proteinGoal));
  const [carbs, setCarbs] = useState(String(profile.carbsGoal));
  const [fat, setFat] = useState(String(profile.fatGoal));

  const toggle = (section: string) =>
    setOpenSection((prev) => (prev === section ? null : section));

  const toggleMulti = (key: keyof typeof profile, val: string) => {
    const current = (profile[key] as string[]) ?? [];
    const next = current.includes(val)
      ? current.filter((x) => x !== val)
      : [...current, val];
    updateProfile({ [key]: next });
  };

  const saveMacros = () => {
    updateProfile({
      calorieGoal: Math.max(1, parseInt(calories) || profile.calorieGoal),
      proteinGoal: Math.max(1, parseInt(protein) || profile.proteinGoal),
      carbsGoal:   Math.max(1, parseInt(carbs)   || profile.carbsGoal),
      fatGoal:     Math.max(1, parseInt(fat)      || profile.fatGoal),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 20 }}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Tap any section to edit</Text>
        </Animated.View>

        {/* ── Goal ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Goal" open={openSection === "goal"} onToggle={() => toggle("goal")} accentColor={accentColor} />
          {openSection !== "goal" && (
            <Text style={styles.summaryText}>{GOAL_LABELS[profile.goal]}</Text>
          )}
          {openSection === "goal" && (
            <View style={styles.goalGrid}>
              {GOALS.map((g) => {
                const active = profile.goal === g.key;
                return (
                  <Pressable
                    key={g.key}
                    onPress={() => updateProfile({ goal: g.key })}
                    style={[styles.goalBtn, active && { borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}10` }]}
                  >
                    <Text style={styles.goalEmoji}>{g.emoji}</Text>
                    <Text style={[styles.goalLabel, active && { color: ACCENT }]}>{g.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </GlowCard>

        {/* ── Cycle ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Cycle" open={openSection === "cycle"} onToggle={() => toggle("cycle")} accentColor={accentColor} />
          {openSection !== "cycle" && (
            <Text style={styles.summaryText}>{profile.cycleLength}-day cycle</Text>
          )}
          {openSection === "cycle" && (
            <Stepper
              label="Cycle length (days)"
              value={profile.cycleLength}
              min={21} max={45}
              onChange={(v) => updateProfile({ cycleLength: v })}
              accentColor={accentColor}
            />
          )}
        </GlowCard>

        {/* ── Diet ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Diet Style" open={openSection === "diet"} onToggle={() => toggle("diet")} accentColor={accentColor} />
          {openSection !== "diet" && (
            <Text style={styles.summaryText}>{profile.dietStyle || "Balanced"}</Text>
          )}
          {openSection === "diet" && (
            <ChipRow
              options={DIET_STYLES}
              selected={[profile.dietStyle]}
              onToggle={(v) => updateProfile({ dietStyle: v })}
              accentColor={accentColor}
              single
            />
          )}
        </GlowCard>

        {/* ── Allergies ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Allergies & Intolerances" open={openSection === "allergies"} onToggle={() => toggle("allergies")} accentColor={accentColor} />
          {openSection !== "allergies" && (
            <Text style={styles.summaryText}>{profile.allergies.length > 0 ? profile.allergies.join(", ") : "None"}</Text>
          )}
          {openSection === "allergies" && (
            <ChipRow
              options={ALLERGIES}
              selected={profile.allergies}
              onToggle={(v) => toggleMulti("allergies", v)}
              accentColor={accentColor}
            />
          )}
        </GlowCard>

        {/* ── Dislikes ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Foods to Avoid" open={openSection === "dislikes"} onToggle={() => toggle("dislikes")} accentColor={accentColor} />
          {openSection !== "dislikes" && (
            <Text style={styles.summaryText}>{profile.dislikes.length > 0 ? profile.dislikes.join(", ") : "None"}</Text>
          )}
          {openSection === "dislikes" && (
            <ChipRow
              options={AVOID_FOODS}
              selected={profile.dislikes}
              onToggle={(v) => toggleMulti("dislikes", v)}
              accentColor={accentColor}
            />
          )}
        </GlowCard>

        {/* ── Cuisines ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Cuisine Preferences" open={openSection === "cuisines"} onToggle={() => toggle("cuisines")} accentColor={accentColor} />
          {openSection !== "cuisines" && (
            <Text style={styles.summaryText}>{profile.cuisines.length > 0 ? profile.cuisines.join(", ") : "Any"}</Text>
          )}
          {openSection === "cuisines" && (
            <ChipRow
              options={CUISINES}
              selected={profile.cuisines}
              onToggle={(v) => toggleMulti("cuisines", v)}
              accentColor={accentColor}
            />
          )}
        </GlowCard>

        {/* ── Conditions ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Health Conditions" open={openSection === "conditions"} onToggle={() => toggle("conditions")} accentColor={accentColor} />
          {openSection !== "conditions" && (
            <Text style={styles.summaryText}>{profile.conditions.length > 0 ? profile.conditions.join(", ") : "None"}</Text>
          )}
          {openSection === "conditions" && (
            <ChipRow
              options={CONDITIONS}
              selected={profile.conditions}
              onToggle={(v) => toggleMulti("conditions", v)}
              accentColor={accentColor}
            />
          )}
        </GlowCard>

        {/* ── Cooking time ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Cooking Time" open={openSection === "cooking"} onToggle={() => toggle("cooking")} accentColor={accentColor} />
          {openSection !== "cooking" && (
            <Text style={styles.summaryText}>{profile.cookingTime}</Text>
          )}
          {openSection === "cooking" && (
            <ChipRow
              options={COOKING_TIMES}
              selected={[profile.cookingTime]}
              onToggle={(v) => updateProfile({ cookingTime: v })}
              accentColor={accentColor}
              single
            />
          )}
        </GlowCard>

        {/* ── Macros ── */}
        <GlowCard style={styles.card}>
          <SectionHeader title="Macro Targets" open={openSection === "macros"} onToggle={() => toggle("macros")} accentColor={accentColor} />
          {openSection !== "macros" && (
            <Text style={styles.summaryText}>
              {profile.calorieGoal} kcal · P:{profile.proteinGoal}g · C:{profile.carbsGoal}g · F:{profile.fatGoal}g
            </Text>
          )}
          {openSection === "macros" && (
            <>
              <View style={styles.macroInputRow}>
                {[
                  { label: "Calories", value: calories, set: setCalories, unit: "kcal" },
                  { label: "Protein",  value: protein,  set: setProtein,  unit: "g" },
                  { label: "Carbs",    value: carbs,    set: setCarbs,    unit: "g" },
                  { label: "Fat",      value: fat,      set: setFat,      unit: "g" },
                ].map((f) => (
                  <View key={f.label} style={styles.macroInputCell}>
                    <Text style={styles.macroInputLabel}>{f.label}</Text>
                    <TextInput
                      style={[styles.macroInput, { borderColor: `${accentColor}40` }]}
                      value={f.value}
                      onChangeText={f.set}
                      keyboardType="numeric"
                      placeholderTextColor={DARK_THEME.textMuted}
                    />
                    <Text style={styles.macroInputUnit}>{f.unit}</Text>
                  </View>
                ))}
              </View>
              <Pressable onPress={saveMacros} style={[styles.saveBtn, { backgroundColor: accentColor }]}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </>
          )}
        </GlowCard>

        {/* ── Account ── */}
        <GlowCard style={styles.card}>
          {confirmSignOut ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Are you sure you want to sign out?</Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirmSignOut(false)} style={styles.confirmCancel}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => supabase.auth.signOut()} style={[styles.confirmAction, { backgroundColor: "#f87171" }]}>
                  <Text style={styles.confirmActionText}>Sign Out</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmSignOut(true)} style={styles.actionRow}>
              <Ionicons name="log-out-outline" size={20} color="#f87171" />
              <Text style={[styles.actionText, { color: "#f87171" }]}>Sign Out</Text>
            </Pressable>
          )}
        </GlowCard>

        <Text style={styles.version}>Feaste v1.0.0 🌸</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_THEME.bg },
  scroll: { padding: 16, paddingTop: 12, paddingBottom: 48 },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  subtitle: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, marginTop: 4 },
  card: { marginBottom: 10 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: "Georgia", fontSize: 14, color: DARK_THEME.textPrimary, fontWeight: "600" },
  summaryText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, marginTop: 6 },

  // Goal grid
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  goalBtn: {
    width: "48%", alignItems: "center", paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: DARK_THEME.borderColor, backgroundColor: "rgba(255,255,255,0.02)", gap: 4,
  },
  goalEmoji: { fontSize: 22 },
  goalLabel: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, fontWeight: "500", textAlign: "center" },

  // Chips
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: DARK_THEME.borderColor, backgroundColor: "rgba(255,255,255,0.02)",
  },
  chipText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary },

  // Stepper
  stepperRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  stepperLabel: { fontSize: TYPE.body, color: DARK_THEME.textSecondary },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepperBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    borderColor: DARK_THEME.borderColor, alignItems: "center", justifyContent: "center",
  },
  stepperVal: { fontSize: 18, fontWeight: "700", minWidth: 32, textAlign: "center" },

  // Macro inputs
  macroInputRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  macroInputCell: { flex: 1, alignItems: "center", gap: 4 },
  macroInputLabel: { fontSize: 10, color: DARK_THEME.textMuted, fontWeight: "600" },
  macroInput: {
    width: "100%", backgroundColor: DARK_THEME.inputBg, borderRadius: 10,
    borderWidth: 1, color: DARK_THEME.textPrimary, fontSize: 15, fontWeight: "700",
    textAlign: "center", paddingVertical: 8,
  },
  macroInputUnit: { fontSize: 10, color: DARK_THEME.textMuted },
  saveBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 14 },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#0a0e1a" },

  // Account
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 2 },
  actionText: { flex: 1, fontSize: 14, color: DARK_THEME.textSecondary },
  confirmBox: { gap: 12 },
  confirmText: { fontSize: 13, color: DARK_THEME.textSecondary, lineHeight: 18 },
  confirmRow: { flexDirection: "row", gap: 8 },
  confirmCancel: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center",
  },
  confirmCancelText: { fontSize: 13, color: DARK_THEME.textSecondary },
  confirmAction: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  confirmActionText: { fontSize: 13, color: "#0a0e1a", fontWeight: "600" },

  version: { textAlign: "center", fontSize: 12, color: DARK_THEME.textMuted, marginTop: 24 },
});
