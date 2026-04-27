"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useYouTubeData } from "@/lib/use-youtube-data";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/components/LoginPage";
import { useAuth } from "@/lib/auth";
import { Comment } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThumbsUp, MessageCircle, Search, SmilePlus, Meh, Frown, User } from "lucide-react";

interface CommentSummary {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positiveRate: number;
}

function timeAgo(dateString: string) {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function CommentAvatar({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  const dim = `${size}px`;
  return src ? (
    <div
      className="relative rounded-full overflow-hidden shrink-0 ring-1 ring-border"
      style={{ width: dim, height: dim, minWidth: dim }}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes={dim} />
    </div>
  ) : (
    <div
      className="rounded-full bg-muted flex items-center justify-center shrink-0 ring-1 ring-border"
      style={{ width: dim, height: dim, minWidth: dim }}
    >
      <User style={{ width: size * 0.45, height: size * 0.45 }} className="text-muted-foreground" />
    </div>
  );
}

function sentimentBadge(s: Comment["sentiment"]) {
  if (s === "positive") return <Badge variant="secondary" className="text-success bg-success/10 border-success/20 text-[10px]"><SmilePlus className="w-2.5 h-2.5 mr-1" />Positive</Badge>;
  if (s === "negative") return <Badge variant="destructive" className="text-[10px]"><Frown className="w-2.5 h-2.5 mr-1" />Negative</Badge>;
  return <Badge variant="outline" className="text-[10px]"><Meh className="w-2.5 h-2.5 mr-1" />Neutral</Badge>;
}

function CommentsPage() {
  const { data, loading: dataLoading, refresh, refreshing, lastUpdated } = useYouTubeData();
  const [comments, setComments] = useState<Comment[]>([]);
  const [summary, setSummary] = useState<CommentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<"all" | Comment["sentiment"]>("all");

  useEffect(() => {
    if (!data?.videos.length) return;
    setLoading(true);
    const topVideoIds = data.videos
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map((v) => v.id);

    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds: topVideoIds }),
    })
      .then((r) => r.json())
      .then((d) => {
        // Attach video titles
        const withTitles = d.comments.map((c: Comment) => ({
          ...c,
          videoTitle: data.videos.find((v) => v.id === c.videoId)?.title ?? "Unknown",
        }));
        setComments(withTitles);
        setSummary(d.summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [data]);

  const filtered = useMemo(() => {
    return comments
      .filter((c) => sentiment === "all" || c.sentiment === sentiment)
      .filter((c) => c.text.toLowerCase().includes(query.toLowerCase()) || c.author.toLowerCase().includes(query.toLowerCase()));
  }, [comments, sentiment, query]);

  if (dataLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell channel={data?.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="w-full px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Comments</h1>
          <p className="text-sm text-muted-foreground">Top comments from your 5 most-viewed videos with sentiment analysis</p>
        </div>

        {/* Sentiment summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <MessageCircle className="size-3.5 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-xs">Total</CardDescription>
                </div>
                <CardTitle className="text-xl tabular-nums">{summary.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                    <SmilePlus className="size-3.5 text-success" />
                  </div>
                  <CardDescription className="text-xs">Positive</CardDescription>
                </div>
                <CardTitle className="text-xl tabular-nums text-success">{summary.positive}</CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <Meh className="size-3.5 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-xs">Neutral</CardDescription>
                </div>
                <CardTitle className="text-xl tabular-nums">{summary.neutral}</CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Frown className="size-3.5 text-destructive" />
                  </div>
                  <CardDescription className="text-xs">Negative</CardDescription>
                </div>
                <CardTitle className="text-xl tabular-nums text-destructive">{summary.negative}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Sentiment bar */}
        {summary && (
          <Card size="sm">
            <CardHeader>
              <CardDescription className="text-xs">Audience Sentiment — {summary.positiveRate}% positive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                <div className="bg-success rounded-l-full transition-all" style={{ width: `${(summary.positive / summary.total) * 100}%` }} />
                <div className="bg-muted-foreground/30 transition-all" style={{ width: `${(summary.neutral / summary.total) * 100}%` }} />
                <div className="bg-destructive rounded-r-full transition-all" style={{ width: `${(summary.negative / summary.total) * 100}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[11px] text-success flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" />{Math.round((summary.positive / summary.total) * 100)}% positive</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block" />{Math.round((summary.neutral / summary.total) * 100)}% neutral</span>
                <span className="text-[11px] text-destructive flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" />{Math.round((summary.negative / summary.total) * 100)}% negative</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search comments…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-8 w-64 text-sm" />
          </div>
          <Tabs value={sentiment} onValueChange={(v) => setSentiment(v as typeof sentiment)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="positive">Positive</TabsTrigger>
              <TabsTrigger value="neutral">Neutral</TabsTrigger>
              <TabsTrigger value="negative">Negative</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Comments feed */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} size="sm"><CardContent className="h-20 animate-pulse bg-muted/30 rounded-lg" /></Card>
            ))}
          </div>
        ) : error ? (
          <Card><CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent></Card>
        ) : (
          <Tabs defaultValue="feed">
            <TabsList>
              <TabsTrigger value="feed">Comment Feed</TabsTrigger>
              <TabsTrigger value="byVideo">By Video</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-4">
              <div className="space-y-3">
                {filtered.map((comment) => (
                  <Card key={comment.id} size="sm">
                    <CardContent className="pt-3">
                      <div className="flex gap-3">
                        <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-semibold">{comment.author}</span>
                            <span className="text-[11px] text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                            {sentimentBadge(comment.sentiment)}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{comment.text}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{comment.likeCount}</span>
                            {comment.replyCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{comment.replyCount} replies</span>}
                            <span className="ml-auto truncate max-w-[200px] text-muted-foreground/60">{comment.videoTitle}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">No comments match your filters.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="byVideo" className="mt-4">
              <div className="space-y-6">
                {data?.videos.slice(0, 5).sort((a, b) => b.viewCount - a.viewCount).map((video) => {
                  const videoComments = filtered.filter((c) => c.videoId === video.id);
                  if (!videoComments.length) return null;
                  return (
                    <div key={video.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:text-primary transition-colors truncate">
                          {video.title}
                        </a>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">{videoComments.length} comments</Badge>
                      </div>
                      <div className="space-y-2">
                        {videoComments.map((comment) => (
                          <Card key={comment.id} size="sm">
                            <CardContent className="pt-3">
                              <div className="flex gap-3">
                                <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={28} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-semibold">{comment.author}</span>
                                    <span className="text-[11px] text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                                    {sentimentBadge(comment.sentiment)}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{comment.text}</p>
                                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{comment.likeCount}</span>
                                    {comment.replyCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{comment.replyCount} replies</span>}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppShell>
  );
}

export default function Comments() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <CommentsPage /> : <LoginPage />;
}
