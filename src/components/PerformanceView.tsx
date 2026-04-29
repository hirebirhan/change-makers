"use client";

import { useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { YouTubeApiResponse } from "@/types/youtube";
import { analyzeVideoPerformance, VideoPerformance } from "@/lib/analytics-utils";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { TrendingUp, TrendingDown, Clock, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { EmptyState } from "@/components/performance/EmptyState";
import { PerformanceStats } from "@/components/performance/PerformanceStats";

type TabValue = "best" | "recent" | "worst";
type RangeValue = "all" | "year" | "90days" | "30days" | "7days";

const ITEMS_PER_PAGE = 8;

interface PerformanceViewProps {
  initialData: YouTubeApiResponse;
  performance: {
    best: VideoPerformance[];
    worst: VideoPerformance[];
    recent: VideoPerformance[];
  };
}

export function PerformanceView({ initialData, performance }: PerformanceViewProps) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tab, setTab] = useState<TabValue>("best");
  const [range, setRange] = useState<RangeValue>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

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

  const filteredVideos = useMemo(
    () => filterVideosByRange(data.videos, range),
    [data.videos, range]
  );

  const activePerformance = useMemo(() => {
    if (data === initialData && range === "all") return performance;
    return analyzeVideoPerformance(filteredVideos);
  }, [data, filteredVideos, initialData, performance, range]);

  const counts = useMemo(() => ({
    best: activePerformance.best.length,
    recent: activePerformance.recent.length,
    worst: activePerformance.worst.length,
  }), [activePerformance]);

  const rankedVideos = useMemo(() => {
    if (tab === "best") return activePerformance.best;
    if (tab === "recent") return activePerformance.recent;
    return activePerformance.worst;
  }, [tab, activePerformance]);

  const currentVideos = useMemo(
    () => searchPerformanceVideos(rankedVideos, query),
    [rankedVideos, query]
  );

  const totalPages = Math.max(1, Math.ceil(currentVideos.length / ITEMS_PER_PAGE));
  const paginatedVideos = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return currentVideos.slice(start, start + ITEMS_PER_PAGE);
  }, [currentVideos, page]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div className="space-y-3 border-b pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Performance</h1>
              <p className="text-xs text-muted-foreground leading-none">
                {currentVideos.length} videos matching your filters
              </p>
            </div>
            <Tabs value={tab} onValueChange={(value) => {
              setTab(value as TabValue);
              setPage(1);
            }}>
              <TabsList>
                <TabsTrigger value="best" className="h-7 text-xs px-2 gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Best ({counts.best})
                </TabsTrigger>
                <TabsTrigger value="recent" className="h-7 text-xs px-2 gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recent ({counts.recent})
                </TabsTrigger>
                <TabsTrigger value="worst" className="h-7 text-xs px-2 gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Improve ({counts.worst})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search videos"
                className="pl-9"
              />
            </div>
            <Tabs value={range} onValueChange={(value) => {
              setRange(value as RangeValue);
              setPage(1);
            }}>
              <TabsList>
                <TabsTrigger value="7days" className="h-7 text-xs px-2">7D</TabsTrigger>
                <TabsTrigger value="30days" className="h-7 text-xs px-2">30D</TabsTrigger>
                <TabsTrigger value="90days" className="h-7 text-xs px-2">90D</TabsTrigger>
                <TabsTrigger value="year" className="h-7 text-xs px-2">Year</TabsTrigger>
                <TabsTrigger value="all" className="h-7 text-xs px-2">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <PerformanceStats performance={activePerformance} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {currentVideos.length > 0 ? (
            paginatedVideos.map((perf, index) => (
              <PerformanceCard key={perf.video.id} perf={perf} rank={(page - 1) * ITEMS_PER_PAGE + index + 1} variant={tab} />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState />
            </div>
          )}
        </div>

        <PerformancePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={currentVideos.length}
          onPageChange={setPage}
        />
      </main>
    </AppShell>
  );
}

function filterVideosByRange(videos: YouTubeApiResponse["videos"], range: RangeValue) {
  if (range === "all") return videos;
  const days = range === "7days" ? 7 : range === "30days" ? 30 : range === "90days" ? 90 : 365;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return videos.filter((video) => new Date(video.publishedAt).getTime() >= cutoff);
}

function searchPerformanceVideos(videos: VideoPerformance[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return videos;
  return videos.filter((perf) => {
    const haystack = [
      perf.video.title,
      perf.video.description,
      perf.video.tags.join(" "),
    ].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

function PerformancePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-3">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems} videos
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
