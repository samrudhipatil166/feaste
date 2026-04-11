// Supabase Edge Function — analyze-meal
// Uses direct fetch to Anthropic API (no SDK dependency)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHASE_CONTEXT: Record<string, string> = {
  menstrual:  "the menstrual phase (iron, magnesium and omega-3 needs are elevated; warming restorative foods are ideal)",
  follicular: "the follicular phase (energy is rising; fresh light foods, fermented foods and B vitamins are great)",
  ovulatory:  "the ovulatory phase (peak energy; antioxidants, fibre and light carbs are ideal)",
  luteal:     "the luteal phase (progesterone rises; complex carbs, magnesium and serotonin-boosting foods help mood and cravings)",
};

const VALID_BADGES = [
  "iron-rich", "high magnesium", "high fibre", "good fats",
  "high protein", "antioxidant-rich", "gut-friendly", "blood sugar friendly",
];

function buildFormat(phase?: string): string {
  const phaseDesc = phase && PHASE_CONTEXT[phase]
    ? PHASE_CONTEXT[phase]
    : "their current cycle phase";

  return `{
  "name": "overall meal name — brief and natural",
  "protein": total_grams_number,
  "carbs": total_grams_number,
  "fat": total_grams_number,
  "fibre": total_grams_number,
  "confidence": 0_to_1_number,
  "ingredients": [
    {
      "name": "Ingredient name with estimated weight e.g. Rolled oats (~80g)",
      "protein": grams_number,
      "carbs": grams_number,
      "fat": grams_number,
      "fibre": grams_number
    }
  ],
  "phaseNote": "One short warm casual sentence — like a knowledgeable friend — connecting this meal to ${phaseDesc}. Never clinical. e.g. 'The oats here give you a slow serotonin lift which is exactly what you need right now.'",
  "phaseBadge": "Exactly one of: iron-rich, high magnesium, high fibre, good fats, high protein, antioxidant-rich, gut-friendly, blood sugar friendly — or null if none clearly applies"
}

Rules:
- List every distinct food item as its own entry in ingredients
- Include the estimated portion/weight in each ingredient name
- The totals (protein/carbs/fat/fibre) must equal the sum of the ingredient entries
- Do NOT include a calories field — calories are calculated from macros as protein×4 + carbs×4 + fat×9
- phaseNote must be conversational and warm, never prescriptive or clinical
- phaseBadge must be exactly one of the valid options above, or null — never make up a badge`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { type, description, image, phase } = await req.json();
    const format = buildFormat(phase);

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

Return ONLY valid JSON, no markdown, no other text:
${format}`,
        },
      ];
    } else {
      userContent = `Analyse this meal and estimate macros for each food component separately.
Description: "${description}"

Return ONLY valid JSON, no markdown, no other text:
${format}`;
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
        max_tokens: 1500,
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

    // Enforce: totals = sum of ingredients
    if (Array.isArray(result.ingredients) && result.ingredients.length > 0) {
      result.protein = result.ingredients.reduce((s: number, i: { protein?: number }) => s + (i.protein ?? 0), 0);
      result.carbs   = result.ingredients.reduce((s: number, i: { carbs?: number })   => s + (i.carbs   ?? 0), 0);
      result.fat     = result.ingredients.reduce((s: number, i: { fat?: number })     => s + (i.fat     ?? 0), 0);
      result.fibre   = result.ingredients.reduce((s: number, i: { fibre?: number })   => s + (i.fibre   ?? 0), 0);

      // Compute calories per ingredient from macros
      result.ingredients = result.ingredients.map((ing: { name: string; protein?: number; carbs?: number; fat?: number; fibre?: number }) => ({
        ...ing,
        protein: ing.protein ?? 0,
        carbs:   ing.carbs   ?? 0,
        fat:     ing.fat     ?? 0,
        fibre:   ing.fibre   ?? 0,
        calories: Math.round((ing.protein ?? 0) * 4 + (ing.carbs ?? 0) * 4 + (ing.fat ?? 0) * 9),
      }));
    } else {
      // No ingredients — init empty array
      result.ingredients = [];
    }

    // Validate phaseBadge
    if (result.phaseBadge && !VALID_BADGES.includes(result.phaseBadge)) {
      result.phaseBadge = null;
    }

    // Ensure fibre is a number
    result.fibre = result.fibre ?? 0;

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analyze-meal error:", msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
