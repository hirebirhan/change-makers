"use client";

import { ChannelStats } from "@/types/youtube";
import { Users, Eye, PlayCircle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChannelOverviewProps {
  stats: ChannelStats;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

const STATS = (stats: ChannelStats) => [
  { icon: Users,      label: "Subscribers", value: formatNumber(stats.subscriberCount), iconCn: "text-blue-500",   bgCn: "bg-blue-500/10"   },
  { icon: Eye,        label: "Total Views",  value: formatNumber(stats.viewCount),       iconCn: "text-violet-500", bgCn: "bg-violet-500/10" },
  { icon: PlayCircle, label: "Videos",       value: stats.videoCount.toString(),         iconCn: "text-destructive",bgCn: "bg-destructive/10"},
  { icon: Clock,      label: "Avg Duration", value: stats.avgViewDuration,               iconCn: "text-amber-500",  bgCn: "bg-amber-500/10"  },
];

export default function ChannelOverview({ stats }: ChannelOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STATS(stats).map(({ icon: Icon, label, value, iconCn, bgCn }) => (
        <Card key={label} size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgCn} ${iconCn}`}>
                <Icon className="size-3.5" />
              </div>
              <CardDescription className="text-xs">{label}</CardDescription>
            </div>
            <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
