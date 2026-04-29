import type { ChannelStats, DailyMetric, Video, YouTubeApiResponse } from "@/types/youtube";

export type DateRange = "lifetime" | "year" | "30days" | "7days";

export interface DashboardTrends {
  views: number;
  watchTime: number;
  videos: number;
}

const RANGE_DAYS: Record<Exclude<DateRange, "lifetime">, number> = {
  "7days": 7,
  "30days": 30,
  year: 365,
};

export function getFilteredDashboardData(data: YouTubeApiResponse, dateRange: DateRange) {
  const cutoffDate = getCutoffDate(dateRange);

  return {
    ...data,
    dailyMetrics: data.dailyMetrics.filter((metric) => new Date(metric.date) >= cutoffDate),
    videos: data.videos.filter((video) => new Date(video.publishedAt) >= cutoffDate),
  };
}

export function getChannelStatsForRange(
  data: YouTubeApiResponse,
  filteredVideos: Video[],
  dateRange: DateRange
): { filteredChannelStats: ChannelStats; trends?: DashboardTrends } {
  if (dateRange === "lifetime") {
    return {
      filteredChannelStats: {
        ...data.channel,
        viewCount: sumVideoViews(filteredVideos),
        videoCount: filteredVideos.length,
      },
    };
  }

  const rangeDays = RANGE_DAYS[dateRange];
  const cutoffDate = getDateDaysAgo(rangeDays);
  const previousCutoffDate = getDateDaysAgo(rangeDays * 2);
  const currentMetrics = data.dailyMetrics.filter((metric) => new Date(metric.date) >= cutoffDate);
  const previousMetrics = data.dailyMetrics.filter((metric) => {
    const date = new Date(metric.date);
    return date >= previousCutoffDate && date < cutoffDate;
  });

  const currentViews = sumMetric(currentMetrics, "views");
  const currentWatchTime = sumMetric(currentMetrics, "watchTimeHours");
  const previousViews = sumMetric(previousMetrics, "views");
  const previousWatchTime = sumMetric(previousMetrics, "watchTimeHours");
  const previousVideos = data.videos.filter((video) => {
    const date = new Date(video.publishedAt);
    return date >= previousCutoffDate && date < cutoffDate;
  }).length;

  return {
    filteredChannelStats: {
      ...data.channel,
      viewCount: currentViews,
      videoCount: filteredVideos.length,
    },
    trends: {
      views: percentChange(currentViews, previousViews),
      watchTime: percentChange(currentWatchTime, previousWatchTime),
      videos: percentChange(filteredVideos.length, previousVideos),
    },
  };
}

export function splitVideosByFormat(videos: Video[]) {
  return {
    shorts: videos.filter((video) => video.isShort),
    regularVideos: videos.filter((video) => !video.isShort),
  };
}

export function getTotalWatchTimeHours(metrics: DailyMetric[]) {
  return sumMetric(metrics, "watchTimeHours");
}

function getCutoffDate(dateRange: DateRange) {
  if (dateRange === "lifetime") return new Date(0);
  return getDateDaysAgo(RANGE_DAYS[dateRange]);
}

function getDateDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function sumMetric(metrics: DailyMetric[], key: "views" | "watchTimeHours") {
  return metrics.reduce((sum, metric) => sum + metric[key], 0);
}

function sumVideoViews(videos: Video[]) {
  return videos.reduce((sum, video) => sum + video.viewCount, 0);
}

function percentChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}
