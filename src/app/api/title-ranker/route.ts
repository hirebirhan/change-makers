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
  
  let lastError: Error | null = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      workingModel = modelName;
      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  // Convert technical error to user-friendly message
  const errorMsg = lastError?.message || 'Unknown error';
  let userMessage = "AI service is temporarily unavailable. Please try again in a few moments.";
  
  if (errorMsg.includes("404") || errorMsg.includes("not found") || errorMsg.includes("not supported")) {
    userMessage = "AI service needs to be updated. Please contact support or try again later.";
  } else if (errorMsg.includes("API key") || errorMsg.includes("authentication") || errorMsg.includes("401")) {
    userMessage = "AI service authentication failed. Please check your settings.";
  } else if (errorMsg.includes("quota") || errorMsg.includes("limit") || errorMsg.includes("429")) {
    userMessage = "AI service usage limit reached. Please try again later.";
  } else if (errorMsg.includes("timeout") || errorMsg.includes("network")) {
    userMessage = "Connection timed out. Please check your internet connection.";
  }
  
  throw new Error(userMessage);
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
    const { title, topKeywords = [], autofix = false } = await req.json();
    
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 400 });
    }

    let prompt = '';
    
    if (autofix) {
      prompt = `You are a YouTube SEO expert. Your task is to improve this title following EXACT rules.

Original Title: "${title}"
Channel's top keywords: ${topKeywords.slice(0, 8).join(", ")}

You MUST follow these rules EXACTLY:

1. CHARACTER LENGTH: Make the title between 45-60 characters. Count carefully.

2. KEYWORD PLACEMENT: If the title doesn't have one of these keywords [${topKeywords.slice(0, 3).join(", ")}] in the first 3 words, add it naturally at the start.

3. NUMBERS: If there's no number in the title, add ONE number (like 5, 10, 7, 3) that makes sense.

4. POWER WORDS: Add 1-2 of these words if missing: Complete, Ultimate, Best, Proven, Easy, Fast, Simple, Master, Guide, Essential.

5. STRUCTURE: Add ONE separator (: or |) OR make it a question (?) if it doesn't have one.

6. KEEP THE MEANING: Don't change what the video is about. Only improve the wording.

7. BE NATURAL: The title must sound natural and readable, not keyword-stuffed.

8. EMOJI: Only add ONE emoji at the very start if it fits the topic. Skip if it's professional/technical content.

Return ONLY this JSON format (no markdown, no code blocks, no extra text):
{
  "fixed": {
    "title": "Your improved title here",
    "changes": [
      "Changed length from X to Y characters",
      "Added keyword 'example' at start",
      "Added number '5'",
      "Added separator ':'"
    ]
  }
}`;
    } else {
      prompt = `You are a YouTube SEO expert. Analyze this video title and provide detailed scoring.

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
    }
}`;
    }

    const response = await callGemini(prompt);
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const aiResult = JSON.parse(cleaned);

    if (autofix) {
      const response = await callGemini(prompt);
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const aiResult = JSON.parse(cleaned);

      const fixedTitle = aiResult.fixed.title;
      const lower = fixedTitle.toLowerCase();
      const words = lower.split(/\s+/).filter((w: string) => w.length > 0);

      // Calculate dimensions using helper functions for consistency
      const dimensions = [
        {
          label: "Character limits",
          score: analyzeCharacterLimits(fixedTitle).score,
          max: 20,
          feedback: analyzeCharacterLimits(fixedTitle).feedback
        },
        {
          label: "Keyword relevance",
          score: (() => {
            const top3 = topKeywords.slice(0, 3);
            const inFirst3 = top3.some((kw: string) => words.slice(0, 3).some((w: string) => w.includes(kw)));
            const hasAny = top3.some((kw: string) => lower.includes(kw));
            const hasMultiple = top3.filter((kw: string) => lower.includes(kw)).length;
            
            if (inFirst3 && hasMultiple >= 2) return 20;
            if (inFirst3) return 16;
            if (hasMultiple >= 2) return 12;
            if (hasAny) return 8;
            return 0;
          })(),
          max: 20,
          feedback: (() => {
            const top3 = topKeywords.slice(0, 3);
            const inFirst3 = top3.some((kw: string) => words.slice(0, 3).some((w: string) => w.includes(kw)));
            const hasMultiple = top3.filter((kw: string) => lower.includes(kw)).length;
            
            if (inFirst3 && hasMultiple >= 2) return `Multiple top keywords in first 3 words — excellent`;
            if (inFirst3) return `Top keyword in first 3 words — good`;
            if (hasMultiple >= 2) return `Has ${hasMultiple} top keywords, but not at start`;
            if (top3.some((kw: string) => lower.includes(kw))) return `Keyword present but not prominent`;
            return `No channel keywords detected`;
          })()
        },
        {
          label: "Power words & numbers",
          score: (() => {
            const hasNumber = /\d/.test(fixedTitle);
            const powerCount = POWER_WORDS.filter(w => lower.includes(w)).length;
            return (hasNumber ? 8 : 0) + Math.min(powerCount * 4, 12);
          })(),
          max: 20,
          feedback: (() => {
            const hasNumber = /\d/.test(fixedTitle);
            const powerCount = POWER_WORDS.filter(w => lower.includes(w)).length;
            
            if (hasNumber && powerCount >= 2) return `Number + ${powerCount} power words — strong CTR signal`;
            if (hasNumber && powerCount === 1) return `Number + power word — good combination`;
            if (powerCount >= 2) return `${powerCount} power words — add a number for impact`;
            if (hasNumber) return `Has a number — add power words for CTR`;
            if (powerCount === 1) return `Has 1 power word — add a number`;
            return `No power words or numbers — add both`;
          })()
        },
        {
          label: "Structure & clarity",
          score: (() => {
            const hasSeparator = /[|:\-–—]/.test(fixedTitle);
            const hasQuestion = /\?/.test(fixedTitle);
            const wordCount = words.length;
            
            let score = 0;
            if (hasSeparator) score += 10;
            if (hasQuestion) score += 8;
            if (wordCount >= 5 && wordCount <= 12) score += 7;
            else if (wordCount >= 3 && wordCount <= 15) score += 4;
            
            return score;
          })(),
          max: 25,
          feedback: (() => {
            const hasSeparator = /[|:\-–—]/.test(fixedTitle);
            const hasQuestion = /\?/.test(fixedTitle);
            const wordCount = words.length;
            
            const parts = [];
            if (hasSeparator) parts.push("separator");
            if (hasQuestion) parts.push("question");
            if (wordCount >= 5 && wordCount <= 12) parts.push("ideal word count");
            
            if (parts.length >= 2) return `Has ${parts.join(" + ")} — excellent structure`;
            if (parts.length === 1) return `Has ${parts[0]} — good structure`;
            return `Consider adding separator or question format`;
          })()
        },
        {
          label: "Search intent",
          score: (() => {
            const { intent, confidence } = detectSearchIntent(fixedTitle);
            return intent === "mixed" ? 10 : Math.round(confidence * 10);
          })(),
          max: 10,
          feedback: (() => {
            const { intent, confidence } = detectSearchIntent(fixedTitle);
            const pct = Math.round(confidence * 100);
            if (intent === "informational") return `Informational intent (${pct}% confident) — good for educational content`;
            if (intent === "transactional") return `Transactional intent (${pct}% confident) — good for reviews/comparisons`;
            return `Mixed intent — could be clearer for search`;
          })()
        },
        {
          label: "Emoji usage",
          score: analyzeEmoji(fixedTitle).score,
          max: 10,
          feedback: analyzeEmoji(fixedTitle).feedback
        },
        {
          label: "Sentiment tone",
          score: (() => {
            const { sentiment, confidence } = detectSentiment(fixedTitle);
            if (sentiment === "exciting") return 10;
            if (sentiment === "positive") return Math.round(6 + confidence * 4);
            if (sentiment === "negative") return 3;
            return 5;
          })(),
          max: 10,
          feedback: (() => {
            const { sentiment } = detectSentiment(fixedTitle);
            if (sentiment === "exciting") return "Exciting tone — drives curiosity and clicks";
            if (sentiment === "positive") return "Positive tone — builds trust";
            if (sentiment === "negative") return "Negative tone — use sparingly for controversy";
            return "Neutral tone — consider adding emotional hook";
          })()
        }
      ];

      const totalScore = Math.min(dimensions.reduce((s, d) => s + d.score, 0), 100);
      const grade = totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : totalScore >= 50 ? "D" : "F";

      return NextResponse.json({
        input: title,
        totalScore,
        grade,
        dimensions,
        fixed: {
          title: fixedTitle,
          score: totalScore,
          changes: aiResult.fixed.changes
        },
        meta: {
          searchIntent: detectSearchIntent(fixedTitle),
          sentiment: detectSentiment(fixedTitle),
          emoji: analyzeEmoji(fixedTitle),
          characterLimits: analyzeCharacterLimits(fixedTitle)
        }
      });
    }

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
