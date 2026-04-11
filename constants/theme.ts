import { GoalType } from "@/types";

export const ACCENT = "#FBD168";

export const GOAL_LABELS: Record<GoalType, string> = {
  wellness: "General Wellness",
  muscle: "Muscle Gain",
  weightloss: "Weight Loss",
  hormonal: "Hormonal Balance",
};

export const DARK_THEME = {
  bg: "#0a0e1a",
  bgSecondary: "#0f1525",
  cardBg: "rgba(255,255,255,0.03)",
  cardBgSolid: "#111827",
  textPrimary: "#f0eeff",
  textSecondary: "rgba(255,255,255,0.60)",
  textMuted: "rgba(255,255,255,0.40)",
  borderColor: "rgba(255,255,255,0.07)",
  inputBg: "rgba(255,255,255,0.06)",
};

export const TYPE = {
  xs: 10,    // micro labels, hints
  sm: 11,    // labels, captions
  md: 12,    // body, pills
  body: 13,  // default body text
  lg: 15,    // section titles, inputs
  xl: 18,    // screen titles
  xxl: 24,   // hero / app name
};

export const MACRO_COLORS = {
  protein: ACCENT,
  carbs:   ACCENT,
  fat:     ACCENT,
  water:   "#5B8DB8",
};
