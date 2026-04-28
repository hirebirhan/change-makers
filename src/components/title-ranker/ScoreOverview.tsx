import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface DimensionScore {
  label: string;
  score: number;
  max: number;
  feedback: string;
}

interface ScoreOverviewProps {
  grade: string;
  totalScore: number;
  input: string;
  dimensions: DimensionScore[];
}

function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-chart-1";
  if (grade === "B") return "text-primary";
  if (grade === "C") return "text-chart-5";
  return "text-destructive";
}

function gradeBg(grade: string) {
  if (grade === "A+" || grade === "A") return "bg-chart-1/5 border-chart-1/20";
  if (grade === "B") return "bg-primary/5 border-primary/20";
  if (grade === "C") return "bg-chart-5/5 border-chart-5/20";
  return "bg-destructive/5 border-destructive/20";
}

export function ScoreOverview({ grade, totalScore, input, dimensions }: ScoreOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card className={`border ${gradeBg(grade)}`}>
        <CardContent className="pt-6 pb-6 flex flex-col items-center gap-2">
          <span className={`text-6xl font-black tabular-nums ${gradeColor(grade)}`}>{grade}</span>
          <span className="text-xs text-muted-foreground">Overall Grade</span>
          <span className={`text-2xl font-semibold tabular-nums mt-1 ${gradeColor(grade)}`}>
            {totalScore}<span className="text-sm font-normal text-muted-foreground">/100</span>
          </span>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardDescription>Analysed title</CardDescription>
          <CardTitle className="text-sm leading-snug">&ldquo;{input}&rdquo;</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {dimensions.map(d => {
              const pct = d.score / d.max;
              return (
                <Badge key={d.label} variant="secondary" className="gap-1.5">
                  {pct >= 0.8 ? <CheckCircle2 className="w-3 h-3 text-chart-1" /> : <AlertCircle className="w-3 h-3 text-chart-5" />}
                  {d.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
