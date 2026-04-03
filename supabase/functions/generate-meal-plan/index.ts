// Supabase Edge Function — generate-meal-plan
// Generates daily or weekly meal plans via Claude, factoring in hormonal conditions,
// cycle phase, food preferences, and goals.

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
    const body = await req.json();
    const {
      type, // "daily" | "weekly"
      goal,
      conditions,
      phase,
      phases, // for weekly
      dietStyle,
      allergies,
      cuisines,
      cookingTime,
      calorieGoal,
    } = body;

    const client = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    let prompt: string;

    if (type === "daily") {
      prompt = `You are a hormone-aware nutrition expert for women.

Create a personalised daily meal plan with these specs:
- Goal: ${goal}
- Hormonal conditions: ${conditions?.join(", ") || "none"}
- Current cycle phase: ${phase}
- Diet style: ${dietStyle}
- Allergies/restrictions (MUST avoid): ${allergies?.join(", ") || "none"}
- Favourite cuisines: ${cuisines?.join(", ") || "any"}
- Max cooking time per meal: ${cookingTime}
- Daily calorie target: ${calorieGoal} kcal

Return ONLY valid JSON in this exact format:
{
  "meals": [
    {
      "meal": "Breakfast",
      "time": "8:00 AM",
      "name": "meal name",
      "description": "brief description",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "emoji": "🥣"
    }
  ]
}

Include breakfast, morning snack, lunch, afternoon snack, dinner. Total calories should be close to ${calorieGoal}.`;
    } else {
      prompt = `You are a hormone-aware nutrition expert for women.

Create a 7-day weekly meal plan with these specs:
- Goal: ${goal}
- Hormonal conditions: ${conditions?.join(", ") || "none"}
- Cycle phases for each day: ${phases?.join(", ")}
- Diet style: ${dietStyle}
- Allergies/restrictions (MUST avoid): ${allergies?.join(", ") || "none"}
- Favourite cuisines: ${cuisines?.join(", ") || "any"}
- Max cooking time per meal: ${cookingTime}
- Daily calorie target: ${calorieGoal} kcal

Return ONLY valid JSON:
{
  "days": [
    {
      "dayIndex": 0,
      "phase": "follicular",
      "meals": [
        { "meal": "Breakfast", "name": "meal name", "calories": number, "emoji": "🥣" },
        { "meal": "Lunch", "name": "meal name", "calories": number, "emoji": "🥗" },
        { "meal": "Dinner", "name": "meal name", "calories": number, "emoji": "🍗" }
      ]
    }
  ]
}`;
    }

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = (message.content[0] as { type: "text"; text: string }).text.trim();
    const result = JSON.parse(rawText);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-meal-plan error:", err);
    return new Response(
      JSON.stringify({ error: "Meal plan generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
