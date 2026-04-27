"use client";

import { ChannelStats } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MonetizationProgressProps {
  stats: ChannelStats;
  totalWatchTimeHours: number;
}

// YouTube Partner Program Requirements
const REQUIREMENTS = {
  subscribers: 1000,
  watchTimeHours: 4000, // in the last 12 months
  publicVideos: 1, // at least 1 uploaded video
};

export default function MonetizationProgress({ stats, totalWatchTimeHours }: MonetizationProgressProps) {
  // Calculate progress for each requirement
  const subscribersProgress = Math.min((stats.subscriberCount / REQUIREMENTS.subscribers) * 100, 100);
  const watchTimeProgress = Math.min((totalWatchTimeHours / REQUIREMENTS.watchTimeHours) * 100, 100);
  const videosProgress = stats.videoCount >= REQUIREMENTS.publicVideos ? 100 : 0;

  // Overall progress (average of all requirements)
  const overallProgress = Math.round((subscribersProgress + watchTimeProgress + videosProgress) / 3);

  // Check if eligible
  const isEligible = 
    stats.subscriberCount >= REQUIREMENTS.subscribers &&
    totalWatchTimeHours >= REQUIREMENTS.watchTimeHours &&
    stats.videoCount >= REQUIREMENTS.publicVideos;

  const requirements = [
    {
      label: "Subscribers",
      current: stats.subscriberCount.toLocaleString(),
      target: REQUIREMENTS.subscribers.toLocaleString(),
      progress: subscribersProgress,
      met: stats.subscriberCount >= REQUIREMENTS.subscribers,
    },
    {
      label: "Watch Time Hours",
      current: totalWatchTimeHours.toLocaleString(),
      target: REQUIREMENTS.watchTimeHours.toLocaleString(),
      progress: watchTimeProgress,
      met: totalWatchTimeHours >= REQUIREMENTS.watchTimeHours,
    },
    {
      label: "Public Videos",
      current: stats.videoCount.toLocaleString(),
      target: REQUIREMENTS.publicVideos.toLocaleString(),
      progress: videosProgress,
      met: stats.videoCount >= REQUIREMENTS.publicVideos,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Monetization Progress</CardTitle>
              <CardDescription>YouTube Partner Program eligibility</CardDescription>
            </div>
          </div>
          {isEligible ? (
            <Badge variant="default" className="bg-chart-1 hover:bg-chart-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Eligible
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {overallProgress}% Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold text-primary tabular-nums">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-4" />
        </div>

        {/* Individual Requirements - 2 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requirements.map((req) => (
            <div key={req.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle2 className="w-4 h-4 text-chart-1 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium">{req.label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {Math.round(req.progress)}%
                </span>
              </div>
              <Progress value={req.progress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {req.current} / {req.target}
              </p>
            </div>
          ))}
        </div>

        {/* Status Message */}
        <div className="pt-4 border-t border-border">
          {isEligible ? (
            <p className="text-sm text-chart-1 font-medium">
              🎉 Your channel meets all requirements for monetization!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Meet all requirements to apply for the YouTube Partner Program.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
