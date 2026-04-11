import { CyclePhase } from "@/types";

export const PHASE_INFO: Record<
  CyclePhase,
  {
    emoji: string;
    label: string;
    color: string;
    foodFocus: string[];
    eat: string[];
    avoid: string[];
    easyWins: string[];
    insight: string;
  }
> = {
  menstrual: {
    emoji: "🌺",
    label: "Menstrual Phase",
    color: "#D96B8A",
    foodFocus: ["Iron-rich", "Anti-inflammatory", "Warming foods"],
    eat: [
      "Dark leafy greens",
      "Red meat or lentils",
      "Dark chocolate",
      "Ginger tea",
      "Salmon",
      "Sweet potatoes",
    ],
    avoid: [
      "Excess caffeine",
      "Alcohol",
      "Processed sugar",
      "Very salty foods",
    ],
    easyWins: [
      "Eggs any style",
      "Spinach or kale in anything",
      "Tinned salmon or sardines",
      "Dark chocolate as a treat",
      "Sweet potato as a side",
      "Ginger or turmeric tea",
    ],
    insight: "Iron drops during your period — these foods replenish without being heavy on digestion.",
  },
  follicular: {
    emoji: "🌱",
    label: "Follicular Phase",
    color: "#6BAA76",
    foodFocus: ["Light & fresh", "Fermented foods", "Lean protein"],
    eat: [
      "Sprouted grains",
      "Avocado",
      "Eggs",
      "Kimchi & sauerkraut",
      "Citrus fruits",
      "Chicken",
    ],
    avoid: ["Heavy fried foods", "Excess dairy", "Refined carbs"],
    easyWins: [
      "Avocado on toast or in a salad",
      "Eggs for breakfast",
      "Kimchi or sauerkraut on the side",
      "Citrus in your water or dressing",
      "Grilled chicken",
      "Swap white bread for sourdough",
    ],
    insight: "Estrogen is rising and your body absorbs nutrients well — lighter, fresher foods feel great right now.",
  },
  ovulatory: {
    emoji: "✨",
    label: "Ovulatory Phase",
    color: "#D4A840",
    foodFocus: ["Fiber-rich", "Antioxidants", "Light carbs"],
    eat: [
      "Quinoa",
      "Berries",
      "Raw vegetables",
      "Flaxseeds",
      "Wild fish",
      "Bell peppers",
    ],
    avoid: ["Excess alcohol", "Processed foods", "Trans fats"],
    easyWins: [
      "Raw veggie snacks or a big salad",
      "Berries in yogurt or on the side",
      "Flaxseeds sprinkled on anything",
      "Salmon or tuna",
      "Quinoa as your grain",
      "Bell peppers raw or roasted",
    ],
    insight: "Energy peaks this week — antioxidant-rich foods help your body manage the estrogen surge.",
  },
  luteal: {
    emoji: "🌙",
    label: "Luteal Phase",
    color: "#9B7FD4",
    foodFocus: ["Magnesium-rich", "Complex carbs", "Serotonin-boosting"],
    eat: [
      "Brown rice",
      "Turkey",
      "Dark chocolate",
      "Bananas",
      "Chickpeas",
      "Pumpkin seeds",
    ],
    avoid: [
      "Excess sugar",
      "Caffeine overload",
      "Carbonated drinks",
      "Artificial sweeteners",
    ],
    easyWins: [
      "Brown rice or sweet potato as your carb",
      "Turkey in a sandwich or salad",
      "Dark chocolate (genuinely helps)",
      "Banana as a snack",
      "Chickpeas in a salad or curry",
      "Pumpkin seeds on anything",
    ],
    insight: "Progesterone rises and can dip serotonin — complex carbs and magnesium foods help keep your mood steady.",
  },
};

export function getPhaseForDay(day: number, cycleLength: number): CyclePhase {
  const pct = day / cycleLength;
  if (pct <= 0.18) return "menstrual";
  if (pct <= 0.5) return "follicular";
  if (pct <= 0.6) return "ovulatory";
  return "luteal";
}

