import React from "react";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { DARK_THEME } from "@/constants/theme";

interface GlowCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  onPress?: () => void;
  delay?: number;
  noPadding?: boolean;
}

export function GlowCard({
  children,
  style,
  glowColor,
  onPress,
  delay = 0,
  noPadding = false,
}: GlowCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 15 });
  };

  const cardStyle: ViewStyle = {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    ...(noPadding ? {} : { padding: 16 }),
  };

  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay * 1000).duration(350).springify()}
      style={[cardStyle, animatedStyle, style]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {content}
    </Pressable>
  );
}
