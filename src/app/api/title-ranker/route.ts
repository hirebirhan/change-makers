import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const MODEL_PRIORITY = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-flash',
  'gemini-pro'
];

let workingModel: string | null = null;

async function callGemini(prompt: string): Promise<string> {
  if (!genAI) throw new Error("Gemini API not configured");
  
  const modelsToTry = workingModel ? [workingModel, ...MODEL_PRIORITY] : MODEL_PRIORITY;
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      workingModel = modelName;
      return text;
    } catch (error) {
      continue;
    }
  }
  
  throw new Error("All Gemini models failed");
}

const POWER_WORDS = [
  "ultimate", "complete", "proven", "best", "top", "guide", "how", "why", "what",
  "secret", "fast", "easy", "free", "new", "now", "today", "never", "always",
  "every", "most", "least", "first", "last", "step", "master", "learn", "build",
  "create", "make", "tips", "tricks", "hack", "mistake", "error", "solution",
  "tutorial", "review", "comparison", "vs", "versus", "beginner", "advanced",
  "expert", "professional", "official", "real", "truth", "facts", "myth"
];

const INFORMATIONAL_WORDS = [
  "how", "what", "why", "when", "where", "who", "guide", "tutorial", "explained",
  "understand", "learn", "basics", "introduction", "overview", "beginner", "101",
  "explained", "meaning", "definition", "history", "background", "overview"
];

const TRANSACTIONAL_WORDS = [
  "buy", "get", "download", "purchase", "order", "cheap", "discount", "deal",
  "sale", "price", "cost", "best", "top", "review", "comparison", "vs", "versus",
  "recommended", "must-have", "essential", "ultimate", "complete"
];

function detectSearchIntent(title: string): { intent: "informational" | "transactional" | "mixed"; confidence: number } {
  const lower = title.toLowerCase();
  const infoCount = INFORMATIONAL_WORDS.filter(w => lower.includes(w)).length;
  const transCount = TRANSACTIONAL_WORDS.filter(w => lower.includes(w)).length;
  
  if (infoCount > transCount && infoCount > 0) return { intent: "informational", confidence: Math.min(0.5 + infoCount * 0.1, 0.9) };
  if (transCount > infoCount && transCount > 0) return { intent: "transactional", confidence: Math.min(0.5 + transCount * 0.1, 0.9) };
  if (infoCount === transCount && infoCount > 0) return { intent: "mixed", confidence: 0.6 };
  return { intent: "mixed", confidence: 0.3 };
}

function detectSentiment(title: string): { sentiment: "positive" | "neutral" | "negative" | "exciting"; confidence: number } {
  const lower = title.toLowerCase();
  const positive = ["amazing", "awesome", "great", "best", "perfect", "love", "incredible", "fantastic", "excellent", "brilliant"];
  const negative = ["bad", "worst", "terrible", "awful", "hate", "avoid", "fail", "error", "wrong", "problem"];
  const exciting = ["shocking", "secret", "revealed", "unbelievable", "mind-blowing", "insane", "crazy", "never", "finally", "breakthrough"];
  
  const posCount = positive.filter(w => lower.includes(w)).length;
  const negCount = negative.filter(w => lower.includes(w)).length;
  const excCount = exciting.filter(w => lower.includes(w)).length;
  
  if (excCount > 0) return { sentiment: "exciting", confidence: Math.min(0.5 + excCount * 0.15, 0.95) };
  if (posCount > negCount && posCount > 0) return { sentiment: "positive", confidence: Math.min(0.5 + posCount * 0.1, 0.85) };
  if (negCount > posCount && negCount > 0) return { sentiment: "negative", confidence: Math.min(0.5 + negCount * 0.1, 0.85) };
  return { sentiment: "neutral", confidence: 0.5 };
}

function analyzeEmoji(title: string): { count: number; placement: "start" | "middle" | "end" | "none"; score: number; feedback: string } {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = title.match(emojiRegex) || [];
  const count = emojis.length;
  
  if (count === 0) {
    return { count: 0, placement: "none", score: 0, feedback: "No emojis — consider adding one for visual appeal (optional)" };
  }
  
  const firstEmojiIndex = title.search(emojiRegex);
  const placement = firstEmojiIndex < title.length * 0.2 ? "start" : firstEmojiIndex > title.length * 0.8 ? "end" : "middle";
  
  if (count === 1 && placement === "start") {
    return { count, placement, score: 10, feedback: "One emoji at start — optimal for visibility" };
  }
  if (count === 1) {
    return { count, placement, score: 7, feedback: "One emoji — good, but start placement is better" };
  }
  if (count === 2) {
    return { count, placement, score: 5, feedback: "Two emojis — acceptable but may look cluttered" };
  }
  return { count, placement, score: 0, feedback: "Too many emojis — reduces professionalism" };
}

