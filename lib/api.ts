import { supabase } from "./supabase";

// All Claude API calls go through Supabase Edge Functions — never expose key in app

export async function analyzeMeal(input: {
  type: "text" | "voice";
  description: string;
}): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
} | null> {
  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: { type: input.type, description: input.description },
  });
  if (error) {
    console.error("analyze-meal error:", error);
    return null;
  }
  return data;
}

export async function analyzeMealPhoto(base64Image: string, description?: string): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
} | null> {
  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: { type: "photo", image: base64Image, ...(description?.trim() ? { description } : {}) },
  });
  if (error) {
    console.error("analyze-meal-photo error:", error);
    return null;
  }
  return data;
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
