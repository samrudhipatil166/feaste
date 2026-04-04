import { CyclePhase } from "@/types";

/**
 * Cross-references what your body needs in the current phase
 * with what the meal actually provides.
 *
 * Used for Spoonacular meals (full nutrient data).
 */
export function buildMealInsight(
  phases: CyclePhase[] | "all",
  nutrients: { name: string; amount: number }[],
  _name: string,
): string {
  const get = (n: string) => nutrients.find((x) => x.name === n)?.amount ?? 0;
  const iron      = get("Iron");
  const fiber     = get("Fiber");
  const magnesium = get("Magnesium");
  const protein   = get("Protein");
  const calcium   = get("Calcium");
  const vitaminC  = get("Vitamin C");
  const folate    = get("Folate");
  const potassium = get("Potassium");

  const phaseList: CyclePhase[] =
    phases === "all"
      ? ["menstrual", "follicular", "ovulatory", "luteal"]
      : [...phases];

  // What each phase needs × what this meal delivers
  for (const phase of phaseList) {
    if (phase === "menstrual") {
      if (iron > 3.5)     return `Your body loses iron during your period — this meal helps rebuild stores (${iron.toFixed(1)}mg)`;
      if (magnesium > 40) return `Magnesium (${magnesium.toFixed(0)}mg) reduces the prostaglandins that cause period cramps`;
      if (fiber > 8)      return `High fibre helps reduce the inflammation that worsens period pain`;
      if (vitaminC > 20)  return `Vitamin C here boosts iron absorption — key for replacing what you lose each cycle`;
    }
    if (phase === "follicular") {
      if (protein > 15)   return `Rising estrogen supercharges muscle synthesis — ${protein.toFixed(0)}g of plant protein makes the most of it`;
      if (folate > 80)    return `Folate supports the follicle development happening in your body right now`;
      if (vitaminC > 25)  return `Vitamin C supports the rising estrogen that drives your energy this phase`;
      if (fiber > 6)      return `Fibre feeds gut bacteria that help metabolise the rising estrogen of your follicular phase`;
    }
    if (phase === "ovulatory") {
      if (fiber > 8)      return `Fibre helps your body clear the estrogen surge of ovulation and prevent hormonal dominance`;
      if (vitaminC > 25)  return `Antioxidants protect egg quality and reduce the inflammation triggered by ovulation`;
      if (calcium > 180)  return `Calcium supports the peak hormonal activity your body is navigating during ovulation`;
      if (protein > 15)   return `Protein fuels the high-energy demands your body has at peak ovulation`;
    }
    if (phase === "luteal") {
      if (magnesium > 40) return `Magnesium (${magnesium.toFixed(0)}mg) is your PMS ally — eases bloating, cramps, and mood dips`;
      if (calcium > 150)  return `Studies show calcium reduces PMS symptoms by up to 50% — this meal is a solid source`;
      if (fiber > 6)      return `Complex fibre keeps blood sugar steady, which tames the cravings and mood swings`;
      if (protein > 15)   return `Protein supports progesterone production and keeps energy even through the luteal phase`;
    }
  }

  // Nutrient-only fallbacks (no phase-specific match)
  if (protein > 18)   return `${protein.toFixed(0)}g of plant protein — the building blocks for every hormone your body makes`;
  if (fiber > 10)     return `${fiber.toFixed(0)}g of fibre nourishes the gut bacteria that directly regulate your hormones`;
  if (magnesium > 35) return `Magnesium supports 300+ body processes — including the ones that keep hormones balanced`;
  if (potassium > 600) return `Potassium reduces water retention and the bloating that often tracks your cycle`;
  if (calcium > 200)  return `A strong calcium source — supports bone density that can dip with hormonal fluctuations`;
  if (folate > 100)   return `Rich in folate — essential for cell renewal and healthy hormone metabolism`;

  return `Supports your hormonal balance throughout your cycle`;
}

/**
 * Phase-aware insight for manually logged meals (macros only — no micronutrient data).
 * Focuses on what your body needs right now and whether the macro profile fits.
 */
export function buildLogInsight(
  phase: CyclePhase,
  protein: number,
  carbs: number,
  fat: number,
): string {
  switch (phase) {
    case "menstrual":
      if (protein > 15) return `Good protein — supports your body while it works hard this phase`;
      if (fat > 12)     return `Healthy fats help produce the hormones your body needs during menstruation`;
      if (carbs < 35)   return `Lower carbs reduce the inflammation that can worsen period symptoms`;
      return `During your period, anti-inflammatory and iron-rich foods are especially supportive`;

    case "follicular":
      if (protein > 15) return `${protein}g of protein — your follicular phase is the best time to build and repair`;
      if (carbs < 55)   return `Light, balanced carbs match your rising energy — your metabolism is at its most efficient right now`;
      return `You're in an energetic phase — your body absorbs and uses nutrients particularly well right now`;

    case "ovulatory":
      if (fat > 10)     return `Healthy fats support the hormone surge your body is managing during ovulation`;
      if (protein > 15) return `Protein protects against the high-energy demands of ovulation`;
      return `Fibre and antioxidant-rich foods are especially beneficial for ovulation support`;

    case "luteal":
      if (carbs > 40)   return `Complex carbs boost serotonin production — exactly what you need in the luteal phase`;
      if (protein > 15) return `Protein stabilises blood sugar and helps manage the energy dips before your period`;
      if (fat > 12)     return `Healthy fats support progesterone — the key hormone of your luteal phase`;
      return `Nourishing your body well now can meaningfully reduce PMS symptoms`;
  }
}
