import { GoalType } from "@/types";

export const GOAL_COLORS: Record<GoalType, string> = {
  wellness:   "#F5C842",  // warm gold
  muscle:     "#5B9FE8",  // steel blue (not teal)
  weightloss: "#F07058",  // coral-red
  hormonal:   "#B47FE8",  // soft purple
};

export const GOAL_GLOWS: Record<GoalType, string> = {
  wellness:   "rgba(245,200,66,0.12)",
  muscle:     "rgba(91,159,232,0.12)",
  weightloss: "rgba(240,112,88,0.12)",
  hormonal:   "rgba(180,127,232,0.12)",
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

// Vibrant fills only — never used as font color
export const MACRO_COLORS = {
  protein: "#6BA8A4",  // teal
  carbs:   "#9B8EC4",  // lavender
  fat:     "#C49A6C",  // amber
  water:   "#5B8DB8",  // blue
};
