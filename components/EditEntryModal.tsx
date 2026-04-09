import React, { useState } from "react";
import {
  View, Text, Pressable, StyleSheet, TextInput, Modal,
} from "react-native";
import { DARK_THEME, MACRO_COLORS, TYPE } from "@/constants/theme";
import { FoodEntry, MealType } from "@/types";

const MEAL_SLOTS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_EMOJI: Record<MealType, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

export function EditEntryModal({
  entry,
  accentColor,
  onSave,
  onClose,
}: {
  entry: FoodEntry;
  accentColor: string;
  onSave: (updates: Partial<FoodEntry>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(entry.name);
  const [meal, setMeal] = useState<MealType>(entry.meal);
  const [calories, setCalories] = useState(String(entry.calories));
  const [protein, setProtein] = useState(String(entry.protein));
  const [carbs, setCarbs] = useState(String(entry.carbs));
  const [fat, setFat] = useState(String(entry.fat));

  const handleSave = () => {
    onSave({
      name: name.trim() || entry.name,
      meal,
      calories: Math.max(0, parseInt(calories) || 0),
      protein: Math.max(0, parseInt(protein) || 0),
      carbs: Math.max(0, parseInt(carbs) || 0),
      fat: Math.max(0, parseInt(fat) || 0),
    });
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Edit Entry</Text>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholderTextColor={DARK_THEME.textMuted}
          />

          <Text style={styles.fieldLabel}>Meal</Text>
          <View style={styles.mealRow}>
            {MEAL_SLOTS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMeal(m)}
                style={[
                  styles.mealBtn,
                  meal === m && { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}60` },
                ]}
              >
                <Text style={styles.mealEmoji}>{SLOT_EMOJI[m]}</Text>
                <Text style={[styles.mealLabel, meal === m && { color: accentColor }]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.macroRow}>
            {[
              { label: "Calories", value: calories, set: setCalories, unit: "kcal", color: accentColor },
              { label: "Protein",  value: protein,  set: setProtein,  unit: "g",    color: MACRO_COLORS.protein },
              { label: "Carbs",    value: carbs,    set: setCarbs,    unit: "g",    color: MACRO_COLORS.carbs },
              { label: "Fat",      value: fat,      set: setFat,      unit: "g",    color: MACRO_COLORS.fat },
            ].map((f) => (
              <View key={f.label} style={styles.macroCell}>
                <Text style={[styles.macroLabel, { color: f.color }]}>{f.label}</Text>
                <TextInput
                  style={[styles.macroInput, { borderColor: `${f.color}40` }]}
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType="numeric"
                  placeholderTextColor={DARK_THEME.textMuted}
                />
                <Text style={styles.macroUnit}>{f.unit}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: accentColor }]}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: DARK_THEME.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center", marginBottom: 16,
  },
  title: { fontFamily: "Georgia", fontSize: 18, color: DARK_THEME.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, marginBottom: 6, fontWeight: "600" },
  textInput: {
    backgroundColor: DARK_THEME.inputBg, borderRadius: 12, borderWidth: 1,
    borderColor: DARK_THEME.borderColor, color: DARK_THEME.textPrimary,
    fontSize: TYPE.body, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  mealRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  mealBtn: {
    flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12,
    backgroundColor: DARK_THEME.inputBg, borderWidth: 1, borderColor: DARK_THEME.borderColor, gap: 2,
  },
  mealEmoji: { fontSize: 14 },
  mealLabel: { fontSize: 10, color: DARK_THEME.textSecondary, fontWeight: "500" },
  macroRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  macroCell: { flex: 1, alignItems: "center", gap: 4 },
  macroLabel: { fontSize: 10, fontWeight: "600" },
  macroInput: {
    width: "100%", backgroundColor: DARK_THEME.inputBg, borderRadius: 10,
    borderWidth: 1, color: DARK_THEME.textPrimary, fontSize: 15, fontWeight: "700",
    textAlign: "center", paddingVertical: 8,
  },
  macroUnit: { fontSize: 10, color: DARK_THEME.textMuted },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#0a0e1a" },
});
