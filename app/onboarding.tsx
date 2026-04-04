import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, GOAL_COLORS, GOAL_LABELS, TYPE } from "@/constants/theme";
import { GoalType } from "@/types";
import { supabase } from "@/lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GOALS: { key: GoalType; emoji: string; desc: string }[] = [
  { key: "wellness", emoji: "🌿", desc: "Feel balanced & energised every day" },
  { key: "muscle", emoji: "💪", desc: "Build lean muscle & strength" },
  { key: "weightloss", emoji: "🔥", desc: "Lose weight sustainably" },
  { key: "hormonal", emoji: "🌙", desc: "Balance hormones & cycle symptoms" },
];

const CONDITIONS = [
  "PCOS", "Hypothyroidism", "Hyperthyroidism", "Perimenopause",
  "Endometriosis", "Amenorrhea", "Irregular periods", "None",
];

const DIET_STYLES = [
  "Balanced", "Plant-Based", "Keto-ish",
  "High Protein", "Anti-Inflammatory", "No Preference",
];

const CUISINES = [
  "Italian", "Japanese", "Mexican", "Indian", "Thai",
  "Korean", "Middle Eastern", "American", "Mediterranean",
  "Chinese", "Jamaican", "Caribbean", "Ethiopian", "Greek",
  "French", "Vietnamese", "Turkish", "Spanish", "Peruvian",
];

const ALLERGIES = [
  "Gluten", "Dairy", "Nuts", "Soy", "Eggs",
  "Shellfish", "Nightshades", "None",
];

const AVOID_FOODS = [
  "Beef", "Pork", "Lamb", "Fish", "Shellfish",
  "Chicken", "Turkey", "Red meat", "Mushrooms",
  "Onions", "Garlic", "Spicy food", "Raw food",
];

const COOKING_TIMES = ["15 min", "30 min", "45 min", "60+ min"];

