export type GoalType = "wellness" | "muscle" | "weightloss" | "hormonal";
export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  date: string; // ISO YYYY-MM-DD — used to filter to today only
  meal: MealType;
  source?: "manual" | "photo" | "voice" | "text" | "ai";
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

export interface Vitamin {
  id: string;
  name: string;
  reason: string;
  dosage?: string;
  timing?: string;
  checked: boolean;
}

export interface PeriodLog {
  id: string;
  startDate: string;
  endDate?: string;
  flow: "light" | "medium" | "heavy" | "very_heavy";
  symptoms: string[];
}

export interface DailyPlan {
  meal: string;
  time: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
}

export interface WeeklyPlanDay {
  date: string;
  phase: CyclePhase;
  meals: { meal: string; name: string; calories: number; emoji: string }[];
}

export interface UserProfile {
  id: string | null;
  goal: GoalType;
  conditions: string[];
  cycleLength: number;
  cycleDay: number;
  lastPeriodDate: string | null; // ISO date string YYYY-MM-DD
  allergies: string[];
  dietStyle: string;
  cuisines: string[];
  dislikes: string[];
  cookingTime: string;
  mealsPerDay: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}
