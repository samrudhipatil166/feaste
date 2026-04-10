import { supabase } from "./supabase";

// All Claude API calls go through Supabase Edge Functions — never expose key in app

async function invokeWithRetry(
  fn: string,
  body: object,
  retries = 2,
): Promise<{ data: unknown; error: unknown }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabase.functions.invoke(fn, { body });
    if (!error && !data?.error) return { data, error: null };
    if (attempt < retries) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    else return { data, error };
  }
  return { data: null, error: new Error("Max retries exceeded") };
}

export interface MealBreakdownItem {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealAnalysis {
  name: string;
  calories?: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  breakdown?: MealBreakdownItem[];
}

export async function analyzeMeal(input: {
  type: "text" | "voice";
  description: string;
}): Promise<MealAnalysis | null> {
  const { data, error } = await invokeWithRetry("analyze-meal", {
    type: input.type, description: input.description,
  });
  if (error) { console.error("analyze-meal error:", error); return null; }
  return data as MealAnalysis;
}

export async function analyzeMealPhoto(base64Image: string, description?: string): Promise<MealAnalysis | null> {
  const { data, error } = await invokeWithRetry("analyze-meal", {
    type: "photo", image: base64Image, ...(description?.trim() ? { description } : {}),
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
