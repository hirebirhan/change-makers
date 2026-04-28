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
  watchTimeHours: 3000, // in the last 12 months
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="size-3.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Monetization Progress</CardTitle>
              <CardDescription className="text-xs">YPP eligibility</CardDescription>
            </div>
          </div>
          {isEligible ? (
            <Badge variant="default" className="bg-chart-1 hover:bg-chart-1 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Eligible
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {overallProgress}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Individual Requirements - Compact List */}
        <div className="space-y-2">
          {requirements.map((req) => (
            <div key={req.label} className="p-2 rounded hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-chart-1 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium">{req.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {req.current} / {req.target}
                  </span>
                  <span className="text-xs font-semibold tabular-nums">
                    {Math.round(req.progress)}%
                  </span>
                </div>
              </div>
              <Progress value={req.progress} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Status Message */}
        {isEligible && (
          <p className="text-xs text-chart-1 font-medium pt-2 border-t">
            🎉 Your channel meets all requirements for monetization!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
