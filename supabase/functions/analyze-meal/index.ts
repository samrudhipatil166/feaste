// Supabase Edge Function — analyze-meal
// Called by the app; proxies to Anthropic API so the key is never in the client

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
          text: `Analyse this meal photo and estimate the nutritional content.${description ? `\nAdditional context from the user: "${description}"` : ""}
Return ONLY valid JSON in this exact format, no other text:
{
  "name": "meal name",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "confidence": number (0-1)
}`,
        },
      ];
    } else {
      userContent = `Analyse this meal description and estimate the nutritional content.
Description: "${description}"

Return ONLY valid JSON in this exact format, no other text:
{
  "name": "meal name",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "confidence": number (0-1)
}`;
    }

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
      messages: [{ role: "user", content: userContent }],
    });

    const rawText = (message.content[0] as { type: "text"; text: string }).text.trim();
    // Strip markdown code fences if present, then extract the JSON object
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analyze-meal error:", msg);
    return new Response(
      JSON.stringify({ error: "Analysis failed", detail: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
