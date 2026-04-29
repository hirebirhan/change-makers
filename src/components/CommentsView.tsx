"use client";

import { useState, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Comment, YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import type { CommentSummary } from "@/lib/comments-server";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { SummaryCards } from "@/components/comments/SummaryCards";
import { CommentFilters } from "@/components/comments/CommentFilters";
import { LoadingState } from "@/components/comments/LoadingState";
import { ErrorState } from "@/components/comments/ErrorState";
import { EmptyState } from "@/components/comments/EmptyState";
import { CommentsFeed } from "@/components/comments/CommentsFeed";
import { CommentsByVideo } from "@/components/comments/CommentsByVideo";
import { Pagination } from "@/components/comments/Pagination";

const COMMENTS_PER_PAGE = 20;

interface CommentsData {
  comments: Comment[];
  summary: CommentSummary;
}

export function CommentsView({
  initialData,
  initialCommentsData,
}: {
  initialData: YouTubeApiResponse;
  initialCommentsData: CommentsData;
}) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [comments, setComments] = useState(initialCommentsData.comments);
  const [summary, setSummary] = useState<CommentSummary | null>(initialCommentsData.summary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<"all" | Comment["sentiment"]>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError(null);
    try {
      const result = await fetchYouTubeAnalytics();
      const commentsResult = await fetchComments(result.videos);
      setData(result);
      setComments(commentsResult.comments);
      setSummary(commentsResult.summary);
      setLastUpdated(new Date());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh comments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return comments
      .filter((c) => sentiment === "all" || c.sentiment === sentiment)
      .filter((c) => c.text.toLowerCase().includes(normalizedQuery) || c.author.toLowerCase().includes(normalizedQuery));
  }, [comments, sentiment, query]);

  const totalPages = Math.ceil(filtered.length / COMMENTS_PER_PAGE);
  const paginatedComments = useMemo(() => {
    const start = (currentPage - 1) * COMMENTS_PER_PAGE;
    return filtered.slice(start, start + COMMENTS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Comments</h1>
          <p className="text-xs text-muted-foreground leading-none">Sentiment analysis across all your videos</p>
        </div>

        {summary && <SummaryCards summary={summary} />}

        <CommentFilters
          query={query}
          sentiment={sentiment}
          onQueryChange={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onSentimentChange={(value) => {
            setSentiment(value);
            setCurrentPage(1);
          }}
        />

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="feed" className="space-y-4">
            <TabsList>
              <TabsTrigger value="feed" className="gap-1.5 text-xs"><MessageCircle className="w-3.5 h-3.5" />Feed</TabsTrigger>
              <TabsTrigger value="byVideo" className="gap-1.5 text-xs"><ThumbsUp className="w-3.5 h-3.5" />By Video</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0 space-y-2">
              <CommentsFeed comments={paginatedComments} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={COMMENTS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </TabsContent>

            <TabsContent value="byVideo" className="mt-0 space-y-3">
              <CommentsByVideo videos={data.videos} comments={paginatedComments} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={COMMENTS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppShell>
  );
}

async function fetchComments(videos: YouTubeApiResponse["videos"]): Promise<CommentsData> {
  if (!videos.length) return { comments: [], summary: { positive: 0, neutral: 0, negative: 0, total: 0, positiveRate: 0 } };

  const response = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoIds: videos.map((video) => video.id) }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.statusText}`);
  }

  const result = (await response.json()) as CommentsData;
  const titles = new Map(videos.map((video) => [video.id, video.title]));

  return {
    comments: result.comments.map((comment) => ({
      ...comment,
      videoTitle: titles.get(comment.videoId) ?? comment.videoTitle,
    })),
    summary: result.summary,
  };
}
