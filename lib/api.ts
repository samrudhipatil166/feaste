import { supabase } from "./supabase";

// All Claude API calls go through Supabase Edge Functions — never expose key in app

async function invokeWithRetry(
  fn: string,
  body: object,
  retries = 2,
): Promise<{ data: unknown; error: string | null }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabase.functions.invoke(fn, { body });
    if (error) {
      console.error(`[${fn}] invoke error (attempt ${attempt + 1}):`, error.message ?? error);
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); continue; }
      return { data: null, error: error.message ?? "Invoke failed" };
    }
    if (data?.ok === false) {
      console.error(`[${fn}] function error (attempt ${attempt + 1}):`, data.error);
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); continue; }
      return { data: null, error: data.error ?? "Function failed" };
    }
    return { data, error: null };
  }
  return { data: null, error: "Max retries exceeded" };
}

export interface IngredientItem {
  name: string;     // "Rolled oats (~80g)"
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
  calories: number; // computed from macros
  visible?: "clear" | "partial" | "inferred";
}

// Keep for backward compatibility
export type MealBreakdownItem = IngredientItem;

export interface MealAnalysis {
  name: string;
  calories: number; // computed from macros
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  confidence: number;
  ingredients: IngredientItem[];
  phaseNote?: string;
  phaseBadge?: string;
  isNutritionLabel?: boolean;
  servingSize?: string; // e.g. "30g" or "1 cup (240ml)"
}

export async function analyzeMeal(input: {
  type: "text" | "voice";
  description: string;
  phase?: string;
}): Promise<MealAnalysis | null> {
  const { data, error } = await invokeWithRetry("analyze-meal", {
    type: input.type,
    description: input.description,
    phase: input.phase,
  });
  if (error) { console.error("analyze-meal error:", error); return null; }
  return data as MealAnalysis;
}

export async function analyzeMealPhoto(
  base64Image: string,
  description?: string,
  phase?: string,
): Promise<MealAnalysis | null> {
  const { data, error } = await invokeWithRetry("analyze-meal", {
    type: "photo",
    image: base64Image,
    ...(description?.trim() ? { description } : {}),
    phase,
  });
  if (error) { console.error("analyze-meal-photo error:", error); return null; }
  return data as MealAnalysis;
}

export async function generateDailyPlan(context: {
  goal: string;
  conditions: string[];
  phase: string;
  dietStyle: string;
  allergies: string[];
  cuisines: string[];
  cookingTime: string;
  calorieGoal: number;
}): Promise<{ meals: object[] } | null> {
  const { data, error } = await supabase.functions.invoke(
    "generate-meal-plan",
    { body: { ...context, type: "daily" } }
  );
  if (error) {
    console.error("generate-meal-plan error:", error);
    return null;
  }
  return data;
}

export async function generateWeeklyPlan(context: {
  goal: string;
  conditions: string[];
  phases: string[];
  dietStyle: string;
  allergies: string[];
  cuisines: string[];
  cookingTime: string;
  calorieGoal: number;
}): Promise<{ days: object[] } | null> {
  const { data, error } = await supabase.functions.invoke(
    "generate-meal-plan",
    { body: { ...context, type: "weekly" } }
  );
  if (error) {
    console.error("generate-weekly-plan error:", error);
    return null;
  }
  return data;
}
