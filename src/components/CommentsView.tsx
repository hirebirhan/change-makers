"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { LoginPage } from "@/components/LoginPage";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Comment, YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { ThumbsUp, MessageCircle, Search, SmilePlus, Meh, Frown, User, MessageSquare } from "lucide-react";

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
  if (s === "positive") return <Badge variant="secondary" className="text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20 text-[10px]"><SmilePlus className="w-2.5 h-2.5 mr-1" />Positive</Badge>;
  if (s === "negative") return <Badge variant="destructive" className="text-[10px]"><Frown className="w-2.5 h-2.5 mr-1" />Negative</Badge>;
  return <Badge variant="outline" className="text-[10px]"><Meh className="w-2.5 h-2.5 mr-1" />Neutral</Badge>;
}

function CommentsView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [summary, setSummary] = useState<CommentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<"all" | Comment["sentiment"]>("all");

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
        setComments(d.comments.map((c: Comment) => ({
          ...c,
          videoTitle: data.videos.find((v) => v.id === c.videoId)?.title ?? "Unknown",
        })));
        setSummary(d.summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [data]);

  const filtered = useMemo(() => comments
    .filter((c) => sentiment === "all" || c.sentiment === sentiment)
    .filter((c) => c.text.toLowerCase().includes(query.toLowerCase()) || c.author.toLowerCase().includes(query.toLowerCase())),
    [comments, sentiment, query]
  );

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            Comments
          </h1>
          <p className="text-sm text-muted-foreground mt-2 ml-[52px]">Sentiment analysis and browsing of comments across all your videos</p>
        </div>

        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total", value: summary.total, icon: MessageCircle, bg: "bg-muted", iconCn: "text-muted-foreground", valueCn: "text-foreground" },
              { label: "Positive", value: summary.positive, icon: SmilePlus, bg: "bg-green-500/10", iconCn: "text-green-600 dark:text-green-400", valueCn: "text-green-600 dark:text-green-400" },
              { label: "Neutral", value: summary.neutral, icon: Meh, bg: "bg-gray-100 dark:bg-gray-800", iconCn: "text-gray-600 dark:text-gray-400", valueCn: "text-gray-600 dark:text-gray-400" },
              { label: "Negative", value: summary.negative, icon: Frown, bg: "bg-red-500/10", iconCn: "text-red-600 dark:text-red-400", valueCn: "text-red-600 dark:text-red-400" },
            ].map(({ label, value, icon: Icon, bg, iconCn, valueCn }) => (
              <Card key={label} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`size-3 ${iconCn}`} />
                    </div>
                    <CardDescription className="text-[10px]">{label}</CardDescription>
                  </div>
                  <CardTitle className={`text-lg tabular-nums ${valueCn}`}>{value.toLocaleString()}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {summary && (
          <Card size="sm">
            <CardHeader>
              <CardDescription>Sentiment Distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 rounded-full overflow-hidden flex">
                <div className="bg-green-500" style={{ width: `${(summary.positive / summary.total) * 100}%` }} />
                <div className="bg-gray-400 dark:bg-gray-600" style={{ width: `${(summary.neutral / summary.total) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(summary.negative / summary.total) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px]">
                <span className="text-green-600 dark:text-green-400">Positive {Math.round((summary.positive / summary.total) * 100)}%</span>
                <span className="text-gray-600 dark:text-gray-400">Neutral {Math.round((summary.neutral / summary.total) * 100)}%</span>
                <span className="text-red-600 dark:text-red-400">Negative {Math.round((summary.negative / summary.total) * 100)}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search comments or authors…" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="pl-10 h-10 w-full sm:w-80 text-sm border-border/40" 
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
          <div className="grid grid-cols-1 gap-2">
            {[...Array(6)].map((_, i) => (
              <Card key={i} size="sm"><CardContent className="h-20 animate-pulse bg-muted/30 rounded-lg" /></Card>
            ))}
          </div>
        ) : error ? (
          <Card size="sm"><CardContent className="py-8 text-center text-xs text-destructive">{error}</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40">
            <CardContent className="py-16 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No comments found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or sentiment filters</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList>
              <TabsTrigger value="feed" className="gap-2"><MessageCircle className="w-3.5 h-3.5" />Comment Feed</TabsTrigger>
              <TabsTrigger value="byVideo" className="gap-2"><ThumbsUp className="w-3.5 h-3.5" />By Video</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              <div className="grid grid-cols-1 gap-2">
                {filtered.map((comment) => (
                  <Card key={comment.id} size="sm">
                    <CardContent className="pt-3">
                      <div className="flex gap-3">
                        <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-semibold">{comment.author}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                            {sentimentBadge(comment.sentiment)}
                          </div>
                          <p className="text-xs text-foreground leading-relaxed mb-2">{comment.text}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{comment.likeCount.toLocaleString()}</span>
                            {comment.replyCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{comment.replyCount} replies</span>}
                            <span className="ml-auto truncate max-w-[180px] text-muted-foreground/60 italic">{comment.videoTitle}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="byVideo" className="mt-0">
              <div className="space-y-4">
                {data.videos.sort((a, b) => b.viewCount - a.viewCount).map((video) => {
                  const videoComments = filtered.filter((c) => c.videoId === video.id);
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
                        <Badge variant="secondary" className="shrink-0 text-[10px] bg-secondary/50">{videoComments.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {videoComments.map((comment) => (
                          <Card key={comment.id} size="sm">
                            <CardContent className="pt-3">
                              <div className="flex gap-3">
                                <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={28} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-semibold">{comment.author}</span>
                                    <span className="text-[10px] text-muted-foreground">·</span>
                                    <span className="text-[10px] text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
                                    {sentimentBadge(comment.sentiment)}
                                  </div>
                                  <p className="text-xs text-foreground leading-relaxed mb-1.5">{comment.text}</p>
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{comment.likeCount.toLocaleString()}</span>
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

export default function CommentsViewWithAuth({ initialData }: { initialData: YouTubeApiResponse }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <CommentsView initialData={initialData} /> : <LoginPage />;
}
