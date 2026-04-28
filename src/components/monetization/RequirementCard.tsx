import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RequirementCardProps {
  label: string;
  current: string;
  target: string;
  progress: number;
  met: boolean;
}

export function RequirementCard({ label, current, target, progress, met }: RequirementCardProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {met ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-chart-1 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {current} / {target}
          </span>
          <span className={`text-xs font-semibold tabular-nums ${met ? "text-chart-1" : ""}`}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}
