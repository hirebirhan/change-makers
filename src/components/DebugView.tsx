"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";

interface DebugViewProps {
  initialData: YouTubeApiResponse;
  rawData: {
    channelData?: unknown;
    uploadsData?: unknown;
    playlistData?: unknown;
    videosData?: unknown;
    error?: string;
  };
}

export function DebugView({ initialData, rawData }: DebugViewProps) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await fetchYouTubeAnalytics();
      setData(result);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = [
    {
      id: "channel",
      title: "1. Channel Data",
      description: "GET /channels?part=snippet,statistics,brandingSettings",
      data: rawData.channelData,
    },
    {
      id: "uploads",
      title: "2. Uploads Playlist",
      description: "GET /channels?part=contentDetails",
      data: rawData.uploadsData,
    },
    {
      id: "playlist",
      title: "3. Playlist Items",
      description: "GET /playlistItems?part=contentDetails",
      data: rawData.playlistData,
    },
    {
      id: "videos",
      title: "4. Videos Details",
      description: "GET /videos?part=snippet,statistics,contentDetails,status",
      data: rawData.videosData,
    },
  ];

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Debug API</h1>
          <p className="text-xs text-muted-foreground leading-none">
            Raw API responses loaded from server
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleSection(section.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {expandedSections[section.id] ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {expandedSections[section.id] && (
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                      {JSON.stringify(section.data, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Important Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
              <li>YouTube Data API v3 does NOT provide historical daily analytics (views per day, subscribers per day)</li>
              <li>The API only provides cumulative totals (total views, total likes, total comments)</li>
              <li>Daily metrics in the dashboard are ESTIMATED/SIMULATED based on video publish dates</li>
              <li>To get real daily analytics, you need YouTube Analytics API with OAuth authentication</li>
              <li>YouTube Analytics API requires channel owner authorization and different setup</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
