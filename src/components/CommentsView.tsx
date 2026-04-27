"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Comment, YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { ThumbsUp, MessageCircle, Search, SmilePlus, Meh, Frown, User, ChevronLeft, ChevronRight, Lightbulb, TrendingUp, HelpCircle } from "lucide-react";

const COMMENTS_PER_PAGE = 20;
import { Skeleton } from "./ui/skeleton";

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
    <div className="relative rounded-full overflow-hidden shrink-0 ring-1 ring-border" style={{ width: dim, height: dim, minWidth: dim }}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={dim} />
    </div>
  ) : (
    <div className="rounded-full bg-muted flex items-center justify-center shrink-0 ring-1 ring-border" style={{ width: dim, height: dim, minWidth: dim }}>
      <User style={{ width: size * 0.45, height: size * 0.45 }} className="text-muted-foreground" />
    </div>
  );
}

function sentimentBadge(s: Comment["sentiment"]) {
  if (s === "positive") return <Badge variant="secondary" className="text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20 text-[10px] h-4 px-1.5"><SmilePlus className="w-2.5 h-2.5 mr-0.5" />Positive</Badge>;
  if (s === "negative") return <Badge variant="destructive" className="text-[10px] h-4 px-1.5"><Frown className="w-2.5 h-2.5 mr-0.5" />Negative</Badge>;
  return <Badge variant="outline" className="text-[10px] h-4 px-1.5"><Meh className="w-2.5 h-2.5 mr-0.5" />Neutral</Badge>;
}