export default function OnboardingScreen() {
  const router = useRouter();
  const updateProfile = useAppStore((s) => s.updateProfile);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const userId = useAppStore((s) => s.userId);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [goal, setGoal] = useState<GoalType>("wellness");
  const [conditions, setConditions] = useState<string[]>([]);
  const [cycleLength, setCycleLength] = useState(28);
  const [irregular, setIrregular] = useState(false);
  const today = new Date();
  const [periodDay, setPeriodDay] = useState(today.getDate());
  const [periodMonth, setPeriodMonth] = useState(today.getMonth());
  const [periodYear, setPeriodYear] = useState(today.getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(today.getMonth());
  const [calViewYear, setCalViewYear] = useState(today.getFullYear());
  const [periodDays, setPeriodDays] = useState(5);
  const [flow, setFlow] = useState("Medium");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [dietStyles, setDietStyles] = useState<string[]>(["Balanced"]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [cookingTime, setCookingTime] = useState("30 min");

  // Macro targets
  const [calorieGoal, setCalorieGoal] = useState("1900");
  const [proteinGoal, setProteinGoal] = useState("130");
  const [carbsGoal, setCarbsGoal] = useState("220");
  const [fatGoal, setFatGoal] = useState("65");

  const accentColor = GOAL_COLORS[goal];

  const GOAL_MACRO_PRESETS: Record<GoalType, { cal: string; protein: string; carbs: string; fat: string }> = {
    wellness:   { cal: "1900", protein: "130", carbs: "220", fat: "65" },
    muscle:     { cal: "2200", protein: "170", carbs: "230", fat: "70" },
    weightloss: { cal: "1600", protein: "130", carbs: "155", fat: "55" },
    hormonal:   { cal: "1800", protein: "100", carbs: "210", fat: "70" },
  };

  // Auto-recalculate macros when calories change, using goal-based ratios
  useEffect(() => {
    const cal = parseInt(calorieGoal);
    if (!cal || cal < 500) return;
    const preset = GOAL_MACRO_PRESETS[goal as keyof typeof GOAL_MACRO_PRESETS] ?? GOAL_MACRO_PRESETS.wellness;
    const baseCal = parseInt(preset.cal);
    const proteinRatio = (parseInt(preset.protein) * 4) / baseCal;
    const carbsRatio = (parseInt(preset.carbs) * 4) / baseCal;
    const fatRatio = (parseInt(preset.fat) * 9) / baseCal;
    setProteinGoal(String(Math.round((cal * proteinRatio) / 4)));
    setCarbsGoal(String(Math.round((cal * carbsRatio) / 4)));
    setFatGoal(String(Math.round((cal * fatRatio) / 9)));
  }, [calorieGoal]);

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) => {
    if (item === "None") {
      set(arr.includes("None") ? [] : ["None"]);
      return;
    }
    set(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr.filter((x) => x !== "None"), item]);
  };

  const TOTAL_STEPS = 7;

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const periodDateObj = new Date(periodYear, periodMonth, periodDay);
  const periodDateStr = `${String(periodDay).padStart(2,"0")}-${MONTHS[periodMonth]}-${periodYear}`;

  const calcCycleDay = (): number => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - periodDateObj.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(1, diff + 1), cycleLength);
  };

  const daysInMonth = new Date(periodYear, periodMonth + 1, 0).getDate();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();
  const maxDay = (periodYear === todayY && periodMonth === todayM) ? todayD : daysInMonth;
  const maxMonth = periodYear === todayY ? todayM : 11;

  const handleFinish = async () => {
    setSaving(true);
    const parsedCycleLength = cycleLength;
    const parsedCycleDay = calcCycleDay();

    const isoDate = `${periodYear}-${String(periodMonth + 1).padStart(2,"0")}-${String(periodDay).padStart(2,"0")}`;

    updateProfile({
      goal,
      conditions,
      cycleLength: parsedCycleLength,
      cycleDay: parsedCycleDay,
      lastPeriodDate: isoDate,
      allergies,
      dislikes,
      dietStyle: dietStyles.join(", "),
      cuisines,
      cookingTime,
      calorieGoal: parseInt(calorieGoal) || 1900,
      proteinGoal: parseInt(proteinGoal) || 130,
      carbsGoal: parseInt(carbsGoal) || 220,
      fatGoal: parseInt(fatGoal) || 65,
    });

    // Persist to Supabase if user is logged in
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        goal,
        conditions,
        diet_style: dietStyles.join(", "),
        cycle_length: parsedCycleLength,
        is_irregular: irregular,
        period_days: periodDays,
        flow,
        symptoms,
        last_period_date: periodDateStr,
      });
      await supabase.from("food_preferences").upsert({
        user_id: userId,
        allergies,
        cuisines,
        cooking_time: cookingTime,
      });
    }

    await supabase.auth.updateUser({ data: { onboarded: true } });
    setOnboarded(true);
    setSaving(false);
    router.replace("/(tabs)");
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const steps = [
    // Step 0 – Goal
    <Animated.View key="goal" entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={styles.stepTitle}>What's your main goal?</Text>
      <Text style={styles.stepSubtitle}>This shapes your macro targets and meal style</Text>
      <View style={styles.optionGrid}>
        {GOALS.map((g) => (
          <Pressable
            key={g.key}
            onPress={() => {
              setGoal(g.key);
              const p = GOAL_MACRO_PRESETS[g.key];
              setCalorieGoal(p.cal);
              setProteinGoal(p.protein);
              setCarbsGoal(p.carbs);
              setFatGoal(p.fat);
            }}
            style={[
              styles.goalCard,
              goal === g.key && {
                backgroundColor: `${GOAL_COLORS[g.key]}15`,
                borderColor: `${GOAL_COLORS[g.key]}40`,
              },
            ]}
          >
            <Text style={styles.goalEmoji}>{g.emoji}</Text>
            <Text style={[styles.goalLabel, goal === g.key && { color: GOAL_COLORS[g.key] }]}>
              {GOAL_LABELS[g.key]}
            </Text>
            <Text style={styles.goalDesc}>{g.desc}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>,

    // Step 1 – Conditions
    <Animated.View key="conditions" entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🌸</Text>
      <Text style={styles.stepTitle}>Any hormonal conditions?</Text>
      <Text style={styles.stepSubtitle}>We'll personalise your vitamin & nutrition advice</Text>
      <View style={styles.pillWrap}>
        {CONDITIONS.map((c) => (
          <Pressable
            key={c}
            onPress={() => toggle(conditions, setConditions, c)}
            style={[
              styles.pill,
              conditions.includes(c) && { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` },
            ]}
          >
            <Text style={[styles.pillText, conditions.includes(c) && { color: accentColor }]}>{c}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>,

    // Step 2 – Cycle
    <Animated.View key="cycle" entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🗓️</Text>
      <Text style={styles.stepTitle}>Tell us about your cycle</Text>
      <Text style={styles.stepSubtitle}>No judgement — every cycle is different</Text>

      <Pressable
        onPress={() => setIrregular((v) => !v)}
        style={[styles.toggleRow, irregular && { borderColor: `${accentColor}40` }]}
      >
        <View style={[styles.checkbox, irregular && { backgroundColor: accentColor, borderColor: accentColor }]}>
          {irregular && <Ionicons name="checkmark" size={12} color="#0a0e1a" />}
        </View>
        <Text style={styles.toggleLabel}>My cycle is irregular</Text>
      </Pressable>

      {!irregular && (
        <View style={{ gap: 14 }}>
          {/* Cycle length */}
          <View>
            <Text style={styles.label}>Cycle length (days)</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setCycleLength((v) => Math.max(21, v - 1))} style={[styles.stepperBtn, { borderColor: accentColor }]}>
                <Text style={[styles.stepperBtnText, { color: accentColor }]}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{cycleLength}</Text>
              <Pressable onPress={() => setCycleLength((v) => Math.min(35, v + 1))} style={[styles.stepperBtn, { borderColor: accentColor }]}>
                <Text style={[styles.stepperBtnText, { color: accentColor }]}>+</Text>
              </Pressable>
              <Text style={styles.stepperRange}>21–35 days</Text>
            </View>
          </View>

          {/* Period duration */}
          <View>
            <Text style={styles.label}>Period lasts (days)</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setPeriodDays((v) => Math.max(1, v - 1))} style={[styles.stepperBtn, { borderColor: accentColor }]}>
                <Text style={[styles.stepperBtnText, { color: accentColor }]}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{periodDays}</Text>
              <Pressable onPress={() => setPeriodDays((v) => Math.min(10, v + 1))} style={[styles.stepperBtn, { borderColor: accentColor }]}>
                <Text style={[styles.stepperBtnText, { color: accentColor }]}>+</Text>
              </Pressable>
              <Text style={styles.stepperRange}>1–10 days</Text>
            </View>
          </View>
        </View>
      )}

      {/* Last period date — calendar grid */}
      <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>When did your last period start?</Text>
            {(() => {
              const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
              const todayMidnight = new Date(todayY, todayM, todayD);
              // Build full month grid for calViewYear/calViewMonth
              const daysInCalMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
              const dates: Date[] = Array.from({ length: daysInCalMonth }, (_, i) =>
                new Date(calViewYear, calViewMonth, i + 1)
              );
              const firstDow = (new Date(calViewYear, calViewMonth, 1).getDay() + 6) % 7;
              const paddedDates: (Date | null)[] = [...Array(firstDow).fill(null), ...dates];
              const rows: (Date | null)[][] = [];
              for (let i = 0; i < paddedDates.length; i += 7) rows.push(paddedDates.slice(i, i + 7));
              const isAtMaxMonth = calViewYear === todayY && calViewMonth === todayM;
              const isAtMinMonth = calViewYear === todayY - 2 && calViewMonth === 0;

              const selectedDate = new Date(periodYear, periodMonth, periodDay);
              const isSelected = (d: Date) =>
                d.getFullYear() === periodYear && d.getMonth() === periodMonth && d.getDate() === periodDay;

              return (
                <View style={styles.calendarWrap}>
                  {/* Month navigation */}
                  <View style={styles.calNavRow}>
                    <Pressable
                      onPress={() => {
                        if (isAtMinMonth) return;
                        if (calViewMonth === 0) { setCalViewMonth(11); setCalViewYear(y => y - 1); }
                        else setCalViewMonth(m => m - 1);
                      }}
                      style={[styles.calNavBtn, isAtMinMonth && { opacity: 0.3 }]}
                    >
                      <Text style={styles.calNavText}>‹</Text>
                    </Pressable>
                    <Text style={styles.calNavTitle}>{MONTHS[calViewMonth]} {calViewYear}</Text>
                    <Pressable
                      onPress={() => {
                        if (isAtMaxMonth) return;
                        if (calViewMonth === 11) { setCalViewMonth(0); setCalViewYear(y => y + 1); }
                        else setCalViewMonth(m => m + 1);
                      }}
                      style={[styles.calNavBtn, isAtMaxMonth && { opacity: 0.3 }]}
                    >
                      <Text style={styles.calNavText}>›</Text>
                    </Pressable>
                  </View>
                  {/* Day-of-week headers */}
                  <View style={styles.calendarRow}>
                    {DAY_LABELS.map((l, i) => (
                      <Text key={i} style={styles.calendarDow}>{l}</Text>
                    ))}
                  </View>
                  {rows.map((row, ri) => (
                    <View key={ri} style={styles.calendarRow}>
                      {row.map((d, ci) => {
                        if (!d) return <View key={ci} style={styles.calendarCell} />;
                        const sel = isSelected(d);
                        const isToday = d.getTime() === todayMidnight.getTime();
                        const isFuture = d > todayMidnight;
                        return (
                          <Pressable
                            key={ci}
                            disabled={isFuture}
                            onPress={() => {
                              setPeriodDay(d.getDate());
                              setPeriodMonth(d.getMonth());
                              setPeriodYear(d.getFullYear());
                            }}
                            style={[
                              styles.calendarCell,
                              sel && { backgroundColor: accentColor, borderRadius: 8 },
                              !sel && isToday && { borderWidth: 1, borderColor: `${accentColor}60`, borderRadius: 8 },
                              isFuture && { opacity: 0.2 },
                            ]}
                          >
                            <Text style={[
                              styles.calendarDayText,
                              sel && { color: "#0a0e1a", fontWeight: "700" },
                              !sel && isToday && { color: accentColor },
                            ]}>
                              {d.getDate()}
                            </Text>
                            {d.getDate() === 1 && (
                              <Text style={[styles.calendarMonthLabel, sel && { color: "#0a0e1a" }]}>
                                {MONTHS[d.getMonth()]}
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                  <Text style={styles.calendarSelected}>
                    Selected: {String(periodDay).padStart(2, "0")} {MONTHS[periodMonth]} {periodYear} · Cycle day {calcCycleDay()}
                  </Text>
                </View>
              );
            })()}
          </View>

      {!irregular && (
        <View style={{ gap: 14, marginTop: 14 }}>
          {/* Flow */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Flow</Text>
            <View style={styles.flowGrid}>
              {[
                { label: "Light", emoji: "💧" },
                { label: "Medium", emoji: "💧💧" },
                { label: "Heavy", emoji: "💧💧💧" },
                { label: "Very heavy", emoji: "🌊" },
              ].map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => setFlow(f.label)}
                  style={[
                    styles.flowCard,
                    flow === f.label && { backgroundColor: `${accentColor}18`, borderColor: accentColor },
                  ]}
                >
                  <Text style={styles.flowEmoji}>{f.emoji}</Text>
                  <Text style={[styles.flowLabel, flow === f.label && { color: accentColor }]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Symptoms */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
            <View style={styles.pillWrap}>
              {["Cramps", "Bloating", "Headache", "Fatigue", "Mood swings", "Back pain", "Breast tenderness", "Acne", "Cravings", "Nausea", "Insomnia", "Brain fog"].map((s) => (
                <Pressable
                  key={s}
                  onPress={() => toggle(symptoms, setSymptoms, s)}
                  style={[styles.pill, symptoms.includes(s) && { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }]}
                >
                  <Text style={[styles.pillText, symptoms.includes(s) && { color: accentColor }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </Animated.View>,

    // Step 3 – Diet style
    <Animated.View key="diet" entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🥗</Text>
      <Text style={styles.stepTitle}>How do you eat?</Text>
      <Text style={styles.stepSubtitle}>Pick all that feel like you</Text>
      <View style={styles.optionGrid}>
        {DIET_STYLES.map((d) => (
          <Pressable
            key={d}
            onPress={() => toggle(dietStyles, setDietStyles, d)}
            style={[
              styles.optionCard,
              dietStyles.includes(d) && { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` },
            ]}
          >
            <Text style={[styles.optionText, dietStyles.includes(d) && { color: accentColor }]}>{d}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>,

    // Step 4 – Cuisines & allergies
    <Animated.View key="prefs" entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🍜</Text>
      <Text style={styles.stepTitle}>Favourite cuisines?</Text>
      <Text style={styles.stepSubtitle}>Helps us suggest meals you'll actually want to eat</Text>
      <View style={styles.pillWrap}>
        {CUISINES.map((c) => (
          <Pressable
            key={c}
            onPress={() => toggle(cuisines, setCuisines, c)}
            style={[
              styles.pill,
              cuisines.includes(c) && { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` },
            ]}
          >
            <Text style={[styles.pillText, cuisines.includes(c) && { color: accentColor }]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.stepTitle, { fontSize: 16, marginTop: 24 }]}>Any allergies?</Text>
      <Text style={styles.stepSubtitle}>We'll keep these out of all your plans</Text>
      <View style={styles.pillWrap}>
        {ALLERGIES.map((a) => (
          <Pressable
            key={a}
            onPress={() => toggle(allergies, setAllergies, a)}
            style={[
              styles.pill,
              allergies.includes(a) && { backgroundColor: "rgba(244,114,182,0.15)", borderColor: "rgba(244,114,182,0.4)" },
            ]}
          >
            <Text style={[styles.pillText, allergies.includes(a) && { color: "#f472b6" }]}>{a}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.stepTitle, { fontSize: 16, marginTop: 24 }]}>Foods you'd rather avoid?</Text>
      <Text style={styles.stepSubtitle}>Religious, ethical, or just personal — no judgement</Text>
      <View style={styles.pillWrap}>
        {AVOID_FOODS.map((f) => (
          <Pressable
            key={f}
            onPress={() => toggle(dislikes, setDislikes, f)}
            style={[
              styles.pill,
              dislikes.includes(f) && { backgroundColor: "rgba(251,209,104,0.12)", borderColor: "rgba(251,209,104,0.35)" },
            ]}
          >
            <Text style={[styles.pillText, dislikes.includes(f) && { color: "#FBD168" }]}>{f}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>,

    // Step 5 – Cooking time
    <Animated.View key="cooking" entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>⏱️</Text>
      <Text style={styles.stepTitle}>How long per meal?</Text>
      <Text style={styles.stepSubtitle}>Realistically — we won't judge</Text>
      <View style={styles.optionGrid}>
        {COOKING_TIMES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setCookingTime(t)}
            style={[
              styles.optionCard,
              cookingTime === t && { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` },
            ]}
          >
            <Ionicons name="time-outline" size={18} color={cookingTime === t ? accentColor : DARK_THEME.textMuted} />
            <Text style={[styles.optionText, cookingTime === t && { color: accentColor }]}>{t}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>,

    // Step 6 – Macro targets
    <Animated.View key="macros" entering={FadeInRight} style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={styles.stepTitle}>Your daily targets</Text>
      <Text style={styles.stepSubtitle}>Pre-filled based on your goal — adjust if you know your numbers</Text>
      {[
        { label: "Calories", unit: "kcal", value: calorieGoal, set: setCalorieGoal },
        { label: "Protein", unit: "g", value: proteinGoal, set: setProteinGoal },
        { label: "Carbs", unit: "g", value: carbsGoal, set: setCarbsGoal },
        { label: "Fat", unit: "g", value: fatGoal, set: setFatGoal },
      ].map(({ label, unit, value, set }) => (
        <View key={label} style={styles.macroRow}>
          <Text style={styles.macroLabel}>{label}</Text>
          <View style={[styles.macroInputWrap, { borderColor: `${accentColor}40` }]}>
            <TextInput
              style={[styles.macroInput, { color: accentColor }]}
              value={value}
              onChangeText={set}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.macroUnit}>{unit}</Text>
          </View>
        </View>
      ))}
    </Animated.View>,
  ];

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${progress}%` as any, backgroundColor: accentColor },
          ]}
        />
      </View>

      {/* Step counter */}
      <View style={styles.stepCounter}>
        <Text style={styles.stepCountText}>{step + 1} / {TOTAL_STEPS}</Text>
      </View>

      {/* Scrollable step content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {steps[step]}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 && (
          <Pressable onPress={() => setStep((s) => s - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={DARK_THEME.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleNext}
          disabled={saving}
          style={[styles.nextBtn, { backgroundColor: accentColor, marginLeft: step === 0 ? "auto" : 0 }]}
        >
          {saving ? (
            <ActivityIndicator color="#0a0e1a" />
          ) : (
            <Text style={styles.nextText}>
              {step === TOTAL_STEPS - 1 ? "Start Feaste 🌸" : "Next"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_THEME.bg,
    paddingTop: 60,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 24,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepCounter: {
    alignItems: "flex-end",
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 4,
  },
  stepCountText: {
    fontSize: TYPE.sm,
    color: DARK_THEME.textMuted,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  stepContainer: {
    paddingTop: 8,
  },
  stepEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  stepTitle: {
    fontFamily: "Georgia",
    fontSize: TYPE.xl,
    color: DARK_THEME.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: TYPE.body,
    color: DARK_THEME.textSecondary,
    marginBottom: 20,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  goalCard: {
    width: (SCREEN_WIDTH - 58) / 2,
    backgroundColor: DARK_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    padding: 16,
    gap: 6,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalLabel: {
    fontSize: TYPE.md,
    fontWeight: "600",
    color: DARK_THEME.textPrimary,
  },
  goalDesc: {
    fontSize: TYPE.xs,
    color: DARK_THEME.textMuted,
    lineHeight: 15,
  },
  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DARK_THEME.cardBg,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
  },
  pillText: {
    fontSize: TYPE.md,
    color: DARK_THEME.textSecondary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: DARK_THEME.cardBg,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: DARK_THEME.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: {
    fontSize: TYPE.body,
    color: DARK_THEME.textPrimary,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: TYPE.lg,
    fontWeight: "600",
    lineHeight: 20,
  },
  stepperValue: {
    fontSize: TYPE.xl,
    fontWeight: "700",
    color: DARK_THEME.textPrimary,
    minWidth: 36,
    textAlign: "center",
  },
  stepperRange: {
    fontSize: TYPE.sm,
    color: DARK_THEME.textMuted,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  dateColumn: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  dateArrow: {
    padding: 4,
  },
  dateCell: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: DARK_THEME.inputBg,
    alignItems: "center",
  },
  dateCellText: {
    fontSize: TYPE.body,
    fontWeight: "700",
    color: DARK_THEME.textPrimary,
  },
  dateSep: {
    fontSize: TYPE.lg,
    color: DARK_THEME.textMuted,
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 10,
    color: DARK_THEME.textMuted,
    letterSpacing: 0.5,
  },
  sectionBox: {
    backgroundColor: DARK_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: TYPE.lg,
    fontWeight: "700",
    color: DARK_THEME.textPrimary,
  },
  flowGrid: {
    flexDirection: "row",
    gap: 6,
  },
  flowCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: DARK_THEME.inputBg,
    borderWidth: 1.5,
    borderColor: DARK_THEME.borderColor,
  },
  flowEmoji: {
    fontSize: 16,
  },
  flowLabel: {
    fontSize: 11,
    color: DARK_THEME.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  label: {
    fontSize: TYPE.sm,
    color: DARK_THEME.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: DARK_THEME.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: TYPE.body,
    color: DARK_THEME.textPrimary,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: DARK_THEME.cardBg,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    minWidth: (SCREEN_WIDTH - 58) / 2,
  },
  optionText: {
    fontSize: TYPE.md,
    color: DARK_THEME.textSecondary,
  },
  calNavRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
  },
  calNavBtn: { padding: 8 },
  calNavText: { fontSize: 22, color: DARK_THEME.textPrimary, lineHeight: 24 },
  calNavTitle: { fontSize: TYPE.body, fontWeight: "600", color: DARK_THEME.textPrimary },
  calendarWrap: {
    backgroundColor: DARK_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    padding: 10,
    gap: 2,
  },
  calendarRow: {
    flexDirection: "row",
  },
  calendarDow: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: DARK_THEME.textMuted,
    paddingVertical: 4,
    fontWeight: "600",
  },
  calendarCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    minHeight: 36,
  },
  calendarDayText: {
    fontSize: 13,
    color: DARK_THEME.textPrimary,
  },
  calendarMonthLabel: {
    fontSize: 8,
    color: DARK_THEME.textMuted,
    marginTop: 1,
  },
  calendarSelected: {
    fontSize: 12,
    color: DARK_THEME.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  macroLabel: {
    fontSize: TYPE.md,
    color: DARK_THEME.textPrimary,
    fontWeight: "500",
  },
  macroInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK_THEME.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    minWidth: 90,
  },
  macroInput: {
    fontSize: TYPE.lg,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
  },
  macroUnit: {
    fontSize: TYPE.sm,
    color: DARK_THEME.textMuted,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: DARK_THEME.borderColor,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
  },
  backText: {
    fontSize: 14,
    color: DARK_THEME.textSecondary,
  },
  nextBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 120,
    alignItems: "center",
  },
  nextText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0e1a",
  },
});