function analyzeCharacterLimits(title: string): { length: number; mobileTruncated: boolean; desktopTruncated: boolean; score: number; feedback: string } {
  const len = title.length;
  const mobileTruncated = len > 50;
  const desktopTruncated = len > 100;
  
  if (len >= 40 && len <= 60) {
    return { length: len, mobileTruncated: false, desktopTruncated: false, score: 20, feedback: `${len} chars — optimal for both mobile and desktop` };
  }
  if (len >= 30 && len <= 70) {
    return { length: len, mobileTruncated: false, desktopTruncated: false, score: 15, feedback: `${len} chars — good, within safe range` };
  }
  if (mobileTruncated && !desktopTruncated) {
    return { length: len, mobileTruncated: true, desktopTruncated: false, score: 8, feedback: `${len} chars — truncated on mobile (50 char limit)` };
  }
  if (desktopTruncated) {
    return { length: len, mobileTruncated: true, desktopTruncated: true, score: 5, feedback: `${len} chars — truncated on both mobile and desktop` };
  }
  return { length: len, mobileTruncated: false, desktopTruncated: false, score: 10, feedback: `${len} chars — too short, add more context` };
}

export async function POST(req: NextRequest) {
  try {
    const { title, topKeywords = [], videoData = [] } = await req.json();
    
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 400 });
    }

    const prompt = `You are a YouTube SEO expert. Analyze this video title and provide detailed scoring.

Title: "${title}"
Channel's top keywords: ${topKeywords.slice(0, 8).join(", ")}

CRITICAL RULES:
- Each dimension has a MAX score - NEVER exceed it
- Total score MUST be ≤ 100 (sum of all dimension scores)
- Alternative titles should score 75-95 (realistic, not perfect)
- Be honest and critical in scoring

Analyze across these 7 dimensions:
1. Character limits (MAX 20 pts) - Optimal 40-60 chars, penalize if too short/long
2. Keyword relevance (MAX 20 pts) - Top keywords in first 3 words = max score
3. Power words & numbers (MAX 20 pts) - Numbers + power words like "ultimate", "complete", "proven"
4. Structure & clarity (MAX 25 pts) - Separators (|, :), questions, 5-12 words ideal
5. Search intent (MAX 10 pts) - Clear informational/transactional intent
6. Emoji usage (MAX 10 pts) - 0-1 emoji at start = good, 2+ = bad
7. Sentiment tone (MAX 10 pts) - Exciting/positive > neutral > negative

Then generate 6 alternative titles that score 75-95 points (be realistic).

Return ONLY valid JSON (no markdown, no code blocks):
{
  "dimensions": [
    {"label": "Character limits", "score": 18, "max": 20, "feedback": "52 chars — optimal"},
    {"label": "Keyword relevance", "score": 12, "max": 20, "feedback": "Has keyword but not at start"},
    {"label": "Power words & numbers", "score": 8, "max": 20, "feedback": "Has number but no power words"},
    {"label": "Structure & clarity", "score": 15, "max": 25, "feedback": "Has separator — good structure"},
    {"label": "Search intent", "score": 7, "max": 10, "feedback": "Clear informational intent"},
    {"label": "Emoji usage", "score": 0, "max": 10, "feedback": "No emojis — consider adding one"},
    {"label": "Sentiment tone", "score": 6, "max": 10, "feedback": "Neutral tone — add emotional hook"}
  ],
  "alternatives": [
    {"title": "...", "score": 88, "reason": "..."},
    {"title": "...", "score": 85, "reason": "..."},
    {"title": "...", "score": 82, "reason": "..."},
    {"title": "...", "score": 80, "reason": "..."},
    {"title": "...", "score": 78, "reason": "..."},
    {"title": "...", "score": 75, "reason": "..."}
  ],
  "bestChoice": {
    "title": "...",
    "score": 88,
    "whyBest": "This title scores highest because it combines optimal character length, strong keyword placement, power words, and clear structure."
  }
}`;

    const response = await callGemini(prompt);
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const aiResult = JSON.parse(cleaned);

    // Validate and cap dimension scores
    const validatedDimensions = aiResult.dimensions.map((d: { label: string; score: number; max: number; feedback: string }) => ({
      label: d.label,
      score: Math.min(d.score, d.max),
      max: d.max,
      feedback: d.feedback
    }));

    const totalScore = Math.min(validatedDimensions.reduce((s: number, d: { score: number }) => s + d.score, 0), 100);
    const grade = totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : totalScore >= 50 ? "D" : "F";

    // Validate and cap alternative scores
    const rankedAlternatives = aiResult.alternatives
      .map((alt: { title: string; score: number; reason: string }) => ({
        title: alt.title,
        totalScore: Math.min(alt.score, 100),
        improvement: alt.reason
      }))
      .sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore);

    // Validate and cap best choice score
    const bestChoice = aiResult.bestChoice ? {
      title: aiResult.bestChoice.title,
      score: Math.min(aiResult.bestChoice.score, 100),
      whyBest: aiResult.bestChoice.whyBest
    } : undefined;

    return NextResponse.json({
      input: title,
      totalScore,
      grade,
      dimensions: validatedDimensions,
      rankedAlternatives,
      bestChoice,
      meta: {
        searchIntent: detectSearchIntent(title),
        sentiment: detectSentiment(title),
        emoji: analyzeEmoji(title),
        characterLimits: analyzeCharacterLimits(title)
      }
    });
  } catch (error) {
    console.error("Title ranker error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
