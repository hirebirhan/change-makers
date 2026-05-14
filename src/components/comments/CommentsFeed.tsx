import type { Comment } from "@/types/youtube";
import { CommentCard } from "./CommentCard";

interface CommentsFeedProps {
  comments: (Comment & { videoTitle?: string })[];
  isOAuthConnected?: boolean;
}

export function CommentsFeed({ comments, isOAuthConnected = false }: CommentsFeedProps) {
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} showVideoTitle isOAuthConnected={isOAuthConnected} />
      ))}
    </div>
  );
}
