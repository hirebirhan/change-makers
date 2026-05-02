"use client";

import { useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import ChannelOverview from "@/components/ChannelOverview";
import AnalyticsChart from "@/components/AnalyticsChart";
import ReportsSection from "@/components/ReportsSection";
import MonetizationProgress from "@/components/MonetizationProgress";
import { Badge } from "@/components/ui/badge";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ShortsSection } from "@/components/dashboard/ShortsSection";
import { TopVideosCard } from "@/components/dashboard/TopVideosCard";
import {
  DateRange,
  getChannelStatsForRange,
  getFilteredDashboardData,
  getTotalWatchTimeHours,
  splitVideosByFormat,
} from "@/components/dashboard/dashboard-metrics";

export function DashboardView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30days');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const result = await fetchYouTubeAnalytics();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Failed to refresh YouTube data");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredData = useMemo(() => getFilteredDashboardData(data, dateRange), [data, dateRange]);
  const { filteredChannelStats, trends } = useMemo(
    () => getChannelStatsForRange(data, filteredData.videos, dateRange),
    [data, filteredData.videos, dateRange]
  );
  const { shorts, regularVideos } = useMemo(
    () => splitVideosByFormat(filteredData.videos),
    [filteredData.videos]
  );
  const totalWatchTimeHours = useMemo(
    () => getTotalWatchTimeHours(filteredData.dailyMetrics),
    [filteredData.dailyMetrics]
  );

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 md:px-6 py-5 space-y-5">
        <DashboardHeader dateRange={dateRange} onDateRangeChange={setDateRange} />

        {refreshError && (
          <Badge variant="destructive" className="h-auto w-fit max-w-full whitespace-normal px-3 py-1.5 text-xs">
            {refreshError}
          </Badge>
        )}

        <ChannelOverview stats={filteredChannelStats} totalWatchTimeHours={totalWatchTimeHours} trends={trends} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AnalyticsChart data={filteredData.dailyMetrics} />
          </div>
          <TopVideosCard videos={regularVideos} />
        </div>

        <ShortsSection shorts={shorts} />

        <MonetizationProgress stats={data.channel} totalWatchTimeHours={totalWatchTimeHours} />

        <ReportsSection reports={data.reports} />
      </main>
    </AppShell>
  );
}
