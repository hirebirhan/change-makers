export interface ChannelStats {
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  watchTimeHours: number;
  avgViewDuration: string;
  channelName: string;
  channelDescription: string;
  profileImageUrl: string;
  bannerImageUrl: string;
  customUrl: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  tags: string[];
}

export interface DailyMetric {
  date: string;
  views: number;
  watchTimeHours: number;
  subscribersGained: number;
  subscribersLost: number;
  subscribedViews: number;
  unsubscribedViews: number;
}

export interface MonthlyReport {
  month: string;
  totalViews: number;
  totalWatchTimeHours: number;
  newSubscribers: number;
  topVideos: Video[];
  avgViewsPerVideo: number;
  engagementRate: number;
}

export interface YouTubeApiResponse {
  success: boolean;
  channel: ChannelStats;
  videos: Video[];
  dailyMetrics: DailyMetric[];
  reports: MonthlyReport[];
}
