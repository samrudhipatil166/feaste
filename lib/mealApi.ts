import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { CyclePhase } from "@/types";

// Cache keyed by ISO week (YYYY-WW) so it auto-regenerates every Monday
const CACHE_KEY_PREFIX = "meal_library_week_";
// Rolling history of meal names used in previous weeks (capped at 4 weeks)
const HISTORY_KEY = "used_meal_names_v1";
const MAX_HISTORY_WEEKS = 4;

// ── Types ──────────────────────────────────────────────────────────────────────

export type MealSlot = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export type ApiMeal = {
  meal: MealSlot;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
  cookTime: string;
  cookTimeMinutes: number;
  cuisine: string[];
  allergens: string[];
  dietary: string[];
  phases: CyclePhase[] | "all";
  insight: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
  proTip: string;
};

type WeekCache = {
  meals: ApiMeal[];
  week: string; // ISO week key e.g. "2026-W14"
};

type MealHistory = {
  // week key → meal names used that week
  weeks: Record<string, string[]>;
};

// ── Week key ───────────────────────────────────────────────────────────────────

function getISOWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // ISO week: week containing Thursday, starting Monday
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function detectAllergens(ingredients: string[]): string[] {
  const text = ingredients.join(" ").toLowerCase();
  const allergenMap: Record<string, string> = {
    milk: "Dairy", cheese: "Dairy", cream: "Dairy", butter: "Dairy", yogurt: "Dairy",
    egg: "Eggs", gluten: "Gluten", wheat: "Gluten", flour: "Gluten",
    peanut: "Peanuts", almond: "Nuts", walnut: "Nuts", cashew: "Nuts", pecan: "Nuts",
    soy: "Soy", tofu: "Soy", sesame: "Sesame", tahini: "Sesame",
    shrimp: "Shellfish", crab: "Shellfish", lobster: "Shellfish",
    salmon: "Fish", tuna: "Fish", cod: "Fish", tilapia: "Fish",
  };
  const found = new Set<string>();
  Object.entries(allergenMap).forEach(([keyword, allergen]) => {
    if (text.includes(keyword)) found.add(allergen);
  });
  return Array.from(found);
}

function mealEmoji(slot: MealSlot, cuisines: string[]): string {
  if (slot === "Breakfast") return "🍳";
  if (slot === "Snack") return "🥗";
  const cuisineEmojis: Record<string, string> = {
    Italian: "🍝", Japanese: "🍱", Mexican: "🌮", Indian: "🍛",
    Mediterranean: "🫙", Chinese: "🥢", Thai: "🍜", American: "🍔",
    "Middle Eastern": "🧆", Greek: "🫒",
  };
  for (const c of cuisines) {
    if (cuisineEmojis[c]) return cuisineEmojis[c];
  }
  return slot === "Lunch" ? "🥙" : "🍽️";
}

function mapClaudeMeal(raw: any): ApiMeal | null {
  try {
    const protein = Math.round(raw.protein ?? 0);
    const carbs = Math.round(raw.carbs ?? 0);
    const fat = Math.round(raw.fat ?? 0);
    const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
    const cookTimeMinutes = raw.cookTimeMinutes ?? 30;
    const cuisine: string[] = Array.isArray(raw.cuisine) ? raw.cuisine : ["International"];
    const dietary: string[] = Array.isArray(raw.dietary) ? raw.dietary : [];
    const phases: CyclePhase[] | "all" =
      raw.phases === "all" || !Array.isArray(raw.phases) || raw.phases.length === 0
        ? "all"
        : raw.phases;
    const ingredients: string[] = Array.isArray(raw.ingredients) ? raw.ingredients : [];
    const steps: string[] = Array.isArray(raw.steps) ? raw.steps : [];

    return {
      meal: raw.meal as MealSlot,
      name: raw.name,
      description: raw.description ?? "",
      calories,
      protein,
      carbs,
      fat,
      emoji: mealEmoji(raw.meal as MealSlot, cuisine),
      cookTime: `${cookTimeMinutes} min`,
      cookTimeMinutes,
      cuisine,
      allergens: detectAllergens(ingredients),
      dietary,
      phases,
      insight: raw.insight ?? "",
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      ingredients,
      steps: steps.length ? steps : ["Prepare ingredients.", "Cook following standard method.", "Season and serve."],
      proTip: raw.proTip ?? "Prep ingredients the night before to save time.",
    };
  } catch {
    return null;
  }
}

// ── History helpers ────────────────────────────────────────────────────────────

async function loadHistory(): Promise<MealHistory> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as MealHistory;
  } catch {}
  return { weeks: {} };
}

async function saveHistory(history: MealHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function getExcludedMealNames(history: MealHistory, currentWeek: string): string[] {
  const allNames = new Set<string>();
  for (const [week, names] of Object.entries(history.weeks)) {
    if (week !== currentWeek) {
      names.forEach((n) => allNames.add(n));
    }
  }
  return Array.from(allNames);
}

function pruneHistory(history: MealHistory, currentWeek: string): MealHistory {
  // Keep only the most recent MAX_HISTORY_WEEKS weeks (excluding current)
  const weeks = Object.keys(history.weeks)
    .filter((w) => w !== currentWeek)
    .sort()
    .slice(-MAX_HISTORY_WEEKS);
  const pruned: Record<string, string[]> = {};
  for (const w of weeks) pruned[w] = history.weeks[w];
  if (history.weeks[currentWeek]) pruned[currentWeek] = history.weeks[currentWeek];
  return { weeks: pruned };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function fetchMealLibrary(options: {
  diet?: string;
  allergies?: string[];
  cuisines?: string[];
  forceRefresh?: boolean;
}): Promise<ApiMeal[]> {
  const { diet = "", allergies = [], cuisines = [], forceRefresh = false } = options;
  const currentWeek = getISOWeekKey();
  const cacheKey = `${CACHE_KEY_PREFIX}${currentWeek}`;

  // Return cached library if it's for the current week
  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const entry: WeekCache = JSON.parse(cached);
        if (entry.week === currentWeek) return entry.meals;
      }
    } catch {}
  }

  // Load history and build exclusion list
  const history = await loadHistory();
  const excludeMeals = getExcludedMealNames(history, currentWeek);

  const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
    body: { diet, cuisines, allergies, excludeMeals },
  });

  if (error || !data?.meals) {
    console.error("generate-meal-plan error:", error);
    return [];
  }

  const meals: ApiMeal[] = (data.meals as any[])
    .map(mapClaudeMeal)
    .filter(Boolean) as ApiMeal[];

  // Persist cache for this week
  try {
    const entry: WeekCache = { meals, week: currentWeek };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {}

  // Update history: record this week's meal names, then prune
  const updatedHistory = pruneHistory(
    { weeks: { ...history.weeks, [currentWeek]: meals.map((m) => m.name) } },
    currentWeek,
  );
  await saveHistory(updatedHistory);

  return meals;
}

export async function clearMealCache(): Promise<void> {
  const currentWeek = getISOWeekKey();
  await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${currentWeek}`);
}
