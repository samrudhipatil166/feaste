import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const setUserId = useAppStore((s) => s.setUserId);
  const onboarded = useAppStore((s) => s.onboarded);
  const hasHydrated = useAppStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return; // wait for store to load from storage

    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuthGroup = segments[0] === "(auth)";
      if (!session) {
        if (!inAuthGroup) router.replace("/(auth)/login");
      } else {
        setUserId(session.user.id);
        if (!onboarded) {
          router.replace("/onboarding");
        } else if (inAuthGroup || segments[0] === "onboarding") {
          router.replace("/(tabs)");
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setUserId(null);
          router.replace("/(auth)/login");
        } else {
          setUserId(session.user.id);
          if (!onboarded) {
            router.replace("/onboarding");
          } else {
            router.replace("/(tabs)");
          }
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [hasHydrated]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="period-log" options={{ presentation: "modal" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
