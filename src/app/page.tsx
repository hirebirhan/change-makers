"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoginPage } from "@/components/LoginPage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ChannelOverview from "@/components/ChannelOverview";
import AnalyticsChart from "@/components/AnalyticsChart";
import VideoCard from "@/components/VideoCard";
import ReportsSection from "@/components/ReportsSection";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { YouTubeApiResponse } from "@/types/youtube";

function Dashboard() {
  const { logout } = useAuth();
  const [data, setData] = useState<YouTubeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchYouTubeAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive flex items-center justify-center mx-auto shadow-lg shadow-destructive/30 animate-pulse">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Loading analytics</p>
            <p className="text-xs text-muted-foreground">Fetching your channel data…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-destructive">Failed to load</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { channel } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-destructive flex items-center justify-center shadow-md shadow-destructive/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">Birhan Nega</span>
          </div>

          {/* Right: channel identity + actions */}
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <Separator orientation="vertical" className="h-5 mx-1" />
            {channel.profileImageUrl ? (
              <Image src={channel.profileImageUrl} alt={channel.channelName} width={32} height={32} className="rounded-full object-cover ring-2 ring-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                {channel.channelName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 hidden md:block ml-1 mr-2">
              <a
                href={`https://www.youtube.com/${channel.customUrl || `channel/${channel.channelName}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold leading-none truncate hover:text-primary transition-colors block"
              >
                {channel.channelName}
              </a>
              {channel.customUrl && (
                <a
                  href={`https://www.youtube.com/${channel.customUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground mt-0.5 hover:text-primary transition-colors block"
                >
                  {channel.customUrl}
                </a>
              )}
            </div>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Overview stats */}
        <ChannelOverview stats={data.channel} />

        {/* Analytics + Top Videos */}
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

        {/* Reports */}
        <ReportsSection reports={data.reports} />
      </main>

      <footer className="border-t border-border mt-4">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-destructive flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <span className="text-xs font-medium">ChangeMakers Analytics</span>
          </div>
          <p className="text-xs text-muted-foreground">Powered by YouTube Data API v3</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}
