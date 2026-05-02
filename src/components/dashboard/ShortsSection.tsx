import VideoCard from "@/components/VideoCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@/types/youtube";

interface ShortsSectionProps {
  shorts: Video[];
}

export function ShortsSection({ shorts }: ShortsSectionProps) {
  if (!shorts.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Shorts</CardTitle>
        <CardDescription className="text-xs">Videos under 60 seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...shorts].sort((a, b) => b.viewCount - a.viewCount).map((video) => (
            <VideoCard key={video.id} video={video} layout="grid" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
