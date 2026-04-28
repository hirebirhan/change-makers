"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import VideoCard from "@/components/VideoCard";
import { YouTubeApiResponse } from "@/types/youtube";
import { VideoPerformance } from "@/lib/analytics-utils";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";

interface PerformanceViewProps {
  initialData: YouTubeApiResponse;
  performance: {
    best: VideoPerformance[];
    worst: VideoPerformance[];
    recent: VideoPerformance[];
  };
}

export function PerformanceView({ initialData, performance }: PerformanceViewProps) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Video Performance</h1>
          <p className="text-sm text-muted-foreground leading-tight">Track your best and worst performing content</p>
        </div>

        <Tabs defaultValue="best">
          <TabsList>
            <TabsTrigger value="best">
              <TrendingUp className="w-4 h-4 mr-2" />
              Best Performers
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="w-4 h-4 mr-2" />
              Recent (30d)
            </TabsTrigger>
            <TabsTrigger value="worst">
              <TrendingDown className="w-4 h-4 mr-2" />
              Needs Improvement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="best" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Best Performing Videos</CardTitle>
                <CardDescription>Ranked by engagement score (views per day × engagement rate)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.best.map((perf, index) => (
                    <div key={perf.video.id} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-chart-1 text-white font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">{perf.video.title}</h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">
                            <Zap className="w-3 h-3 mr-1" />
                            {Math.round(perf.viewsPerDay).toLocaleString()} views/day
                          </Badge>
                          <Badge variant="outline">{perf.likeRatio.toFixed(2)}% like rate</Badge>
                          <Badge variant="outline">{perf.commentRatio.toFixed(2)}% comment rate</Badge>
                          <Badge variant="outline">{perf.video.viewCount.toLocaleString()} total views</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads Performance</CardTitle>
                <CardDescription>Videos published in the last 30 days, ranked by views per day</CardDescription>
              </CardHeader>
              <CardContent>
                {performance.recent.length > 0 ? (
                  <div className="space-y-4">
                    {performance.recent.map((perf, index) => (
                      <div key={perf.video.id} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-chart-2 text-white font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-2 line-clamp-2">{perf.video.title}</h3>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="secondary">
                              <Zap className="w-3 h-3 mr-1" />
                              {Math.round(perf.viewsPerDay).toLocaleString()} views/day
                            </Badge>
                            <Badge variant="outline">
                              {new Date(perf.video.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </Badge>
                            <Badge variant="outline">{perf.video.viewCount.toLocaleString()} views</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No videos published in the last 30 days</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="worst" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Videos Needing Improvement</CardTitle>
                <CardDescription>Lowest performing videos - opportunities for optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.worst.map((perf, index) => (
                    <div key={perf.video.id} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">{perf.video.title}</h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">
                            {Math.round(perf.viewsPerDay).toLocaleString()} views/day
                          </Badge>
                          <Badge variant="outline">{perf.likeRatio.toFixed(2)}% like rate</Badge>
                          <Badge variant="outline">{perf.commentRatio.toFixed(2)}% comment rate</Badge>
                          <Badge variant="outline">{perf.video.viewCount.toLocaleString()} total views</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
