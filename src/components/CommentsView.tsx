"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Comment, YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
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

interface CommentSummary {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positiveRate: number;
}

export function CommentsView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [summary, setSummary] = useState<CommentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<"all" | Comment["sentiment"]>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await fetchYouTubeAnalytics();
      setData(result);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!data.videos.length) return;
    setLoading(true);
    const allVideoIds = data.videos.map((v) => v.id);

    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds: allVideoIds }),
    })
      .then((r) => r.json())
      .then((d) => {
        const commentsWithTitles = d.comments.map((c: Comment) => ({
          ...c,
          videoTitle: data.videos.find((v) => v.id === c.videoId)?.title ?? "Unknown",
        }));
        setComments(commentsWithTitles);
        setSummary(d.summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [data]);

  const filtered = useMemo(() => {
    const result = comments
      .filter((c) => sentiment === "all" || c.sentiment === sentiment)
      .filter((c) => c.text.toLowerCase().includes(query.toLowerCase()) || c.author.toLowerCase().includes(query.toLowerCase()));
    setCurrentPage(1);
    return result;
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
          onQueryChange={setQuery}
          onSentimentChange={setSentiment}
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
