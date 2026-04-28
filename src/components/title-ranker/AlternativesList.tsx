import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { CopyBtn } from "./CopyBtn";

interface RankedTitle {
  title: string;
  totalScore: number;
  improvement: string;
}

interface AlternativesListProps {
  alternatives: RankedTitle[];
  onAnalyze: (title: string) => void;
}

export function AlternativesList({ alternatives, onAnalyze }: AlternativesListProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Other Alternatives</h2>
        <p className="text-xs text-muted-foreground mt-1">Additional high-scoring titles ranked by predicted SEO performance</p>
      </div>
      <div className="space-y-2">
        {alternatives.map((alt, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:shadow-md hover:border-border transition-all group">
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              #{i + 1}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start gap-2">
                <p className="text-sm font-semibold leading-snug flex-1">{alt.title}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyBtn text={alt.title} />
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => onAnalyze(alt.title)}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{alt.improvement}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-sm font-semibold tabular-nums text-chart-1">{alt.totalScore}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
