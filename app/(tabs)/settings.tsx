import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { GlowCard } from "@/components/GlowCard";

export default function SettingsScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const accentColor = useAppStore((s) => s.accentColor());

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleResetOnboarding = () => {
    setOnboarded(false);
    router.replace("/onboarding");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Your profile & preferences</Text>
        </Animated.View>

        {/* Profile summary */}
        <GlowCard glowColor={accentColor} style={styles.card}>
          <Text style={styles.sectionTitle}>Current Profile</Text>
          {[
            { label: "Goal", value: profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1) },
            { label: "Diet Style", value: profile.dietStyle },
            { label: "Calories", value: `${profile.calorieGoal} kcal` },
            { label: "Protein / Carbs / Fat", value: `${profile.proteinGoal}g / ${profile.carbsGoal}g / ${profile.fatGoal}g` },
            { label: "Cycle Length", value: `${profile.cycleLength} days` },
            { label: "Allergies", value: profile.allergies.join(", ") || "None" },
            { label: "Avoid foods", value: profile.dislikes.join(", ") || "None" },
            { label: "Conditions", value: profile.conditions.join(", ") || "None" },
          ].map((item) => (
            <View key={item.label} style={styles.profileRow}>
              <Text style={styles.profileLabel}>{item.label}</Text>
              <Text style={styles.profileValue}>{item.value}</Text>
            </View>
          ))}
        </GlowCard>

        {/* Actions */}
        <GlowCard style={styles.card}>
          {confirmReset ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>This will take you back through onboarding to update your preferences.</Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirmReset(false)} style={styles.confirmCancel}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleResetOnboarding} style={[styles.confirmAction, { backgroundColor: accentColor }]}>
                  <Text style={styles.confirmActionText}>Continue</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmReset(true)} style={styles.actionRow}>
              <Ionicons name="refresh-outline" size={20} color={accentColor} />
              <Text style={[styles.actionText, { color: DARK_THEME.textPrimary }]}>
                Update Profile & Preferences
              </Text>
              <Ionicons name="chevron-forward" size={16} color={DARK_THEME.textMuted} />
            </Pressable>
          )}
          <View style={styles.rowDivider} />
          <Pressable onPress={() => router.push("/period-log")} style={styles.actionRow}>
            <Ionicons name="calendar-outline" size={20} color={accentColor} />
            <Text style={styles.actionText}>Period Log</Text>
            <Ionicons name="chevron-forward" size={16} color={DARK_THEME.textMuted} />
          </Pressable>
          <View style={styles.rowDivider} />
          <Pressable onPress={() => router.push("/(tabs)/history")} style={styles.actionRow}>
            <Ionicons name="bar-chart-outline" size={20} color={accentColor} />
            <Text style={styles.actionText}>View History</Text>
            <Ionicons name="chevron-forward" size={16} color={DARK_THEME.textMuted} />
          </Pressable>
        </GlowCard>

        <GlowCard style={styles.card}>
          {confirmSignOut ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Are you sure you want to sign out?</Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirmSignOut(false)} style={styles.confirmCancel}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSignOut} style={[styles.confirmAction, { backgroundColor: "#f87171" }]}>
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
  scroll: { padding: 16, paddingTop: 12, paddingBottom: 40 },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  subtitle: { fontSize: 13, color: DARK_THEME.textSecondary, marginTop: 4, marginBottom: 20 },
  card: { marginBottom: 12 },
  sectionTitle: { fontFamily: "Georgia", fontSize: 14, color: DARK_THEME.textPrimary, marginBottom: 12 },
  profileRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  profileLabel: { fontSize: 13, color: DARK_THEME.textSecondary },
  profileValue: { fontSize: 13, color: DARK_THEME.textPrimary, fontWeight: "500", maxWidth: "60%", textAlign: "right" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  actionText: { flex: 1, fontSize: 14, color: DARK_THEME.textSecondary },
  rowDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.04)", marginVertical: 12 },
  confirmBox: { gap: 12 },
  confirmText: { fontSize: 13, color: DARK_THEME.textSecondary, lineHeight: 18 },
  confirmRow: { flexDirection: "row", gap: 8 },
  confirmCancel: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center" },
  confirmCancelText: { fontSize: 13, color: DARK_THEME.textSecondary },
  confirmAction: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  confirmActionText: { fontSize: 13, color: "#0a0e1a", fontWeight: "600" },
  version: { textAlign: "center", fontSize: 12, color: DARK_THEME.textMuted, marginTop: 24 },
});
