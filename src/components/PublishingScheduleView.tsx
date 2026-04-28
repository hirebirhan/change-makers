"use client";

import { useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Clock, TrendingUp, Calendar, Award, Users, Zap, Globe } from "lucide-react";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PublishingScheduleView({ initialData }: { initialData: YouTubeApiResponse }) {
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

  // Best practices based on YouTube research and industry data
  const bestPractices = useMemo(() => {
    // Peak engagement hours (EST): 2-4 PM (14-16), 5-6 PM (17-18)
    // Good hours: 12-3 PM (12-15), 7-10 PM (19-22)
    // Weekend mornings: 9-11 AM (9-11)
    const hourScores: Record<number, number> = {
      0: 20, 1: 15, 2: 15, 3: 15, 4: 15, 5: 20, 6: 30, 7: 40, 8: 50, 9: 70,
      10: 75, 11: 80, 12: 85, 13: 90, 14: 100, 15: 95, 16: 90, 17: 95, 18: 90,
      19: 85, 20: 80, 21: 75, 22: 65, 23: 40
    };

    // Best days: Thursday > Friday > Saturday > Wednesday > Sunday > Tuesday > Monday
    const dayScores: Record<number, number> = {
      0: 70, // Sunday
      1: 60, // Monday
      2: 65, // Tuesday
      3: 80, // Wednesday
      4: 100, // Thursday
      5: 95, // Friday
      6: 90  // Saturday
    };

    // Combined day-hour scores
    const dayHourScores: Record<string, number> = {};
    DAYS.forEach((_, dayIndex) => {
      HOURS.forEach(hour => {
        const key = `${dayIndex}-${hour}`;
        const baseScore = (dayScores[dayIndex] * 0.4) + (hourScores[hour] * 0.6);
        // Boost weekend mornings
        if ((dayIndex === 0 || dayIndex === 6) && hour >= 9 && hour <= 11) {
          dayHourScores[key] = Math.min(100, baseScore * 1.2);
        } else {
          dayHourScores[key] = baseScore;
        }
      });
    });

    return { hourScores, dayScores, dayHourScores };
  }, []);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const getHeatmapColor = (score: number) => {
    if (score >= 90) return 'bg-chart-1';
    if (score >= 75) return 'bg-chart-2';
    if (score >= 60) return 'bg-chart-3';
    if (score >= 40) return 'bg-chart-4';
    return 'bg-muted';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  // Find best times from best practices
  const bestDayHour = Object.entries(bestPractices.dayHourScores)
    .sort((a, b) => b[1] - a[1])[0];
  const bestDayHourParts = bestDayHour[0].split('-');
  const bestDayName = DAYS[Number(bestDayHourParts[0])];
  const bestHourFormatted = formatHour(Number(bestDayHourParts[1]));

  const bestDay = Object.entries(bestPractices.dayScores)
    .sort((a, b) => b[1] - a[1])[0];
  const bestHour = Object.entries(bestPractices.hourScores)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Publishing Schedule</h1>
          <p className="text-xs text-muted-foreground leading-none">Optimal times to publish based on YouTube best practices</p>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-1/10">
                  <Award className="size-3.5 text-chart-1" />
                </div>
                <CardDescription className="text-xs">Best Day & Time</CardDescription>
              </div>
              <CardTitle className="text-base font-semibold">
                {bestDayName} at {bestHourFormatted}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-2/10">
                  <Calendar className="size-3.5 text-chart-2" />
                </div>
                <CardDescription className="text-xs">Best Day</CardDescription>
              </div>
              <CardTitle className="text-base font-semibold">
                {DAYS[Number(bestDay[0])]}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-3/10">
                  <Clock className="size-3.5 text-chart-3" />
                </div>
                <CardDescription className="text-xs">Best Hour</CardDescription>
              </div>
              <CardTitle className="text-base font-semibold">
                {formatHour(Number(bestHour[0]))}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-500/10">
                  <Globe className="size-3.5 text-orange-500" />
                </div>
                <CardDescription className="text-xs">Timezone</CardDescription>
              </div>
              <CardTitle className="text-base font-semibold">
                EST/EDT
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Best Practices Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">About These Recommendations</CardTitle>
            <CardDescription className="text-xs">Based on YouTube industry research and engagement patterns</CardDescription>
          </CardHeader>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-1/10 shrink-0">
                <Users className="size-3.5 text-chart-1" />
              </div>
              <div>
                <div className="text-sm font-semibold">Peak Engagement Hours</div>
                <div className="text-xs text-muted-foreground leading-tight">2-4 PM EST when most viewers are active after work/school</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-2/10 shrink-0">
                <TrendingUp className="size-3.5 text-chart-2" />
              </div>
              <div>
                <div className="text-sm font-semibold">Best Days</div>
                <div className="text-xs text-muted-foreground leading-tight">Thursday-Saturday show highest engagement across all content types</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-chart-3/10 shrink-0">
                <Zap className="size-3.5 text-chart-3" />
              </div>
              <div>
                <div className="text-sm font-semibold">Weekend Strategy</div>
                <div className="text-xs text-muted-foreground leading-tight">9-11 AM on weekends captures morning viewers with free time</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Publishing Heatmap</CardTitle>
            <CardDescription className="text-xs">Optimal times based on YouTube engagement patterns (EST/EDT)</CardDescription>
          </CardHeader>
          <div className="p-4">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex gap-1">
                  <div className="flex flex-col gap-1 pt-6">
                    {DAYS.map(day => (
                      <div key={day} className="h-6 flex items-center justify-end pr-2 text-xs font-medium w-20">
                        {day.slice(0, 3)}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-1 mb-1">
                      {HOURS.map(hour => (
                        <div key={hour} className="w-6 text-xs text-center text-muted-foreground">
                          {hour % 6 === 0 ? hour : ''}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      {DAYS.map((_, dayIndex) => (
                        <div key={dayIndex} className="flex gap-1">
                          {HOURS.map(hour => {
                            const key = `${dayIndex}-${hour}`;
                            const score = bestPractices.dayHourScores[key];
                            const color = getHeatmapColor(score);
                            return (
                              <div
                                key={hour}
                                className={`w-6 h-6 rounded ${color} cursor-pointer hover:ring-2 hover:ring-primary transition-all`}
                                title={`${DAYS[dayIndex]} ${formatHour(hour)}: ${getScoreLabel(score)} (${Math.round(score)}% optimal)`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Day Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Optimal Days</CardTitle>
            <CardDescription className="text-xs">Best days to publish based on engagement patterns</CardDescription>
          </CardHeader>
          <div className="p-4">
            <div className="space-y-2">
              {DAYS.map((day, index) => {
                const score = bestPractices.dayScores[index];
                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-20 text-xs font-medium">{day}</div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-1 transition-all"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="w-24 text-xs text-right tabular-nums">
                      {getScoreLabel(score)}
                    </div>
                    <div className="w-16 text-xs text-muted-foreground text-right">
                      {Math.round(score)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Hour Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Optimal Hours (EST/EDT)</CardTitle>
            <CardDescription className="text-xs">Best times to publish throughout the day</CardDescription>
          </CardHeader>
          <div className="p-4">
            <div className="space-y-2">
              {HOURS.map(hour => {
                const score = bestPractices.hourScores[hour];
                return (
                  <div key={hour} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-medium">{formatHour(hour)}</div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-2 transition-all"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="w-24 text-xs text-right tabular-nums">
                      {getScoreLabel(score)}
                    </div>
                    <div className="w-16 text-xs text-muted-foreground text-right">
                      {Math.round(score)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
