import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const MODEL_PRIORITY = ["gemini-flash-latest", "gemini-pro-latest", "gemini-flash", "gemini-pro"];

export async function POST(req: NextRequest) {
  try {
    const { comments } = (await req.json()) as { comments: { id: string; text: string }[] };

    if (!Array.isArray(comments) || comments.length === 0)
      return NextResponse.json({ sentiments: {} });

    if (!process.env.GEMINI_API_KEY)
      return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 400 });

    // Process in batches of 50 to stay within token limits
    const BATCH = 50;
    const result: Record<string, "positive" | "neutral" | "negative"> = {};

    for (let i = 0; i < comments.length; i += BATCH) {
      const batch = comments.slice(i, i + BATCH);
      const numbered = batch.map((c, idx) => `${idx + 1}. "${c.text.slice(0, 200)}"`).join("\n");

      const prompt = `Classify each YouTube comment's sentiment. Consider context, sarcasm, and mixed feelings carefully.

Comments:
${numbered}

Return ONLY a valid JSON array of exactly ${batch.length} values, each being "positive", "neutral", or "negative".
Example: ["positive","neutral","negative"]
No other text.`;

      let text = "";
      for (const modelName of MODEL_PRIORITY) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const res = await model.generateContent(prompt);
          text = res.response.text().trim();
          break;
        } catch { continue; }
      }

      // Parse JSON array from response
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as string[];
          batch.forEach((c, idx) => {
            const val = parsed[idx];
            if (val === "positive" || val === "negative" || val === "neutral")
              result[c.id] = val;
          });
        } catch { /* keep keyword-based fallback for this batch */ }
      }
    }

    return NextResponse.json({ sentiments: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sentiment classification failed" },
      { status: 500 }
    );
  }
}
