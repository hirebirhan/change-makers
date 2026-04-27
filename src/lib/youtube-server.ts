import { YouTubeApiResponse, ChannelStats, Video } from "@/types/youtube";

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BASE = "https://www.googleapis.com/youtube/v3";

async function fetchChannel(): Promise<ChannelStats> {
  const res = await fetch(
    `${BASE}/channels?part=snippet,statistics,brandingSettings&id=${CHANNEL_ID}&key=${API_KEY}`,
    { next: { revalidate: 300 } }
  );
  const data = await res.json();
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
  const chRes = await fetch(
    `${BASE}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`,
    { next: { revalidate: 300 } }
  );
  const chData = await chRes.json();
  const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  const plRes = await fetch(
    `${BASE}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=20&key=${API_KEY}`,
    { next: { revalidate: 300 } }
  );
  const plData = await plRes.json();
  const videoIds: string[] = (plData.items ?? []).map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  );
  if (!videoIds.length) return [];

  const vRes = await fetch(
    `${BASE}/videos?part=snippet,statistics,contentDetails,status&id=${videoIds.join(",")}&key=${API_KEY}`,
    { next: { revalidate: 300 } }
  );
  const vData = await vRes.json();

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
  for (let i = 29; i >= 0; i--) {
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
  const months: Record<string, { views: number; likes: number; comments: number; count: number }> = {};
  for (const v of videos) {
    const key = new Date(v.publishedAt).toLocaleString("en-US", { month: "long", year: "numeric" });
    if (!months[key]) months[key] = { views: 0, likes: 0, comments: 0, count: 0 };
    months[key].views += v.viewCount;
    months[key].likes += v.likeCount;
    months[key].comments += v.commentCount;
    months[key].count += 1;
  }
  return Object.entries(months)
    .slice(0, 4)
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
