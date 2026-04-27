import { NextRequest, NextResponse } from "next/server";

async function fetchTrends(geo = "US"): Promise<string[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 3600 } }
    );
    const xml = await res.text();
    return [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)]
      .map((m) => m[1])
      .filter((t) => t !== "Daily Search Trends")
      .slice(0, 20);
  } catch {
    return [];
  }
}

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
      const e = map.get(word) ?? { count: 0, totalViews: 0 };
      map.set(word, { count: e.count + 1, totalViews: e.totalViews + v.viewCount });
    }
  }
  return [...map.entries()]
    .map(([keyword, { count, totalViews }]) => ({ keyword, count, totalViews }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 30);
}

function buildTitleSuggestions(
  keywords: { keyword: string; totalViews: number }[],
  trends: string[]
): { suggestion: string; reason: string }[] {
  const topKw = keywords.slice(0, 5).map((k) => k.keyword);
  const suggestions: { suggestion: string; reason: string }[] = [];
  for (const trend of trends.slice(0, 5)) {
    const match = topKw.find((kw) => trend.toLowerCase().includes(kw));
    if (match) {
      suggestions.push({
        suggestion: `${trend}: Everything You Need to Know`,
        reason: `Trending topic "${trend}" overlaps with your top keyword "${match}"`,
      });
    }
  }
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

function findTagGaps(videos: { tags: string[] }[], trends: string[]): string[] {
  const existing = new Set(videos.flatMap((v) => v.tags.map((t) => t.toLowerCase())));
  return trends.filter((t) => !existing.has(t.toLowerCase())).slice(0, 10);
}

type VideoInput = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

function buildIssues(v: VideoInput): string[] {
  const issues: string[] = [];
  if (v.title.length < 40) issues.push("Title too short (aim for 40–70 chars)");
  if (v.title.length > 70) issues.push("Title too long (aim for 40–70 chars)");
  if (v.description.length < 200) issues.push("Description under 200 characters");
  if (v.tags.length < 10) issues.push(`Only ${v.tags.length} tags (aim for 10+)`);
  return issues;
}

function buildSuggestions(v: VideoInput): string[] {
  const s: string[] = [];
  if (v.title.length < 40)
    s.push("Expand your title to 40–70 characters — longer titles give YouTube more context and rank better.");
  if (v.title.length > 70)
    s.push("Shorten your title to under 70 characters so it isn't truncated in search results.");
  if (!v.title.includes("|") && !v.title.includes(":") && !v.title.includes("-"))
    s.push('Add a separator (| or :) to split your keyword from a hook, e.g. "Main Topic | Why It Matters".');
  if (v.description.length < 200)
    s.push("Write at least 200 characters in your description — include your main keyword in the first 2 sentences.");
  if (v.description.length < 500)
    s.push("Aim for 400–800 character descriptions. Add timestamps, links, and 3–5 hashtags at the end.");
  if (v.tags.length < 5)
    s.push("Add at least 10 tags: mix broad terms, specific phrases, and your channel name.");
  else if (v.tags.length < 10)
    s.push(`You have ${v.tags.length} tags — add ${10 - v.tags.length} more. Include long-tail keyword variations.`);
  const eng = v.viewCount ? ((v.likeCount + v.commentCount) / v.viewCount) * 100 : 0;
  if (eng < 2)
    s.push("Engagement is low — add a clear CTA in the first 30 seconds asking viewers to like and comment.");
  else if (eng < 4)
    s.push("Good engagement — boost it further by ending with a question to prompt comments.");
  if (v.viewCount < 1000)
    s.push("Share this video in relevant communities and forums to drive initial traffic and signal relevance to YouTube.");
  s.push("Add end screens and cards to keep viewers watching more of your content — this improves session time.");
  s.push("Create a custom thumbnail with high contrast, a face if possible, and 3–5 bold words.");
  return s.slice(0, 5);
}

export async function POST(req: NextRequest) {
  try {
    const { videos, geo = "US" } = await req.json();
    const trends = await fetchTrends(geo);
    const keywords = analyzeKeywords(videos);
    const titleSuggestions = buildTitleSuggestions(keywords, trends);
    const tagGaps = findTagGaps(videos, trends);

    const videoScores = videos.map((v: VideoInput) => {
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
      return { id: v.id, title: v.title, score, issues: buildIssues(v), suggestions: buildSuggestions(v) };
    });

    return NextResponse.json({ trends, keywords, titleSuggestions, tagGaps, videoScores });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SEO analysis failed" },
      { status: 500 }
    );
  }
}
