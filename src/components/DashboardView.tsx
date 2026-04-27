"use client";

import { useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import ChannelOverview from "@/components/ChannelOverview";
import AnalyticsChart from "@/components/AnalyticsChart";
import VideoCard from "@/components/VideoCard";
import ReportsSection from "@/components/ReportsSection";
import MonetizationProgress from "@/components/MonetizationProgress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";

export function DashboardView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  const shorts = data.videos.filter(v => v.isShort);
  const regularVideos = data.videos.filter(v => !v.isShort);

  // Calculate total watch time hours from daily metrics (last 12 months approximation)
  const totalWatchTimeHours = useMemo(() => {
    return data.dailyMetrics.reduce((sum, metric) => sum + metric.watchTimeHours, 0);
  }, [data.dailyMetrics]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-6 py-8 space-y-6">
        <ChannelOverview stats={data.channel} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnalyticsChart data={data.dailyMetrics} />
          </div>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Top Videos</CardTitle>
              <CardDescription>Ranked by total views</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[340px]">
              <div className="space-y-1">
                {regularVideos
                  .sort((a, b) => b.viewCount - a.viewCount)
                  .map((video, index) => (
                    <VideoCard key={video.id} video={video} rank={index + 1} />
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <MonetizationProgress stats={data.channel} totalWatchTimeHours={totalWatchTimeHours} />

        {shorts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Shorts</CardTitle>
              <CardDescription>Videos under 60 seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shorts
                  .sort((a, b) => b.viewCount - a.viewCount)
                  .map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <ReportsSection reports={data.reports} />
      </main>

      <footer className="border-t border-border">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-medium">Birhan Tech Corner Analytics</span>
          <p className="text-xs text-muted-foreground">Powered by YouTube Data API v3</p>
        </div>
      </footer>
    </AppShell>
  );
}
