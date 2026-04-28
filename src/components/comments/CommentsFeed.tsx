import type { Comment } from "@/types/youtube";
import { CommentCard } from "./CommentCard";

interface CommentsFeedProps {
  comments: (Comment & { videoTitle?: string })[];
}

export function CommentsFeed({ comments }: CommentsFeedProps) {
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} showVideoTitle />
      ))}
    </div>
  );
}
