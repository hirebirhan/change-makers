"use client";

import { ChannelStats } from "@/types/youtube";
import { Users, Eye, PlayCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChannelOverviewProps {
  stats: ChannelStats;
  totalWatchTimeHours?: number;
  trends?: {
    views: number | null;
    watchTime: number | null;
    videos: number | null;
  };
}

function formatNumber(num: number | undefined): string {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

const STATS = (
  stats: ChannelStats,
  totalWatchTimeHours?: number,
  trends?: ChannelOverviewProps["trends"]
) => [
  {
    icon: Users,
    label: "Subscribers",
    value: formatNumber(stats.subscriberCount),
    exact: stats.subscriberCount ?? 0,
    iconCn: "text-chart-1",
    bgCn: "bg-chart-1/10",
    trend: undefined,
  },
  {
    icon: Eye,
    label: "Views",
    value: formatNumber(stats.viewCount),
    exact: stats.viewCount ?? 0,
    iconCn: "text-muted-foreground",
    bgCn: "bg-muted",
    trend: trends?.views,
  },
  {
    icon: PlayCircle,
    label: "Videos",
    value: stats.videoCount.toString(),
    exact: stats.videoCount ?? 0,
    iconCn: "text-muted-foreground",
    bgCn: "bg-muted",
    trend: trends?.videos,
  },
  {
    icon: Clock,
    label: "Watch Time",
    value: formatNumber(totalWatchTimeHours ?? 0) + "h",
    exact: totalWatchTimeHours ?? 0,
    iconCn: "text-muted-foreground",
    bgCn: "bg-muted",
    trend: trends?.watchTime,
    suffix: "est.",
  },
];

export default function ChannelOverview({ stats, totalWatchTimeHours, trends }: ChannelOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STATS(stats, totalWatchTimeHours, trends).map(
        ({ icon: Icon, label, value, exact, iconCn, bgCn, trend, suffix }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bgCn} ${iconCn}`}>
                  <Icon className="size-3.5" />
                </div>
                <CardDescription className="text-xs">{label}</CardDescription>
              </div>
              <div className="flex items-end justify-between gap-1">
                <Tooltip>
                  <TooltipTrigger>
                    <CardTitle className="text-xl tabular-nums cursor-default w-fit">
                      {value}
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-mono text-xs">{exact.toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-1 pb-0.5">
                  {suffix && (
                    <span className="text-xs text-muted-foreground/60">{suffix}</span>
                  )}
                  {trend != null && (
                    <div
                      className={`flex items-center gap-0.5 text-xs font-semibold ${
                        trend > 0
                          ? "text-chart-1"
                          : trend < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {trend > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : trend < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      {trend !== 0 && <span>{Math.abs(trend).toFixed(0)}%</span>}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        )
      )}
    </div>
  );
}
