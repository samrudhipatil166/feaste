import React, { useState, useMemo } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { ACCENT, DARK_THEME, TYPE } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { PeriodLog } from "@/types";

const DIET_STYLES = ["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Gluten-Free"];
const ALLERGIES   = ["Gluten", "Dairy", "Eggs", "Nuts", "Peanuts", "Soy", "Shellfish", "Fish", "Sesame"];
const CONDITIONS  = ["PCOS", "Thyroid", "Menopause", "None"];
const FLOW_OPTIONS: PeriodLog["flow"][] = ["light", "medium", "heavy", "very_heavy"];

const SYMPTOMS = [
  "Cramps", "Bloating", "Headache", "Fatigue", "Mood swings",
  "Breast tenderness", "Back pain", "Nausea", "Insomnia", "Spotting",
];

const ACTIVITY_LEVELS = ["Sedentary", "Lightly active", "Active", "Very active"];
const CALC_GOALS = ["Lose weight", "Maintain", "Build muscle"];
const WEIGHT_UNITS = ["kg", "lbs"];

function fmtDateHuman(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function ChipRow({
  options, selected, onToggle, single,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
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
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={open ? ACCENT : DARK_THEME.textMuted} />
    </Pressable>
  );
}

export function ProfileSheet({
  visible,
  onClose,
  initialSection,
}: {
  visible: boolean;
  onClose: () => void;
  initialSection?: string;
}) {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const refreshPhase = useAppStore((s) => s.refreshPhase);
  const foodLog = useAppStore((s) => s.foodLog);
  const periodLogs = useAppStore((s) => s.periodLogs);
  const addPeriodLog = useAppStore((s) => s.addPeriodLog);
  const clearTodayLog = useAppStore((s) => s.clearTodayLog);

  const [openSection, setOpenSection] = useState<string | null>(initialSection ?? "cycle");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Calorie + macro goal inputs
  const [calorieInput, setCalorieInput] = useState(String(profile.calorieGoal));
  const [proteinInput, setProteinInput] = useState(String(profile.proteinGoal));
  const [carbsInput, setCarbsInput] = useState(String(profile.carbsGoal));
  const [fatInput, setFatInput] = useState(String(profile.fatGoal));
  const [fibreInput, setFibreInput] = useState(String(profile.fibreGoal ?? 25));

  // TDEE calculator state
  const [showCalc, setShowCalc] = useState(false);
  const [calcWeight, setCalcWeight] = useState("");
  const [calcWeightUnit, setCalcWeightUnit] = useState("kg");
  const [calcHeight, setCalcHeight] = useState("");
  const [calcActivity, setCalcActivity] = useState("Lightly active");
  const [calcGoal, setCalcGoal] = useState("Maintain");
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Add period form
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [pStartDate, setPStartDate] = useState("");
  const [pEndDate, setPEndDate] = useState("");
  const [stillOngoing, setStillOngoing] = useState(false);
  const [pFlow, setPFlow] = useState<PeriodLog["flow"]>("medium");
  const [pSymptoms, setPSymptoms] = useState<string[]>([]);

  const toggle = (s: string) => setOpenSection((prev) => (prev === s ? null : s));

  const toggleMulti = (key: keyof typeof profile, val: string) => {
    const current = (profile[key] as string[]) ?? [];
    const next = current.includes(val) ? current.filter((x) => x !== val) : [...current, val];
    updateProfile({ [key]: next } as any);
  };

  const toggleSingleString = (key: keyof typeof profile, val: string) => {
    updateProfile({ [key]: val } as any);
  };

  // Live macro kcal check
  const macroKcal = useMemo(() => {
    const p = parseInt(proteinInput) || 0;
    const c = parseInt(carbsInput) || 0;
    const f = parseInt(fatInput) || 0;
    return p * 4 + c * 4 + f * 9;
  }, [proteinInput, carbsInput, fatInput]);
  const calGoalNum = parseInt(calorieInput) || 0;
  const macroDiff = Math.abs(macroKcal - calGoalNum);

  const handleCalcTDEE = () => {
    const weightKg = calcWeightUnit === "kg"
      ? parseFloat(calcWeight) || 0
      : (parseFloat(calcWeight) || 0) * 0.453592;
    const heightCm = parseFloat(calcHeight) || 0;
    // Mifflin-St Jeor for female
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 - 161;
    const activityMap: Record<string, number> = {
      "Sedentary": 1.2,
      "Lightly active": 1.375,
      "Active": 1.55,
      "Very active": 1.725,
    };
    const tdee = Math.round(bmr * (activityMap[calcActivity] ?? 1.375));
    const adjusted = calcGoal === "Lose weight" ? Math.round(tdee - 300) : calcGoal === "Build muscle" ? Math.round(tdee + 200) : tdee;
    const protein = Math.round((adjusted * 0.30) / 4);
    const carbs   = Math.round((adjusted * 0.40) / 4);
    const fat     = Math.round((adjusted * 0.30) / 9);
    setCalorieInput(String(adjusted));
    setProteinInput(String(protein));
    setCarbsInput(String(carbs));
    setFatInput(String(fat));
    setCalcResult(`Suggested: ${adjusted} kcal — P ${protein}g · C ${carbs}g · F ${fat}g`);
  };

  // History: group foodLog by date, last 30 days
  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const historyDays = (() => {
    const map: Record<string, typeof foodLog> = {};
    foodLog.forEach((e) => {
      if (e.date >= thirtyDaysAgo && e.date <= todayStr) {
        map[e.date] = map[e.date] ?? [];
        map[e.date].push(e);
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30);
  })();

  const handleAddPeriod = () => {
    if (!pStartDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return;
    }
    addPeriodLog({
      id: Date.now().toString(),
      startDate: pStartDate,
      endDate: pEndDate || undefined,
      flow: pFlow,
      symptoms: pSymptoms,
    });
    setAddingPeriod(false);
    setStillOngoing(false);
    setPStartDate(""); setPEndDate(""); setPFlow("medium"); setPSymptoms([]);
  };

  const cycleDay = (() => {
    if (!profile.lastPeriodDate) return profile.cycleDay ?? 1;
    const diff = Math.floor((Date.now() - new Date(profile.lastPeriodDate).getTime()) / 86400000);
    return Math.min(Math.max(1, diff + 1), profile.cycleLength);
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Profile</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

            {/* ── Cycle ── */}
            <View style={styles.sectionCard}>
              <SectionHeader title="Cycle" open={openSection === "cycle"} onToggle={() => toggle("cycle")} />
              {openSection !== "cycle" && (
                <Text style={styles.summaryText}>Day {cycleDay} of {profile.cycleLength} · {profile.lastPeriodDate ?? "no date set"}</Text>
              )}
              {openSection === "cycle" && (
                <View style={styles.sectionBody}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Last period start date</Text>
                    {!!fmtDateHuman(profile.lastPeriodDate ?? "") && (
                      <Text style={styles.dateDisplay}>{fmtDateHuman(profile.lastPeriodDate ?? "")}</Text>
                    )}
                    <TextInput
                      style={styles.fieldInput}
                      value={profile.lastPeriodDate ?? ""}
                      onChangeText={(v) => updateProfile({ lastPeriodDate: v || null })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={DARK_THEME.textMuted}
                    />
                    <Text style={styles.hintText}>Cannot be a future date</Text>
                  </View>
                  <View style={styles.stepperRow}>
                    <Text style={styles.stepperLabel}>Cycle length</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        onPress={() => updateProfile({ cycleLength: Math.max(21, profile.cycleLength - 1) })}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="remove" size={16} color={DARK_THEME.textSecondary} />
                      </Pressable>
                      <Text style={styles.stepperVal}>{profile.cycleLength} days</Text>
                      <Pressable
                        onPress={() => updateProfile({ cycleLength: Math.min(45, profile.cycleLength + 1) })}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="add" size={16} color={ACCENT} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.regularityRow}>
                    <Text style={styles.fieldLabel}>Regularity</Text>
                    <View style={styles.regularityBtns}>
                      {[
                        { label: "Regular", val: false },
                        { label: "Irregular", val: true },
                      ].map(({ label, val }) => {
                        const active = (profile.isIrregular ?? false) === val;
                        return (
                          <Pressable
                            key={label}
                            onPress={() => updateProfile({ isIrregular: val })}
                            style={[styles.regularityBtn, active && styles.regularityBtnActive]}
                          >
                            <Text style={[styles.regularityText, active && styles.regularityTextActive]}>{label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Period log */}
                  <Text style={styles.subSectionTitle}>Period log</Text>
                  {periodLogs.slice(0, 3).map((log) => (
                    <View key={log.id} style={styles.periodRow}>
                      <Text style={styles.periodDate}>
                        {fmtDateHuman(log.startDate) || log.startDate}
                        {log.endDate ? ` — ${fmtDateHuman(log.endDate) || log.endDate}` : " (ongoing)"}
                      </Text>
                      <Text style={styles.periodFlow}>{log.flow}</Text>
                    </View>
                  ))}
                  {periodLogs.length === 0 && (
                    <Text style={styles.emptyText}>No periods logged yet</Text>
                  )}

                  {addingPeriod ? (
                    <View style={styles.addPeriodForm}>
                      <Text style={styles.fieldLabel}>Start date</Text>
                      {!!fmtDateHuman(pStartDate) && (
                        <Text style={styles.dateDisplay}>{fmtDateHuman(pStartDate)}</Text>
                      )}
                      <TextInput
                        style={styles.fieldInput}
                        value={pStartDate}
                        onChangeText={setPStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={DARK_THEME.textMuted}
                      />
                      <View style={[styles.endDateHeader, { marginTop: 10 }]}>
                        <Text style={styles.fieldLabel}>End date</Text>
                        <Pressable
                          onPress={() => {
                            setStillOngoing(!stillOngoing);
                            if (!stillOngoing) setPEndDate("");
                          }}
                          style={[styles.ongoingToggle, stillOngoing && styles.ongoingToggleActive]}
                        >
                          <Text style={[styles.ongoingToggleText, stillOngoing && styles.ongoingToggleTextActive]}>
                            Still ongoing
                          </Text>
                        </Pressable>
                      </View>
                      {!!fmtDateHuman(pEndDate) && !stillOngoing && (
                        <Text style={styles.dateDisplay}>{fmtDateHuman(pEndDate)}</Text>
                      )}
                      <TextInput
                        style={[styles.fieldInput, stillOngoing && styles.fieldInputDisabled]}
                        value={stillOngoing ? "" : pEndDate}
                        onChangeText={setPEndDate}
                        placeholder={stillOngoing ? "Still ongoing" : "YYYY-MM-DD (optional)"}
                        placeholderTextColor={DARK_THEME.textMuted}
                        editable={!stillOngoing}
                      />
                      <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Flow</Text>
                      <View style={styles.chipWrap}>
                        {FLOW_OPTIONS.map((f) => (
                          <Pressable
                            key={f}
                            onPress={() => setPFlow(f)}
                            style={[styles.chip, pFlow === f && styles.chipActive]}
                          >
                            <Text style={[styles.chipText, pFlow === f && styles.chipTextActive]}>
                              {f.replace("_", " ")}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Symptoms</Text>
                      <ChipRow options={SYMPTOMS} selected={pSymptoms} onToggle={(v) => {
                        setPSymptoms((prev) => prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]);
                      }} />
                      <View style={styles.formActions}>
                        <Pressable onPress={() => { setAddingPeriod(false); setStillOngoing(false); }} style={styles.cancelBtn}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleAddPeriod} style={styles.saveBtn}>
                          <Text style={styles.saveBtnText}>Save</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setAddingPeriod(true)} style={styles.addPeriodBtn}>
                      <Ionicons name="add" size={14} color={ACCENT} />
                      <Text style={[styles.addPeriodText, { color: ACCENT }]}>Add period</Text>
                    </Pressable>
                  )}

                  {/* Save cycle settings */}
                  <Pressable
                    onPress={() => {
                      updateProfile({ lastPeriodDate: profile.lastPeriodDate, cycleLength: profile.cycleLength, isIrregular: profile.isIrregular });
                      refreshPhase();
                    }}
                    style={[styles.fullSaveBtn, { marginTop: 16 }]}
                  >
                    <Text style={styles.fullSaveBtnText}>Save changes</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* ── History ── */}
            <View style={styles.sectionCard}>
              <SectionHeader title="History" open={openSection === "history"} onToggle={() => toggle("history")} />
              {openSection === "history" && (
                <View style={styles.sectionBody}>
                  {historyDays.length === 0 && (
                    <Text style={styles.emptyText}>No history yet — start logging meals</Text>
                  )}
                  {historyDays.map(([date, entries]) => {
                    const cal = entries.reduce((s, e) => s + e.calories, 0);
                    const p   = entries.reduce((s, e) => s + e.protein, 0);
                    const c   = entries.reduce((s, e) => s + e.carbs, 0);
                    const f   = entries.reduce((s, e) => s + e.fat, 0);
                    const isToday = date === todayStr;
                    const expanded = expandedDay === date;
                    const label = isToday
                      ? "Today"
                      : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    return (
                      <View key={date}>
                        <Pressable onPress={() => setExpandedDay(expanded ? null : date)} style={styles.historyRow}>
                          <Text style={styles.historyDate}>{label}</Text>
                          <View style={styles.historyRight}>
                            <Text style={[styles.historyCal, { color: ACCENT }]}>{cal} kcal</Text>
                            <Text style={styles.historyMacros}>P:{p}g C:{c}g F:{f}g</Text>
                          </View>
                          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={DARK_THEME.textMuted} style={{ marginLeft: 8 }} />
                        </Pressable>
                        {expanded && (
                          <View style={styles.historyExpanded}>
                            {entries.map((e) => (
                              <View key={e.id} style={styles.historyMealRow}>
                                <Text style={styles.historyMealName} numberOfLines={1}>{e.name}</Text>
                                <Text style={styles.historyMealCal}>{e.calories} kcal</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        <View style={styles.historyDivider} />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Preferences ── */}
            <View style={styles.sectionCard}>
              <SectionHeader title="Preferences" open={openSection === "prefs"} onToggle={() => toggle("prefs")} />
              {openSection === "prefs" && (
                <View style={styles.sectionBody}>
                  <Text style={styles.fieldLabel}>Dietary style</Text>
                  <ChipRow
                    options={DIET_STYLES}
                    selected={[profile.dietStyle]}
                    onToggle={(v) => toggleSingleString("dietStyle", v)}
                    single
                  />
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Allergies</Text>
                  <ChipRow
                    options={ALLERGIES}
                    selected={profile.allergies}
                    onToggle={(v) => toggleMulti("allergies", v)}
                  />
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Health conditions</Text>
                  <ChipRow
                    options={CONDITIONS}
                    selected={profile.conditions}
                    onToggle={(v) => toggleMulti("conditions", v)}
                  />

                  {/* ── Calorie & macro goals ── */}
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Daily calorie goal</Text>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={calorieInput}
                      onChangeText={setCalorieInput}
                      keyboardType="number-pad"
                      placeholderTextColor={DARK_THEME.textMuted}
                    />
                    <Text style={styles.macroUnit}>kcal</Text>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Protein</Text>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={proteinInput}
                      onChangeText={setProteinInput}
                      keyboardType="number-pad"
                      placeholderTextColor={DARK_THEME.textMuted}
                    />
                    <Text style={styles.macroUnit}>g</Text>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Carbohydrates</Text>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={carbsInput}
                      onChangeText={setCarbsInput}
                      keyboardType="number-pad"
                      placeholderTextColor={DARK_THEME.textMuted}
                    />
                    <Text style={styles.macroUnit}>g</Text>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Fat</Text>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={fatInput}
                      onChangeText={setFatInput}
                      keyboardType="number-pad"
                      placeholderTextColor={DARK_THEME.textMuted}
                    />
                    <Text style={styles.macroUnit}>g</Text>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Fibre</Text>
                  <View style={styles.macroInputRow}>
                    <TextInput
                      style={styles.macroInput}
                      value={fibreInput}
                      onChangeText={setFibreInput}
                      keyboardType="number-pad"
                      placeholderTextColor={DARK_THEME.textMuted}
                    />
                    <Text style={styles.macroUnit}>g</Text>
                  </View>

                  {/* Live macro check */}
                  <View style={styles.macroCheckRow}>
                    <Text style={styles.macroCheckFormula}>
                      {`(P×4) + (C×4) + (F×9) = ${macroKcal} kcal`}
                    </Text>
                    {calGoalNum > 0 && macroDiff <= 100 ? (
                      <Text style={styles.macroCheckGood}>macros look good ✓</Text>
                    ) : calGoalNum > 0 ? (
                      <Text style={styles.macroCheckWarn}>{`your macros add up to ${macroKcal} kcal — consider adjusting`}</Text>
                    ) : null}
                  </View>

                  {/* TDEE calculator */}
                  <Text style={styles.tdeeHint}>Not sure what your macros should be?</Text>
                  <Pressable onPress={() => setShowCalc(!showCalc)} style={styles.tdeeLink}>
                    <Text style={styles.tdeeLinkText}>{showCalc ? "hide calculator ↑" : "calculate for me →"}</Text>
                  </Pressable>

                  {showCalc && (
                    <View style={styles.calcBox}>
                      <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Weight</Text>
                      <View style={styles.macroInputRow}>
                        <TextInput
                          style={styles.macroInput}
                          value={calcWeight}
                          onChangeText={setCalcWeight}
                          keyboardType="number-pad"
                          placeholder="e.g. 65"
                          placeholderTextColor={DARK_THEME.textMuted}
                        />
                        <View style={styles.unitToggleRow}>
                          {WEIGHT_UNITS.map((u) => (
                            <Pressable
                              key={u}
                              onPress={() => setCalcWeightUnit(u)}
                              style={[styles.unitToggleChip, calcWeightUnit === u && styles.chipActive]}
                            >
                              <Text style={[styles.chipText, calcWeightUnit === u && styles.chipTextActive]}>{u}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <Text style={[styles.fieldLabel, { marginTop: 10, marginBottom: 6 }]}>Height (cm)</Text>
                      <View style={styles.macroInputRow}>
                        <TextInput
                          style={styles.macroInput}
                          value={calcHeight}
                          onChangeText={setCalcHeight}
                          keyboardType="number-pad"
                          placeholder="e.g. 165"
                          placeholderTextColor={DARK_THEME.textMuted}
                        />
                        <Text style={styles.macroUnit}>cm</Text>
                      </View>

                      <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Activity level</Text>
                      <View style={styles.chipWrap}>
                        {ACTIVITY_LEVELS.map((a) => (
                          <Pressable
                            key={a}
                            onPress={() => setCalcActivity(a)}
                            style={[styles.chip, calcActivity === a && styles.chipActive]}
                          >
                            <Text style={[styles.chipText, calcActivity === a && styles.chipTextActive]}>{a}</Text>
                          </Pressable>
                        ))}
                      </View>

                      <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Goal</Text>
                      <View style={styles.chipWrap}>
                        {CALC_GOALS.map((g) => (
                          <Pressable
                            key={g}
                            onPress={() => setCalcGoal(g)}
                            style={[styles.chip, calcGoal === g && styles.chipActive]}
                          >
                            <Text style={[styles.chipText, calcGoal === g && styles.chipTextActive]}>{g}</Text>
                          </Pressable>
                        ))}
                      </View>

                      <Pressable onPress={handleCalcTDEE} style={[styles.fullSaveBtn, { marginTop: 14 }]}>
                        <Text style={styles.fullSaveBtnText}>Calculate</Text>
                      </Pressable>

                      {calcResult && (
                        <Text style={styles.calcResultText}>{calcResult}</Text>
                      )}
                      <Text style={styles.calcNote}>These are suggested starting targets — adjust to suit you</Text>
                    </View>
                  )}

                  {/* Save preferences */}
                  <Pressable
                    onPress={() => updateProfile({
                      dietStyle: profile.dietStyle,
                      allergies: profile.allergies,
                      conditions: profile.conditions,
                      calorieGoal: Math.max(1, parseInt(calorieInput) || profile.calorieGoal),
                      proteinGoal: Math.max(1, parseInt(proteinInput) || profile.proteinGoal),
                      carbsGoal: Math.max(1, parseInt(carbsInput) || profile.carbsGoal),
                      fatGoal: Math.max(1, parseInt(fatInput) || profile.fatGoal),
                      fibreGoal: Math.max(1, parseInt(fibreInput) || (profile.fibreGoal ?? 25)),
                    })}
                    style={[styles.fullSaveBtn, { marginTop: 16 }]}
                  >
                    <Text style={styles.fullSaveBtnText}>Save</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* ── Account ── */}
            <View style={styles.sectionCard}>
              <SectionHeader title="Account" open={openSection === "account"} onToggle={() => toggle("account")} />
              {openSection === "account" && (
                <View style={styles.sectionBody}>
                  {confirmReset ? (
                    <View style={styles.confirmBox}>
                      <Text style={styles.confirmText}>Reset today's food log? This can't be undone.</Text>
                      <View style={styles.confirmRow}>
                        <Pressable onPress={() => setConfirmReset(false)} style={styles.cancelBtn}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => { clearTodayLog(); setConfirmReset(false); }}
                          style={[styles.saveBtn, { backgroundColor: "#f87171" }]}
                        >
                          <Text style={styles.saveBtnText}>Reset</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setConfirmReset(true)} style={styles.actionRow}>
                      <Ionicons name="refresh-outline" size={18} color={DARK_THEME.textSecondary} />
                      <Text style={styles.actionText}>Reset today's log</Text>
                    </Pressable>
                  )}

                  <View style={styles.divider} />

                  {confirmSignOut ? (
                    <View style={styles.confirmBox}>
                      <Text style={styles.confirmText}>Sign out of Feaste?</Text>
                      <View style={styles.confirmRow}>
                        <Pressable onPress={() => setConfirmSignOut(false)} style={styles.cancelBtn}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => supabase.auth.signOut()}
                          style={[styles.saveBtn, { backgroundColor: "#f87171" }]}
                        >
                          <Text style={styles.saveBtnText}>Sign Out</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setConfirmSignOut(true)} style={styles.actionRow}>
                      <Ionicons name="log-out-outline" size={18} color="#f87171" />
                      <Text style={[styles.actionText, { color: "#f87171" }]}>Sign out</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            <View style={{ height: 48 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#0f1525",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    maxHeight: "90%",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center", marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "Georgia", fontSize: 20,
    color: DARK_THEME.textPrimary, fontWeight: "600",
    marginBottom: 16,
  },

  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14, marginBottom: 10,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: DARK_THEME.textPrimary, fontFamily: "Georgia" },
  summaryText: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, marginTop: 6 },

  sectionBody: { marginTop: 14, gap: 0 },
  subSectionTitle: { fontSize: 11, color: DARK_THEME.textMuted, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },

  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, marginBottom: 6 },
  fieldInput: {
    backgroundColor: DARK_THEME.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: TYPE.body, color: DARK_THEME.textPrimary,
  },

  stepperRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  stepperLabel: { fontSize: TYPE.body, color: DARK_THEME.textSecondary },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepperBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center",
  },
  stepperVal: { fontSize: TYPE.body, color: DARK_THEME.textPrimary, fontWeight: "600", minWidth: 64, textAlign: "center" },

  regularityRow: { marginBottom: 12 },
  regularityBtns: { flexDirection: "row", gap: 8, marginTop: 6 },
  regularityBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)",
  },
  regularityBtnActive: { borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}10` },
  regularityText: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  regularityTextActive: { color: ACCENT, fontWeight: "600" },

  periodRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  periodDate: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  periodFlow: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, textTransform: "capitalize" },

  addPeriodForm: { marginTop: 12 },
  addPeriodBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingVertical: 4 },
  addPeriodText: { fontSize: TYPE.sm, fontWeight: "600" },

  formActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  cancelBtnText: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  saveBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
    backgroundColor: ACCENT,
  },
  saveBtnText: { fontSize: TYPE.sm, fontWeight: "700", color: "#0a0e1a" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)",
  },
  chipActive: { borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}12` },
  chipText: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  chipTextActive: { color: ACCENT, fontWeight: "600" },

  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  historyDate: { flex: 1, fontSize: TYPE.body, color: DARK_THEME.textSecondary },
  historyRight: { alignItems: "flex-end" },
  historyCal: { fontSize: TYPE.sm, fontWeight: "600" },
  historyMacros: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 1 },
  historyExpanded: { paddingHorizontal: 4, paddingBottom: 6 },
  historyMealRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  historyMealName: { flex: 1, fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  historyMealCal: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  historyDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.04)" },

  calorieRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  calorieInput: {
    flex: 1, backgroundColor: DARK_THEME.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 15, color: DARK_THEME.textPrimary, fontWeight: "700",
  },
  calorieUnit: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 12 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  actionText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary },
  confirmBox: { gap: 10 },
  confirmText: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  confirmRow: { flexDirection: "row", gap: 8 },

  emptyText: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, fontStyle: "italic", marginVertical: 8 },

  // Date display
  dateDisplay: {
    fontSize: TYPE.body, color: DARK_THEME.textPrimary, fontWeight: "600",
    marginBottom: 4,
  },
  hintText: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 4 },

  // End date / ongoing toggle
  endDateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  ongoingToggle: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)",
  },
  ongoingToggleActive: { borderColor: `${ACCENT}50`, backgroundColor: `${ACCENT}12` },
  ongoingToggleText: { fontSize: TYPE.xs, color: DARK_THEME.textSecondary },
  ongoingToggleTextActive: { color: ACCENT, fontWeight: "600" },
  fieldInputDisabled: { opacity: 0.4 },

  // Full-width save button
  fullSaveBtn: {
    paddingVertical: 13, borderRadius: 12, alignItems: "center",
    backgroundColor: ACCENT,
  },
  fullSaveBtnText: { fontSize: TYPE.body, fontWeight: "700", color: "#412402" },

  // Macro inputs
  macroInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  macroInput: {
    flex: 1, backgroundColor: DARK_THEME.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: TYPE.body, color: DARK_THEME.textPrimary, fontWeight: "600",
  },
  macroUnit: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, width: 30 },

  // Macro check
  macroCheckRow: { marginTop: 12, gap: 4 },
  macroCheckFormula: { fontSize: TYPE.xs, color: DARK_THEME.textMuted },
  macroCheckGood: { fontSize: TYPE.sm, color: "rgba(134,239,172,0.80)", fontWeight: "600" },
  macroCheckWarn: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600" },

  // TDEE calculator
  tdeeHint: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 16 },
  tdeeLink: { marginTop: 4, alignSelf: "flex-start" },
  tdeeLinkText: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600" },
  calcBox: {
    marginTop: 12, padding: 12, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  unitToggleRow: { flexDirection: "row", gap: 6 },
  unitToggleChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)",
  },
  calcResultText: {
    fontSize: TYPE.sm, color: DARK_THEME.textPrimary, fontWeight: "600",
    marginTop: 10, textAlign: "center",
  },
  calcNote: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 6, textAlign: "center", fontStyle: "italic" },
});
