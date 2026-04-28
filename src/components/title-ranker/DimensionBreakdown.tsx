import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, CheckCircle2, AlertCircle } from "lucide-react";

interface DimensionScore {
  label: string;
  score: number;
  max: number;
  feedback: string;
}

interface DimensionBreakdownProps {
  dimensions: DimensionScore[];
}

function scoreBarColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.8) return "bg-chart-1";
  if (pct >= 0.5) return "bg-chart-5";
  return "bg-destructive";
}

export function DimensionBreakdown({ dimensions }: DimensionBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <div>
            <CardTitle className="text-sm">Dimension Breakdown</CardTitle>
            <CardDescription>Score across 7 SEO dimensions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dimensions.map((d) => (
          <div key={d.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{d.label}</span>
              <span className="text-sm tabular-nums font-semibold">
                <span className={d.score === d.max ? "text-chart-1" : d.score >= d.max * 0.5 ? "text-chart-5" : "text-destructive"}>{d.score}</span>
                <span className="text-muted-foreground font-normal">/{d.max}</span>
              </span>
            </div>
            <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(d.score, d.max)}`}
                style={{ width: `${(d.score / d.max) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 leading-relaxed">
              {d.score >= d.max * 0.8
                ? <CheckCircle2 className="w-3.5 h-3.5 text-chart-1 shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 text-chart-5 shrink-0" />}
              {d.feedback}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
