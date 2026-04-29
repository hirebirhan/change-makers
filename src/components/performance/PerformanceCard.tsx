import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eye, Heart, MessageCircle, Zap, CalendarDays, Gauge } from "lucide-react";
import type { VideoPerformance } from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";

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
  const tone = VARIANT_TONE[variant];
  const engagementRate = perf.likeRatio + perf.commentRatio;
  const publishedDate = new Date(perf.video.publishedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className={cn("overflow-hidden transition-colors hover:border-primary/30", tone.card)}>
      <div className="grid gap-3 p-3 sm:grid-cols-[184px_1fr]">
        <a
          href={`https://www.youtube.com/watch?v=${perf.video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-video overflow-hidden rounded-lg bg-muted"
        >
          <Image
            src={perf.video.thumbnailUrl}
            alt={perf.video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 640px) 184px, 100vw"
          />
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(perf.video.duration)}
          </div>
          <div className={cn("absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold", tone.rank)}>
            #{rank}
          </div>
        </a>

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {variant === "best" && rank === 1 && (
                  <Badge variant="outline" className="h-6 rounded-md border-chart-1/20 bg-chart-1/10 px-2 text-xs text-chart-1">
                    Top performer
                  </Badge>
                )}
                {variant === "recent" && (
                  <Badge variant="outline" className="h-6 rounded-md border-chart-2/20 bg-chart-2/10 px-2 text-xs text-chart-2">
                    Recent
                  </Badge>
                )}
              </div>
              <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
                <CalendarDays className="size-3.5" />
                {publishedDate}
              </span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${perf.video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-primary"
            >
              {perf.video.title}
            </a>
            <p className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
              <CalendarDays className="size-3.5" />
              {publishedDate}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric icon={Zap} label="Views/day" value={formatNumber(Math.round(perf.viewsPerDay))} emphasis={tone.metric} />
            <Metric icon={Eye} label="Views" value={formatNumber(perf.video.viewCount)} />
            <Metric icon={Gauge} label="Engage" value={`${engagementRate.toFixed(1)}%`} />
            <Metric icon={CalendarDays} label="Age" value={`${perf.daysOld}d`} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <CompactMetric icon={Heart} value={formatNumber(perf.video.likeCount)} label={`${perf.likeRatio.toFixed(1)}%`} />
              <CompactMetric icon={MessageCircle} value={formatNumber(perf.video.commentCount)} label={`${perf.commentRatio.toFixed(1)}%`} />
            </div>
            {variant === "worst" && suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {suggestions.map((suggestion) => (
                  <Badge key={suggestion} variant="outline" className="h-6 rounded-md border-chart-5/20 bg-chart-5/10 px-2 text-xs text-chart-5">
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
          </div>
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

function Metric({
  icon: Icon,
  label,
  value,
  emphasis,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  emphasis?: string;
}) {
  return (
    <div className="rounded-lg border bg-background/70 p-2">
      <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={cn("text-sm font-semibold tabular-nums", emphasis)}>{value}</div>
    </div>
  );
}

function CompactMetric({ icon: Icon, value, label }: { icon: typeof Heart; value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      <span className="font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </span>
  );
}

const VARIANT_TONE = {
  best: {
    card: "border-chart-1/20",
    rank: "bg-chart-1 text-white",
    metric: "text-chart-1",
  },
  recent: {
    card: "border-chart-2/20",
    rank: "bg-chart-2 text-white",
    metric: "text-chart-2",
  },
  worst: {
    card: "border-chart-5/20",
    rank: "bg-chart-5/10 text-chart-5",
    metric: "text-chart-5",
  },
} satisfies Record<PerformanceCardProps["variant"], {
  card: string;
  rank: string;
  metric: string;
}>;
