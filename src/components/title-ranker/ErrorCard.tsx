import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorCardProps {
  error: string;
}

export function ErrorCard({ error }: ErrorCardProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">Error</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
