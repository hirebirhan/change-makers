import { Video } from "@/types/youtube";

export interface TagAnalysis {
  tag: string;
  count: number;
  totalViews: number;
  avgViews: number;
}

export interface UploadFrequency {
  date: string;
  count: number;
}

export interface VideoLengthDistribution {
  range: string;
  count: number;
  avgViews: number;
}

export interface VideoPerformance {
  video: Video;
  daysOld: number;
  viewsPerDay: number;
  likeRatio: number;
  commentRatio: number;
  engagementScore: number;
}

export interface GrowthMilestone {
  type: "subscribers" | "views" | "videos";
  current: number;
  next: number;
  progress: number;
  remaining: number;
}

export interface UploadStreak {
  currentStreak: number;
  longestStreak: number;
  lastUploadDays: number;
}

// Tag Analysis
export function analyzeTagsFromVideos(videos: Video[]): TagAnalysis[] {
  const tagMap = new Map<string, { count: number; totalViews: number }>();

  videos.forEach((video) => {
    video.tags.forEach((tag) => {
      const existing = tagMap.get(tag) || { count: 0, totalViews: 0 };
      tagMap.set(tag, {
        count: existing.count + 1,
        totalViews: existing.totalViews + video.viewCount,
      });
    });
  });

  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      totalViews: data.totalViews,
      avgViews: Math.round(data.totalViews / data.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
}

// Upload Frequency Analysis
export function analyzeUploadFrequency(videos: Video[]): UploadFrequency[] {
  const last90Days = new Date();
  last90Days.setDate(last90Days.getDate() - 90);

  const dateMap = new Map<string, number>();

  videos.forEach((video) => {
    const date = new Date(video.publishedAt);
    if (date >= last90Days) {
      const dateStr = date.toISOString().split("T")[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Video Length Distribution
export function analyzeVideoLengthDistribution(videos: Video[]): VideoLengthDistribution[] {
  const ranges = [
    { label: "< 1 min (Shorts)", min: 0, max: 60 },
    { label: "1-5 min", min: 61, max: 300 },
    { label: "5-10 min", min: 301, max: 600 },
    { label: "10-20 min", min: 601, max: 1200 },
    { label: "20-30 min", min: 1201, max: 1800 },
    { label: "> 30 min", min: 1801, max: Infinity },
  ];

  return ranges.map((range) => {
    const videosInRange = videos.filter(
      (v) => v.durationSeconds >= range.min && v.durationSeconds <= range.max
    );
    const totalViews = videosInRange.reduce((sum, v) => sum + v.viewCount, 0);
    return {
      range: range.label,
      count: videosInRange.length,
      avgViews: videosInRange.length > 0 ? Math.round(totalViews / videosInRange.length) : 0,
    };
  });
}

// Video Performance Analysis
export function analyzeVideoPerformance(videos: Video[]): {
  best: VideoPerformance[];
  worst: VideoPerformance[];
  recent: VideoPerformance[];
} {
  const now = new Date();
  const performances: VideoPerformance[] = videos.map((video) => {
    const publishDate = new Date(video.publishedAt);
    const daysOld = Math.max(1, Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)));
    const viewsPerDay = video.viewCount / daysOld;
    const likeRatio = video.viewCount > 0 ? (video.likeCount / video.viewCount) * 100 : 0;
    const commentRatio = video.viewCount > 0 ? (video.commentCount / video.viewCount) * 100 : 0;
    const engagementScore = viewsPerDay * (1 + likeRatio + commentRatio);

    return {
      video,
      daysOld,
      viewsPerDay,
      likeRatio,
      commentRatio,
      engagementScore,
    };
  });

  const sorted = [...performances].sort((a, b) => b.engagementScore - a.engagementScore);
  const recent = performances
    .filter((p) => {
      const daysOld = Math.floor((now.getTime() - new Date(p.video.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysOld <= 30;
    })
    .sort((a, b) => b.viewsPerDay - a.viewsPerDay);

  return {
    best: sorted.slice(0, 10),
    worst: sorted.slice(-10).reverse(),
    recent: recent.slice(0, 10),
  };
}

// Growth Milestones
export function calculateGrowthMilestones(
  subscriberCount: number,
  viewCount: number,
  videoCount: number
): GrowthMilestone[] {
  const milestones: GrowthMilestone[] = [];

  // Subscriber milestones
  const subMilestones = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  const nextSubMilestone = subMilestones.find((m) => m > subscriberCount);
  if (nextSubMilestone) {
    milestones.push({
      type: "subscribers",
      current: subscriberCount,
      next: nextSubMilestone,
      progress: (subscriberCount / nextSubMilestone) * 100,
      remaining: nextSubMilestone - subscriberCount,
    });
  }

  // View milestones
  const viewMilestones = [1000, 10000, 100000, 500000, 1000000, 5000000, 10000000];
  const nextViewMilestone = viewMilestones.find((m) => m > viewCount);
  if (nextViewMilestone) {
    milestones.push({
      type: "views",
      current: viewCount,
      next: nextViewMilestone,
      progress: (viewCount / nextViewMilestone) * 100,
      remaining: nextViewMilestone - viewCount,
    });
  }

  // Video milestones
  const videoMilestones = [10, 25, 50, 100, 250, 500, 1000];
  const nextVideoMilestone = videoMilestones.find((m) => m > videoCount);
  if (nextVideoMilestone) {
    milestones.push({
      type: "videos",
      current: videoCount,
      next: nextVideoMilestone,
      progress: (videoCount / nextVideoMilestone) * 100,
      remaining: nextVideoMilestone - videoCount,
    });
  }

  return milestones;
}

// Upload Streak
export function calculateUploadStreak(videos: Video[]): UploadStreak {
  if (videos.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastUploadDays: 0 };
  }

  const sortedDates = videos
    .map((v) => new Date(v.publishedAt).toISOString().split("T")[0])
    .sort((a, b) => b.localeCompare(a));

  const uniqueDates = [...new Set(sortedDates)];
  const now = new Date();
  const lastUpload = new Date(uniqueDates[0]);
  const lastUploadDays = Math.floor((now.getTime() - lastUpload.getTime()) / (1000 * 60 * 60 * 24));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate streaks (consecutive weeks with uploads)
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const daysDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Current streak
  if (lastUploadDays <= 7) {
    currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const daysDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak, lastUploadDays };
}
