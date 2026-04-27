"use client";

import { ChannelStats } from "@/types/youtube";
import { Users, Eye, PlayCircle, Heart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChannelOverviewProps {
  stats: ChannelStats;
}

function formatNumber(num: number | undefined): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

const STATS = (stats: ChannelStats) => [
  { icon: Users,      label: "Subscribers",     value: formatNumber(stats.subscriberCount), exact: stats.subscriberCount ?? 0, iconCn: "text-primary",          bgCn: "bg-primary/10"   },
  { icon: Eye,        label: "Total Views",      value: formatNumber(stats.viewCount),       exact: stats.viewCount ?? 0,       iconCn: "text-muted-foreground",  bgCn: "bg-muted"        },
  { icon: PlayCircle, label: "Videos",           value: stats.videoCount.toString(),         exact: stats.videoCount ?? 0,      iconCn: "text-primary",          bgCn: "bg-primary/10"   },
  { icon: Heart,      label: "Total Engagement", value: formatNumber(stats.totalEngagement), exact: stats.totalEngagement ?? 0, iconCn: "text-rose-500",         bgCn: "bg-rose-500/10" },
];

export default function ChannelOverview({ stats }: ChannelOverviewProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS(stats).map(({ icon: Icon, label, value, exact, iconCn, bgCn }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgCn} ${iconCn} cursor-help`}>
                      <Icon className="size-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono">{exact.toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
                <CardDescription className="text-xs">{label}</CardDescription>
              </div>
              <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
