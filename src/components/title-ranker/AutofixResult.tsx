import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { CopyBtn } from "./CopyBtn";

interface AutofixResultProps {
  fixed: {
    title: string;
    score: number;
    changes: string[];
  };
  onAnalyze: (title: string) => void;
}

export function AutofixResult({ fixed, onAnalyze }: AutofixResultProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Autofixed Title</h2>
        <p className="text-xs text-muted-foreground mt-1">AI automatically improved your title based on missing elements</p>
      </div>
      
      <div className="p-4 rounded-xl border-2 border-chart-1 bg-chart-1/5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-chart-1 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-2">
              <p className="text-sm font-semibold leading-snug flex-1">{fixed.title}</p>
              <div className="flex items-center gap-1 shrink-0">
                <CopyBtn text={fixed.title} />
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => onAnalyze(fixed.title)}>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Changes made:</p>
              {fixed.changes.map((change, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-chart-1 shrink-0 mt-0.5" />
                  {change}
                </p>
              ))}
            </div>
            <Badge variant="secondary" className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-xs">
              Improved Score: {fixed.score}/100
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
