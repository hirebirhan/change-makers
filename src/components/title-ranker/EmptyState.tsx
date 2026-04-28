import { Type } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
        <Type className="w-7 h-7 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">Enter a title above to get started</p>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          AI will score it across 7 SEO dimensions and generate optimized alternatives, then pick the best one for you
        </p>
      </div>
    </div>
  );
}
