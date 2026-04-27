"use client";

import Image from "next/image";
import { Video } from "@/types/youtube";
import { Eye, ThumbsUp } from "lucide-react";

interface VideoCardProps {
  video: Video;
  rank?: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

function timeAgo(dateString: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function VideoCard({ video, rank }: VideoCardProps) {
  return (
    <div className="flex gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors group">
      {/* Thumbnail */}
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
          <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded leading-4">
            #{rank}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium line-clamp-2 leading-snug hover:text-primary transition-colors"
        >
          {video.title}
        </a>
        <div className="flex items-center gap-2.5 mt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(video.viewCount)}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{formatNumber(video.likeCount)}</span>
          <span className="ml-auto">{timeAgo(video.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}
