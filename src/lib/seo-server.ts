import { Video } from "@/types/youtube";

export interface SeoData {
  keywords: { keyword: string; count: number; totalViews: number }[];
  recommendedKeywords: { keyword: string; source: string; competition: string; reason: string }[];
  titleSuggestions: { suggestion: string; reason: string }[];
  videoScores: { id: string; title: string; score: number; issues: string[]; suggestions: string[] }[];
}

function analyzeKeywords(videos: Video[]): { keyword: string; count: number; totalViews: number }[] {
  const STOP = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "is","it","this","that","my","your","how","what","why","when","i","you",
    "we","they","be","are","was","were","have","has","do","did","will","can",
    "get","got","new","best","top","video","youtube","channel",
  ]);
  
  const map = new Map<string, { count: number; totalViews: number }>();
  
  for (const v of videos) {
    const words = [
      ...v.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/),
      ...v.tags.map((t) => t.toLowerCase()),
    ].filter((w) => w.length > 2 && !STOP.has(w));
    
    for (const word of words) {
      const e = map.get(word) ?? { count: 0, totalViews: 0 };
      map.set(word, { count: e.count + 1, totalViews: e.totalViews + v.viewCount });
    }
  }
  
  return [...map.entries()]
    .map(([keyword, { count, totalViews }]) => ({ keyword, count, totalViews }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 30);
}

function buildRecommendedKeywords(
  keywords: { keyword: string; count: number; totalViews: number }[],
  videos: Video[]
): { keyword: string; source: string; competition: string; reason: string }[] {
  const existing = new Set(videos.flatMap((v) => v.tags.map((t) => t.toLowerCase())));
  const recommended: { keyword: string; source: string; competition: string; reason: string }[] = [];

  // Top performing keywords you should use more
  for (const { keyword, count, totalViews } of keywords.slice(0, 5)) {
    if (keyword.length > 3) {
      recommended.push({
        keyword,
        source: "Your content",
        competition: "Proven",
        reason: `Used ${count}x, drove ${(totalViews / 1000).toFixed(0)}K views`,
      });
    }
  }

  // Related variations
  const variations = ["tutorial", "guide", "tips", "review", "explained", "beginner", "advanced"];
  for (const { keyword } of keywords.slice(0, 3)) {
    for (const suffix of variations.slice(0, 3)) {
      const combined = `${keyword} ${suffix}`;
      if (!existing.has(combined.toLowerCase())) {
        recommended.push({
          keyword: combined,
          source: "Related",
          competition: "Medium",
          reason: `Variation of successful "${keyword}"`,
        });
      }
    }
  }

  return recommended.slice(0, 15);
}

function buildTitleSuggestions(
  keywords: { keyword: string; totalViews: number }[]
): { suggestion: string; reason: string }[] {
  const suggestions: { suggestion: string; reason: string }[] = [];
  
  for (const { keyword } of keywords.slice(0, 3)) {
    suggestions.push({
      suggestion: `Complete ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Guide`,
      reason: `"${keyword}" is your top keyword`,
    });
    suggestions.push({
      suggestion: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Tips That Work`,
      reason: `Tips format for "${keyword}"`,
    });
  }
  
  return suggestions.slice(0, 8);
}

function scoreVideo(v: Video): { id: string; title: string; score: number; issues: string[]; suggestions: string[] } {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (v.title.length >= 40 && v.title.length <= 70) score += 25;
  else {
    score += 10;
    if (v.title.length < 40) issues.push("Title too short");
    if (v.title.length > 70) issues.push("Title too long");
  }

  if (v.description.length >= 200) score += 25;
  else {
    score += 10;
    issues.push("Description under 200 chars");
  }

  if (v.tags.length >= 10) score += 25;
  else {
    score += Math.round((v.tags.length / 10) * 25);
    issues.push(`Only ${v.tags.length} tags`);
  }

  const eng = v.viewCount ? ((v.likeCount + v.commentCount) / v.viewCount) * 100 : 0;
  if (eng >= 5) score += 25;
  else score += Math.round((eng / 5) * 25);

  if (score < 75) {
    if (v.title.length < 40) suggestions.push("Expand title to 40-70 characters");
    if (v.description.length < 200) suggestions.push("Write longer description");
    if (v.tags.length < 10) suggestions.push("Add more tags");
  }

  return { id: v.id, title: v.title, score, issues, suggestions: suggestions.slice(0, 3) };
}

export async function getSeoData(videos: Video[]): Promise<SeoData> {
  const keywords = analyzeKeywords(videos);
  const recommendedKeywords = buildRecommendedKeywords(keywords, videos);
  const titleSuggestions = buildTitleSuggestions(keywords);
  const videoScores = videos.map(scoreVideo);

  return {
    keywords,
    recommendedKeywords,
    titleSuggestions,
    videoScores,
  };
}
