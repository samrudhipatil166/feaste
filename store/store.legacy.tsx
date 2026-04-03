import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type GoalType = "wellness" | "muscle" | "weightloss" | "hormonal";
export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";
export type ThemeMode = "dark" | "light";

export const goalColors: Record<GoalType, string> = {
  wellness: "#f5c563",
  muscle: "#5eead4",
  weightloss: "#f472b6",
  hormonal: "#a78bfa",
};

export const goalGlows: Record<GoalType, string> = {
  wellness: "rgba(245,197,99,0.15)",
  muscle: "rgba(94,234,212,0.15)",
  weightloss: "rgba(244,114,182,0.15)",
  hormonal: "rgba(167,139,250,0.15)",
};

export const goalLabels: Record<GoalType, string> = {
  wellness: "General Wellness",
  muscle: "Muscle Gain",
  weightloss: "Weight Loss",
  hormonal: "Hormonal Balance",
};

export const phaseInfo: Record<CyclePhase, { emoji: string; label: string; color: string; foodFocus: string[]; eat: string[]; avoid: string[] }> = {
  menstrual: {
    emoji: "🌺", label: "Menstrual Phase", color: "#f472b6",
    foodFocus: ["Iron-rich", "Anti-inflammatory", "Warming foods"],
    eat: ["Dark leafy greens", "Red meat or lentils", "Dark chocolate", "Ginger tea", "Salmon", "Sweet potatoes"],
    avoid: ["Excess caffeine", "Alcohol", "Processed sugar", "Very salty foods"],
  },
  follicular: {
    emoji: "🌱", label: "Follicular Phase", color: "#5eead4",
    foodFocus: ["Light & fresh", "Fermented foods", "Lean protein"],
    eat: ["Sprouted grains", "Avocado", "Eggs", "Kimchi & sauerkraut", "Citrus fruits", "Chicken"],
    avoid: ["Heavy fried foods", "Excess dairy", "Refined carbs"],
  },
  ovulatory: {
    emoji: "✨", label: "Ovulatory Phase", color: "#f5c563",
    foodFocus: ["Fiber-rich", "Antioxidants", "Light carbs"],
    eat: ["Quinoa", "Berries", "Raw vegetables", "Flaxseeds", "Wild fish", "Bell peppers"],
    avoid: ["Excess alcohol", "Processed foods", "Trans fats"],
  },
  luteal: {
    emoji: "🌙", label: "Luteal Phase", color: "#a78bfa",
    foodFocus: ["Magnesium-rich", "Complex carbs", "Serotonin-boosting"],
    eat: ["Brown rice", "Turkey", "Dark chocolate", "Bananas", "Chickpeas", "Pumpkin seeds"],
    avoid: ["Excess sugar", "Caffeine overload", "Carbonated drinks", "Artificial sweeteners"],
  },
};

export const phaseOrder: CyclePhase[] = ["menstrual", "follicular", "ovulatory", "luteal"];

