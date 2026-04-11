import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoalType,
  CyclePhase,
  FoodEntry,
  GroceryItem,
  Vitamin,
  PeriodLog,
  UserProfile,
} from "@/types";
import { getPhaseForDay, getPhaseForDayIrregular, DEFAULT_VITAMINS } from "@/constants/cycle";
import { ACCENT } from "@/constants/theme";

const DEFAULT_GROCERY: GroceryItem[] = [
  { id: "1", name: "Salmon fillets", category: "Protein", checked: false },
  { id: "2", name: "Greek yogurt", category: "Dairy", checked: false },
  { id: "3", name: "Spinach", category: "Vegetables", checked: false },
  { id: "4", name: "Sweet potatoes", category: "Vegetables", checked: false },
  { id: "5", name: "Quinoa", category: "Grains", checked: false },
  { id: "6", name: "Blueberries", category: "Fruits", checked: false },
  { id: "7", name: "Eggs (dozen)", category: "Protein", checked: false },
  { id: "8", name: "Avocados", category: "Fruits", checked: false },
  { id: "9", name: "Flaxseed", category: "Seeds & Nuts", checked: false },
  { id: "10", name: "Dark chocolate 85%", category: "Treats", checked: false },
];

interface AppStore {
  // ── Auth & onboarding ──────────────────────────────────────────────────────
  userId: string | null;
  onboarded: boolean;
  privacyAccepted: boolean;
  _hasHydrated: boolean;
  setUserId: (id: string | null) => void;
  setOnboarded: (v: boolean) => void;
  setPrivacyAccepted: () => void;
  setHasHydrated: (v: boolean) => void;

  // ── Profile ────────────────────────────────────────────────────────────────
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // ── Cycle ──────────────────────────────────────────────────────────────────
  currentPhase: CyclePhase;
  refreshPhase: () => void;

  // ── Today ──────────────────────────────────────────────────────────────────
  waterGlasses: number;
  setWater: (n: number) => void;

  // ── Food log ───────────────────────────────────────────────────────────────
  foodLog: FoodEntry[];
  addFoodEntry: (entry: FoodEntry) => void;
  removeFoodEntry: (id: string) => void;
  editFoodEntry: (id: string, updates: Partial<FoodEntry>) => void;
  clearTodayLog: () => void;

  // ── Grocery ────────────────────────────────────────────────────────────────
  groceryItems: GroceryItem[];
  toggleGroceryItem: (id: string) => void;
  addGroceryItem: (item: GroceryItem) => void;
  removeGroceryItem: (id: string) => void;

  // ── Vitamins ───────────────────────────────────────────────────────────────
  vitamins: Vitamin[];
  vitaminsLastReset: string; // ISO date "YYYY-MM-DD"
  toggleVitamin: (id: string) => void;
  resetVitaminsIfNewDay: () => void;

  // ── Period logs ────────────────────────────────────────────────────────────
  periodLogs: PeriodLog[];
  addPeriodLog: (log: PeriodLog) => void;
  updatePeriodLog: (id: string, updates: Partial<PeriodLog>) => void;

  // ── History (weekly calorie buffer) ───────────────────────────────────────
  weeklyCalories: number[];

  // ── Misc ───────────────────────────────────────────────────────────────────
  streak: number;

  // ── Meal preferences ───────────────────────────────────────────────────────
  likedMeals: string[];
  toggleLikedMeal: (name: string) => void;

  // ── Weekly plan (persisted Mon-Sun × 2 weeks) ─────────────────────────────
  weekPlanData: {
    thisWeek: any[];
    nextWeek: any[];
    generatedAt: string;
  } | null;
  setWeekPlanData: (data: { thisWeek: any[]; nextWeek: any[]; generatedAt: string }) => void;

  // ── Plan-derived grocery items ─────────────────────────────────────────────
  planGroceryItems: GroceryItem[];
  setPlanGroceryItems: (items: GroceryItem[]) => void;
  togglePlanGroceryItem: (id: string) => void;
  removePlanGroceryItem: (id: string) => void;

  // ── Derived helpers (not persisted) ───────────────────────────────────────
  accentColor: () => string;
  glowColor: () => string;
  currentCycleDay: () => number;
}

