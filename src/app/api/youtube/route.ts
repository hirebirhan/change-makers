import { NextResponse } from "next/server";

const generateDailyMetrics = () => {
  const metrics = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const baseViews = 1200 + Math.random() * 3000;
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 1.5 : 1;
    metrics.push({
      date: date.toISOString().split("T")[0],
      views: Math.round(baseViews * weekendMultiplier),
      watchTimeHours: Math.round(baseViews * 0.08 * weekendMultiplier),
      subscribersGained: Math.round((baseViews * 0.02 * weekendMultiplier)),
      subscribersLost: Math.round(Math.random() * 5),
    });
  }
  return metrics;
};

const MOCK_DATA = {
  success: true,
  channel: {
    subscriberCount: 48231,
    viewCount: 1897420,
    videoCount: 87,
    watchTimeHours: 145832,
    avgViewDuration: "4:32",
    channelName: "My Channel",
    channelDescription:
      "Creating content about technology, tutorials, and creative projects. Subscribe for weekly uploads!",
    profileImageUrl: "https://yt3.googleusercontent.com/ytc/AIdro_",
    bannerImageUrl: "https://yt3.googleusercontent.com/",
    customUrl: "@mychannel",
  },
  videos: [
    {
      id: "vid_1",
      title: "How to Build a Next.js App in 2025 - Full Tutorial",
      description: "A comprehensive guide to building modern web applications...",
      thumbnailUrl: "https://i.ytimg.com/vi/demo1/maxresdefault.jpg",
      publishedAt: "2026-04-20T10:00:00Z",
      viewCount: 15420,
      likeCount: 892,
      commentCount: 156,
      duration: "24:15",
      tags: ["nextjs", "tutorial", "webdev"],
    },
    {
      id: "vid_2",
      title: "React Server Components Explained Simply",
      description: "Understanding RSC and how they change React development...",
      thumbnailUrl: "https://i.ytimg.com/vi/demo2/maxresdefault.jpg",
      publishedAt: "2026-04-15T10:00:00Z",
      viewCount: 12350,
      likeCount: 745,
      commentCount: 98,
      duration: "18:42",
      tags: ["react", "server components", "tutorial"],
    },
    {
      id: "vid_3",
      title: "TypeScript Tips Every Developer Should Know",
      description: "Advanced TypeScript patterns and best practices...",
      thumbnailUrl: "https://i.ytimg.com/vi/demo3/maxresdefault.jpg",
      publishedAt: "2026-04-10T10:00:00Z",
      viewCount: 9870,
      likeCount: 620,
      commentCount: 87,
      duration: "15:30",
      tags: ["typescript", "tips", "programming"],
    },
    {
      id: "vid_4",
      title: "Building a Real-time Dashboard with WebSockets",
      description: "Learn how to build live updating dashboards...",
      thumbnailUrl: "https://i.ytimg.com/vi/demo4/maxresdefault.jpg",
      publishedAt: "2026-04-05T10:00:00Z",
      viewCount: 21500,
      likeCount: 1200,
      commentCount: 230,
      duration: "32:10",
      tags: ["websockets", "realtime", "dashboard"],
    },
    {
      id: "vid_5",
      title: "CSS Grid vs Flexbox - When to Use Which",
      description: "A practical comparison of CSS layout systems...",
      thumbnailUrl: "https://i.ytimg.com/vi/demo5/maxresdefault.jpg",
      publishedAt: "2026-03-28T10:00:00Z",
      viewCount: 18200,
      likeCount: 1050,
      commentCount: 175,
      duration: "21:05",
      tags: ["css", "grid", "flexbox", "tutorial"],
    },
    {
      id: "vid_6",
      title: "Docker for Developers - Complete Guide",
      description: "Containerize your applications with Docker...",
      thumbnailUrl: "https://i.ytimg.com/vi/demo6/maxresdefault.jpg",
      publishedAt: "2026-03-20T10:00:00Z",
      viewCount: 25600,
      likeCount: 1540,
      commentCount: 312,
      duration: "45:00",
      tags: ["docker", "devops", "containers"],
    },
  ],
  dailyMetrics: generateDailyMetrics(),
  reports: [
    {
      month: "April 2026",
      totalViews: 87500,
      totalWatchTimeHours: 6850,
      newSubscribers: 1240,
      topVideos: [],
      avgViewsPerVideo: 14583,
      engagementRate: 6.8,
    },
    {
      month: "March 2026",
      totalViews: 92300,
      totalWatchTimeHours: 7120,
      newSubscribers: 1380,
      topVideos: [],
      avgViewsPerVideo: 15383,
      engagementRate: 7.2,
    },
    {
      month: "February 2026",
      totalViews: 78900,
      totalWatchTimeHours: 5980,
      newSubscribers: 1050,
      topVideos: [],
      avgViewsPerVideo: 13150,
      engagementRate: 6.5,
    },
    {
      month: "January 2026",
      totalViews: 68200,
      totalWatchTimeHours: 5240,
      newSubscribers: 890,
      topVideos: [],
      avgViewsPerVideo: 11366,
      engagementRate: 5.9,
    },
  ],
};

export async function GET() {
  try {
    return NextResponse.json(MOCK_DATA);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch YouTube analytics" },
      { status: 500 }
    );
  }
}
