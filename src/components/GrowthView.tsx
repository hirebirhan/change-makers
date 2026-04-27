"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { YouTubeApiResponse } from "@/types/youtube";
import { GrowthMilestone, UploadStreak } from "@/lib/analytics-utils";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Target, Users, Eye, PlaySquare, Flame, Calendar } from "lucide-react";

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

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Growth Tracking</h1>
          <p className="text-sm text-muted-foreground">Track your milestones and upload consistency</p>
        </div>

        {/* Upload Streak */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-base">Current Streak</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{streak.currentStreak}</p>
              <p className="text-xs text-muted-foreground mt-1">weeks with uploads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-chart-1" />
                <CardTitle className="text-base">Longest Streak</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{streak.longestStreak}</p>
              <p className="text-xs text-muted-foreground mt-1">weeks with uploads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-chart-2" />
                <CardTitle className="text-base">Last Upload</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{streak.lastUploadDays}</p>
              <p className="text-xs text-muted-foreground mt-1">days ago</p>
            </CardContent>
          </Card>
        </div>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Milestones</CardTitle>
            <CardDescription>Track your progress to the next major milestone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {milestones.map((milestone) => {
              const Icon = milestoneIcons[milestone.type];
              return (
                <div key={milestone.type} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{milestone.type}</p>
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
                  <Progress value={milestone.progress} className="h-3" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Milestones you've already reached</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.channel.subscriberCount >= 100 && (
                <Badge variant="secondary" className="justify-center py-2">
                  <Users className="w-3 h-3 mr-1" />
                  100 Subs
                </Badge>
              )}
              {data.channel.subscriberCount >= 500 && (
                <Badge variant="secondary" className="justify-center py-2">
                  <Users className="w-3 h-3 mr-1" />
                  500 Subs
                </Badge>
              )}
              {data.channel.subscriberCount >= 1000 && (
                <Badge variant="default" className="justify-center py-2 bg-chart-1">
                  <Users className="w-3 h-3 mr-1" />
                  1K Subs
                </Badge>
              )}
              {data.channel.viewCount >= 1000 && (
                <Badge variant="secondary" className="justify-center py-2">
                  <Eye className="w-3 h-3 mr-1" />
                  1K Views
                </Badge>
              )}
              {data.channel.viewCount >= 10000 && (
                <Badge variant="secondary" className="justify-center py-2">
                  <Eye className="w-3 h-3 mr-1" />
                  10K Views
                </Badge>
              )}
              {data.channel.viewCount >= 100000 && (
                <Badge variant="default" className="justify-center py-2 bg-chart-1">
                  <Eye className="w-3 h-3 mr-1" />
                  100K Views
                </Badge>
              )}
              {data.channel.videoCount >= 10 && (
                <Badge variant="secondary" className="justify-center py-2">
                  <PlaySquare className="w-3 h-3 mr-1" />
                  10 Videos
                </Badge>
              )}
              {data.channel.videoCount >= 50 && (
                <Badge variant="secondary" className="justify-center py-2">
                  <PlaySquare className="w-3 h-3 mr-1" />
                  50 Videos
                </Badge>
              )}
              {data.channel.videoCount >= 100 && (
                <Badge variant="default" className="justify-center py-2 bg-chart-1">
                  <PlaySquare className="w-3 h-3 mr-1" />
                  100 Videos
                </Badge>
              )}
              {streak.longestStreak >= 4 && (
                <Badge variant="secondary" className="justify-center py-2">
                  <Flame className="w-3 h-3 mr-1" />
                  4 Week Streak
                </Badge>
              )}
              {streak.longestStreak >= 12 && (
                <Badge variant="default" className="justify-center py-2 bg-orange-500">
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