export function CommentsView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [summary, setSummary] = useState<CommentSummary | null>(null);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
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
    setCurrentPage(1); // Reset to first page when filters change
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
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight">Comments</h1>
          <p className="text-xs text-muted-foreground mt-1">Sentiment analysis across all your videos</p>
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: summary.total, icon: MessageCircle, bg: "bg-muted", iconCn: "text-muted-foreground", valueCn: "text-foreground" },
              { label: "Positive", value: summary.positive, icon: SmilePlus, bg: "bg-green-500/10", iconCn: "text-green-600 dark:text-green-400", valueCn: "text-green-600 dark:text-green-400" },
              { label: "Neutral", value: summary.neutral, icon: Meh, bg: "bg-gray-100 dark:bg-gray-800", iconCn: "text-gray-600 dark:text-gray-400", valueCn: "text-gray-600 dark:text-gray-400" },
              { label: "Negative", value: summary.negative, icon: Frown, bg: "bg-red-500/10", iconCn: "text-red-600 dark:text-red-400", valueCn: "text-red-600 dark:text-red-400" },
            ].map(({ label, value, icon: Icon, bg, iconCn, valueCn }) => (
              <Card key={label} size="sm">
                <CardHeader className="space-y-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <CardDescription className="text-[10px] font-medium uppercase tracking-wide">{label}</CardDescription>
                    <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`size-3 ${iconCn}`} />
                    </div>
                  </div>
                  <CardTitle className={`text-2xl tabular-nums ${valueCn}`}>{value.toLocaleString()}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {summary && (
          <Card size="sm">
            <CardContent className="py-3">
              <div className="h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-green-500" style={{ width: `${(summary.positive / summary.total) * 100}%` }} />
                <div className="bg-gray-400 dark:bg-gray-600" style={{ width: `${(summary.neutral / summary.total) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(summary.negative / summary.total) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px]">
                <span className="text-green-600 dark:text-green-400">{Math.round((summary.positive / summary.total) * 100)}% Positive</span>
                <span className="text-gray-600 dark:text-gray-400">{Math.round((summary.neutral / summary.total) * 100)}% Neutral</span>
                <span className="text-red-600 dark:text-red-400">{Math.round((summary.negative / summary.total) * 100)}% Negative</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Ideas Section */}
        {contentIdeas.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Content Ideas from Comments</CardTitle>
                    <CardDescription className="text-xs">AI-generated video topics based on audience questions and requests</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoadingIdeas(true);
                    fetch("/api/content-ideas", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ comments: comments.slice(0, 100) }),
                    })
                      .then((r) => r.json())
                      .then((result) => setContentIdeas(result.ideas || []))
                      .catch((e) => console.error("Failed to generate content ideas:", e))
                      .finally(() => setLoadingIdeas(false));
                  }}
                  disabled={loadingIdeas}
                  className="h-7 text-xs"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {contentIdeas.map((idea, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-background/60 border border-border/40">
                  <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-xs leading-relaxed flex-1">{idea}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {loadingIdeas && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-6 text-center">
              <Lightbulb className="w-6 h-6 mx-auto text-primary/50 mb-2 animate-pulse" />
              <p className="text-xs font-medium">Analyzing comments for content ideas...</p>
            </CardContent>
          </Card>
        )}

        {!loadingIdeas && !contentIdeas.length && comments.length > 0 && (
          <Card className="border-border/40">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Get AI-powered content ideas</p>
                  <p className="text-[10px] text-muted-foreground">Analyze comments to discover what your audience wants</p>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setLoadingIdeas(true);
                  fetch("/api/content-ideas", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ comments: comments.slice(0, 100) }),
                  })
                    .then((r) => r.json())
                    .then((result) => setContentIdeas(result.ideas || []))
                    .catch((e) => console.error("Failed to generate content ideas:", e))
                    .finally(() => setLoadingIdeas(false));
                }}
                className="h-7 text-xs"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Generate Ideas
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search comments or authors…" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="pl-9 h-8 w-full sm:w-72 text-xs border-border/40" 
            />
          </div>
          <Tabs value={sentiment} onValueChange={(v) => setSentiment(v as typeof sentiment)} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto h-8 p-0.5">
              <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
              <TabsTrigger value="positive" className="text-xs h-7">Positive</TabsTrigger>
              <TabsTrigger value="neutral" className="text-xs h-7">Neutral</TabsTrigger>
              <TabsTrigger value="negative" className="text-xs h-7">Negative</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="space-y-1.5">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <Card size="sm"><CardContent className="py-6 text-center text-xs text-destructive">{error}</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40">
            <CardContent className="py-10 text-center">
              <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium">No comments found</p>
              <p className="text-[10px] text-muted-foreground mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="feed" className="space-y-3">
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="feed" className="gap-1.5 text-xs h-7"><MessageCircle className="w-3 h-3" />Feed</TabsTrigger>
              <TabsTrigger value="byVideo" className="gap-1.5 text-xs h-7"><ThumbsUp className="w-3 h-3" />By Video</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              <div className="space-y-1.5">
                {paginatedComments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border/40 bg-card hover:bg-accent/5 p-2.5 transition-all">
                    <div className="flex gap-2.5">
                      <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[11px] font-semibold">{comment.author}</span>
                          <span className="text-[9px] text-muted-foreground">·</span>
                          <span className="text-[9px] text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                          {sentimentBadge(comment.sentiment)}
                        </div>
                        <p className="text-[11px] text-foreground leading-relaxed mb-1.5">{comment.text}</p>
                        <div className="flex items-center gap-2.5 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" />{comment.likeCount.toLocaleString()}</span>
                          {comment.replyCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" />{comment.replyCount}</span>}
                          <span className="ml-auto truncate max-w-[200px] text-muted-foreground/60 italic text-[9px]">{comment.videoTitle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">
                    Showing {((currentPage - 1) * COMMENTS_PER_PAGE) + 1}-{Math.min(currentPage * COMMENTS_PER_PAGE, filtered.length)} of {filtered.length} comments
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-7 w-7 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="byVideo" className="mt-0">
              <div className="space-y-2.5">
                {data.videos.sort((a, b) => b.viewCount - a.viewCount).map((video) => {
                  const videoComments = paginatedComments.filter((c) => c.videoId === video.id);
                  if (!videoComments.length) return null;
                  return (
                    <div key={video.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <a 
                          href={`https://www.youtube.com/watch?v=${video.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] font-semibold hover:text-primary transition-colors line-clamp-1 flex-1"
                        >
                          {video.title}
                        </a>
                        <Badge variant="secondary" className="shrink-0 text-[9px] bg-secondary/50 h-4 px-1.5">{videoComments.length}</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {videoComments.map((comment) => (
                          <div key={comment.id} className="rounded-lg border border-border/40 bg-card hover:bg-accent/5 p-2.5 transition-all">
                            <div className="flex gap-2.5">
                              <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={24} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="text-[11px] font-semibold">{comment.author}</span>
                                  <span className="text-[9px] text-muted-foreground">·</span>
                                  <span className="text-[9px] text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                                  {sentimentBadge(comment.sentiment)}
                                </div>
                                <p className="text-[11px] text-foreground leading-relaxed mb-1">{comment.text}</p>
                                <div className="flex items-center gap-2.5 text-[9px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" />{comment.likeCount.toLocaleString()}</span>
                                  {comment.replyCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" />{comment.replyCount}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">
                    Showing {((currentPage - 1) * COMMENTS_PER_PAGE) + 1}-{Math.min(currentPage * COMMENTS_PER_PAGE, filtered.length)} of {filtered.length} comments
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-7 w-7 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppShell>
  );
}

