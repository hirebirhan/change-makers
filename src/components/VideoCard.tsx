"use client";

import { Video } from "@/types/youtube";
import { Eye, ThumbsUp, MessageCircle, Calendar } from "lucide-react";

interface VideoCardProps {
  video: Video;
  rank: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function VideoCard({ video, rank }: VideoCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
            {video.title}
          </h4>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(video.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {formatNumber(video.likeCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {formatNumber(video.commentCount)}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {timeAgo(video.publishedAt)}
            <span className="mx-1">•</span>
            {video.duration}
          </div>
        </div>
      </div>
    </div>
  );
}
