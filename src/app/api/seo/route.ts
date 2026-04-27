import { NextRequest, NextResponse } from "next/server";

// ── Google Trends RSS (no API key required) ──────────────────────────────────
async function fetchTrends(geo = "US"): Promise<string[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 3600 } }
    );
    const xml = await res.text();
    const titles = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)]
      .map((m) => m[1])
      .filter((t) => t !== "Daily Search Trends");
    return titles.slice(0, 20);
  } catch {
    return [];
  }
}

// ── Keyword frequency from video titles + tags ───────────────────────────────
function analyzeKeywords(
  videos: { title: string; tags: string[]; viewCount: number }[]
): { keyword: string; count: number; totalViews: number }[] {
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
      const existing = map.get(word) ?? { count: 0, totalViews: 0 };
      map.set(word, { count: existing.count + 1, totalViews: existing.totalViews + v.viewCount });
    }
  }

  return [...map.entries()]
    .map(([keyword, { count, totalViews }]) => ({ keyword, count, totalViews }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 30);
}

// ── Title suggestions based on top keywords + trends ─────────────────────────
function buildTitleSuggestions(
  keywords: { keyword: string; totalViews: number }[],
  trends: string[]
): { suggestion: string; reason: string }[] {
  const topKw = keywords.slice(0, 5).map((k) => k.keyword);
  const suggestions: { suggestion: string; reason: string }[] = [];

  // Trend-keyword intersections
  for (const trend of trends.slice(0, 5)) {
    const match = topKw.find((kw) => trend.toLowerCase().includes(kw));
    if (match) {
      suggestions.push({
        suggestion: `${trend}: Everything You Need to Know`,
        reason: `Trending topic "${trend}" overlaps with your top keyword "${match}"`,
      });
    }
  }

  // High-view keyword patterns
  for (const kw of topKw.slice(0, 3)) {
    suggestions.push({
      suggestion: `The Ultimate Guide to ${kw.charAt(0).toUpperCase() + kw.slice(1)} in ${new Date().getFullYear()}`,
      reason: `"${kw}" drives high views on your channel — evergreen format`,
    });
    suggestions.push({
      suggestion: `${kw.charAt(0).toUpperCase() + kw.slice(1)} Tips That Actually Work`,
      reason: `High-CTR title pattern for your top keyword "${kw}"`,
    });
  }

  return suggestions.slice(0, 8);
}

// ── Tag gap analysis ──────────────────────────────────────────────────────────
function findTagGaps(
  videos: { tags: string[]; viewCount: number }[],
  trends: string[]
): string[] {
  const existingTags = new Set(videos.flatMap((v) => v.tags.map((t) => t.toLowerCase())));
  return trends
    .filter((t) => !existingTags.has(t.toLowerCase()))
    .slice(0, 10);
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { videos, geo = "US" } = await req.json();

    const [trends] = await Promise.all([fetchTrends(geo)]);
    const keywords = analyzeKeywords(videos);
    const titleSuggestions = buildTitleSuggestions(keywords, trends);
    const tagGaps = findTagGaps(videos, trends);

    // Per-video SEO score (0-100)
    const videoScores = videos.map((v: { id: string; title: string; description: string; tags: string[]; viewCount: number; likeCount: number; commentCount: number }) => {
      let score = 0;
      if (v.title.length >= 40 && v.title.length <= 70) score += 25;
      else if (v.title.length > 0) score += 10;
      if (v.description.length >= 200) score += 25;
      else if (v.description.length > 0) score += 10;
      if (v.tags.length >= 10) score += 25;
      else if (v.tags.length > 0) score += Math.round((v.tags.length / 10) * 25);
      const eng = v.viewCount ? ((v.likeCount + v.commentCount) / v.viewCount) * 100 : 0;
      if (eng >= 5) score += 25;
      else score += Math.round((eng / 5) * 25);
      return { id: v.id, title: v.title, score, issues: buildIssues(v) };
    });

    return NextResponse.json({ trends, keywords, titleSuggestions, tagGaps, videoScores });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SEO analysis failed" },
      { status: 500 }
    );
  }
}

function buildIssues(v: { title: string; description: string; tags: string[] }): string[] {
  const issues: string[] = [];
  if (v.title.length < 40) issues.push("Title too short (aim for 40–70 chars)");
  if (v.title.length > 70) issues.push("Title too long (aim for 40–70 chars)");
  if (v.description.length < 200) issues.push("Description under 200 characters");
  if (v.tags.length < 10) issues.push(`Only ${v.tags.length} tags (aim for 10+)`);
  return issues;
}
