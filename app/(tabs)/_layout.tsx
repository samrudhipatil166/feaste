import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME } from "@/constants/theme";

type TabName =
  | "index"
  | "log"
  | "today"
  | "plan"
  | "grocery";

const TAB_CONFIG: {
  name: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: "index",   label: "Home",    icon: "home-outline",      iconFocused: "home" },
  { name: "today",   label: "Today",   icon: "nutrition-outline", iconFocused: "nutrition" },
  { name: "log",     label: "Log",     icon: "camera-outline",   iconFocused: "camera" },
  { name: "plan",    label: "Plan",    icon: "calendar-outline", iconFocused: "calendar" },
  { name: "grocery", label: "Grocery", icon: "cart-outline",     iconFocused: "cart" },
];

export default function TabsLayout() {
  const accentColor = useAppStore((s) => DARK_THEME && s.accentColor());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: DARK_THEME.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {TAB_CONFIG.map(({ name, label, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? iconFocused : icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(10,14,26,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
});
