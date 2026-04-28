import { ThumbsUp, MessageCircle } from "lucide-react";
import type { Comment } from "@/types/youtube";
import { CommentAvatar } from "./CommentAvatar";
import { SentimentBadge } from "./SentimentBadge";

interface CommentCardProps {
  comment: Comment & { videoTitle?: string };
  showVideoTitle?: boolean;
  avatarSize?: number;
}

function timeAgo(dateString: string) {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function CommentCard({ comment, showVideoTitle = false, avatarSize = 32 }: CommentCardProps) {
  return (
    <div className="rounded-lg border bg-card hover:bg-muted/50 p-3 transition-colors">
      <div className="flex gap-3">
        <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className="text-xs font-semibold">{comment.author}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
            <SentimentBadge sentiment={comment.sentiment} />
          </div>
          <p className="text-xs text-foreground leading-relaxed mb-2">{comment.text}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />{comment.likeCount.toLocaleString()}
            </span>
            {comment.replyCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />{comment.replyCount}
              </span>
            )}
            {showVideoTitle && comment.videoTitle && (
              <span className="ml-auto truncate max-w-xs text-muted-foreground/60 italic text-xs">
                {comment.videoTitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
