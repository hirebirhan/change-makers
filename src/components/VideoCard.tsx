"use client";

import Image from "next/image";
import { Video } from "@/types/youtube";
import { Eye, ThumbsUp } from "lucide-react";

interface VideoCardProps {
  video: Video;
  rank?: number;
  layout?: "list" | "grid";
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function timeAgo(dateString: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (diffDays === 0)   return "Today";
  if (diffDays === 1)   return "Yesterday";
  if (diffDays < 7)     return `${diffDays}d ago`;
  if (diffDays < 30)    return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365)   return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

const YT_PLACEHOLDER = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function VideoCard({ video, rank, layout = "list" }: VideoCardProps) {
  if (layout === "grid") {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-lg overflow-hidden hover:bg-muted/40 transition-colors"
      >
        <div className="relative w-full aspect-video overflow-hidden bg-muted rounded-lg">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              {YT_PLACEHOLDER}
            </div>
          )}
          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono leading-none">
            {video.duration}
          </span>
        </div>
        <div className="px-1 py-2">
          <p className="text-xs font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </p>
          <div className="flex items-center gap-2.5 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatNumber(video.viewCount)}</span>
            <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" />{formatNumber(video.likeCount)}</span>
            <span className="ml-auto">{timeAgo(video.publishedAt)}</span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className="flex gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors group">
      <div className="relative shrink-0 w-16 h-10 rounded-md overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        )}
        {rank && (
          <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-xs font-bold px-1 rounded leading-4">
            #{rank}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium line-clamp-2 leading-snug hover:text-primary transition-colors"
        >
          {video.title}
        </a>
        <div className="flex items-center gap-2.5 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(video.viewCount)}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{formatNumber(video.likeCount)}</span>
          <span className="ml-auto">{timeAgo(video.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}
