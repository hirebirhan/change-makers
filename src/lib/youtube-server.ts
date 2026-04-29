import { YouTubeApiResponse, ChannelStats, Video } from "@/types/youtube";

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BASE = "https://www.googleapis.com/youtube/v3";

function assertYouTubeEnv() {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not configured");
  if (!CHANNEL_ID) throw new Error("YOUTUBE_CHANNEL_ID is not configured");
}

async function fetchYouTube<T>(path: string, params: Record<string, string>): Promise<T> {
  assertYouTubeEnv();
  const apiKey = API_KEY as string;
  const url = new URL(`${BASE}/${path}`);
  Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url, { next: { revalidate: 300 } });
  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.message || `YouTube API request failed with ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

type YouTubeListResponse<T> = {
  items?: T[];
};

async function fetchChannel(): Promise<ChannelStats> {
  const data = await fetchYouTube<YouTubeListResponse<{
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      thumbnails?: { high?: { url: string }; default?: { url: string } };
    };
    statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
    brandingSettings?: { image?: { bannerExternalUrl?: string } };
  }>>("channels", {
    part: "snippet,statistics,brandingSettings",
    id: CHANNEL_ID ?? "",
  });
  const ch = data.items?.[0];
  if (!ch) throw new Error("Channel not found");
  return {
    channelName: ch.snippet.title,
    channelDescription: ch.snippet.description,
    profileImageUrl: ch.snippet.thumbnails?.high?.url ?? ch.snippet.thumbnails?.default?.url ?? "",
    bannerImageUrl: ch.brandingSettings?.image?.bannerExternalUrl ?? "",
    customUrl: ch.snippet.customUrl ?? "",
    subscriberCount: parseInt(ch.statistics.subscriberCount ?? "0"),
    viewCount: parseInt(ch.statistics.viewCount ?? "0"),
    videoCount: parseInt(ch.statistics.videoCount ?? "0"),
    totalEngagement: 0,
  };
}

async function fetchVideos(): Promise<Video[]> {
  const chData = await fetchYouTube<YouTubeListResponse<{
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>>("channels", {
    part: "contentDetails",
    id: CHANNEL_ID ?? "",
  });
  const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  const plData = await fetchYouTube<YouTubeListResponse<{
    contentDetails: { videoId: string };
  }>>("playlistItems", {
    part: "contentDetails",
    playlistId: uploadsId,
    maxResults: "20",
  });
  const videoIds: string[] = (plData.items ?? []).map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  );
  if (!videoIds.length) return [];

  const vData = await fetchYouTube<YouTubeListResponse<{
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: { maxres?: { url: string }; high?: { url: string }; default?: { url: string } };
      publishedAt: string;
      tags?: string[];
    };
    statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
    contentDetails: { duration: string };
    status: { privacyStatus: string };
  }>>("videos", {
    part: "snippet,statistics,contentDetails,status",
    id: videoIds.join(","),
  });

  return (vData.items ?? [])
    .filter((v: { status: { privacyStatus: string } }) => v.status.privacyStatus === "public")
    .map((v: {
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: { maxres?: { url: string }; high?: { url: string }; default?: { url: string } };
        publishedAt: string;
        tags?: string[];
      };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }) => {
      const durationSeconds = parseDurationToSeconds(v.contentDetails.duration);
      return {
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnailUrl:
          v.snippet.thumbnails?.maxres?.url ??
          v.snippet.thumbnails?.high?.url ??
          v.snippet.thumbnails?.default?.url ?? "",
        publishedAt: v.snippet.publishedAt,
        viewCount: parseInt(v.statistics.viewCount ?? "0"),
        likeCount: parseInt(v.statistics.likeCount ?? "0"),
        commentCount: parseInt(v.statistics.commentCount ?? "0"),
        duration: formatDuration(v.contentDetails.duration),
        durationSeconds,
        isShort: durationSeconds <= 60,
        tags: v.snippet.tags ?? [],
      };
    });
}

function parseDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  return h * 3600 + m * 60 + s;
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function buildDailyMetrics(videos: { publishedAt: string; viewCount: number }[]) {
  const today = new Date();
  const days: Record<string, number> = {};
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days[d.toISOString().split("T")[0]] = 0;
  }
  const dateKeys = Object.keys(days);
  for (const v of videos) {
    const pubDate = v.publishedAt.split("T")[0];
    const activeDays = dateKeys.filter((d) => d >= pubDate);
    if (!activeDays.length) continue;
    const viewsPerDay = Math.round(v.viewCount / activeDays.length);
    for (const d of activeDays) days[d] += viewsPerDay;
  }
  return dateKeys.map((date) => {
    const views = days[date];
    return {
      date,
      views,
      watchTimeHours: Math.round(views * 0.07),
      subscribersGained: Math.round(views * 0.015),
      subscribersLost: Math.round(views * 0.003),
      subscribedViews: Math.round(views * 0.35),
      unsubscribedViews: Math.round(views * 0.65),
    };
  });
}

function buildMonthlyReports(videos: { publishedAt: string; viewCount: number; likeCount: number; commentCount: number }[]) {
  const now = new Date();
  const last12Months: Record<string, { views: number; likes: number; comments: number; count: number; date: Date }> = {};
  
  // Initialize last 12 months (from 11 months ago to current month)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    last12Months[key] = { views: 0, likes: 0, comments: 0, count: 0, date: d };
  }
  
  // Aggregate video data only for videos published in the last 12 months
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  
  for (const v of videos) {
    const pubDate = new Date(v.publishedAt);
    
    // Only include videos from the last 12 months
    if (pubDate >= twelveMonthsAgo) {
      const key = pubDate.toLocaleString("en-US", { month: "short", year: "numeric" });
      if (last12Months[key]) {
        last12Months[key].views += v.viewCount;
        last12Months[key].likes += v.likeCount;
        last12Months[key].comments += v.commentCount;
        last12Months[key].count += 1;
      }
    }
  }
  
  // Return in chronological order (oldest to newest)
  return Object.entries(last12Months)
    .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
    .map(([month, { views, likes, comments, count }]) => ({
      month,
      totalViews: views,
      totalWatchTimeHours: Math.round(views * 0.07),
      newSubscribers: Math.round(views * 0.015),
      topVideos: [],
      avgViewsPerVideo: count ? Math.round(views / count) : 0,
      engagementRate: views ? parseFloat((((likes + comments) / views) * 100).toFixed(1)) : 0,
    }));
}

export async function getYouTubeData(): Promise<YouTubeApiResponse> {
  const [channel, videos] = await Promise.all([fetchChannel(), fetchVideos()]);
  const totalEngagement = videos.reduce((sum, v) => sum + v.likeCount + v.commentCount, 0);
  return {
    success: true,
    channel: { ...channel, totalEngagement },
    videos,
    dailyMetrics: buildDailyMetrics(videos),
    reports: buildMonthlyReports(videos),
  };
}
