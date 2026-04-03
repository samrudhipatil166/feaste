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
    backgroundColor: DARK_THEME.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: glowColor
      ? `${glowColor}25`
      : DARK_THEME.borderColor,
    ...(noPadding ? {} : { padding: 16 }),
    shadowColor: glowColor ?? "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowColor ? 0.3 : 0,
    shadowRadius: 20,
    elevation: glowColor ? 8 : 0,
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
