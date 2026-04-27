import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

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

    const lower = title.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 0);
    const len = title.length;
    
    // Enhanced dimensions
    const dimensions = [
      {
        label: "Character limits",
        score: analyzeCharacterLimits(title).score,
        max: 20,
        feedback: analyzeCharacterLimits(title).feedback
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
          const inFirst3 = top3.some((kw: string) => words.slice(0, 3).some(w => w.includes(kw)));
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
          const hasNumber = /\d/.test(title);
          const powerCount = POWER_WORDS.filter(w => lower.includes(w)).length;
          return (hasNumber ? 8 : 0) + Math.min(powerCount * 4, 12);
        })(),
        max: 20,
        feedback: (() => {
          const hasNumber = /\d/.test(title);
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
          const hasSeparator = /[|:\-–—]/.test(title);
          const hasQuestion = /\?/.test(title);
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
          const hasSeparator = /[|:\-–—]/.test(title);
          const hasQuestion = /\?/.test(title);
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
          const { intent, confidence } = detectSearchIntent(title);
          return intent === "mixed" ? 10 : Math.round(confidence * 10);
        })(),
        max: 10,
        feedback: (() => {
          const { intent, confidence } = detectSearchIntent(title);
          const pct = Math.round(confidence * 100);
          if (intent === "informational") return `Informational intent (${pct}% confident) — good for educational content`;
          if (intent === "transactional") return `Transactional intent (${pct}% confident) — good for reviews/comparisons`;
          return `Mixed intent — could be clearer for search`;
        })()
      },
      {
        label: "Emoji usage",
        score: analyzeEmoji(title).score,
        max: 10,
        feedback: analyzeEmoji(title).feedback
      },
      {
        label: "Sentiment tone",
        score: (() => {
          const { sentiment, confidence } = detectSentiment(title);
          if (sentiment === "exciting") return 10;
          if (sentiment === "positive") return Math.round(6 + confidence * 4);
          if (sentiment === "negative") return 3;
          return 5;
        })(),
        max: 10,
        feedback: (() => {
          const { sentiment } = detectSentiment(title);
          if (sentiment === "exciting") return "Exciting tone — drives curiosity and clicks";
          if (sentiment === "positive") return "Positive tone — builds trust";
          if (sentiment === "negative") return "Negative tone — use sparingly for controversy";
          return "Neutral tone — consider adding emotional hook";
        })()
      }
    ];

    const totalScore = dimensions.reduce((s, d) => s + d.score, 0);
    const grade = totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : totalScore >= 50 ? "D" : "F";

    // Generate AI-powered alternatives
    let aiAlternatives: { title: string; reason: string }[] = [];
    
    if (genAI && topKeywords.length > 0) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Generate 6 high-CTR YouTube video title alternatives for a tech/education channel.
        
        Original title: "${title}"
        Channel's top keywords: ${topKeywords.slice(0, 5).join(", ")}
        
        Rules:
        - 40-70 characters optimal
        - Include numbers or power words
        - Use separators (|, :) or questions
        - Match informational/transactional intent
        - Make them click-worthy but not clickbait
        
        Return ONLY a JSON array with format: [{"title": "...", "reason": "..."}]`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response.text();
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        
        try {
          aiAlternatives = JSON.parse(cleaned);
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      } catch (e) {
        console.error("AI generation failed:", e);
      }
    }

    // Fallback template-based alternatives
    const topKw = topKeywords[0] ?? "topic";
    const topKwCap = topKw.charAt(0).toUpperCase() + topKw.slice(1);
    const year = new Date().getFullYear();
    
    const templateAlternatives = [
      { title: `${topKwCap}: The Complete Guide (${year})`, reason: "Evergreen format with year — high search volume" },
      { title: `How to Master ${topKwCap} | Step-by-Step Tutorial`, reason: "How-to with separator — strong intent match" },
      { title: `${topKwCap} Tips That Actually Work (Most Get This Wrong)`, reason: "Curiosity gap + social proof" },
      { title: `I Tried ${topKwCap} for 30 Days — Here's What Happened`, reason: "Personal story — high watch time signal" },
      { title: `Top 10 ${topKwCap} Mistakes You're Making in ${year}`, reason: "Listicle + year — proven CTR formula" },
      { title: `${topKwCap} Explained: Everything You Need to Know`, reason: "Educational — targets 'explained' queries" },
    ];

    const alternatives = aiAlternatives.length > 0 ? aiAlternatives : templateAlternatives;
    const rankedAlternatives = alternatives.map((alt, i) => ({
      title: alt.title,
      totalScore: 95 - (i * 5),
      improvement: alt.reason
    }));

    return NextResponse.json({
      totalScore,
      grade,
      dimensions,
      rankedAlternatives,
      meta: {
        searchIntent: detectSearchIntent(title),
        sentiment: detectSentiment(title),
        emoji: analyzeEmoji(title),
        characterLimits: analyzeCharacterLimits(title)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
