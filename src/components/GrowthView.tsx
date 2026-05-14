"use client";

import { useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { YouTubeApiResponse } from "@/types/youtube";
import { GrowthMilestone, UploadStreak } from "@/lib/analytics-utils";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Target, Users, Eye, PlaySquare, Flame, Calendar } from "lucide-react";
import { UploadCalendar } from "@/components/UploadCalendar";
import { AlertSettings } from "@/components/AlertSystem";

interface GrowthViewProps {
  initialData: YouTubeApiResponse;
  milestones: GrowthMilestone[];
  streak: UploadStreak;
}

const milestoneIcons = {
  subscribers: Users,
  views: Eye,
  videos: PlaySquare,
};

export function GrowthView({ initialData, milestones, streak }: GrowthViewProps) {
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

  const publishingInsights = useMemo(() => {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats: Record<number, { views: number; count: number }> = {};
    for (const v of data.videos) {
      const day = new Date(v.publishedAt).getDay();
      if (!dayStats[day]) dayStats[day] = { views: 0, count: 0 };
      dayStats[day].views += v.viewCount;
      dayStats[day].count += 1;
    }
    return DAYS.map((label, i) => ({
      label,
      short: label.slice(0, 3),
      avgViews: dayStats[i]?.count ? Math.round(dayStats[i].views / dayStats[i].count) : 0,
      count: dayStats[i]?.count ?? 0,
    })).sort((a, b) => b.avgViews - a.avgViews);
  }, [data.videos]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Growth Tracking</h1>
          <p className="text-xs text-muted-foreground leading-none">Track your milestones and upload consistency</p>
        </div>

        {/* Upload Streak */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-5/10">
                  <Flame className="size-3.5 text-chart-5" />
                </div>
                <CardDescription className="text-xs">Current Streak</CardDescription>
              </div>
              <CardTitle className="text-xl tabular-nums">{streak.currentStreak} <span className="text-xs font-normal text-muted-foreground">weeks</span></CardTitle>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-1/10">
                  <Target className="size-3.5 text-chart-1" />
                </div>
                <CardDescription className="text-xs">Longest Streak</CardDescription>
              </div>
              <CardTitle className="text-xl tabular-nums">{streak.longestStreak} <span className="text-xs font-normal text-muted-foreground">weeks</span></CardTitle>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-2/10">
                  <Calendar className="size-3.5 text-chart-2" />
                </div>
                <CardDescription className="text-xs">Last Upload</CardDescription>
              </div>
              <CardTitle className="text-xl tabular-nums">{streak.lastUploadDays} <span className="text-xs font-normal text-muted-foreground">days ago</span></CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Upload Calendar */}
        <UploadCalendar videos={data.videos} />

        {/* Publishing Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Best Days to Publish</CardTitle>
            <CardDescription className="text-xs">
              Ranked by average views across your {data.videos.length} published videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {publishingInsights.map((day, i) => {
              const max = publishingInsights[0].avgViews;
              const pct = max ? Math.round((day.avgViews / max) * 100) : 0;
              return (
                <div key={day.label} className="flex items-center gap-3">
                  <span className="text-xs w-7 text-muted-foreground shrink-0">{day.short}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${i === 0 ? 'bg-chart-1' : i === 1 ? 'bg-chart-2' : 'bg-muted-foreground/30'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums w-20 text-right text-muted-foreground">
                    {day.count > 0 ? `${day.avgViews.toLocaleString()} avg` : 'no data'}
                  </span>
                  {i === 0 && day.count > 0 && (
                    <Badge variant="secondary" className="text-xs py-0 px-1.5 shrink-0">Best</Badge>
                  )}
                </div>
              );
            })}
            {publishingInsights[0]?.count > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                Your videos published on <span className="font-medium text-foreground">{publishingInsights[0].label}</span> average the highest views.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Growth Milestones</CardTitle>
            <CardDescription className="text-xs">Track your progress to the next major milestone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((milestone) => {
              const Icon = milestoneIcons[milestone.type];
              return (
                <div key={milestone.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-chart-1/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-chart-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{milestone.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {milestone.current.toLocaleString()} / {milestone.next.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{Math.round(milestone.progress)}%</p>
                      <p className="text-xs text-muted-foreground">{milestone.remaining.toLocaleString()} to go</p>
                    </div>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alerts */}
        <AlertSettings />

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Achievements</CardTitle>
            <CardDescription className="text-xs">Milestones you have already reached</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {data.channel.subscriberCount >= 100 && (
                <Badge variant="secondary" className="justify-center py-1.5 text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  100 Subs
                </Badge>
              )}
              {data.channel.subscriberCount >= 500 && (
                <Badge variant="secondary" className="justify-center py-1.5 text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  500 Subs
                </Badge>
              )}
              {data.channel.subscriberCount >= 1000 && (
                <Badge variant="default" className="justify-center py-1.5 text-xs bg-chart-1">
                  <Users className="w-3 h-3 mr-1" />
                  1K Subs
                </Badge>
              )}
              {data.channel.viewCount >= 1000 && (
                <Badge variant="secondary" className="justify-center py-1.5 text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  1K Views
                </Badge>
              )}
              {data.channel.viewCount >= 10000 && (
                <Badge variant="secondary" className="justify-center py-1.5 text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  10K Views
                </Badge>
              )}
              {data.channel.viewCount >= 100000 && (
                <Badge variant="default" className="justify-center py-1.5 text-xs bg-chart-1">
                  <Eye className="w-3 h-3 mr-1" />
                  100K Views
                </Badge>
              )}
              {data.channel.videoCount >= 10 && (
                <Badge variant="secondary" className="justify-center py-1.5 text-xs">
                  <PlaySquare className="w-3 h-3 mr-1" />
                  10 Videos
                </Badge>
              )}
              {data.channel.videoCount >= 50 && (
                <Badge variant="secondary" className="justify-center py-1.5 text-xs">
                  <PlaySquare className="w-3 h-3 mr-1" />
                  50 Videos
                </Badge>
              )}
              {data.channel.videoCount >= 100 && (
                <Badge variant="default" className="justify-center py-1.5 text-xs bg-chart-1">
                  <PlaySquare className="w-3 h-3 mr-1" />
                  100 Videos
                </Badge>
              )}
              {streak.longestStreak >= 4 && (
                <Badge variant="secondary" className="justify-center py-1.5 text-xs">
                  <Flame className="w-3 h-3 mr-1" />
                  4 Week Streak
                </Badge>
              )}
              {streak.longestStreak >= 12 && (
                <Badge variant="default" className="justify-center py-1.5 text-xs bg-chart-5">
                  <Flame className="w-3 h-3 mr-1" />
                  12 Week Streak
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
