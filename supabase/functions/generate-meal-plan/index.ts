// Supabase Edge Function — generate-meal-plan
// Generates a meal library using Claude Haiku, personalised to the user's
// diet, cuisines, allergies, and cycle phase.

import Anthropic from "npm:@anthropic-ai/sdk@0.40.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { diet = "", cuisines = [], allergies = [], excludeMeals = [] } = await req.json();

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const dietLine   = diet ? `Diet: ${diet} (strictly no meat, fish, poultry, or seafood for plant-based)` : "Diet: no restriction";
    const cuisineLine = cuisines.length ? `Preferred cuisines: ${cuisines.join(", ")} — use these heavily` : "Cuisines: varied international";
    const allergyLine = allergies.length ? `MUST avoid (allergies): ${allergies.join(", ")}` : "No allergies";
    const excludeLine = excludeMeals.length
      ? `MUST NOT generate any of these meals (already used in previous weeks — create entirely different dishes): ${excludeMeals.join(", ")}`
      : "";

    const prompt = `You are a hormone-aware nutrition expert. Generate a diverse meal library for women's cycle-synced meal planning.

${dietLine}
${cuisineLine}
${allergyLine}
${excludeLine}

Generate exactly:
- 10 Breakfast meals
- 12 Lunch meals
- 12 Dinner meals
- 8 Snack meals

Rules:
- Strictly respect the diet and allergies — this is a health app
- Distribute cuisines across the meals; don't cluster them all at one slot
- Assign each meal to the cycle phase(s) where its nutrients are most beneficial:
  menstrual = iron-rich, anti-inflammatory, warming
  follicular = light, protein-rich, fermented
  ovulatory  = high-fibre, antioxidant-rich
  luteal     = magnesium-rich, complex carbs, serotonin-supporting
- Macro values must be realistic for the described portion
- insight: ONE sentence explaining what the meal provides for the assigned phase

Return ONLY valid JSON, no other text:
{
  "meals": [
    {
      "meal": "Breakfast",
      "name": "meal name",
      "description": "1-2 sentence description",
      "protein": number,
      "carbs": number,
      "fat": number,
      "cookTimeMinutes": number,
      "cuisine": ["cuisine name"],
      "dietary": ["vegetarian"] (include "vegan" and/or "gluten-free" if applicable),
      "phases": ["follicular"] (1-2 most relevant phases, or the string "all"),
      "insight": "one sentence — what this meal gives you for that phase",
      "tags": ["high-protein", "quick"] (1-3 relevant tags),
      "ingredients": ["amount ingredient", ...] (5-7 key ingredients),
      "steps": ["step 1", "step 2", "step 3"] (3-4 clear steps),
      "proTip": "one practical tip"
    }
  ]
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = (message.content[0] as { type: "text"; text: string }).text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-meal-plan error:", err);
    return new Response(
      JSON.stringify({ error: "Meal generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
