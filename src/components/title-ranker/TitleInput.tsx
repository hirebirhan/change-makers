import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Type, Sparkles, CheckCircle2 } from "lucide-react";

interface TitleInputProps {
  input: string;
  topKeywords: string[];
  analyzing: boolean;
  autofixing: boolean;
  onInputChange: (value: string) => void;
  onAnalyze: () => void;
  onAutofix: () => void;
}

export function TitleInput({ input, topKeywords, analyzing, autofixing, onInputChange, onAnalyze, onAutofix }: TitleInputProps) {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Type className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Title Ranker</CardTitle>
            <CardDescription>Score your title across 7 SEO dimensions with AI-powered insights</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-3">
          <Input
            placeholder="e.g. How I built a full-stack app in one weekend"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
            className="flex-1"
          />
          <Button onClick={onAnalyze} disabled={!input.trim() || analyzing || autofixing} className="gap-2 shrink-0">
            <Sparkles className="w-4 h-4" />
            {analyzing ? "Analysing..." : "Analyse"}
          </Button>
          <Button onClick={onAutofix} disabled={!input.trim() || analyzing || autofixing} variant="secondary" className="gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            {autofixing ? "Fixing..." : "Autofix"}
          </Button>
        </div>
        {topKeywords.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Your top keywords:</span>
            {topKeywords.slice(0, 8).map(kw => (
              <button key={kw} onClick={() => onInputChange(input ? `${input} ${kw}` : kw)}
                className="text-xs px-2 py-1 rounded-md bg-secondary/50 hover:bg-accent transition-colors">
                {kw}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
