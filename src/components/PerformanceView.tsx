"use client";

import { useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YouTubeApiResponse } from "@/types/youtube";
import { VideoPerformance } from "@/lib/analytics-utils";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { EmptyState } from "@/components/performance/EmptyState";

type TabValue = "best" | "recent" | "worst";

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

  const counts = useMemo(() => ({
    best: performance.best.length,
    recent: performance.recent.length,
    worst: performance.worst.length,
  }), [performance]);

  const currentVideos = useMemo(() => {
    if (tab === "best") return performance.best;
    if (tab === "recent") return performance.recent;
    return performance.worst;
  }, [tab, performance]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Performance</h1>
            <p className="text-xs text-muted-foreground leading-none">{currentVideos.length} videos</p>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {currentVideos.length > 0 ? (
            currentVideos.map((perf, index) => (
              <PerformanceCard key={perf.video.id} perf={perf} rank={index + 1} variant={tab} />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState />
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
