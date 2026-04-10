// Supabase Edge Function — analyze-meal
// Uses direct fetch to Anthropic API (no SDK dependency)

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
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { type, description, image } = await req.json();

    let userContent: unknown;

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    clearTimeout(timeout);

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errBody);
      throw new Error(`Anthropic API returned ${anthropicRes.status}: ${errBody}`);
    }

    const anthropicData = await anthropicRes.json();
    const rawText = (anthropicData.content?.[0]?.text ?? "").trim();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const result = JSON.parse(jsonMatch[0]);

    // Enforce: totals = sum of breakdown
    if (Array.isArray(result.breakdown) && result.breakdown.length > 0) {
      result.protein = result.breakdown.reduce((s: number, i: { protein?: number }) => s + (i.protein ?? 0), 0);
      result.carbs   = result.breakdown.reduce((s: number, i: { carbs?: number })   => s + (i.carbs   ?? 0), 0);
      result.fat     = result.breakdown.reduce((s: number, i: { fat?: number })     => s + (i.fat     ?? 0), 0);
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analyze-meal error:", msg);
    // Always return 200 so the client can read the error detail
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
