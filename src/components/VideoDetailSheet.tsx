"use client";

import Image from "next/image";
import { Video } from "@/types/youtube";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, ThumbsUp, MessageCircle, Clock, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoDetailSheetProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

export function VideoDetailSheet({ video, open, onOpenChange }: VideoDetailSheetProps) {
  if (!video) return null;

  const engagementRate = video.viewCount
    ? (((video.likeCount + video.commentCount) / video.viewCount) * 100).toFixed(2)
    : "0";

  const stats = [
    { icon: Eye,           label: "Views",       value: formatNumber(video.viewCount) },
    { icon: ThumbsUp,      label: "Likes",       value: formatNumber(video.likeCount) },
    { icon: MessageCircle, label: "Comments",    value: formatNumber(video.commentCount) },
    { icon: Clock,         label: "Duration",    value: video.duration },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base leading-snug pr-6">{video.title}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3 h-3" />
            {new Date(video.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </SheetDescription>
        </SheetHeader>

        {/* Thumbnail */}
        {video.thumbnailUrl && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted mb-4">
            <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" sizes="480px" />
          </div>
        )}

        {/* Watch button */}
        <Button variant="destructive" size="sm" className="w-full mb-4" render={
          <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" />
        }>
          <ExternalLink className="w-3.5 h-3.5" />
          Watch on YouTube
        </Button>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Icon className="w-3 h-3" />{label}
              </div>
              <p className="text-sm font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Engagement */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Engagement Rate</p>
          <p className="text-sm font-semibold">{engagementRate}%</p>
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(parseFloat(engagementRate) * 10, 100)}%` }} />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Description */}
        {video.description && (
          <>
            <p className="text-xs font-medium mb-2">Description</p>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-6 mb-4">
              {video.description}
            </p>
            <Separator className="my-4" />
          </>
        )}

        {/* Tags */}
        {video.tags.length > 0 && (
          <>
            <p className="text-xs font-medium mb-2">Tags ({video.tags.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {video.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
