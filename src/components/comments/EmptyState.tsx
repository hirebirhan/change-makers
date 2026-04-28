import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export function EmptyState() {
  return (
    <Card>
      <div className="p-10 text-center">
        <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs font-medium">No comments found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    </Card>
  );
}
