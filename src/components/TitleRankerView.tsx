"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import {
  Type, Sparkles, CheckCircle2, AlertCircle,
  ChevronRight, BarChart2, Copy, Check,
} from "lucide-react";

interface DimensionScore {
  label: string;
  score: number;
  max: number;
  feedback: string;
}

interface AnalysisMeta {
  searchIntent: { intent: string; confidence: number };
  sentiment: { sentiment: string; confidence: number };
  emoji: { count: number; placement: string; score: number; feedback: string };
  characterLimits: { length: number; mobileTruncated: boolean; desktopTruncated: boolean; score: number; feedback: string };
}

interface TitleAnalysis {
  input: string;
  totalScore: number;
  grade: string;
  dimensions: DimensionScore[];
  rankedAlternatives?: RankedTitle[];
  bestChoice?: {
    title: string;
    score: number;
    whyBest: string;
  };
  fixed?: {
    title: string;
    score: number;
    changes: string[];
  };
  meta?: AnalysisMeta;
}


interface RankedTitle {
  title: string;
  totalScore: number;
  improvement: string;
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

function scoreBarColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.8) return "bg-chart-1";
  if (pct >= 0.5) return "bg-chart-5";
  return "bg-destructive";
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <Check className="w-3.5 h-3.5 text-chart-1" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </Button>
  );
}

export function TitleRankerView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<TitleAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [autofixing, setAutofixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await fetchYouTubeAnalytics(); setData(r); setLastUpdated(new Date()); }
    finally { setRefreshing(false); }
  }, []);

  const topKeywords = (() => {
    const STOP = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","is","it","this","that","my","how","what","why","i","you","we","they","be","are","was","were","have","has","do","did","will","can","get","new","best","top","video","youtube"]);
    const map = new Map<string, number>();
    for (const v of data.videos) {
      const words = v.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
      for (const w of words) map.set(w, (map.get(w) ?? 0) + v.viewCount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([kw]) => kw);
  })();

  async function handleAnalyze() {
    if (!input.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/title-ranker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.trim(), topKeywords, videoData: data.videos }),
      });
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        setAnalysis(result);
      }
    } catch (e) {
      console.error("Analysis failed:", e);
      setError("Failed to analyze title. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAutofix() {
    if (!input.trim()) return;
    setAutofixing(true);
    setError(null);
    try {
      const res = await fetch("/api/title-ranker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.trim(), topKeywords, videoData: data.videos, autofix: true }),
      });
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        setAnalysis(result);
      }
    } catch (e) {
      console.error("Autofix failed:", e);
      setError("Failed to autofix title. Please try again.");
    } finally {
      setAutofixing(false);
    }
  }

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">

        {/* Input */}
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1"
              />
              <Button onClick={handleAnalyze} disabled={!input.trim() || analyzing || autofixing} className="gap-2 shrink-0">
                <Sparkles className="w-4 h-4" />
                {analyzing ? "Analysing..." : "Analyse"}
              </Button>
              <Button onClick={handleAutofix} disabled={!input.trim() || analyzing || autofixing} variant="secondary" className="gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                {autofixing ? "Fixing..." : "Autofix"}
              </Button>
            </div>
            {topKeywords.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Your top keywords:</span>
                {topKeywords.slice(0, 8).map(kw => (
                  <button key={kw} onClick={() => setInput(prev => prev ? `${prev} ${kw}` : kw)}
                    className="text-xs px-2 py-1 rounded-md bg-secondary/50 hover:bg-accent transition-colors">
                    {kw}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
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
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Score overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Grade */}
              <Card className={`border ${gradeBg(analysis.grade)}`}>
                <CardContent className="pt-6 pb-6 flex flex-col items-center gap-2">
                  <span className={`text-6xl font-black tabular-nums ${gradeColor(analysis.grade)}`}>{analysis.grade}</span>
                  <span className="text-xs text-muted-foreground">Overall Grade</span>
                  <span className={`text-2xl font-semibold tabular-nums mt-1 ${gradeColor(analysis.grade)}`}>{analysis.totalScore}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
                </CardContent>
              </Card>

              {/* Analysed title */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardDescription>Analysed title</CardDescription>
                  <CardTitle className="text-sm leading-snug">&ldquo;{analysis.input}&rdquo;</CardTitle>
                </CardHeader>
                {analysis.dimensions && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.dimensions.map(d => {
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
                )}
              </Card>
            </div>

            {/* Dimension breakdown */}
            {analysis.dimensions && (
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
                  {analysis.dimensions.map((d) => (
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
            )}

            {/* Metadata insights */}
            {analysis.meta && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="text-xs">Search Intent</CardDescription>
                    <CardTitle className="text-sm capitalize">{analysis.meta.searchIntent.intent}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="text-xs">Sentiment</CardDescription>
                    <CardTitle className="text-sm capitalize">{analysis.meta.sentiment.sentiment}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="text-xs">Emojis</CardDescription>
                    <CardTitle className="text-sm">{analysis.meta.emoji.count}</CardTitle>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription className="text-xs">Length</CardDescription>
                    <CardTitle className="text-sm">{analysis.meta.characterLimits.length} chars</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Autofix result */}
            {analysis.fixed && (
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
                        <p className="text-sm font-semibold leading-snug flex-1">{analysis.fixed.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <CopyBtn text={analysis.fixed.title} />
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => { setInput(analysis.fixed?.title || ""); handleAnalyze(); }}>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Changes made:</p>
                        {analysis.fixed.changes.map((change, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-chart-1 shrink-0 mt-0.5" />
                            {change}
                          </p>
                        ))}
                      </div>
                      <Badge variant="secondary" className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-xs">
                        Improved Score: {analysis.fixed.score}/100
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ranked alternatives */}
            {analysis.bestChoice && (
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
                        <p className="text-sm font-semibold leading-snug flex-1">{analysis.bestChoice.title}</p>
                        <CopyBtn text={analysis.bestChoice.title} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{analysis.bestChoice.whyBest}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Score: {analysis.bestChoice.score}/100
                        </Badge>
                        <Badge variant="secondary" className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-xs">
                          AI Recommended
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other alternatives */}
            {analysis.rankedAlternatives && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold">Other Alternatives</h2>
                  <p className="text-xs text-muted-foreground mt-1">Additional high-scoring titles ranked by predicted SEO performance</p>
                </div>
                <div className="space-y-2">
                  {analysis.rankedAlternatives.map((alt, i) => (
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
                              onClick={() => { setInput(alt.title); handleAnalyze(); }}>
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
            )}
          </div>
        )}

        {/* Empty state */}
        {!analysis && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Type className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Enter a title above to get started</p>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">AI will score it across 7 SEO dimensions and generate optimized alternatives, then pick the best one for you</p>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

