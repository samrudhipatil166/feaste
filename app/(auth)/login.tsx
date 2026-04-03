import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { supabase } from "@/lib/supabase";
import { DARK_THEME, GOAL_COLORS, TYPE } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const accentColor = GOAL_COLORS.wellness;

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      console.error("Login error:", error);
      setErrorMsg(error.message);
    }
    // Navigation handled by AuthGate in _layout
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo / Hero */}
          <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.hero}>
            <Text style={styles.heroEmoji}>🌸</Text>
            <Text style={styles.appName}>Feaste</Text>
            <Text style={styles.tagline}>Hormone-aware nutrition for women</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={DARK_THEME.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={DARK_THEME.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {errorMsg ? (
              <Text style={{ color: "#ff6b6b", marginBottom: 12, fontSize: 13 }}>{errorMsg}</Text>
            ) : null}

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, { backgroundColor: accentColor }]}
            >
              {loading ? (
                <ActivityIndicator color="#0a0e1a" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.push("/(auth)/signup")} style={styles.switchRow}>
              <Text style={styles.switchText}>
                Don't have an account?{" "}
                <Text style={{ color: accentColor }}>Sign up</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_THEME.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 80,
  },
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  appName: {
    fontFamily: "Georgia",
    fontSize: TYPE.xxl,
    color: DARK_THEME.textPrimary,
    fontWeight: "700",
  },
  tagline: {
    fontSize: TYPE.md,
    color: DARK_THEME.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: DARK_THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK_THEME.borderColor,
    padding: 20,
  },
  title: {
    fontFamily: "Georgia",
    fontSize: TYPE.xl,
    color: DARK_THEME.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPE.body,
    color: DARK_THEME.textSecondary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: TYPE.sm,
    color: DARK_THEME.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
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
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  buttonText: {
    fontSize: TYPE.lg,
    fontWeight: "700",
    color: "#0a0e1a",
  },
  switchRow: {
    alignItems: "center",
  },
  switchText: {
    fontSize: TYPE.md,
    color: DARK_THEME.textSecondary,
  },
});
