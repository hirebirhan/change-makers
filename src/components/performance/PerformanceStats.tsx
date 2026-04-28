import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Eye, Heart, MessageCircle, Zap, Video } from "lucide-react";
import type { VideoPerformance } from "@/lib/analytics-utils";

interface PerformanceStatsProps {
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

export function PerformanceStats({ performance }: PerformanceStatsProps) {
  const allVideos = [...performance.best, ...performance.worst, ...performance.recent];
  const uniqueVideos = Array.from(new Map(allVideos.map(p => [p.video.id, p])).values());
  
  const avgViewsPerDay = uniqueVideos.reduce((sum, p) => sum + p.viewsPerDay, 0) / uniqueVideos.length;
  const totalViews = uniqueVideos.reduce((sum, p) => sum + p.video.viewCount, 0);
  const avgLikeRatio = uniqueVideos.reduce((sum, p) => sum + p.likeRatio, 0) / uniqueVideos.length;
  const avgCommentRatio = uniqueVideos.reduce((sum, p) => sum + p.commentRatio, 0) / uniqueVideos.length;
  const topPerformer = performance.best[0];

  const stats = [
    {
      label: "Avg Views/Day",
      value: formatNumber(Math.round(avgViewsPerDay)),
      icon: Zap,
      bg: "bg-chart-1/10",
      iconCn: "text-chart-1"
    },
    {
      label: "Total Views",
      value: formatNumber(totalViews),
      icon: Eye,
      bg: "bg-primary/10",
      iconCn: "text-primary"
    },
    {
      label: "Avg Like Rate",
      value: `${avgLikeRatio.toFixed(1)}%`,
      icon: Heart,
      bg: "bg-chart-2/10",
      iconCn: "text-chart-2"
    },
    {
      label: "Avg Comment Rate",
      value: `${avgCommentRatio.toFixed(1)}%`,
      icon: MessageCircle,
      bg: "bg-chart-4/10",
      iconCn: "text-chart-4"
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, bg, iconCn }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`size-3.5 ${iconCn}`} />
                </div>
                <CardDescription className="text-xs">{label}</CardDescription>
              </div>
              <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {topPerformer && (
        <Card className="border-chart-1/20 bg-chart-1/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-chart-1 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardDescription className="text-xs">Top Performer</CardDescription>
                <CardTitle className="text-sm leading-tight line-clamp-1">{topPerformer.video.title}</CardTitle>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-semibold tabular-nums text-chart-1">{formatNumber(Math.round(topPerformer.viewsPerDay))}</p>
                <p className="text-xs text-muted-foreground">views/day</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