const defaultProfile: UserProfile = {
  id: null,
  goal: "wellness",
  conditions: [],
  cycleLength: 28,
  cycleDay: 14,
  lastPeriodDate: null,
  allergies: [],
  dietStyle: "Balanced",
  cuisines: ["Mediterranean"],
  dislikes: [],
  cookingTime: "30 min",
  mealsPerDay: 3,
  calorieGoal: 1900,
  proteinGoal: 130,
  carbsGoal: 220,
  fatGoal: 65,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth
      userId: null,
      onboarded: false,
      privacyAccepted: false,
      _hasHydrated: false,
      setUserId: (id) => set({ userId: id }),
      setOnboarded: (v) => set({ onboarded: v }),
      setPrivacyAccepted: () => set({ privacyAccepted: true }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // Profile
      profile: defaultProfile,
      updateProfile: (updates) =>
        set((s) => {
          const profile = { ...s.profile, ...updates };
          const lpd = profile.lastPeriodDate;
          const daysSince = lpd ? Math.max(0, Math.floor((Date.now() - new Date(lpd).getTime()) / 86400000)) : 0;
          const phase = profile.isIrregular
            ? getPhaseForDayIrregular(daysSince)
            : getPhaseForDay(
                lpd ? Math.min(daysSince + 1, profile.cycleLength) : profile.cycleDay,
                profile.cycleLength
              );
          return { profile, currentPhase: phase };
        }),

      // Cycle
      currentPhase: getPhaseForDay(
        defaultProfile.cycleDay,
        defaultProfile.cycleLength
      ),
      refreshPhase: () => {
        const { profile } = get();
        const lpd = profile.lastPeriodDate;
        const daysSince = lpd ? Math.max(0, Math.floor((Date.now() - new Date(lpd).getTime()) / 86400000)) : 0;
        const phase = profile.isIrregular
          ? getPhaseForDayIrregular(daysSince)
          : getPhaseForDay(
              lpd ? Math.min(daysSince + 1, profile.cycleLength) : profile.cycleDay,
              profile.cycleLength
            );
        set({ currentPhase: phase });
      },

      // Today
      waterGlasses: 0,
      setWater: (n) => set({ waterGlasses: Math.max(0, Math.min(12, n)) }),

      // Food log
      foodLog: [],
      addFoodEntry: (entry) =>
        set((s) => ({ foodLog: [...s.foodLog, entry] })),
      removeFoodEntry: (id) =>
        set((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) })),
      editFoodEntry: (id, updates) =>
        set((s) => ({ foodLog: s.foodLog.map((e) => e.id === id ? { ...e, ...updates } : e) })),
      clearTodayLog: () => set({ foodLog: [] }),

      // Grocery
      groceryItems: DEFAULT_GROCERY,
      toggleGroceryItem: (id) =>
        set((s) => ({
          groceryItems: s.groceryItems.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i
          ),
        })),
      addGroceryItem: (item) =>
        set((s) => ({ groceryItems: [...s.groceryItems, item] })),
      removeGroceryItem: (id) =>
        set((s) => ({
          groceryItems: s.groceryItems.filter((i) => i.id !== id),
        })),

      // Vitamins
      vitamins: DEFAULT_VITAMINS,
      vitaminsLastReset: "",
      toggleVitamin: (id) =>
        set((s) => ({
          vitamins: s.vitamins.map((v) =>
            v.id === id ? { ...v, checked: !v.checked } : v
          ),
        })),
      resetVitaminsIfNewDay: () => {
        const today = new Date().toISOString().slice(0, 10);
        const s = get();
        if (s.vitaminsLastReset === today) return;
        set({
          vitamins: s.vitamins.map((v) => ({ ...v, checked: false })),
          vitaminsLastReset: today,
        });
      },

      // Period logs
      periodLogs: [],
      addPeriodLog: (log) =>
        set((s) => ({ periodLogs: [log, ...s.periodLogs] })),
      updatePeriodLog: (id, updates) =>
        set((s) => ({
          periodLogs: s.periodLogs.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),

      // History
      weeklyCalories: [1850, 1920, 1780, 2100, 1950, 1680, 0],

      // Misc
      streak: 0,

      // Meal preferences
      likedMeals: [],
      toggleLikedMeal: (name) =>
        set((s) => ({
          likedMeals: s.likedMeals.includes(name)
            ? s.likedMeals.filter((n) => n !== name)
            : [...s.likedMeals, name],
        })),

      // Weekly plan
      weekPlanData: null,
      setWeekPlanData: (data) => set({ weekPlanData: data }),

      // Plan grocery
      planGroceryItems: [],
      setPlanGroceryItems: (items) => set({ planGroceryItems: items }),
      togglePlanGroceryItem: (id) =>
        set((s) => ({
          planGroceryItems: s.planGroceryItems.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i
          ),
        })),
      removePlanGroceryItem: (id) =>
        set((s) => ({
          planGroceryItems: s.planGroceryItems.filter((i) => i.id !== id),
        })),

      // Derived
      accentColor: () => ACCENT,
      glowColor: () => "rgba(251,209,104,0.08)",
      currentCycleDay: () => {
        const { profile } = get();
        if (!profile.lastPeriodDate) return profile.cycleDay;
        const start = new Date(profile.lastPeriodDate);
        const today = new Date();
        const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(1, diff + 1), profile.cycleLength);
      },
    }),
    {
      name: "feaste-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        onboarded: state.onboarded,
        privacyAccepted: state.privacyAccepted,
        profile: state.profile,
        currentPhase: state.currentPhase,
        waterGlasses: state.waterGlasses,
        foodLog: state.foodLog,
        groceryItems: state.groceryItems,
        periodLogs: state.periodLogs,
        weeklyCalories: state.weeklyCalories,
        streak: state.streak,
        likedMeals: state.likedMeals,
        planGroceryItems: state.planGroceryItems,
        weekPlanData: state.weekPlanData,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
