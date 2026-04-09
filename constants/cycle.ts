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
