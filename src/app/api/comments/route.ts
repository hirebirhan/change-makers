import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE = "https://www.googleapis.com/youtube/v3";

// Basic keyword-based sentiment — no external dependency needed
function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const t = text.toLowerCase();
  const pos = ["great","amazing","love","awesome","excellent","fantastic","wonderful","best","thank","helpful","good","nice","perfect","brilliant","outstanding","incredible","superb","enjoyed","learned","useful"];
  const neg = ["bad","terrible","awful","hate","worst","boring","useless","waste","disappointing","poor","horrible","dislike","wrong","misleading","confusing","annoying","trash","garbage"];
  const posScore = pos.filter((w) => t.includes(w)).length;
  const negScore = neg.filter((w) => t.includes(w)).length;
  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

export async function POST(req: NextRequest) {
  try {
    const { videoIds } = await req.json() as { videoIds: string[] };
    if (!videoIds?.length) return NextResponse.json({ comments: [] });

    // Fetch top 10 comments per video in parallel (max 5 videos to stay within quota)
    const limited = videoIds.slice(0, 5);
    const results = await Promise.allSettled(
      limited.map(async (videoId) => {
        const res = await fetch(
          `${BASE}/commentThreads?part=snippet&videoId=${videoId}&maxResults=10&order=relevance&key=${API_KEY}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!data.items) return [];
        return data.items.map((item: {
          id: string;
          snippet: {
            videoId: string;
            topLevelComment: {
              id: string;
              snippet: {
                authorDisplayName: string;
                authorProfileImageUrl: string;
                textDisplay: string;
                likeCount: number;
                publishedAt: string;
              };
            };
            totalReplyCount: number;
          };
        }) => {
          const c = item.snippet.topLevelComment.snippet;
          return {
            id: item.snippet.topLevelComment.id,
            videoId: item.snippet.videoId,
            author: c.authorDisplayName,
            authorProfileImageUrl: c.authorProfileImageUrl,
            text: c.textDisplay.replace(/<[^>]+>/g, ""), // strip HTML
            likeCount: c.likeCount,
            replyCount: item.snippet.totalReplyCount,
            publishedAt: c.publishedAt,
            sentiment: detectSentiment(c.textDisplay),
          };
        });
      })
    );

  interface CommentItem {
    id: string;
    videoId: string;
    author: string;
    authorProfileImageUrl: string;
    text: string;
    likeCount: number;
    replyCount: number;
    publishedAt: string;
    sentiment: "positive" | "neutral" | "negative";
  }

    const comments: CommentItem[] = results
      .filter((r): r is PromiseFulfilledResult<CommentItem[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .sort((a, b) => b.likeCount - a.likeCount);

    // Sentiment summary
    const total = comments.length || 1;
    const summary = {
      positive: comments.filter((c) => c.sentiment === "positive").length,
      neutral: comments.filter((c) => c.sentiment === "neutral").length,
      negative: comments.filter((c) => c.sentiment === "negative").length,
      total: comments.length,
      positiveRate: Math.round((comments.filter((c) => c.sentiment === "positive").length / total) * 100),
    };

    return NextResponse.json({ comments, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
