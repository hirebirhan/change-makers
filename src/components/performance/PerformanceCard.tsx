import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eye, Heart, MessageCircle, Zap } from "lucide-react";
import type { VideoPerformance } from "@/lib/analytics-utils";

interface PerformanceCardProps {
  perf: VideoPerformance;
  rank: number;
  variant: "best" | "recent" | "worst";
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDuration(duration: string) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PerformanceCard({ perf, rank, variant }: PerformanceCardProps) {
  const suggestions = getPerformanceSuggestions(perf);

  const rankColors = {
    best: "bg-chart-1 text-white",
    recent: "bg-chart-2 text-white",
    worst: "bg-chart-5/10 text-chart-5"
  };

  return (
    <Card className="overflow-hidden hover:bg-muted/30 transition-colors">
      <div className="flex gap-2 p-2">
        <div className="relative w-28 h-16 rounded-md overflow-hidden shrink-0 bg-muted">
          <Image
            src={perf.video.thumbnailUrl}
            alt={perf.video.title}
            fill
            className="object-cover"
            sizes="112px"
          />
          <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 rounded">
            {formatDuration(perf.video.duration)}
          </div>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full ${rankColors[variant]} flex items-center justify-center text-xs font-semibold`}>
            {rank}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div>
            <a
              href={`https://www.youtube.com/watch?v=${perf.video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-xs leading-tight line-clamp-2 hover:text-primary transition-colors"
            >
              {perf.video.title}
            </a>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(perf.video.publishedAt).toLocaleDateString()} · {perf.daysOld}d ago
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5 text-xs">
              <Zap className={`w-3 h-3 ${variant === "best" ? "text-chart-1" : variant === "recent" ? "text-chart-2" : "text-muted-foreground"}`} />
              <span className="font-semibold">{formatNumber(Math.round(perf.viewsPerDay))}</span>
              <span className="text-muted-foreground">/day</span>
            </div>
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(perf.video.viewCount)}</span>
            </div>
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Heart className="w-3 h-3" />
              <span>{formatNumber(perf.video.likeCount)}</span>
              <span>({perf.likeRatio.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MessageCircle className="w-3 h-3" />
              <span>{formatNumber(perf.video.commentCount)}</span>
              <span>({perf.commentRatio.toFixed(1)}%)</span>
            </div>
          </div>

          {variant === "worst" && suggestions.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {suggestions.map((suggestion) => (
                <Badge key={suggestion} variant="outline" className="text-xs h-5 px-1.5 bg-chart-5/10 text-chart-5 border-chart-5/20">
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function getPerformanceSuggestions(perf: VideoPerformance) {
  const suggestions = [];
  if (perf.likeRatio < 1) suggestions.push("Low likes");
  if (perf.commentRatio < 0.5) suggestions.push("Low engagement");
  if (perf.viewsPerDay < 10) suggestions.push("Low visibility");
  return suggestions;
}
