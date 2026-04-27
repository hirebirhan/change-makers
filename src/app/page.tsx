"use client";

import { useAuth } from "@/lib/auth";
import { useYouTubeData } from "@/lib/use-youtube-data";
import { LoginPage } from "@/components/LoginPage";
import { AppShell } from "@/components/AppShell";
import ChannelOverview from "@/components/ChannelOverview";
import AnalyticsChart from "@/components/AnalyticsChart";
import VideoCard from "@/components/VideoCard";
import ReportsSection from "@/components/ReportsSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function Dashboard() {
  const { data, loading, error, refresh, refreshing, lastUpdated } = useYouTubeData();

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-yt-red flex items-center justify-center mx-auto shadow-lg shadow-destructive/30 animate-pulse">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Fetching channel data…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!data) return null;

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="w-full px-6 py-8 space-y-6">
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
                {data.videos
                  .sort((a, b) => b.viewCount - a.viewCount)
                  .map((video, index) => (
                    <VideoCard key={video.id} video={video} rank={index + 1} />
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <ReportsSection reports={data.reports} />
      </main>

      <footer className="border-t border-border">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-medium">Birhan tech corner Analytics</span>
          <p className="text-xs text-muted-foreground">Powered by YouTube Data API v3</p>
        </div>
      </footer>
    </AppShell>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}