export function getPhaseForDay(day: number, cycleLength: number): CyclePhase {
  const pct = day / cycleLength;
  if (pct <= 0.18) return "menstrual";
  if (pct <= 0.5) return "follicular";
  if (pct <= 0.6) return "ovulatory";
  return "luteal";
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface AppState {
  onboarded: boolean;
  goal: GoalType;
  conditions: string[];
  cycleLength: number;
  cycleDay: number;
  currentPhase: CyclePhase;
  allergies: string[];
  dietStyle: string;
  cuisines: string[];
  dislikes: string[];
  cookingTime: string;
  waterGlasses: number;
  foodLog: FoodEntry[];
  groceryItems: { id: string; name: string; category: string; checked: boolean; isStaple?: boolean }[];
  vitamins: { id: string; name: string; reason: string; checked: boolean }[];
  periodLogs: { startDate: string; endDate: string; flow: string; symptoms: string[] }[];
  weeklyCalories: number[];
  weeklyMealOverrides: Record<string, string>; // key: "day-idx", value: meal id from directory
  theme: ThemeMode;
  streak: number;
  calGoalHit: boolean;
  vitaminsComplete: boolean;
}

const defaultFoodLog: FoodEntry[] = [
  { id: "1", name: "Greek Yogurt Bowl", calories: 320, protein: 24, carbs: 38, fat: 8, time: "8:30 AM", meal: "breakfast" },
  { id: "2", name: "Grilled Chicken Salad", calories: 480, protein: 42, carbs: 22, fat: 18, time: "12:45 PM", meal: "lunch" },
  { id: "3", name: "Handful of Almonds", calories: 165, protein: 6, carbs: 6, fat: 14, time: "3:00 PM", meal: "snack" },
];

const defaultGrocery = [
  { id: "1", name: "Salmon fillets", category: "Protein", checked: false },
  { id: "2", name: "Greek yogurt", category: "Dairy", checked: true },
  { id: "3", name: "Spinach", category: "Vegetables", checked: false },
  { id: "4", name: "Sweet potatoes", category: "Vegetables", checked: false },
  { id: "5", name: "Quinoa", category: "Grains", checked: true },
  { id: "6", name: "Blueberries", category: "Fruits", checked: false },
  { id: "7", name: "Eggs (dozen)", category: "Protein", checked: false },
  { id: "8", name: "Avocados", category: "Fruits", checked: false },
  { id: "9", name: "Flaxseed", category: "Seeds & Nuts", checked: true },
  { id: "10", name: "Dark chocolate 85%", category: "Treats", checked: false },
  { id: "11", name: "Almond butter", category: "Seeds & Nuts", checked: false },
  { id: "12", name: "Brown rice", category: "Grains", checked: false },
];

const defaultVitamins = [
  { id: "1", name: "Vitamin D3", reason: "Hormonal regulation & mood support", checked: false },
  { id: "2", name: "Magnesium Glycinate", reason: "Luteal phase cramp relief", checked: true },
  { id: "3", name: "Omega-3 (EPA/DHA)", reason: "Anti-inflammatory, brain health", checked: false },
  { id: "4", name: "Iron + Vitamin C", reason: "Menstrual phase replenishment", checked: false },
  { id: "5", name: "B-Complex", reason: "Energy & hormonal metabolism", checked: false },
  { id: "6", name: "Zinc", reason: "Immune & reproductive health", checked: true },
  { id: "7", name: "Probiotics", reason: "Gut-hormone axis support", checked: false },
];

const defaultState: AppState = {
  onboarded: false,
  goal: "wellness",
  conditions: [],
  cycleLength: 28,
  cycleDay: 14,
  currentPhase: "ovulatory",
  allergies: ["Gluten"],
  dietStyle: "Balanced",
  cuisines: ["Mediterranean", "Asian"],
  dislikes: [],
  cookingTime: "30 min",
  waterGlasses: 5,
  foodLog: defaultFoodLog,
  groceryItems: defaultGrocery,
  vitamins: defaultVitamins,
  periodLogs: [],
  weeklyCalories: [1850, 1920, 1780, 2100, 1950, 1680, 965],
  weeklyMealOverrides: {},
  theme: "dark",
  streak: 12,
  calGoalHit: false,
  vitaminsComplete: false,
};

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  accentColor: string;
  glowColor: string;
  bg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
  inputBg: string;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const accentColor = goalColors[state.goal];
  const glowColor = goalGlows[state.goal];

  const isDark = state.theme === "dark";
  const bg = isDark ? "#0a0e1a" : "#f5f3ef";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const textPrimary = isDark ? "white" : "#1a1a2e";
  const textSecondary = isDark ? "#8b8a9e" : "#6b6b7b";
  const textMuted = isDark ? "#6b7194" : "#9b9bab";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  // Sync phase with cycle day
  useEffect(() => {
    const phase = getPhaseForDay(state.cycleDay, state.cycleLength);
    if (phase !== state.currentPhase) {
      setState((p) => ({ ...p, currentPhase: phase }));
    }
  }, [state.cycleDay, state.cycleLength]);

  return (
    <AppContext.Provider value={{ state, setState, accentColor, glowColor, bg, cardBg, textPrimary, textSecondary, textMuted, borderColor, inputBg }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}