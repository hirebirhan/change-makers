"use client";

import { useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import ChannelOverview from "@/components/ChannelOverview";
import AnalyticsChart from "@/components/AnalyticsChart";
import VideoCard from "@/components/VideoCard";
import ReportsSection from "@/components/ReportsSection";
import MonetizationProgress from "@/components/MonetizationProgress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Calendar } from "lucide-react";

type DateRange = 'lifetime' | 'year' | '30days' | '7days';

export function DashboardView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30days');

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

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (dateRange) {
      case '7days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'lifetime':
      default:
        cutoffDate = new Date(0); // Beginning of time
        break;
    }

    // Filter daily metrics
    const filteredMetrics = data.dailyMetrics.filter(metric => 
      new Date(metric.date) >= cutoffDate
    );

    // Filter videos
    const filteredVideos = data.videos.filter(video => 
      new Date(video.publishedAt) >= cutoffDate
    );

    return {
      ...data,
      dailyMetrics: filteredMetrics,
      videos: filteredVideos,
    };
  }, [data, dateRange]);

  // Calculate filtered channel stats based on date range
  const filteredChannelStats = useMemo(() => {
    // Calculate stats from filtered videos
    const totalViews = filteredData.videos.reduce((sum, v) => sum + v.viewCount, 0);
    const totalEngagement = filteredData.videos.reduce((sum, v) => sum + v.likeCount + v.commentCount, 0);
    const videoCount = filteredData.videos.length;

    return {
      ...data.channel,
      viewCount: totalViews,
      videoCount: videoCount,
      totalEngagement: totalEngagement,
      // Keep subscriber count as is (it's a cumulative metric)
    };
  }, [filteredData.videos, data.channel]);

  const shorts = filteredData.videos.filter(v => v.isShort);
  const regularVideos = filteredData.videos.filter(v => !v.isShort);

  // Calculate total watch time hours from filtered daily metrics
  const totalWatchTimeHours = useMemo(() => {
    return filteredData.dailyMetrics.reduce((sum, metric) => sum + metric.watchTimeHours, 0);
  }, [filteredData.dailyMetrics]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        {/* Header with Date Range Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground leading-none">Channel performance overview</p>
          </div>
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <TabsList>
              <TabsTrigger value="7days" className="text-xs">7 Days</TabsTrigger>
              <TabsTrigger value="30days" className="text-xs">30 Days</TabsTrigger>
              <TabsTrigger value="year" className="text-xs">Year</TabsTrigger>
              <TabsTrigger value="lifetime" className="text-xs">Lifetime</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ChannelOverview stats={filteredChannelStats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AnalyticsChart data={filteredData.dailyMetrics} />
          </div>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top Videos</CardTitle>
              <CardDescription className="text-xs">Ranked by total views</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[340px]">
              <div className="space-y-1">
                {regularVideos
                  .sort((a, b) => b.viewCount - a.viewCount)
                  .slice(0, 10)
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
              <CardTitle className="text-base font-semibold">Shorts</CardTitle>
              <CardDescription className="text-xs">Videos under 60 seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-medium">Birhan Tech Corner Analytics</span>
          <p className="text-xs text-muted-foreground">Powered by YouTube Data API v3</p>
        </div>
      </footer>
    </AppShell>
  );
}
