import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
 
  Alert,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, TYPE } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { PeriodLog } from "@/types";

const FLOW_OPTIONS: { key: PeriodLog["flow"]; label: string; emoji: string }[] = [
  { key: "light", label: "Light", emoji: "💧" },
  { key: "medium", label: "Medium", emoji: "💧💧" },
  { key: "heavy", label: "Heavy", emoji: "💧💧💧" },
  { key: "very_heavy", label: "Very heavy", emoji: "🌊" },
];

const SYMPTOMS = [
  "Cramps", "Bloating", "Fatigue", "Headache", "Mood swings",
  "Breast tenderness", "Back pain", "Nausea", "Spotting",
];

export default function PeriodLogScreen() {
  const router = useRouter();
  const addPeriodLog = useAppStore((s) => s.addPeriodLog);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const periodLogs = useAppStore((s) => s.periodLogs);
  const accentColor = useAppStore((s) => s.accentColor());

  const [flow, setFlow] = useState<PeriodLog["flow"]>("medium");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const today = new Date();
  const [startDay, setStartDay] = useState(today.getDate());
  const [startMonth, setStartMonth] = useState(today.getMonth());
  const [startYear, setStartYear] = useState(today.getFullYear());

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const daysInMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const startDateStr = `${startYear}-${String(startMonth + 1).padStart(2,"0")}-${String(startDay).padStart(2,"0")}`;

  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const maxDay = (startYear === todayY && startMonth === todayM) ? todayD : daysInMonth;
  const maxMonth = startYear === todayY ? todayM : 11;

  const incDay = () => setStartDay((d) => {
    const next = d < daysInMonth ? d + 1 : 1;
    return next > maxDay ? 1 : next;
  });
  const decDay = () => setStartDay((d) => (d > 1 ? d - 1 : maxDay));

  const incMonth = () => {
    const next = (startMonth + 1) % 12;
    if (next > maxMonth) return;
    setStartMonth(next);
    if (startYear === todayY && next === todayM && startDay > todayD) setStartDay(todayD);
  };
  const decMonth = () => setStartMonth((m) => (m > 0 ? m - 1 : 0));

  const incYear = () => { if (startYear < todayY) setStartYear((y) => y + 1); };
  const decYear = () => setStartYear((y) => y - 1);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleLog = () => {
    const now = new Date();
    const start = new Date(startYear, startMonth, startDay);
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = Math.max(1, diffDays + 1);

    const log: PeriodLog = {
      id: Date.now().toString(),
      startDate: startDateStr,
      flow,
      symptoms,
    };
    const isoDate = `${startYear}-${String(startMonth + 1).padStart(2,"0")}-${String(startDay).padStart(2,"0")}`;
    addPeriodLog(log);
    updateProfile({ cycleDay, lastPeriodDate: isoDate });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={24} color={DARK_THEME.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Period Log</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.emoji}>🌺</Text>
          <Text style={styles.title}>Log your period</Text>
          <Text style={styles.subtitle}>
            We'll reset your cycle day and adjust your phase tracking
          </Text>
        </Animated.View>

        {/* Flow */}
        <GlowCard style={styles.card}>
          <Text style={styles.sectionLabel}>Flow heaviness</Text>
          <View style={styles.flowRow}>
            {FLOW_OPTIONS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFlow(f.key)}
                style={[
                  styles.flowBtn,
                  flow === f.key && {
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}60`,
                  },
                ]}
              >
                <Text style={styles.flowEmoji}>{f.emoji}</Text>
                <Text
                  style={[
                    styles.flowLabel,
                    flow === f.key && { color: accentColor },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlowCard>

        {/* Symptoms */}
        <GlowCard style={styles.card}>
          <Text style={styles.sectionLabel}>Symptoms (optional)</Text>
          <View style={styles.symptomWrap}>
            {SYMPTOMS.map((s) => (
              <Pressable
                key={s}
                onPress={() => toggleSymptom(s)}
                style={[
                  styles.symptomPill,
                  symptoms.includes(s) && {
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}60`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.symptomText,
                    symptoms.includes(s) && { color: accentColor },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlowCard>

        {/* Start date */}
        <GlowCard style={styles.card}>
          <Text style={styles.sectionLabel}>When did it start?</Text>
          <View style={styles.dateRow}>
            {/* Day */}
            <View style={styles.dateCol}>
              <Pressable onPress={incDay} style={styles.dateArrow}>
                <Ionicons name="chevron-up" size={16} color={accentColor} />
              </Pressable>
              <View style={[styles.dateCell, { borderColor: accentColor }]}>
                <Text style={styles.dateCellText}>{String(startDay).padStart(2,"0")}</Text>
              </View>
              <Pressable onPress={decDay} style={styles.dateArrow}>
                <Ionicons name="chevron-down" size={16} color={accentColor} />
              </Pressable>
              <Text style={styles.dateLabel}>DD</Text>
            </View>

            <Text style={styles.dateSep}>–</Text>

            {/* Month */}
            <View style={styles.dateCol}>
              <Pressable onPress={incMonth} style={styles.dateArrow}>
                <Ionicons name="chevron-up" size={16} color={accentColor} />
              </Pressable>
              <View style={[styles.dateCell, { borderColor: accentColor }]}>
                <Text style={styles.dateCellText}>{MONTHS[startMonth]}</Text>
              </View>
              <Pressable onPress={decMonth} style={styles.dateArrow}>
                <Ionicons name="chevron-down" size={16} color={accentColor} />
              </Pressable>
              <Text style={styles.dateLabel}>MON</Text>
            </View>

            <Text style={styles.dateSep}>–</Text>

            {/* Year */}
            <View style={styles.dateCol}>
              <Pressable onPress={incYear} style={styles.dateArrow}>
                <Ionicons name="chevron-up" size={16} color={accentColor} />
              </Pressable>
              <View style={[styles.dateCell, { borderColor: accentColor }]}>
                <Text style={styles.dateCellText}>{startYear}</Text>
              </View>
              <Pressable onPress={decYear} style={styles.dateArrow}>
                <Ionicons name="chevron-down" size={16} color={accentColor} />
              </Pressable>
              <Text style={styles.dateLabel}>YYYY</Text>
            </View>
          </View>
        </GlowCard>

        {/* Past logs */}
        {periodLogs.length > 0 && (
          <View>
            <Text style={styles.pastTitle}>Past Logs</Text>
            {periodLogs.slice(0, 5).map((log) => (
              <GlowCard key={log.id} style={[styles.card, { padding: 12 }]}>
                <View style={styles.pastRow}>
                  <View>
                    <Text style={styles.pastDate}>{log.startDate}</Text>
                    <Text style={styles.pastFlow}>{log.flow} flow</Text>
                  </View>
                  {log.symptoms.length > 0 && (
                    <Text style={styles.pastSymptoms}>
                      {log.symptoms.slice(0, 2).join(", ")}
                      {log.symptoms.length > 2 ? ` +${log.symptoms.length - 2}` : ""}
                    </Text>
                  )}
                </View>
              </GlowCard>
            ))}
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={handleLog}
          style={[styles.logBtn, { backgroundColor: accentColor }]}
        >
          <Ionicons name="add" size={18} color="#0a0e1a" />
          <Text style={styles.logBtnText}>Log Period</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_THEME.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DARK_THEME.borderColor,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontFamily: "Georgia", fontSize: 16, color: DARK_THEME.textPrimary },
  scroll: { padding: 16, paddingTop: 8 },
  emoji: { fontSize: 36, marginBottom: 8 },
  title: { fontFamily: "Georgia", fontSize: 22, color: DARK_THEME.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, color: DARK_THEME.textSecondary, marginBottom: 20 },
  card: { marginBottom: 12 },
  sectionLabel: { fontSize: 13, color: DARK_THEME.textSecondary, marginBottom: 12, fontWeight: "600" },
  flowRow: { flexDirection: "row", gap: 8 },
  flowBtn: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14,
    backgroundColor: DARK_THEME.cardBg, borderWidth: 1, borderColor: DARK_THEME.borderColor, gap: 4,
  },
  flowEmoji: { fontSize: 16 },
  flowLabel: { fontSize: 12, color: DARK_THEME.textSecondary, fontWeight: "500" },
  symptomWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  symptomPill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: DARK_THEME.cardBg, borderWidth: 1, borderColor: DARK_THEME.borderColor,
  },
  symptomText: { fontSize: 12, color: DARK_THEME.textSecondary },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  dateCol: { flex: 1, alignItems: "center", gap: 4 },
  dateArrow: { padding: 4 },
  dateCell: {
    width: "100%", paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, backgroundColor: DARK_THEME.inputBg, alignItems: "center",
  },
  dateCellText: { fontSize: 14, fontWeight: "700", color: DARK_THEME.textPrimary },
  dateSep: { fontSize: 16, color: DARK_THEME.textMuted, marginBottom: 20 },
  dateLabel: { fontSize: 10, color: DARK_THEME.textMuted, letterSpacing: 0.5 },
  pastTitle: { fontFamily: "Georgia", fontSize: 14, color: DARK_THEME.textPrimary, marginBottom: 8 },
  pastRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pastDate: { fontSize: 13, color: DARK_THEME.textPrimary },
  pastFlow: { fontSize: 11, color: DARK_THEME.textMuted, marginTop: 2, textTransform: "capitalize" },
  pastSymptoms: { fontSize: 11, color: DARK_THEME.textSecondary },
  logBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16, marginTop: 8,
  },
  logBtnText: { fontSize: 16, fontWeight: "700", color: "#0a0e1a" },
});
