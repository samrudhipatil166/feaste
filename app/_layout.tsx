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
  const updateProfile = useAppStore((s) => s.updateProfile);
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const lastPeriodDate = useAppStore((s) => s.profile.lastPeriodDate);

  // Sync lastPeriodDate to Supabase user metadata whenever it changes locally
  useEffect(() => {
    if (!lastPeriodDate) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.auth.updateUser({ data: { lastPeriodDate } });
    });
  }, [lastPeriodDate]);

  useEffect(() => {
    if (!hasHydrated) return;

    function isOnboarded(session: any) {
      return session?.user?.user_metadata?.onboarded === true ||
        useAppStore.getState().onboarded;
    }

    // Load lastPeriodDate from Supabase metadata, taking whichever is more recent
    function loadPeriodDateFromMeta(session: any) {
      const metaDate = session?.user?.user_metadata?.lastPeriodDate;
      if (!metaDate) return;
      const localDate = useAppStore.getState().profile.lastPeriodDate;
      if (!localDate || metaDate > localDate) {
        updateProfile({ lastPeriodDate: metaDate });
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuthGroup = segments[0] === "(auth)";
      if (!session) {
        if (!inAuthGroup) router.replace("/(auth)/login");
      } else {
        setUserId(session.user.id);
        loadPeriodDateFromMeta(session);
        if (!isOnboarded(session)) {
          router.replace("/onboarding");
        } else if (inAuthGroup || segments[0] === "onboarding") {
          router.replace("/(tabs)");
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // USER_UPDATED fires when we call updateUser to save metadata — skip routing
        if (_event === "USER_UPDATED") return;
        if (!session) {
          setUserId(null);
          router.replace("/(auth)/login");
        } else {
          setUserId(session.user.id);
          loadPeriodDateFromMeta(session);
          if (!isOnboarded(session)) {
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
