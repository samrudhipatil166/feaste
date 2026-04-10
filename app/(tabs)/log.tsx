import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { analyzeMeal, analyzeMealPhoto, type MealBreakdownItem } from "@/lib/api";
import { buildLogInsight } from "@/lib/insight";
import { FoodEntry, MealType } from "@/types";

type InputMode = "photo" | "text" | "manual";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface AnalysisResult {
  name: string;
  calories: number; // always set by normalizeResult — never used raw from API
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  breakdown?: MealBreakdownItem[];
}


function BreakdownRow({ item, accentColor }: { item: MealBreakdownItem; accentColor: string }) {
  const kcal = Math.round(item.protein * 4 + item.carbs * 4 + item.fat * 9);
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.breakdownMacros}>
        P:{item.protein}g  C:{item.carbs}g  F:{item.fat}g
      </Text>
      <Text style={[styles.breakdownKcal, { color: accentColor }]}>{kcal} kcal</Text>
    </View>
  );
}

function AnalysisResultCard({
  result,
  accentColor,
  insight,
  mealType,
  onAdd,
  onDiscard,
}: {
  result: AnalysisResult;
  accentColor: string;
  insight: string;
  mealType: MealType;
  onAdd: () => void;
  onDiscard: () => void;
}) {
  const conf = Math.round(result.confidence * 100);

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <GlowCard glowColor={accentColor} style={{ marginBottom: 12 }}>
        <View style={styles.resultHeader}>
          <View style={styles.resultSpark}>
            <Ionicons name="sparkles" size={14} color={accentColor} />
            <Text style={[styles.resultSparklabel, { color: accentColor }]}>
              Analysis
            </Text>
          </View>
          <View style={[styles.confBadge, { backgroundColor: `${accentColor}15` }]}>
            <Text style={[styles.confText, { color: accentColor }]}>{conf}% confident</Text>
          </View>
        </View>

        <Text style={styles.resultName}>{result.name}</Text>

        <View style={styles.macroGrid}>
          {[
            { label: "Calories", value: `${result.calories}`, unit: "kcal", color: accentColor },
            { label: "Protein", value: `${result.protein}`, unit: "g", color: "#4ECDC4" },
            { label: "Carbs", value: `${result.carbs}`, unit: "g", color: "#FBD168" },
            { label: "Fat", value: `${result.fat}`, unit: "g", color: "#f472b6" },
          ].map((m) => (
            <View key={m.label} style={styles.macroCell}>
              <Text style={[styles.macroCellValue, { color: m.color }]}>{m.value}</Text>
              <Text style={styles.macroCellUnit}>{m.unit}</Text>
              <Text style={styles.macroCellLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {result.breakdown && result.breakdown.length > 0 && (
          <View style={styles.breakdownWrap}>
            <Text style={styles.breakdownTitle}>How we got there</Text>
            {result.breakdown.map((item, i) => (
              <BreakdownRow key={i} item={item} accentColor={accentColor} />
            ))}
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownName, { color: "#fff", fontWeight: "600" }]}>Total</Text>
              <Text style={styles.breakdownMacros}>
                P:{result.protein}g  C:{result.carbs}g  F:{result.fat}g
              </Text>
              <Text style={[styles.breakdownKcal, { color: accentColor, fontWeight: "600" }]}>{result.calories} kcal</Text>
            </View>
          </View>
        )}

        <Text style={[styles.insightText, { color: accentColor }]}>{insight}</Text>

        <View style={styles.resultActions}>
          <Pressable onPress={onDiscard} style={styles.discardBtn}>
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
          <Pressable
            onPress={onAdd}
            style={[styles.addBtn, { backgroundColor: accentColor }]}
          >
            <Ionicons name="add" size={16} color="#0a0e1a" />
            <Text style={styles.addBtnText}>Add to Log</Text>
          </Pressable>
        </View>
      </GlowCard>
    </Animated.View>
  );
}

export default function LogScreen() {
  const addFoodEntry = useAppStore((s) => s.addFoodEntry);
  const accentColor = useAppStore((s) => s.accentColor());
  const currentPhase = useAppStore((s) => s.currentPhase);

  const [mode, setMode] = useState<InputMode>("photo");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [textInput, setTextInput] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successName, setSuccessName] = useState("");

  // Photo state — capture first, describe, then analyse
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoDesc, setPhotoDesc] = useState("");

  // Manual entry
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualP, setManualP] = useState("");
  const [manualC, setManualC] = useState("");
  const [manualF, setManualF] = useState("");
  const [manualError, setManualError] = useState("");

  const MODES: { key: InputMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "photo", icon: "camera-outline", label: "Photo" },
    { key: "text", icon: "text-outline", label: "Text" },
    { key: "manual", icon: "create-outline", label: "Manual" },
  ];

  const clearPhoto = () => { setPhotoUri(null); setPhotoBase64(null); setPhotoDesc(""); setErrorMsg(""); };

  // Always derive calories from macros so the numbers are consistent
  const normalizeResult = (r: AnalysisResult): AnalysisResult => ({
    ...r,
    calories: Math.round(r.protein * 4 + r.carbs * 4 + r.fat * 9),
  });

  const handleAddResult = (r: AnalysisResult) => {
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: r.name,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      meal: mealType,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: mode === "manual" ? "manual" : mode === "photo" ? "photo" : "text",
    };
    addFoodEntry(entry);
    setResult(null);
    setTextInput("");
    clearPhoto();
    setSuccessName(r.name);
    setTimeout(() => setSuccessName(""), 3000);
  };

  // Step 1: capture photo, store locally, show preview
  const handlePhotoCapture = async (useCamera: boolean) => {
    setErrorMsg("");
    let pickerResult;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setErrorMsg("Camera permission is required to capture meals."); return; }
      pickerResult = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setErrorMsg("Photo library permission is required."); return; }
      pickerResult = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    }
    if (pickerResult.canceled || !pickerResult.assets[0].base64) return;
    setPhotoUri(pickerResult.assets[0].uri);
    setPhotoBase64(pickerResult.assets[0].base64);
    setResult(null);
  };

  // Step 2: analyse photo + description together
  const handlePhotoAnalyse = async () => {
    if (!photoBase64) return;
    setAnalysing(true);
    setErrorMsg("");
    const analysis = await analyzeMealPhoto(photoBase64, photoDesc);
    setAnalysing(false);
    if (analysis) {
      console.log("analysis data:", JSON.stringify(analysis));
      setResult(normalizeResult(analysis));
    } else {
      setErrorMsg("Couldn't analyse the photo. Try adding a short description to help.");
    }
  };

  const handleTextAnalyse = async () => {
    if (!textInput.trim()) return;
    setAnalysing(true);
    setErrorMsg("");
    setResult(null);
    const analysis = await analyzeMeal({ type: "text", description: textInput });
    setAnalysing(false);
    if (analysis) setResult(normalizeResult(analysis));
    else setErrorMsg("Couldn't analyse your description. Try being more specific.");
  };

