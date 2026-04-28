import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { CopyBtn } from "./CopyBtn";

interface BestChoiceProps {
  bestChoice: {
    title: string;
    score: number;
    whyBest: string;
  };
}

export function BestChoice({ bestChoice }: BestChoiceProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">AI's Best Choice</h2>
        <p className="text-xs text-muted-foreground mt-1">Gemini analyzed all alternatives and picked the highest-scoring title</p>
      </div>
      <div className="p-4 rounded-xl border-2 border-primary bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-2">
              <p className="text-sm font-semibold leading-snug flex-1">{bestChoice.title}</p>
              <CopyBtn text={bestChoice.title} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{bestChoice.whyBest}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                Score: {bestChoice.score}/100
              </Badge>
              <Badge variant="secondary" className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-xs">
                AI Recommended
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
