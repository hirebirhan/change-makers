"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Comment, YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { ThumbsUp, MessageCircle, Search, SmilePlus, Meh, Frown, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const COMMENTS_PER_PAGE = 20;

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
  if (s === "positive") return <Badge variant="secondary" className="text-chart-1 bg-chart-1/10 border-chart-1/20 text-xs h-5 px-2"><SmilePlus className="w-3 h-3 mr-1" />Positive</Badge>;
  if (s === "negative") return <Badge variant="destructive" className="text-xs h-5 px-2"><Frown className="w-3 h-3 mr-1" />Negative</Badge>;
  return <Badge variant="outline" className="text-xs h-5 px-2"><Meh className="w-3 h-3 mr-1" />Neutral</Badge>;
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

        {summary && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total", value: summary.total, icon: MessageCircle, bg: "bg-muted", iconCn: "text-muted-foreground", valueCn: "text-foreground", percent: null },
              { label: "Positive", value: summary.positive, icon: SmilePlus, bg: "bg-chart-1/10", iconCn: "text-chart-1", valueCn: "text-chart-1", percent: Math.round((summary.positive / summary.total) * 100) },
              { label: "Neutral", value: summary.neutral, icon: Meh, bg: "bg-muted", iconCn: "text-muted-foreground", valueCn: "text-muted-foreground", percent: Math.round((summary.neutral / summary.total) * 100) },
              { label: "Negative", value: summary.negative, icon: Frown, bg: "bg-destructive/10", iconCn: "text-destructive", valueCn: "text-destructive", percent: Math.round((summary.negative / summary.total) * 100) },
            ].map(({ label, value, icon: Icon, bg, iconCn, valueCn, percent }) => (
              <Card key={label} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`size-3.5 ${iconCn}`} />
                    </div>
                    <CardDescription className="text-xs">{label}</CardDescription>
                  </div>
                  <CardTitle className={`text-xl tabular-nums ${valueCn}`}>
                    {value.toLocaleString()} {percent !== null && <span className="text-xs font-normal text-muted-foreground">({percent}%)</span>}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search comments or authors…" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="pl-9 h-9 w-full sm:w-72 text-xs" 
            />
          </div>
          <Tabs value={sentiment} onValueChange={(v) => setSentiment(v as typeof sentiment)} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="positive" className="text-xs">Positive</TabsTrigger>
              <TabsTrigger value="neutral" className="text-xs">Neutral</TabsTrigger>
              <TabsTrigger value="negative" className="text-xs">Negative</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <Card><div className="p-6 text-center text-xs text-destructive">{error}</div></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="p-10 text-center">
              <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium">No comments found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="feed" className="space-y-4">
            <TabsList>
              <TabsTrigger value="feed" className="gap-1.5 text-xs"><MessageCircle className="w-3.5 h-3.5" />Feed</TabsTrigger>
              <TabsTrigger value="byVideo" className="gap-1.5 text-xs"><ThumbsUp className="w-3.5 h-3.5" />By Video</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0 space-y-2">
              <div className="space-y-2">
                {paginatedComments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border bg-card hover:bg-muted/50 p-3 transition-colors">
                    <div className="flex gap-3">
                      <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="text-xs font-semibold">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                          {sentimentBadge(comment.sentiment)}
                        </div>
                        <p className="text-xs text-foreground leading-relaxed mb-2">{comment.text}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{comment.likeCount.toLocaleString()}</span>
                          {comment.replyCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{comment.replyCount}</span>}
                          <span className="ml-auto truncate max-w-[200px] text-muted-foreground/60 italic text-xs">{comment.videoTitle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {((currentPage - 1) * COMMENTS_PER_PAGE) + 1}-{Math.min(currentPage * COMMENTS_PER_PAGE, filtered.length)} of {filtered.length} comments
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
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
                            className="h-8 w-8 p-0 text-xs"
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
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="byVideo" className="mt-0 space-y-3">
              <div className="space-y-3">
                {data.videos.sort((a, b) => b.viewCount - a.viewCount).map((video) => {
                  const videoComments = paginatedComments.filter((c) => c.videoId === video.id);
                  if (!videoComments.length) return null;
                  return (
                    <div key={video.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <a 
                          href={`https://www.youtube.com/watch?v=${video.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-semibold hover:text-primary transition-colors line-clamp-1 flex-1"
                        >
                          {video.title}
                        </a>
                        <Badge variant="secondary" className="shrink-0 text-xs h-5 px-2">{videoComments.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {videoComments.map((comment) => (
                          <div key={comment.id} className="rounded-lg border bg-card hover:bg-muted/50 p-3 transition-colors">
                            <div className="flex gap-3">
                              <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={28} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                  <span className="text-xs font-semibold">{comment.author}</span>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                                  {sentimentBadge(comment.sentiment)}
                                </div>
                                <p className="text-xs text-foreground leading-relaxed mb-2">{comment.text}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{comment.likeCount.toLocaleString()}</span>
                                  {comment.replyCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{comment.replyCount}</span>}
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
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {((currentPage - 1) * COMMENTS_PER_PAGE) + 1}-{Math.min(currentPage * COMMENTS_PER_PAGE, filtered.length)} of {filtered.length} comments
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
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
                            className="h-8 w-8 p-0 text-xs"
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
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
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
