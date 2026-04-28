"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { VideoDetailSheet } from "@/components/VideoDetailSheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Search, Eye, ThumbsUp, MessageCircle, Clock } from "lucide-react";

type SortKey = "views" | "likes" | "comments" | "date";
type FilterType = "all" | "videos" | "shorts";

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function VideosView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("views");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<Video | null>(null);

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

  const filtered = useMemo(() => {
    return data.videos
      .filter((v) => {
        const matchesQuery = v.title.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = 
          filter === "all" ? true :
          filter === "shorts" ? v.isShort :
          !v.isShort;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "views") return b.viewCount - a.viewCount;
        if (sort === "likes") return b.likeCount - a.likeCount;
        if (sort === "comments") return b.commentCount - a.commentCount;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [data, query, sort, filter]);

  const counts = useMemo(() => ({
    all: data.videos.length,
    videos: data.videos.filter(v => !v.isShort).length,
    shorts: data.videos.filter(v => v.isShort).length,
  }), [data.videos]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-xl font-bold">Video Library</h1>
              <p className="text-xs text-muted-foreground">{filtered.length} of {data.videos.length} videos</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search videos…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8 h-8 w-full sm:w-56 text-sm"
                />
              </div>
              <Tabs value={sort} onValueChange={(v) => setSort(v as SortKey)} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto grid grid-cols-4">
                  <TabsTrigger value="views" className="text-xs">Views</TabsTrigger>
                  <TabsTrigger value="likes" className="text-xs">Likes</TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
                  <TabsTrigger value="date" className="text-xs">Date</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList className="w-full sm:w-auto grid grid-cols-3">
              <TabsTrigger value="all" className="text-xs">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="videos" className="text-xs">Videos ({counts.videos})</TabsTrigger>
              <TabsTrigger value="shorts" className="text-xs">Shorts ({counts.shorts})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((video) => (
            <Card
              key={video.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden p-0 gap-0"
              onClick={() => setSelected(video)}
            >
              <div className="relative w-full aspect-video bg-muted">
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1.5">
                  {video.isShort && (
                    <span className="bg-yt-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      SHORT
                    </span>
                  )}
                  <span className="bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium line-clamp-2 leading-snug mb-2">{video.title}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(video.viewCount)}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{formatNumber(video.likeCount)}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNumber(video.commentCount)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(video.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {video.tags.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">{video.tags.length} tags</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && query && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            No videos match &ldquo;{query}&rdquo;
          </div>
        )}
      </main>

      <VideoDetailSheet video={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </AppShell>
  );
}
