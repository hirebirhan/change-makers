import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function EmptyState() {
  return (
    <Card>
      <div className="p-10 text-center">
        <Clock className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs font-medium">No videos published in the last 30 days</p>
        <p className="text-xs text-muted-foreground mt-1">Upload a video to see recent performance</p>
      </div>
    </Card>
  );
}