const handleManualAdd = () => {
    if (!manualName.trim() || !manualCal) { setManualError("Please enter at least a name and calories."); return; }
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: manualName,
      calories: parseInt(manualCal, 10) || 0,
      protein: parseInt(manualP, 10) || 0,
      carbs: parseInt(manualC, 10) || 0,
      fat: parseInt(manualF, 10) || 0,
      meal: mealType,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "manual",
    };
    addFoodEntry(entry);
    setManualError("");
    setSuccessName(manualName);
    setTimeout(() => setSuccessName(""), 3000);
    setManualName(""); setManualCal(""); setManualP(""); setManualC(""); setManualF("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Log Food</Text>
          <Text style={styles.subtitle}>
            Snap it, type it, or add it manually — we'll do the math 🧠
          </Text>
        </Animated.View>

        {/* Meal type picker */}
        <Animated.View entering={FadeInDown.delay(0.05).duration(400)} style={styles.mealTypePicker}>
          {MEAL_TYPES.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMealType(m)}
              style={[
                styles.mealTypeBtn,
                mealType === m && {
                  backgroundColor: `${accentColor}20`,
                  borderColor: `${accentColor}40`,
                },
              ]}
            >
              <Text
                style={[
                  styles.mealTypeBtnText,
                  mealType === m && { color: accentColor },
                ]}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Mode tabs */}
        <Animated.View entering={FadeInDown.delay(0.1).duration(400)} style={styles.modeTabs}>
          {MODES.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => { setMode(m.key); setResult(null); }}
              style={[
                styles.modeTab,
                mode === m.key && {
                  backgroundColor: `${accentColor}15`,
                  borderColor: `${accentColor}30`,
                },
              ]}
            >
              <Ionicons
                name={m.icon}
                size={20}
                color={mode === m.key ? accentColor : DARK_THEME.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  mode === m.key && { color: accentColor },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Success banner */}
        {successName !== "" && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.successBanner, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
            <Ionicons name="checkmark-circle" size={16} color={accentColor} />
            <Text style={[styles.successText, { color: accentColor }]}>{successName} logged!</Text>
          </Animated.View>
        )}

        {/* Inline error */}
        {errorMsg !== "" && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Analysis result */}
        {result && (
          <AnalysisResultCard
            result={result}
            accentColor={accentColor}
            insight={buildLogInsight(currentPhase, result.protein, result.carbs, result.fat)}
            mealType={mealType}
            onAdd={() => handleAddResult(result)}
            onDiscard={() => { setResult(null); clearPhoto(); }}
          />
        )}

        {/* Photo mode */}
        {mode === "photo" && !result && (
          <GlowCard glowColor={accentColor} style={{ marginBottom: 12 }}>
            {!photoUri ? (
              /* Step 1: capture */
              <View style={styles.photoMode}>
                <View style={[styles.photoOrb, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
                  <Ionicons name="camera" size={32} color={accentColor} />
                </View>
                <Text style={styles.photoTitle}>Take a photo of your meal</Text>
                <Text style={styles.photoSubtitle}>We'll estimate macros — add a note to improve accuracy</Text>
                <View style={styles.photoActions}>
                  <Pressable onPress={() => handlePhotoCapture(true)} style={[styles.photoBtn, { backgroundColor: accentColor }]}>
                    <Ionicons name="camera" size={16} color="#0a0e1a" />
                    <Text style={styles.photoBtnText}>Take Photo</Text>
                  </Pressable>
                  <Pressable onPress={() => handlePhotoCapture(false)} style={styles.photoOutlineBtn}>
                    <Ionicons name="images-outline" size={16} color={accentColor} />
                    <Text style={[styles.photoOutlineBtnText, { color: accentColor }]}>From Library</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Step 2: preview + description */
              <View style={styles.photoPreviewMode}>
                <View style={styles.photoPreviewRow}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                  <Pressable onPress={clearPhoto} style={styles.photoRetakeBtn}>
                    <Ionicons name="refresh-outline" size={14} color={DARK_THEME.textSecondary} />
                    <Text style={styles.photoRetakeText}>Retake</Text>
                  </Pressable>
                </View>

                <View style={styles.photoDescRow}>
                  <Ionicons name="create-outline" size={15} color={DARK_THEME.textMuted} />
                  <TextInput
                    style={styles.photoDescInput}
                    value={photoDesc}
                    onChangeText={setPhotoDesc}
                    placeholder="Add a note — e.g. large portion, no dressing, extra rice..."
                    placeholderTextColor={DARK_THEME.textMuted}
                    multiline
                  />
                </View>

                {analysing ? (
                  <View style={styles.analysingRow}>
                    <ActivityIndicator color={accentColor} />
                    <Text style={[styles.analysingText, { color: accentColor }]}>Analysing your meal...</Text>
                  </View>
                ) : (
                  <Pressable onPress={handlePhotoAnalyse} style={[styles.analyseBtn, { backgroundColor: accentColor }]}>
                    <Ionicons name="sparkles" size={16} color="#0a0e1a" />
                    <Text style={[styles.analyseBtnText, { color: "#0a0e1a" }]}>Analyse Meal</Text>
                  </Pressable>
                )}
              </View>
            )}
          </GlowCard>
        )}

        {/* Text mode */}
        {mode === "text" && !result && (
          <GlowCard style={{ marginBottom: 12 }}>
            <View style={styles.textModeHeader}>
              <Ionicons name="sparkles" size={14} color={accentColor} />
              <Text style={[styles.textModeLabel, { color: accentColor }]}>
                Describe your meal
              </Text>
            </View>
            <TextInput
              style={styles.textModeInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder={"e.g. Large bowl of salmon poke with brown rice, avocado, edamame and soy sauce"}
              placeholderTextColor={DARK_THEME.textMuted}
              multiline
              numberOfLines={4}
            />
            {analysing ? (
              <View style={styles.analysingRow}>
                <ActivityIndicator color={accentColor} />
                <Text style={[styles.analysingText, { color: accentColor }]}>Analysing...</Text>
              </View>
            ) : (
              <Pressable
                onPress={handleTextAnalyse}
                disabled={!textInput.trim()}
                style={[
                  styles.analyseBtn,
                  { backgroundColor: textInput.trim() ? accentColor : "rgba(255,255,255,0.06)" },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={textInput.trim() ? "#0a0e1a" : DARK_THEME.textMuted}
                />
                <Text
                  style={[
                    styles.analyseBtnText,
                    { color: textInput.trim() ? "#0a0e1a" : DARK_THEME.textMuted },
                  ]}
                >
                  Analyse
                </Text>
              </Pressable>
            )}
          </GlowCard>
        )}

        {/* Manual mode */}
        {mode === "manual" && (
          <GlowCard style={{ marginBottom: 12 }}>
            <Text style={styles.manualTitle}>Manual Entry</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Food name *</Text>
              <TextInput
                style={styles.input}
                value={manualName}
                onChangeText={setManualName}
                placeholder="e.g. Grilled Chicken Breast"
                placeholderTextColor={DARK_THEME.textMuted}
              />
            </View>

            <View style={styles.macroRow}>
              {[
                { label: "Calories *", value: manualCal, set: setManualCal, placeholder: "0" },
                { label: "Protein (g)", value: manualP, set: setManualP, placeholder: "0" },
                { label: "Carbs (g)", value: manualC, set: setManualC, placeholder: "0" },
                { label: "Fat (g)", value: manualF, set: setManualF, placeholder: "0" },
              ].map((field) => (
                <View key={field.label} style={styles.macroInputCell}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.macroInput}
                    value={field.value}
                    onChangeText={field.set}
                    placeholder={field.placeholder}
                    placeholderTextColor={DARK_THEME.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              ))}
            </View>

            {manualError !== "" && (
              <Text style={styles.manualError}>{manualError}</Text>
            )}
            <Pressable
              onPress={handleManualAdd}
              style={[styles.addBtn, { backgroundColor: accentColor, marginTop: 12 }]}
            >
              <Ionicons name="add" size={16} color="#0a0e1a" />
              <Text style={styles.addBtnText}>Add to Log</Text>
            </Pressable>
          </GlowCard>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK_THEME.bg,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
  },
  title: {
    fontFamily: "Georgia",
    fontSize: 26,
    color: DARK_THEME.textPrimary,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    color: DARK_THEME.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  mealTypePicker: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: DARK_THEME.cardBg,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
  },
  mealTypeBtnText: {
    fontSize: 12,
    color: DARK_THEME.textMuted,
    fontWeight: "500",
  },
  modeTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: DARK_THEME.cardBg,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    gap: 4,
  },
  modeTabText: {
    fontSize: 11,
    color: DARK_THEME.textMuted,
    fontWeight: "500",
  },
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  successText: { fontSize: 13, fontWeight: "600" },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1, borderColor: "rgba(248,113,113,0.2)", marginBottom: 12,
  },
  errorText: { fontSize: 12, color: "#f87171", flex: 1 },
  manualError: { fontSize: 12, color: "#f87171", marginTop: 8 },

  photoMode: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  photoOrb: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderStyle: "dashed", marginBottom: 8,
  },
  photoTitle: { fontSize: 15, color: DARK_THEME.textPrimary, fontWeight: "500" },
  photoSubtitle: { fontSize: 12, color: DARK_THEME.textSecondary, marginBottom: 8, textAlign: "center" },
  photoActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  photoBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
  },
  photoBtnText: { fontSize: 14, fontWeight: "700", color: "#0a0e1a" },
  photoOutlineBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    backgroundColor: DARK_THEME.cardBg, borderWidth: 1, borderColor: DARK_THEME.borderColor,
  },
  photoOutlineBtnText: { fontSize: 13, fontWeight: "600" },

  // Preview + description
  photoPreviewMode: { gap: 14 },
  photoPreviewRow: { position: "relative" as any },
  photoPreview: {
    width: "100%", height: 200, borderRadius: 12,
  },
  photoRetakeBtn: {
    position: "absolute" as any, top: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(10,14,26,0.75)", paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 10,
  },
  photoRetakeText: { fontSize: 12, color: DARK_THEME.textSecondary },
  photoDescRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: DARK_THEME.inputBg, borderRadius: 12,
    borderWidth: 1, borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  photoDescInput: {
    flex: 1, fontSize: 13, color: DARK_THEME.textPrimary,
    minHeight: 44, textAlignVertical: "top",
  },
  textModeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  textModeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  textModeInput: {
    backgroundColor: DARK_THEME.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: DARK_THEME.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  analysingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  analysingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  analyseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  analyseBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resultSpark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resultSparklabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  confBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confText: {
    fontSize: 11,
    fontWeight: "600",
  },
  resultName: {
    fontFamily: "Georgia",
    fontSize: 18,
    color: DARK_THEME.textPrimary,
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  macroCell: {
    alignItems: "center",
    flex: 1,
  },
  macroCellValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  macroCellUnit: {
    fontSize: 10,
    color: DARK_THEME.textMuted,
  },
  macroCellLabel: {
    fontSize: 11,
    color: DARK_THEME.textSecondary,
    marginTop: 2,
  },
  breakdownWrap: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    gap: 6,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: DARK_THEME.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakdownName: {
    flex: 1,
    fontSize: 12,
    color: DARK_THEME.textSecondary,
  },
  breakdownMacros: {
    fontSize: 11,
    color: DARK_THEME.textMuted,
  },
  breakdownKcal: {
    fontSize: 12,
    minWidth: 56,
    textAlign: "right",
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 4,
  },
  insightText: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 17,
    marginTop: 12,
    marginBottom: 4,
  },
  resultActions: {
    flexDirection: "row",
    gap: 10,
  },
  discardBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: DARK_THEME.cardBg,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
  },
  discardText: {
    fontSize: 14,
    color: DARK_THEME.textSecondary,
  },
  addBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a0e1a",
  },
  manualTitle: {
    fontFamily: "Georgia",
    fontSize: 16,
    color: DARK_THEME.textPrimary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: DARK_THEME.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: DARK_THEME.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: DARK_THEME.textPrimary,
  },
  macroRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  macroInputCell: {
    width: "47%",
  },
  macroInput: {
    backgroundColor: DARK_THEME.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: DARK_THEME.textPrimary,
    textAlign: "center",
  },
});