/** Phase estimate for irregular cycles — fixed cutoffs from last period start */
export function getPhaseForDayIrregular(daysSinceLastPeriod: number): CyclePhase {
  if (daysSinceLastPeriod <= 5) return "menstrual";
  if (daysSinceLastPeriod <= 13) return "follicular";
  if (daysSinceLastPeriod <= 16) return "ovulatory";
  return "luteal";
}

export interface PhaseVitamin {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  reason: string;
}

export const PHASE_VITAMINS: Record<CyclePhase, PhaseVitamin[]> = {
  menstrual: [
    { id: "iron", name: "Iron + Vitamin C", dosage: "18mg", timing: "Away from calcium", reason: "Replenishes iron lost during your period" },
    { id: "magnesium", name: "Magnesium Glycinate", dosage: "300mg", timing: "Evening", reason: "Eases cramps and helps you sleep" },
    { id: "omega3", name: "Omega-3", dosage: "1000mg", timing: "With meals", reason: "Reduces inflammation and period pain" },
  ],
  follicular: [
    { id: "bcomplex", name: "B-Complex", dosage: "1 capsule", timing: "Morning", reason: "Supports rising estrogen and energy" },
    { id: "zinc", name: "Zinc", dosage: "15mg", timing: "With food", reason: "Boosts follicle development and immunity" },
    { id: "vitd", name: "Vitamin D3", dosage: "2000 IU", timing: "Morning with food", reason: "Supports mood and hormonal balance" },
  ],
  ovulatory: [
    { id: "vitc", name: "Vitamin C", dosage: "500mg", timing: "With meals", reason: "Antioxidant support at estrogen peak" },
    { id: "vite", name: "Vitamin E", dosage: "400 IU", timing: "With meals", reason: "Protects cells during ovulation" },
    { id: "omega3", name: "Omega-3", dosage: "1000mg", timing: "With meals", reason: "Supports healthy ovulation" },
  ],
  luteal: [
    { id: "magnesium", name: "Magnesium Glycinate", dosage: "300mg", timing: "Evening", reason: "Reduces PMS, bloating and mood dips" },
    { id: "calcium", name: "Calcium", dosage: "500mg", timing: "With meals", reason: "Eases PMS symptoms significantly" },
    { id: "b6", name: "Vitamin B6", dosage: "50mg", timing: "Morning", reason: "Supports serotonin and mood" },
  ],
};

export const PCOS_VITAMINS: PhaseVitamin[] = [
  { id: "inositol", name: "Inositol", dosage: "2g twice daily", timing: "Morning and evening", reason: "Improves insulin sensitivity in PCOS" },
  { id: "magnesium", name: "Magnesium", dosage: "300mg", timing: "Evening", reason: "Reduces insulin resistance and cortisol" },
  { id: "omega3", name: "Omega-3", dosage: "1000mg", timing: "With meals", reason: "Reduces PCOS-related inflammation" },
];

export const DEFAULT_VITAMINS = [
  {
    id: "1",
    name: "Vitamin D3",
    reason: "Hormonal regulation & mood support",
    dosage: "2000 IU",
    timing: "Morning with food",
    checked: false,
  },
  {
    id: "2",
    name: "Magnesium Glycinate",
    reason: "Luteal phase cramp relief",
    dosage: "300mg",
    timing: "Evening",
    checked: false,
  },
  {
    id: "3",
    name: "Omega-3 (EPA/DHA)",
    reason: "Anti-inflammatory, brain health",
    dosage: "1000mg",
    timing: "With meals",
    checked: false,
  },
  {
    id: "4",
    name: "Iron + Vitamin C",
    reason: "Menstrual phase replenishment",
    dosage: "18mg",
    timing: "Away from calcium",
    checked: false,
  },
  {
    id: "5",
    name: "B-Complex",
    reason: "Energy & hormonal metabolism",
    dosage: "1 capsule",
    timing: "Morning",
    checked: false,
  },
  {
    id: "6",
    name: "Zinc",
    reason: "Immune & reproductive health",
    dosage: "15mg",
    timing: "With food",
    checked: false,
  },
  {
    id: "7",
    name: "Probiotics",
    reason: "Gut-hormone axis support",
    dosage: "10B CFU",
    timing: "Morning, empty stomach",
    checked: false,
  },
];
