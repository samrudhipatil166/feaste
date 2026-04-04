// Supabase Edge Function — analyze-meal
// Called by the app; proxies to Anthropic API so the key is never in the client

import Anthropic from "npm:@anthropic-ai/sdk@0.40.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREAKDOWN_FORMAT = `{
  "name": "overall meal name",
  "protein": total_grams,
  "carbs": total_grams,
  "fat": total_grams,
  "confidence": 0_to_1,
  "breakdown": [
    { "name": "food item + portion e.g. Rice pilaf (~180g)", "protein": grams, "carbs": grams, "fat": grams },
    { "name": "food item + portion e.g. Köfte meatballs (3 pcs ~120g)", "protein": grams, "carbs": grams, "fat": grams }
  ]
}

Rules:
- List every distinct food item visible as its own entry in breakdown
- Include the estimated portion/weight in the item name
- The totals (protein/carbs/fat) must equal the sum of the breakdown entries
- Do NOT include a calories field — calories are calculated from macros as protein×4 + carbs×4 + fat×9`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, description, image } = await req.json();

    const client = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    let userContent: Anthropic.MessageParam["content"];

    if (type === "photo" && image) {
      userContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: image,
          },
        },
        {
          type: "text",
          text: `Analyse this meal photo. Identify every food item on the plate and estimate macros for each one separately.${description ? `\nUser added context: "${description}"` : ""}

Return ONLY valid JSON, no other text:
${BREAKDOWN_FORMAT}`,
        },
      ];
    } else {
      userContent = `Analyse this meal and estimate macros for each food component separately.
Description: "${description}"

Return ONLY valid JSON, no other text:
${BREAKDOWN_FORMAT}`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: userContent }],
    });

    const rawText = (message.content[0] as { type: "text"; text: string }).text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const result = JSON.parse(jsonMatch[0]);

    // Enforce: totals = sum of breakdown (so the numbers always add up)
    if (Array.isArray(result.breakdown) && result.breakdown.length > 0) {
      result.protein = result.breakdown.reduce((s: number, i: any) => s + (i.protein ?? 0), 0);
      result.carbs   = result.breakdown.reduce((s: number, i: any) => s + (i.carbs   ?? 0), 0);
      result.fat     = result.breakdown.reduce((s: number, i: any) => s + (i.fat     ?? 0), 0);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analyze-meal error:", msg);
    return new Response(
      JSON.stringify({ error: "Analysis failed", detail: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
