import { Badge } from "@/components/ui/badge";
import type { Comment, Video } from "@/types/youtube";
import { CommentCard } from "./CommentCard";

interface CommentsByVideoProps {
  videos: Video[];
  comments: (Comment & { videoTitle?: string })[];
  isOAuthConnected?: boolean;
}

export function CommentsByVideo({ videos, comments, isOAuthConnected = false }: CommentsByVideoProps) {
  const sortedVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount);

  return (
    <div className="space-y-3">
      {sortedVideos.map((video) => {
        const videoComments = comments.filter((c) => c.videoId === video.id);
        if (!videoComments.length) return null;
        
        return (
          <div key={video.id}>
            <div className="flex items-center gap-2 mb-2">
              <a 
                href={`https://www.youtube.com/watch?v=${video.id}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-semibold hover:text-primary transition-colors line-clamp-1 flex-1"
              >
                {video.title}
              </a>
              <Badge variant="secondary" className="shrink-0 text-xs h-5 px-2">{videoComments.length}</Badge>
            </div>
            <div className="space-y-2">
              {videoComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} avatarSize={28} isOAuthConnected={isOAuthConnected} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
