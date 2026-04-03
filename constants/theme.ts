import { GoalType } from "@/types";

export const GOAL_COLORS: Record<GoalType, string> = {
  wellness: "#FBD168",
  muscle: "#4ECDC4",
  weightloss: "#FF6B6B",
  hormonal: "#C084FC",
};

export const GOAL_GLOWS: Record<GoalType, string> = {
  wellness: "rgba(251,209,104,0.15)",
  muscle: "rgba(78,205,196,0.15)",
  weightloss: "rgba(255,107,107,0.15)",
  hormonal: "rgba(192,132,252,0.15)",
};

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
  textSecondary: "#8b8a9e",
  textMuted: "#6b7194",
  borderColor: "rgba(255,255,255,0.06)",
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
  protein: "#6BA8A4",  // muted teal
  carbs: "#9B8EC4",    // muted lavender
  fat: "#C49A6C",      // muted amber
  water: "#5B8DB8",    // muted blue
};
