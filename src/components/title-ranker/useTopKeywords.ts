import { useMemo } from "react";
import type { Video } from "@/types/youtube";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "is", "it", "this", "that", "my", "how", "what", "why", "i", "you", "we", "they",
  "be", "are", "was", "were", "have", "has", "do", "did", "will", "can", "get",
  "new", "best", "top", "video", "youtube"
]);

export function useTopKeywords(videos: Video[]) {
  return useMemo(() => {
    const map = new Map<string, number>();
    
    for (const v of videos) {
      const words = v.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      
      for (const w of words) {
        map.set(w, (map.get(w) ?? 0) + v.viewCount);
      }
    }
    
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);
  }, [videos]);
}
