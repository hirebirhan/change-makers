"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { YouTubeApiResponse } from "@/types/youtube";
import { VideoPerformance } from "@/lib/analytics-utils";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { TrendingUp, TrendingDown, Clock, Eye, Heart, MessageCircle, Zap } from "lucide-react";

interface PerformanceViewProps {
  initialData: YouTubeApiResponse;
  performance: {
    best: VideoPerformance[];
    worst: VideoPerformance[];
    recent: VideoPerformance[];
  };
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
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
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Performance</h1>
          <p className="text-xs text-muted-foreground leading-none">Video performance analysis</p>
        </div>

        <Tabs defaultValue="best">
          <TabsList>
            <TabsTrigger value="best" className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Best
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="worst" className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Improve
            </TabsTrigger>
          </TabsList>

          <TabsContent value="best" className="space-y-1 mt-4">
            {performance.best.map((perf, index) => (
              <div key={perf.video.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-chart-1 text-white font-semibold text-xs shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm leading-tight truncate">{perf.video.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-chart-1" />
                    {formatNumber(Math.round(perf.viewsPerDay))}/day
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(perf.video.viewCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {perf.likeRatio.toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {perf.commentRatio.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="recent" className="space-y-1 mt-4">
            {performance.recent.length > 0 ? (
              performance.recent.map((perf, index) => {
                const daysOld = Math.floor((Date.now() - new Date(perf.video.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={perf.video.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-chart-2 text-white font-semibold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight truncate">{perf.video.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <Badge variant="outline" className="text-xs">{daysOld}d ago</Badge>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-chart-2" />
                        {formatNumber(Math.round(perf.viewsPerDay))}/day
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(perf.video.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {perf.likeRatio.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No videos published in the last 30 days
              </div>
            )}
          </TabsContent>

          <TabsContent value="worst" className="space-y-1 mt-4">
            {performance.worst.map((perf, index) => {
              const suggestions = [];
              if (perf.likeRatio < 1) suggestions.push('Low likes');
              if (perf.commentRatio < 0.5) suggestions.push('Low engagement');
              if (perf.viewsPerDay < 10) suggestions.push('Low visibility');
              
              return (
                <div key={perf.video.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-chart-5/10 text-chart-5 font-semibold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-tight truncate">{perf.video.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    {suggestions.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-chart-5/10 text-chart-5 border-chart-5/20">
                        {suggestions[0]}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {formatNumber(Math.round(perf.viewsPerDay))}/day
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(perf.video.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {perf.likeRatio.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
