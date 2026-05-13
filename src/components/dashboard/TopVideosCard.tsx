import VideoCard from "@/components/VideoCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@/types/youtube";

interface TopVideosCardProps {
  videos: Video[];
}

export function TopVideosCard({ videos }: TopVideosCardProps) {
  const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top Videos</CardTitle>
        <CardDescription className="text-xs">Ranked by total views</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-96">
        <div className="space-y-1">
          {topVideos.map((video, index) => (
            <VideoCard key={video.id} video={video} rank={index + 1} priority={index === 0} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
