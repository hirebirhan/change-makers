import { Badge } from "@/components/ui/badge";
import { SmilePlus, Meh, Frown } from "lucide-react";
import type { Comment } from "@/types/youtube";

export function SentimentBadge({ sentiment }: { sentiment: Comment["sentiment"] }) {
  if (sentiment === "positive") {
    return (
      <Badge variant="secondary" className="text-chart-1 bg-chart-1/10 border-chart-1/20 text-xs h-5 px-2">
        <SmilePlus className="w-3 h-3 mr-1" />Positive
      </Badge>
    );
  }
  
  if (sentiment === "negative") {
    return (
      <Badge variant="destructive" className="text-xs h-5 px-2">
        <Frown className="w-3 h-3 mr-1" />Negative
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="text-xs h-5 px-2">
      <Meh className="w-3 h-3 mr-1" />Neutral
    </Badge>
  );
}
