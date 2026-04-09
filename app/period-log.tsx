import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
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
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();
  const [startDay, setStartDay] = useState(todayD);
  const [startMonth, setStartMonth] = useState(todayM);
  const [startYear, setStartYear] = useState(todayY);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const startDateStr = `${startYear}-${String(startMonth + 1).padStart(2,"0")}-${String(startDay).padStart(2,"0")}`;

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

        {/* Start date — calendar grid */}
        <GlowCard style={styles.card}>
          <Text style={styles.sectionLabel}>When did it start?</Text>
          {(() => {
            const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
            const todayMidnight = new Date(todayY, todayM, todayD);
            const dates: Date[] = Array.from({ length: 36 }, (_, i) => {
              const d = new Date(todayMidnight);
              d.setDate(todayMidnight.getDate() - (35 - i));
              return d;
            });
            const firstDow = (dates[0].getDay() + 6) % 7;
            const padded: (Date | null)[] = [...Array(firstDow).fill(null), ...dates];
            const rows: (Date | null)[][] = [];
            for (let i = 0; i < padded.length; i += 7) rows.push(padded.slice(i, i + 7));
            const isSelected = (d: Date) =>
              d.getFullYear() === startYear && d.getMonth() === startMonth && d.getDate() === startDay;
            return (
              <View style={styles.calendarWrap}>
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
                      return (
                        <Pressable
                          key={ci}
                          onPress={() => {
                            setStartDay(d.getDate());
                            setStartMonth(d.getMonth());
                            setStartYear(d.getFullYear());
                          }}
                          style={[
                            styles.calendarCell,
                            sel && { backgroundColor: accentColor, borderRadius: 8 },
                            !sel && isToday && { borderWidth: 1, borderColor: `${accentColor}60`, borderRadius: 8 },
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
                  Selected: {String(startDay).padStart(2, "0")} {MONTHS[startMonth]} {startYear}
                </Text>
              </View>
            );
          })()}
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
  calendarWrap: {
    backgroundColor: DARK_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    padding: 10,
    gap: 2,
  },
  calendarRow: { flexDirection: "row" },
  calendarDow: {
    flex: 1, textAlign: "center", fontSize: 11,
    color: DARK_THEME.textMuted, paddingVertical: 4, fontWeight: "600",
  },
  calendarCell: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 5, minHeight: 36,
  },
  calendarDayText: { fontSize: 13, color: DARK_THEME.textPrimary },
  calendarMonthLabel: { fontSize: 8, color: DARK_THEME.textMuted, marginTop: 1 },
  calendarSelected: {
    fontSize: 12, color: DARK_THEME.textSecondary,
    textAlign: "center", marginTop: 8,
  },
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
