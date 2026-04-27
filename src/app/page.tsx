"use client";

import { useState, useEffect } from "react";
import ChannelOverview from "@/components/ChannelOverview";
import AnalyticsChart from "@/components/AnalyticsChart";
import VideoCard from "@/components/VideoCard";
import ReportsSection from "@/components/ReportsSection";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { YouTubeApiResponse } from "@/types/youtube";

export default function Home() {
  const [data, setData] = useState<YouTubeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchYouTubeAnalytics();
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-zinc-600">Loading YouTube analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">YouTube Analytics Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <ChannelOverview stats={data.channel} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnalyticsChart data={data.dailyMetrics} />
          </div>
          <div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Videos</h3>
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {data.videos
                  .sort((a, b) => b.viewCount - a.viewCount)
                  .map((video, index) => (
                    <VideoCard key={video.id} video={video} rank={index + 1} />
                  ))}
              </div>
            </div>
          </div>
        </div>

        <ReportsSection reports={data.reports} />
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          YouTube Analytics Dashboard. Data shown is for demonstration purposes.
        </p>
      </footer>
    </div>
  );
}
