import "server-only";

import type { Comment, Video } from "@/types/youtube";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE = "https://www.googleapis.com/youtube/v3";

export interface CommentSummary {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positiveRate: number;
}

interface YouTubeCommentThread {
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
}

interface YouTubeCommentResponse {
  items?: YouTubeCommentThread[];
}

function detectSentiment(text: string): Comment["sentiment"] {
  const value = text.toLowerCase();
  const positive = ["great","amazing","love","awesome","excellent","fantastic","wonderful","best","thank","helpful","good","nice","perfect","brilliant","outstanding","incredible","superb","enjoyed","learned","useful"];
  const negative = ["bad","terrible","awful","hate","worst","boring","useless","waste","disappointing","poor","horrible","dislike","wrong","misleading","confusing","annoying","trash","garbage"];
  const positiveScore = positive.filter((word) => value.includes(word)).length;
  const negativeScore = negative.filter((word) => value.includes(word)).length;
  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

export async function fetchCommentsForVideos(videoIds: string[], videos: Pick<Video, "id" | "title">[] = []) {
  if (!videoIds.length) return { comments: [], summary: buildSummary([]) };
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not configured");

  const titles = new Map(videos.map((video) => [video.id, video.title]));
  const results = await Promise.allSettled(videoIds.map(fetchCommentsForVideo));
  const comments = results
    .filter((result): result is PromiseFulfilledResult<Comment[]> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .map((comment) => ({
      ...comment,
      videoTitle: titles.get(comment.videoId) ?? comment.videoTitle,
    }))
    .sort((a, b) => b.likeCount - a.likeCount);

  return { comments, summary: buildSummary(comments) };
}

async function fetchCommentsForVideo(videoId: string): Promise<Comment[]> {
  const url = new URL(`${BASE}/commentThreads`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", "100");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", API_KEY as string);

  const response = await fetch(url, { next: { revalidate: 300 } });
  const data = (await response.json()) as YouTubeCommentResponse & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Failed to fetch comments for ${videoId}`);

  return (data.items ?? []).map((item) => {
    const comment = item.snippet.topLevelComment.snippet;
    return {
      id: item.snippet.topLevelComment.id,
      videoId: item.snippet.videoId,
      videoTitle: "Unknown",
      author: comment.authorDisplayName,
      authorProfileImageUrl: comment.authorProfileImageUrl,
      text: comment.textDisplay.replace(/<[^>]+>/g, ""),
      likeCount: comment.likeCount,
      replyCount: item.snippet.totalReplyCount,
      publishedAt: comment.publishedAt,
      sentiment: detectSentiment(comment.textDisplay),
    };
  });
}

function buildSummary(comments: Comment[]): CommentSummary {
  const positive = comments.filter((comment) => comment.sentiment === "positive").length;
  const neutral = comments.filter((comment) => comment.sentiment === "neutral").length;
  const negative = comments.filter((comment) => comment.sentiment === "negative").length;
  const total = comments.length;

  return {
    positive,
    neutral,
    negative,
    total,
    positiveRate: total ? Math.round((positive / total) * 100) : 0,
  };
}
