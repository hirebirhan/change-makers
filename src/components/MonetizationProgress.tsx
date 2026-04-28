"use client";

import { ChannelStats } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { RequirementCard } from "@/components/monetization/RequirementCard";
import { useMemo } from "react";

interface MonetizationProgressProps {
  stats: ChannelStats;
  totalWatchTimeHours: number;
}

const REQUIREMENTS = {
  subscribers: 1000,
  watchTimeHours: 3000,
  publicVideos: 1,
} as const;

export default function MonetizationProgress({ stats, totalWatchTimeHours }: MonetizationProgressProps) {
  const requirements = useMemo(() => {
    const subscribersProgress = Math.min((stats.subscriberCount / REQUIREMENTS.subscribers) * 100, 100);
    const watchTimeProgress = Math.min((totalWatchTimeHours / REQUIREMENTS.watchTimeHours) * 100, 100);
    const videosProgress = stats.videoCount >= REQUIREMENTS.publicVideos ? 100 : 0;

    return [
      {
        label: "Subscribers",
        current: stats.subscriberCount.toLocaleString(),
        target: REQUIREMENTS.subscribers.toLocaleString(),
        progress: subscribersProgress,
        met: stats.subscriberCount >= REQUIREMENTS.subscribers,
      },
      {
        label: "Watch Time Hours",
        current: Math.round(totalWatchTimeHours).toLocaleString(),
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
  }, [stats.subscriberCount, stats.videoCount, totalWatchTimeHours]);

  const { isEligible, overallProgress } = useMemo(() => {
    const eligible = requirements.every(req => req.met);
    const progress = Math.round(requirements.reduce((sum, req) => sum + req.progress, 0) / requirements.length);
    return { isEligible: eligible, overallProgress: progress };
  }, [requirements]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEligible ? "bg-chart-1" : "bg-primary/10"}`}>
              <DollarSign className={`size-4 ${isEligible ? "text-white" : "text-primary"}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Monetization Progress</CardTitle>
              <CardDescription className="text-xs">YouTube Partner Program eligibility</CardDescription>
            </div>
          </div>
          {isEligible ? (
            <Badge className="bg-chart-1 hover:bg-chart-1 text-xs">
              Eligible
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {overallProgress}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {requirements.map((req) => (
          <RequirementCard key={req.label} {...req} />
        ))}

        {isEligible && (
          <div className="pt-2 border-t">
            <p className="text-xs text-chart-1 font-medium">
              🎉 Your channel meets all requirements for monetization!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
