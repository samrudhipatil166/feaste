import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { ACCENT, DARK_THEME, TYPE } from "@/constants/theme";
import { analyzeMeal, analyzeMealPhoto, type IngredientItem } from "@/lib/api";
import { FoodEntry, MealType } from "@/types";
import { PHASE_INFO, PHASE_VITAMINS, PCOS_VITAMINS } from "@/constants/cycle";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BTN_TEXT = "#412402"; // text color on amber buttons
const CARD_BG  = "#ffffff08";
const DIVIDER  = "#ffffff0a";
const MUTED    = "#ffffff50";
const SECONDARY = "#ffffffc0";

type InputMode = "photo" | "text" | "manual";

interface AnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  confidence: number;
  ingredients: IngredientItem[];
  phaseNote?: string;
  phaseBadge?: string;
  isNutritionLabel?: boolean;
  servingSize?: string;
  perServingCalories?: number;
  perServingProtein?: number;
  perServingCarbs?: number;
  perServingFat?: number;
  perServingFibre?: number;
}

// ── Ingredient edit form ───────────────────────────────────────────────────────
// Always shows name + weight + calories.
// Editing weight auto-recalculates calories from original ratio.
// Editing calories directly leaves weight untouched.
function IngredientEditForm({
  item, editName, editCal,
  onEditName, onEditCal, onSave, onCancel,
}: {
  item: IngredientItem;
  editName: string; editCal: string;
  onEditName: (v: string) => void; onEditCal: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const weightMatch = item.name.match(/\(~?(\d+(?:\.\d+)?)\s*(g|ml|oz|kg)\b/i);
  const baseWeight = weightMatch ? parseFloat(weightMatch[1]) : null;
  const weightUnit = weightMatch ? weightMatch[2].toLowerCase() : "g";
  const baseCal = item.calories; // original — used for proportional recalc

  const [editWeight, setEditWeight] = useState(
    baseWeight !== null ? String(Math.round(baseWeight)) : ""
  );

  const handleWeightChange = (val: string) => {
    setEditWeight(val);
    const newW = parseFloat(val);
    if (baseWeight && newW > 0 && baseCal > 0) {
      // Recalculate calories proportionally from original ratio
      onEditCal(String(Math.round(baseCal * (newW / baseWeight))));
      // Keep weight in name in sync
      const updated = item.name.replace(
        /\(~?\d+(?:\.\d+)?\s*(?:g|ml|oz|kg)\b/i,
        `(~${Math.round(newW)}${weightUnit}`
      );
      onEditName(updated);
    }
  };

  return (
    <View style={ingStyles.editWrap}>
      {/* Name */}
      <TextInput
        style={ingStyles.editInput}
        value={editName}
        onChangeText={onEditName}
        placeholder="Ingredient name"
        placeholderTextColor={MUTED}
      />
      {/* Weight + Calories always visible */}
      <View style={ingStyles.editWeightRow}>
        <TextInput
          style={[ingStyles.editInput, { flex: 1 }]}
          value={editWeight}
          onChangeText={handleWeightChange}
          placeholder="Weight"
          placeholderTextColor={MUTED}
          keyboardType="decimal-pad"
        />
        <Text style={ingStyles.editCalUnit}>{weightUnit}</Text>
        <Text style={ingStyles.editWeightArrow}>·</Text>
        <TextInput
          style={[ingStyles.editInput, { flex: 1 }]}
          value={editCal}
          onChangeText={onEditCal}
          placeholder="Calories"
          placeholderTextColor={MUTED}
          keyboardType="number-pad"
        />
        <Text style={ingStyles.editCalUnit}>kcal</Text>
      </View>
      <View style={ingStyles.editActions}>
        <Pressable onPress={onCancel} style={ingStyles.editCancel}>
          <Text style={ingStyles.editCancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={onSave} style={ingStyles.editSave}>
          <Text style={ingStyles.editSaveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Ingredient breakdown row ───────────────────────────────────────────────────
function IngredientRow({
  item, onPress, isEditing, isEditMode, editName, editCal,
  onEditName, onEditCal, onSave, onCancel, onDelete,
}: {
  item: IngredientItem;
  onPress?: () => void;
  isEditing?: boolean;
  isEditMode?: boolean;
  editName?: string; editCal?: string;
  onEditName?: (v: string) => void; onEditCal?: (v: string) => void;
  onSave?: () => void; onCancel?: () => void;
  onDelete?: () => void;
}) {
  if (isEditing) {
    return (
      <IngredientEditForm
        item={item}
        editName={editName ?? item.name}
        editCal={editCal ?? String(item.calories)}
        onEditName={onEditName ?? (() => {})}
        onEditCal={onEditCal ?? (() => {})}
        onSave={onSave ?? (() => {})}
        onCancel={onCancel ?? (() => {})}
      />
    );
  }

  const isInferred = item.visible === "inferred";
  const isPartial  = item.visible === "partial";

  return (
    <Pressable onPress={isEditMode ? onPress : undefined} style={ingStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={isInferred ? ingStyles.nameInferred : ingStyles.name}>
          {isPartial  && <Text style={ingStyles.partialPrefix}>{"~ "}</Text>}
          {isInferred && <Text style={ingStyles.inferredPrefix}>{"likely "}</Text>}
          {item.name}
        </Text>
        <Text style={ingStyles.macros}>
          P:{item.protein}g  C:{item.carbs}g  F:{item.fat}g
          {item.fibre ? `  Fibre:${item.fibre}g` : ""}
        </Text>
      </View>
      <Text style={ingStyles.cal}>{item.calories} kcal</Text>
      {isEditMode && (
        <Pressable onPress={onDelete} style={ingStyles.deleteBtn} hitSlop={8}>
          <Ionicons name="close" size={14} color="rgba(248,113,113,0.55)" />
        </Pressable>
      )}
    </Pressable>
  );
}

const ingStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10 },
  name: { fontSize: TYPE.body, color: SECONDARY, fontWeight: "500" },
  nameInferred: { fontSize: TYPE.body, color: MUTED, fontWeight: "400" },
  partialPrefix: { color: ACCENT },
  inferredPrefix: { color: MUTED, fontStyle: "italic" },
  macros: { fontSize: TYPE.xs, color: MUTED, marginTop: 3 },
  cal: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600", marginLeft: 8, marginTop: 2 },
  deleteBtn: { padding: 4, marginLeft: 4, marginTop: 1 },
  editWrap: { paddingVertical: 8, gap: 8 },
  editInput: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: TYPE.body, color: "#fff",
  },
  editCalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editWeightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editWeightArrow: { fontSize: TYPE.sm, color: MUTED },
  editWeightCal: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600", minWidth: 55 },
  editCalUnit: { fontSize: TYPE.sm, color: MUTED },
  editActions: { flexDirection: "row", gap: 8 },
  editCancel: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  editCancelText: { fontSize: TYPE.sm, color: SECONDARY },
  editSave: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", backgroundColor: ACCENT },
  editSaveText: { fontSize: TYPE.sm, fontWeight: "700", color: BTN_TEXT },
});

// ── Breakdown section (shared by result card and expanded meal card) ────────────
function BreakdownSection({
  ingredients, totalCalories, phaseNote,
  editingIdx, editName, editCal,
  onEditRow, onEditName, onEditCal, onSaveEdit, onCancelEdit,
  onDeleteIngredient, onAddIngredient,
}: {
  ingredients: IngredientItem[];
  totalCalories: number;
  phaseNote?: string;
  editingIdx?: number | null;
  editName?: string; editCal?: string;
  onEditRow?: (i: number) => void;
  onEditName?: (v: string) => void; onEditCal?: (v: string) => void;
  onSaveEdit?: () => void; onCancelEdit?: () => void;
  onDeleteIngredient?: (i: number) => void;
  onAddIngredient?: (name: string, calories: number) => void;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCal, setAddCal] = useState("");

  const handleAddNew = () => {
    if (!addName.trim()) return;
    onAddIngredient?.(addName.trim(), parseInt(addCal) || 0);
    setAddName("");
    setAddCal("");
  };

  const canEdit = !!onAddIngredient;

  return (
    <View style={bdStyles.wrap}>
      <View style={bdStyles.titleRow}>
        <Text style={bdStyles.title}>How we got there</Text>
        {isEditMode && (
          <Pressable onPress={() => { setIsEditMode(false); setAddName(""); setAddCal(""); }}>
            <Text style={bdStyles.doneLink}>Done</Text>
          </Pressable>
        )}
      </View>
      {ingredients.map((ing, i) => (
        <View key={i}>
          {i > 0 && <View style={bdStyles.divider} />}
          <IngredientRow
            item={ing}
            isEditMode={isEditMode}
            onPress={() => onEditRow?.(i)}
            isEditing={isEditMode && editingIdx === i}
            editName={editName}
            editCal={editCal}
            onEditName={onEditName}
            onEditCal={onEditCal}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onDelete={() => onDeleteIngredient?.(i)}
          />
        </View>
      ))}
      {isEditMode && (
        <View>
          <View style={bdStyles.divider} />
          <View style={bdStyles.addIngRow}>
            <TextInput
              style={[bdStyles.addIngInput, { flex: 2 }]}
              value={addName}
              onChangeText={setAddName}
              placeholder="Add ingredient..."
              placeholderTextColor={MUTED}
              onSubmitEditing={handleAddNew}
              returnKeyType="done"
            />
            <TextInput
              style={[bdStyles.addIngInput, { flex: 1 }]}
              value={addCal}
              onChangeText={setAddCal}
              placeholder="kcal"
              placeholderTextColor={MUTED}
              keyboardType="number-pad"
            />
            <Pressable
              onPress={handleAddNew}
              style={[bdStyles.addIngBtn, { backgroundColor: addName.trim() ? ACCENT : "rgba(255,255,255,0.06)" }]}
            >
              <Ionicons name="add" size={16} color={addName.trim() ? BTN_TEXT : MUTED} />
            </Pressable>
          </View>
        </View>
      )}
      <View style={bdStyles.divider} />
      <View style={bdStyles.totalRow}>
        <Text style={bdStyles.totalLabel}>Total</Text>
        <Text style={bdStyles.totalCal}>{totalCalories} kcal</Text>
      </View>
      {phaseNote ? (
        <Text style={bdStyles.phaseNote}>{phaseNote}</Text>
      ) : null}
      {canEdit && !isEditMode && (
        <View style={bdStyles.missingRow}>
          <Text style={bdStyles.missingText}>something missing or wrong?</Text>
          <Pressable onPress={() => setIsEditMode(true)}>
            <Text style={bdStyles.missingLink}>edit ingredients →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const bdStyles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DIVIDER,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 10, marginBottom: 4,
  },
  title: { fontSize: 9, color: MUTED, fontWeight: "700", letterSpacing: 1.2 },
  doneLink: { fontSize: TYPE.xs, color: ACCENT, fontWeight: "600" },
  divider: { height: 1, backgroundColor: DIVIDER },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 10,
  },
  totalLabel: { fontSize: TYPE.body, color: "#fff", fontWeight: "700" },
  totalCal: { fontSize: TYPE.body, color: ACCENT, fontWeight: "700" },
  phaseNote: {
    fontSize: TYPE.sm, color: MUTED, fontStyle: "italic",
    lineHeight: 18, marginTop: 4, marginBottom: 8,
  },
  addIngRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
  addIngInput: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10, paddingVertical: 7,
    fontSize: TYPE.sm, color: "#fff",
  },
  addIngBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  missingRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingTop: 4, paddingBottom: 6,
  },
  missingText: { fontSize: TYPE.xs, color: MUTED },
  missingLink: { fontSize: TYPE.xs, color: ACCENT, fontWeight: "600" },
});

// ── Result card (photo + text mode result) ─────────────────────────────────────
function ResultCard({
  result, mode, noteText, onNoteChange,
  onPrimary, onAdd,
  editingIdx, editName, editCal,
  onEditRow, onEditName, onEditCal, onSaveEdit, onCancelEdit,
  onDeleteIngredient, onAddIngredient,
}: {
  result: AnalysisResult;
  mode: "photo" | "text";
  noteText: string;
  onNoteChange: (v: string) => void;
  onPrimary: () => void;
  onAdd: () => void;
  editingIdx: number | null;
  editName: string; editCal: string;
  onEditRow: (i: number) => void;
  onEditName: (v: string) => void;
  onEditCal: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteIngredient: (i: number) => void;
  onAddIngredient: (name: string, calories: number) => void;
  serving: number;
  onServingChange: (v: number) => void;
}) {
  const conf = Math.round(result.confidence * 100);
  const confNote = result.isNutritionLabel
    ? "read directly from nutrition label"
    : conf < 70
    ? "photo is unclear — consider adding a note for better accuracy"
    : conf < 90
    ? "tap to check ingredients look right"
    : null;

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={rcStyles.card}>
      {/* Header row: meal name + calories */}
      <View style={rcStyles.header}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={rcStyles.mealName}>{result.name}</Text>
          <Text style={rcStyles.confidence}>{conf}% confident</Text>
          {confNote ? (
            <Text style={[rcStyles.confidenceNote, {
              color: result.isNutritionLabel ? "#6ee7b7" : conf < 70 ? `${ACCENT}bb` : MUTED,
            }]}>
              {confNote}
            </Text>
          ) : null}
        </View>
        <View style={rcStyles.calBlock}>
          <Text style={rcStyles.calories}>{result.calories}</Text>
          <Text style={rcStyles.kcalLabel}>kcal</Text>
        </View>
      </View>

      {/* 4-macro grid */}
      <View style={rcStyles.macroGrid}>
        {[
          { label: "Protein", value: result.protein },
          { label: "Carbs",   value: result.carbs },
          { label: "Fat",     value: result.fat },
          { label: "Fibre",   value: result.fibre },
        ].map((m) => (
          <View key={m.label} style={rcStyles.macroCell}>
            <Text style={rcStyles.macroValue}>{m.value}g</Text>
            <Text style={rcStyles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Serving adjuster — only for nutrition labels */}
      {result.isNutritionLabel && result.servingSize && (
        <View style={rcStyles.servingRow}>
          <Text style={rcStyles.servingLabel}>How much did you have?</Text>
          <View style={rcStyles.servingControls}>
            <Pressable
              onPress={() => onServingChange(Math.max(0.5, serving - 0.5))}
              style={rcStyles.servingBtn}
            >
              <Text style={rcStyles.servingBtnText}>−</Text>
            </Pressable>
            <Text style={rcStyles.servingValue}>
              {serving === 1 ? `1 × ${result.servingSize}` : `${serving} × ${result.servingSize}`}
            </Text>
            <Pressable
              onPress={() => onServingChange(serving + 0.5)}
              style={rcStyles.servingBtn}
            >
              <Text style={rcStyles.servingBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Ingredient breakdown */}
      {result.ingredients.length > 0 && (
        <BreakdownSection
          ingredients={result.ingredients}
          totalCalories={result.calories}
          phaseNote={result.phaseNote}
          editingIdx={editingIdx}
          editName={editName}
          editCal={editCal}
          onEditRow={onEditRow}
          onEditName={onEditName}
          onEditCal={onEditCal}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDeleteIngredient={onDeleteIngredient}
          onAddIngredient={onAddIngredient}
        />
      )}

      {/* Optional note */}
      <TextInput
        style={rcStyles.noteInput}
        value={noteText}
        onChangeText={onNoteChange}
        placeholder="Add a note — large portion, no dressing..."
        placeholderTextColor={MUTED}
        multiline
      />

      {/* Actions */}
      <View style={rcStyles.actions}>
        <Pressable onPress={onPrimary} style={rcStyles.secondaryBtn}>
          <Text style={rcStyles.secondaryBtnText}>{mode === "photo" ? "Retake" : "Edit"}</Text>
        </Pressable>
        <Pressable onPress={onAdd} style={rcStyles.primaryBtn}>
          <Text style={rcStyles.primaryBtnText}>+ Add to log</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const rcStyles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffffff12",
    padding: 18,
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  mealName: {
    fontFamily: "Georgia", fontSize: 18,
    color: "#fff", fontWeight: "600", lineHeight: 24,
  },
  confidence: { fontSize: TYPE.xs, color: MUTED, marginTop: 4 },
  confidenceNote: { fontSize: TYPE.xs, marginTop: 2, fontStyle: "italic", lineHeight: 16 },
  calBlock: { alignItems: "flex-end" },
  calories: { fontSize: 32, fontWeight: "800", color: ACCENT, lineHeight: 36 },
  kcalLabel: { fontSize: TYPE.xs, color: MUTED, marginTop: 1 },

  macroGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 4,
  },
  macroCell: { flex: 1, alignItems: "center" },
  macroValue: { fontSize: 17, fontWeight: "700", color: ACCENT },
  macroLabel: { fontSize: TYPE.xs, color: MUTED, marginTop: 3 },

  noteInput: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: TYPE.sm,
    color: "#fff",
    minHeight: 44,
    marginBottom: 14,
  },

  servingRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 10, paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  servingLabel: { fontSize: TYPE.sm, color: SECONDARY },
  servingControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  servingBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  servingBtnText: { fontSize: 16, color: ACCENT, fontWeight: "700", lineHeight: 20 },
  servingValue: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600", textAlign: "center" as const, minWidth: 90 },

  actions: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnText: { fontSize: TYPE.body, color: SECONDARY, fontWeight: "500" },
  primaryBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 14, alignItems: "center",
    backgroundColor: ACCENT,
  },
  primaryBtnText: { fontSize: TYPE.body, fontWeight: "800", color: BTN_TEXT },
});

// ── Expandable logged meal card ────────────────────────────────────────────────
function ExpandableMealCard({ entry }: { entry: FoodEntry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={emcStyles.card}>
      <Pressable onPress={() => setExpanded(!expanded)} style={emcStyles.header}>
        <View style={{ flex: 1 }}>
          <View style={emcStyles.nameRow}>
            <Text style={emcStyles.name} numberOfLines={1}>{entry.name}</Text>
            {entry.badge && (
              <View style={emcStyles.badge}>
                <Text style={emcStyles.badgeText}>{entry.badge}</Text>
              </View>
            )}
          </View>
          <Text style={emcStyles.macros}>
            P:{entry.protein}g · C:{entry.carbs}g · F:{entry.fat}g
            {entry.fibre ? ` · Fibre:${entry.fibre}g` : ""}
          </Text>
        </View>
        <View style={emcStyles.calBlock}>
          <Text style={emcStyles.cal}>{entry.calories} kcal</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={MUTED}
            style={{ marginTop: 4 }}
          />
        </View>
      </Pressable>
      {expanded && entry.ingredients && entry.ingredients.length > 0 && (
        <BreakdownSection
          ingredients={entry.ingredients}
          totalCalories={entry.calories}
          phaseNote={entry.phaseNote}
        />
      )}
    </View>
  );
}

const emcStyles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG, borderRadius: 16,
    borderWidth: 1, borderColor: "#ffffff12",
    padding: 14, marginBottom: 8,
  },
  header: { flexDirection: "row", alignItems: "flex-start" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontSize: TYPE.body, color: "#fff", fontWeight: "600" },
  badge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: { fontSize: 9, color: MUTED, fontWeight: "600" },
  macros: { fontSize: TYPE.xs, color: MUTED, marginTop: 3 },
  calBlock: { alignItems: "flex-end", marginLeft: 10 },
  cal: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "700" },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function LogScreen() {
  const addFoodEntry = useAppStore((s) => s.addFoodEntry);
  const currentPhase = useAppStore((s) => s.currentPhase);
  const foodLog = useAppStore((s) => s.foodLog);
  const profile = useAppStore((s) => s.profile);
  const vitaminsTakenByDate = useAppStore((s) => s.vitaminsTakenByDate);
  const toggleVitaminTakenForDate = useAppStore((s) => s.toggleVitaminTakenForDate);
  const logPrefill = useAppStore((s) => s.logPrefill);
  const setLogPrefill = useAppStore((s) => s.setLogPrefill);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = foodLog.filter((f) => f.date === todayStr || !f.date);
  const hasPCOS = profile.conditions.includes("PCOS");
  const phaseVitamins = hasPCOS ? PCOS_VITAMINS : PHASE_VITAMINS[currentPhase];
  const takenToday = vitaminsTakenByDate[todayStr] ?? [];

  // Handle prefill from home screen chips
  useEffect(() => {
    if (logPrefill) {
      setMode("text");
      setTextInput(logPrefill);
      setLogPrefill(null);
    }
  }, [logPrefill]);

  // Mode state
  const [mode, setMode] = useState<InputMode>("photo");
  const [mealType, setMealType] = useState<MealType>("lunch");

  // Photo state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState("");

  // Text state
  const [textInput, setTextInput] = useState("");

  // Shared result state
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultNote, setResultNote] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCal, setEditCal] = useState("");
  const [servingCount, setServingCount] = useState(1);

  // Manual state
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualP, setManualP] = useState("");
  const [manualC, setManualC] = useState("");
  const [manualF, setManualF] = useState("");
  const [manualFibre, setManualFibre] = useState("");
  const [manualIngredients, setManualIngredients] = useState<{ name: string; calories: number }[]>([]);
  const [addingIng, setAddingIng] = useState(false);
  const [newIngName, setNewIngName] = useState("");
  const [newIngCal, setNewIngCal] = useState("");

  // Status
  const [analysing, setAnalysing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successName, setSuccessName] = useState("");

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const clearPhotoState = () => {
    setPhotoUri(null); setPhotoBase64(null); setPhotoNote(""); setErrorMsg("");
  };

  const clearResult = () => {
    setResult(null); setResultNote(""); setEditingIdx(null); setEditName(""); setEditCal(""); setServingCount(1);
  };

  const switchMode = (m: InputMode) => {
    setMode(m);
    clearResult();
    clearPhotoState();
    setTextInput("");
    setErrorMsg("");
  };

  const normalizeResult = (raw: Record<string, unknown>): AnalysisResult => {
    const ingredients = (raw.ingredients as IngredientItem[] | undefined) ?? [];
    const protein = Number(raw.protein ?? 0);
    const carbs   = Number(raw.carbs   ?? 0);
    const fat     = Number(raw.fat     ?? 0);
    const fibre   = Number(raw.fibre   ?? 0);
    const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
    const isNutritionLabel = raw.isNutritionLabel === true;
    return {
      name:        String(raw.name ?? "Meal"),
      protein, carbs, fat, fibre, calories,
      confidence:  Number(raw.confidence ?? 0.7),
      ingredients: ingredients.map((ing) => ({
        ...ing,
        calories: ing.calories ?? Math.round((ing.protein ?? 0) * 4 + (ing.carbs ?? 0) * 4 + (ing.fat ?? 0) * 9),
      })),
      phaseNote:   raw.phaseNote ? String(raw.phaseNote) : undefined,
      phaseBadge:  raw.phaseBadge ? String(raw.phaseBadge) : undefined,
      isNutritionLabel,
      servingSize: raw.servingSize ? String(raw.servingSize) : undefined,
      // Store per-serving base macros for scaling when user adjusts portions
      perServingCalories: isNutritionLabel ? calories : undefined,
      perServingProtein:  isNutritionLabel ? protein  : undefined,
      perServingCarbs:    isNutritionLabel ? carbs    : undefined,
      perServingFat:      isNutritionLabel ? fat      : undefined,
      perServingFibre:    isNutritionLabel ? fibre    : undefined,
    };
  };

  const handleAddResult = () => {
    if (!result) return;
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fibre: result.fibre || undefined,
      badge: result.phaseBadge || undefined,
      ingredients: result.ingredients.length > 0 ? result.ingredients : undefined,
      phaseNote: result.phaseNote,
      meal: mealType,
      date: todayStr,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: mode === "photo" ? "photo" : "text",
    };
    addFoodEntry(entry);
    clearResult();
    clearPhotoState();
    setSuccessName(result.name);
    setTimeout(() => setSuccessName(""), 3000);
  };

  // ── Photo handlers ────────────────────────────────────────────────────────────

  const handlePhotoCapture = async (useCamera: boolean) => {
    setErrorMsg("");
    let pickerResult;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setErrorMsg("Camera permission is required."); return; }
      pickerResult = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.35, allowsEditing: true, aspect: [4, 3], exif: false });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setErrorMsg("Photo library permission is required."); return; }
      pickerResult = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.35, allowsEditing: true, aspect: [4, 3], exif: false });
    }
    if (pickerResult.canceled || !pickerResult.assets[0].base64) return;
    setPhotoUri(pickerResult.assets[0].uri);
    setPhotoBase64(pickerResult.assets[0].base64);
    clearResult();
  };

  const handlePhotoAnalyse = async () => {
    if (!photoBase64) return;
    setAnalysing(true);
    setErrorMsg("");
    const raw = await analyzeMealPhoto(photoBase64, photoNote, currentPhase);
    setAnalysing(false);
    if (raw) {
      setResult(normalizeResult(raw as unknown as Record<string, unknown>));
    } else {
      setErrorMsg("Couldn't analyse the photo. Try adding a short description to help.");
    }
  };

  const handleTextAnalyse = async () => {
    if (!textInput.trim()) return;
    setAnalysing(true);
    setErrorMsg("");
    clearResult();
    const raw = await analyzeMeal({ type: "text", description: textInput, phase: currentPhase });
    setAnalysing(false);
    if (raw) setResult(normalizeResult(raw as unknown as Record<string, unknown>));
    else setErrorMsg("Couldn't analyse. Try being more specific.");
  };

  // ── Ingredient editing (text mode) ────────────────────────────────────────────

  const startEditing = (i: number) => {
    if (!result) return;
    setEditingIdx(i);
    setEditName(result.ingredients[i].name);
    setEditCal(String(result.ingredients[i].calories));
  };

  const saveIngEdit = () => {
    if (!result || editingIdx === null) return;
    const cal = parseInt(editCal) || result.ingredients[editingIdx].calories;
    const updated = result.ingredients.map((ing, i) =>
      i === editingIdx ? { ...ing, name: editName.trim() || ing.name, calories: cal } : ing
    );
    const totalCal = updated.reduce((s, ing) => s + ing.calories, 0);
    setResult({ ...result, ingredients: updated, calories: totalCal });
    setEditingIdx(null);
  };

  const cancelIngEdit = () => setEditingIdx(null);

  const deleteIngredient = (idx: number) => {
    if (!result) return;
    const updated = result.ingredients.filter((_, i) => i !== idx);
    const totalCal = updated.reduce((s, ing) => s + ing.calories, 0);
    setResult({ ...result, ingredients: updated, calories: totalCal });
    if (editingIdx === idx) setEditingIdx(null);
  };

  const addIngredient = (name: string, calories: number) => {
    if (!result) return;
    const newIng: IngredientItem = { name, protein: 0, carbs: 0, fat: 0, calories };
    const updated = [...result.ingredients, newIng];
    const totalCal = updated.reduce((s, ing) => s + ing.calories, 0);
    setResult({ ...result, ingredients: updated, calories: totalCal });
  };

  const handleServingChange = (count: number) => {
    if (!result?.isNutritionLabel) return;
    setServingCount(count);
    const pCal   = result.perServingCalories ?? result.calories;
    const pProt  = result.perServingProtein  ?? result.protein;
    const pCarbs = result.perServingCarbs    ?? result.carbs;
    const pFat   = result.perServingFat      ?? result.fat;
    const pFibre = result.perServingFibre    ?? result.fibre;
    const sc = (v: number) => Math.round(v * count * 10) / 10;
    setResult({
      ...result,
      calories: Math.round(pCal * count),
      protein: sc(pProt), carbs: sc(pCarbs), fat: sc(pFat), fibre: sc(pFibre),
      ingredients: result.ingredients.length > 0
        ? [{ ...result.ingredients[0], calories: Math.round(pCal * count), protein: sc(pProt), carbs: sc(pCarbs), fat: sc(pFat), fibre: sc(pFibre) }]
        : [],
    });
  };

  // ── Manual add ────────────────────────────────────────────────────────────────

  const handleManualAdd = () => {
    if (!manualName.trim()) { setErrorMsg("Please enter a meal name."); return; }
    const cal = parseInt(manualCal) || Math.round(
      (parseInt(manualP) || 0) * 4 + (parseInt(manualC) || 0) * 4 + (parseInt(manualF) || 0) * 9
    );
    const manualFibreVal = parseInt(manualFibre) || undefined;
    const ings: IngredientItem[] = manualIngredients.map((ing) => ({
      name: ing.name,
      protein: 0, carbs: 0, fat: 0,
      calories: ing.calories,
    }));
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: manualName,
      calories: cal,
      protein: parseInt(manualP) || 0,
      carbs: parseInt(manualC) || 0,
      fat: parseInt(manualF) || 0,
      fibre: manualFibreVal,
      ingredients: ings.length > 0 ? ings : undefined,
      meal: mealType,
      date: todayStr,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "manual",
    };
    addFoodEntry(entry);
    setManualName(""); setManualCal(""); setManualP(""); setManualC(""); setManualF(""); setManualFibre("");
    setManualIngredients([]); setAddingIng(false); setErrorMsg("");
    setSuccessName(manualName);
    setTimeout(() => setSuccessName(""), 3000);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const showResult = !!result;
  const showPhotoCapture = mode === "photo" && !photoUri && !showResult;
  const showPhotoPreview = mode === "photo" && !!photoUri && !showResult;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.title}>Log</Text>
            <Text style={styles.subtitle}>snap it, type it, or add it manually</Text>
          </Animated.View>

          {/* Meal type */}
          <View style={styles.mealTypePicker}>
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) => {
              const active = mealType === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMealType(m)}
                  style={[styles.mealTypeBtn, active && styles.mealTypeBtnActive]}
                >
                  <Text style={[styles.mealTypeBtnText, active && styles.mealTypeBtnTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Mode tabs */}
          {!showResult && (
            <View style={styles.modeTabs}>
              {([
                { key: "photo" as InputMode, icon: "camera-outline" as const, label: "Photo" },
                { key: "text"  as InputMode, icon: "text-outline"   as const, label: "Text" },
                { key: "manual" as InputMode, icon: "create-outline" as const, label: "Manual" },
              ]).map((m) => {
                const active = mode === m.key;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => switchMode(m.key)}
                    style={[styles.modeTab, active && styles.modeTabActive]}
                  >
                    <Ionicons name={m.icon} size={18} color={active ? ACCENT : MUTED} />
                    <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Status banners */}
          {successName !== "" && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
              <Text style={styles.successText}>{successName} logged!</Text>
            </Animated.View>
          )}
          {errorMsg !== "" && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* ── Result card (photo & text modes) ── */}
          {showResult && result && (
            <ResultCard
              result={result}
              mode={mode as "photo" | "text"}
              noteText={resultNote}
              onNoteChange={setResultNote}
              onPrimary={() => { clearResult(); if (mode === "photo") clearPhotoState(); }}
              onAdd={handleAddResult}
              editingIdx={editingIdx}
              editName={editName}
              editCal={editCal}
              onEditRow={startEditing}
              onEditName={setEditName}
              onEditCal={setEditCal}
              onSaveEdit={saveIngEdit}
              onCancelEdit={cancelIngEdit}
              onDeleteIngredient={deleteIngredient}
              onAddIngredient={addIngredient}
              serving={servingCount}
              onServingChange={handleServingChange}
            />
          )}

          {/* ── Photo mode ── */}
          {showPhotoCapture && (
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.photoCard}>
              <View style={styles.photoOrb}>
                <Ionicons name="camera" size={36} color={ACCENT} />
              </View>
              <Text style={styles.photoTitle}>Take a photo of your meal</Text>
              <Text style={styles.photoSub}>We'll estimate every ingredient — add a note to improve accuracy</Text>
              <View style={styles.photoActions}>
                <Pressable onPress={() => handlePhotoCapture(true)} style={styles.photoPrimaryBtn}>
                  <Ionicons name="camera" size={16} color={BTN_TEXT} />
                  <Text style={styles.photoPrimaryBtnText}>Take Photo</Text>
                </Pressable>
                <Pressable onPress={() => handlePhotoCapture(false)} style={styles.photoSecondaryBtn}>
                  <Ionicons name="images-outline" size={16} color={ACCENT} />
                  <Text style={[styles.photoSecondaryBtnText, { color: ACCENT }]}>Gallery</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {showPhotoPreview && (
            <Animated.View entering={FadeInDown.duration(350)} style={styles.photoCard}>
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photoUri! }} style={styles.photoPreview} resizeMode="cover" />
                <Pressable onPress={clearPhotoState} style={styles.retakeOverlay}>
                  <Text style={styles.retakeText}>Retake</Text>
                </Pressable>
              </View>
              <View style={styles.photoNoteRow}>
                <Ionicons name="create-outline" size={15} color={MUTED} />
                <TextInput
                  style={styles.photoNoteInput}
                  value={photoNote}
                  onChangeText={setPhotoNote}
                  placeholder="Add a note — large portion, no dressing, extra rice..."
                  placeholderTextColor={MUTED}
                  multiline
                />
              </View>
              {analysing ? (
                <View style={styles.analysingRow}>
                  <ActivityIndicator color={ACCENT} />
                  <Text style={styles.analysingText}>Analysing your meal...</Text>
                </View>
              ) : (
                <Pressable onPress={handlePhotoAnalyse} style={styles.analyseBtn}>
                  <Ionicons name="sparkles" size={16} color={BTN_TEXT} />
                  <Text style={styles.analyseBtnText}>Analyse Meal</Text>
                </Pressable>
              )}
            </Animated.View>
          )}

          {/* ── Text mode ── */}
          {mode === "text" && !showResult && (
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.textCard}>
              <TextInput
                style={[styles.textArea, { borderColor: textInput.length > 0 ? ACCENT : "rgba(255,255,255,0.12)" }]}
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Describe your meal... e.g. egg salad sandwich on sourdough, medium portion"
                placeholderTextColor={MUTED}
                multiline
                numberOfLines={5}
              />
              {analysing ? (
                <View style={styles.analysingRow}>
                  <ActivityIndicator color={ACCENT} />
                  <Text style={styles.analysingText}>Analysing...</Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleTextAnalyse}
                  disabled={!textInput.trim()}
                  style={[styles.analyseBtn, !textInput.trim() && styles.analyseBtnDisabled]}
                >
                  <Ionicons name="sparkles" size={16} color={textInput.trim() ? BTN_TEXT : MUTED} />
                  <Text style={[styles.analyseBtnText, !textInput.trim() && { color: MUTED }]}>
                    Analyse meal
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          )}

          {/* ── Manual mode ── */}
          {mode === "manual" && (
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.manualCard}>
              {/* Meal name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meal name</Text>
                <TextInput
                  style={styles.input}
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="e.g. Grilled Chicken Breast"
                  placeholderTextColor={MUTED}
                />
              </View>

              {/* Calories */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <View style={styles.calorieRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={manualCal}
                    onChangeText={setManualCal}
                    placeholder="0"
                    placeholderTextColor={MUTED}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.calorieUnit}>kcal</Text>
                </View>
              </View>

              {/* 4-macro inputs */}
              <View style={styles.macroInputGrid}>
                {[
                  { label: "Protein", val: manualP, set: setManualP },
                  { label: "Carbs",   val: manualC, set: setManualC },
                  { label: "Fat",     val: manualF, set: setManualF },
                  { label: "Fibre",   val: manualFibre, set: setManualFibre, optional: true },
                ].map((f) => (
                  <View key={f.label} style={styles.macroInputCell}>
                    <Text style={styles.macroInputLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.macroInput}
                      value={f.val}
                      onChangeText={f.set}
                      placeholder={f.optional ? "—" : "0"}
                      placeholderTextColor={MUTED}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.macroInputUnit}>g</Text>
                  </View>
                ))}
              </View>

              {/* Ingredients (optional) */}
              <View style={styles.ingSection}>
                <Text style={styles.ingLabel}>Ingredients <Text style={styles.ingOptional}>(optional)</Text></Text>
                {manualIngredients.map((ing, i) => (
                  <View key={i} style={styles.manualIngRow}>
                    <Text style={styles.manualIngName} numberOfLines={1}>{ing.name}</Text>
                    <Text style={styles.manualIngCal}>{ing.calories} kcal</Text>
                    <Pressable onPress={() => setManualIngredients(manualIngredients.filter((_, j) => j !== i))}>
                      <Ionicons name="close" size={14} color={MUTED} />
                    </Pressable>
                  </View>
                ))}
                {addingIng ? (
                  <View style={styles.addIngForm}>
                    <TextInput
                      style={styles.addIngInput}
                      value={newIngName}
                      onChangeText={setNewIngName}
                      placeholder="Ingredient name"
                      placeholderTextColor={MUTED}
                    />
                    <View style={styles.addIngCalRow}>
                      <TextInput
                        style={[styles.addIngInput, { flex: 1 }]}
                        value={newIngCal}
                        onChangeText={setNewIngCal}
                        placeholder="Calories"
                        placeholderTextColor={MUTED}
                        keyboardType="number-pad"
                      />
                      <Text style={styles.calorieUnit}>kcal</Text>
                    </View>
                    <View style={styles.addIngActions}>
                      <Pressable onPress={() => { setAddingIng(false); setNewIngName(""); setNewIngCal(""); }} style={styles.addIngCancel}>
                        <Text style={styles.addIngCancelText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if (!newIngName.trim()) return;
                          setManualIngredients([...manualIngredients, { name: newIngName, calories: parseInt(newIngCal) || 0 }]);
                          setNewIngName(""); setNewIngCal(""); setAddingIng(false);
                        }}
                        style={styles.addIngSave}
                      >
                        <Text style={styles.addIngSaveText}>Add</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={() => setAddingIng(true)} style={styles.addIngBtn}>
                    <Text style={styles.addIngBtnText}>+ add ingredient</Text>
                  </Pressable>
                )}
              </View>

              <Pressable onPress={handleManualAdd} style={styles.manualAddBtn}>
                <Text style={styles.manualAddBtnText}>+ Add to log</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Logged today ── */}
          {todayLog.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.sectionLabel}>LOGGED TODAY</Text>
              {todayLog.slice().reverse().map((entry) => (
                <ExpandableMealCard key={entry.id} entry={entry} />
              ))}
            </View>
          )}

          {/* ── Vitamins today ── */}
          <View style={styles.vitaminCard}>
            <Text style={styles.sectionLabel}>VITAMINS TODAY</Text>
            <Text style={styles.vitaminPhaseLabel}>{PHASE_INFO[currentPhase].label}</Text>
            {phaseVitamins.slice(0, 3).map((v) => {
              const taken = takenToday.includes(v.id);
              return (
                <Pressable
                  key={v.id}
                  onPress={() => toggleVitaminTakenForDate(v.id, todayStr)}
                  style={styles.vitaminRow}
                >
                  <View style={[styles.vitaminCheck, taken && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
                    {taken && <Ionicons name="checkmark" size={12} color={BTN_TEXT} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vitaminName, taken && { color: MUTED }]}>{v.name}</Text>
                    <Text style={styles.vitaminDetail}>{v.dosage} · {v.timing}</Text>
                    <Text style={styles.vitaminReason}>{v.reason}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0a1e" },
  scroll: { padding: 16, paddingTop: 12 },

  title: { fontFamily: "Georgia", fontSize: 26, color: "#fff", fontWeight: "600" },
  subtitle: { fontSize: TYPE.sm, color: SECONDARY, marginTop: 4, marginBottom: 18 },

  // Meal type
  mealTypePicker: { flexDirection: "row", gap: 7, marginBottom: 14 },
  mealTypeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center",
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: "#ffffff12",
  },
  mealTypeBtnActive: { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}40` },
  mealTypeBtnText: { fontSize: 11, color: MUTED, fontWeight: "500" },
  mealTypeBtnTextActive: { color: ACCENT, fontWeight: "700" },

  // Mode tabs
  modeTabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  modeTab: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 16,
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: "#ffffff12", gap: 5,
  },
  modeTabActive: { backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}30` },
  modeTabText: { fontSize: 11, color: MUTED, fontWeight: "500" },
  modeTabTextActive: { color: ACCENT, fontWeight: "700" },

  // Banners
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
    backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}25`,
    marginBottom: 12,
  },
  successText: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600" },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.08)", borderWidth: 1, borderColor: "rgba(248,113,113,0.2)",
    marginBottom: 12,
  },
  errorText: { fontSize: 12, color: "#f87171", flex: 1 },

  // Photo card
  photoCard: {
    backgroundColor: CARD_BG, borderRadius: 20, borderWidth: 1, borderColor: "#ffffff12",
    padding: 20, marginBottom: 12, alignItems: "center", gap: 10,
  },
  photoOrb: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: `${ACCENT}12`,
    borderWidth: 2, borderStyle: "dashed", borderColor: `${ACCENT}40`,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  photoTitle: { fontSize: 16, color: "#fff", fontWeight: "600" },
  photoSub: { fontSize: TYPE.sm, color: MUTED, textAlign: "center", lineHeight: 18 },
  photoActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  photoPrimaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14,
    backgroundColor: ACCENT,
  },
  photoPrimaryBtnText: { fontSize: TYPE.body, fontWeight: "800", color: BTN_TEXT },
  photoSecondaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14,
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: "#ffffff15",
  },
  photoSecondaryBtnText: { fontSize: TYPE.body, fontWeight: "600" },

  photoPreviewWrap: { position: "relative" as any, width: "100%" },
  photoPreview: { width: "100%", height: 220, borderRadius: 14 },
  retakeOverlay: {
    position: "absolute" as any, top: 10, right: 10,
    backgroundColor: "rgba(10,10,20,0.80)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  retakeText: { fontSize: TYPE.sm, color: "#fff" },

  photoNoteRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12,
    borderWidth: 1, borderColor: "#ffffff10",
    paddingHorizontal: 12, paddingVertical: 10, width: "100%",
  },
  photoNoteInput: { flex: 1, fontSize: TYPE.sm, color: "#fff", minHeight: 36, textAlignVertical: "top" },

  analysingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  analysingText: { fontSize: TYPE.body, color: ACCENT, fontWeight: "500" },
  analyseBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14,
    backgroundColor: ACCENT, alignSelf: "stretch", justifyContent: "center",
  },
  analyseBtnDisabled: { backgroundColor: "rgba(255,255,255,0.08)" },
  analyseBtnText: { fontSize: TYPE.body, fontWeight: "800", color: BTN_TEXT },

  // Text card
  textCard: {
    backgroundColor: CARD_BG, borderRadius: 20, borderWidth: 1, borderColor: "#ffffff12",
    padding: 16, marginBottom: 12, gap: 12,
  },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: TYPE.body, color: "#fff",
    minHeight: 110, textAlignVertical: "top",
  },

  // Manual card
  manualCard: {
    backgroundColor: CARD_BG, borderRadius: 20, borderWidth: 1, borderColor: "#ffffff12",
    padding: 16, marginBottom: 12,
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: TYPE.xs, color: SECONDARY, fontWeight: "600", letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12,
    borderWidth: 1, borderColor: "#ffffff12",
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: TYPE.body, color: "#fff",
  },
  calorieRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  calorieUnit: { fontSize: TYPE.sm, color: MUTED },
  macroInputGrid: { flexDirection: "row", gap: 8, marginBottom: 18 },
  macroInputCell: { flex: 1, alignItems: "center", gap: 4 },
  macroInputLabel: { fontSize: 10, color: MUTED, fontWeight: "600", textTransform: "uppercase" },
  macroInput: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10,
    borderWidth: 1, borderColor: "#ffffff10",
    paddingVertical: 8, fontSize: 15, fontWeight: "700", color: "#fff", textAlign: "center",
  },
  macroInputUnit: { fontSize: 10, color: MUTED },

  // Ingredients section
  ingSection: { marginBottom: 18 },
  ingLabel: { fontSize: TYPE.xs, color: SECONDARY, fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  ingOptional: { color: MUTED, fontWeight: "400" },
  manualIngRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DIVIDER,
  },
  manualIngName: { flex: 1, fontSize: TYPE.sm, color: SECONDARY },
  manualIngCal: { fontSize: TYPE.sm, color: ACCENT, fontWeight: "600", marginRight: 8 },
  addIngBtn: {
    borderWidth: 1, borderColor: "#ffffff15", borderStyle: "dashed", borderRadius: 10,
    paddingVertical: 10, alignItems: "center", marginTop: 6,
  },
  addIngBtnText: { fontSize: TYPE.sm, color: MUTED },
  addIngForm: { marginTop: 8, gap: 8 },
  addIngInput: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10,
    borderWidth: 1, borderColor: "#ffffff12",
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: TYPE.body, color: "#fff",
  },
  addIngCalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addIngActions: { flexDirection: "row", gap: 8 },
  addIngCancel: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "#ffffff10",
  },
  addIngCancelText: { fontSize: TYPE.sm, color: SECONDARY },
  addIngSave: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", backgroundColor: ACCENT },
  addIngSaveText: { fontSize: TYPE.sm, fontWeight: "700", color: BTN_TEXT },

  manualAddBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: ACCENT,
  },
  manualAddBtnText: { fontSize: TYPE.body, fontWeight: "800", color: BTN_TEXT },

  // Logged today
  sectionLabel: {
    fontSize: 9, color: MUTED, fontWeight: "700",
    letterSpacing: 1.2, marginBottom: 10,
  },

  // Vitamins
  vitaminCard: {
    backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: "#ffffff12",
    padding: 16, marginTop: 12,
  },
  vitaminPhaseLabel: { fontSize: TYPE.xs, color: MUTED, marginBottom: 12, marginTop: -6 },
  vitaminRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  vitaminCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
    marginTop: 1, flexShrink: 0,
  },
  vitaminName: { fontSize: TYPE.sm, color: "#fff", fontWeight: "600" },
  vitaminDetail: { fontSize: TYPE.xs, color: MUTED, marginTop: 2 },
  vitaminReason: { fontSize: TYPE.xs, color: "rgba(255,255,255,0.30)", marginTop: 2, fontStyle: "italic" },
});
