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
  rankedAlternatives: RankedTitle[];
  meta?: AnalysisMeta;
}


interface RankedTitle {
  title: string;
  totalScore: number;
  improvement: string;
}

function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-success";
  if (grade === "B") return "text-primary";
  if (grade === "C") return "text-warning";
  return "text-destructive";
}

function gradeBg(grade: string) {
  if (grade === "A+" || grade === "A") return "bg-success/5 border-success/20";
  if (grade === "B") return "bg-primary/5 border-primary/20";
  if (grade === "C") return "bg-warning/5 border-warning/20";
  return "bg-destructive/5 border-destructive/20";
}

function scoreBarColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.8) return "bg-success";
  if (pct >= 0.5) return "bg-warning";
  return "bg-destructive";
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
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
    try {
      const res = await fetch("/api/title-ranker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.trim(), topKeywords, videoData: data.videos }),
      });
      const result = await res.json();
      setAnalysis(result);
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary" />
            </div>
            Title Ranker
          </h1>
          <p className="text-sm text-muted-foreground mt-2 ml-[52px]">Score your title across 7 SEO dimensions with AI-powered insights</p>
        </div>

        {/* Input */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Analyse a Title</CardTitle>
            <CardDescription>Enter any video title — we'll score it and suggest better-ranked alternatives based on your channel's top keywords</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="e.g. How I built a full-stack app in one weekend"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1 h-11 border-border/40 focus-visible:ring-ring/20"
              />
              <Button onClick={handleAnalyze} disabled={!input.trim() || analyzing} className="gap-2 shrink-0 h-11 px-5">
                <Sparkles className="w-4 h-4" />
                {analyzing ? "Analysing..." : "Analyse"}
              </Button>
            </div>
            {topKeywords.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Your top keywords:</span>
                {topKeywords.slice(0, 8).map(kw => (
                  <button key={kw} onClick={() => setInput(prev => prev ? `${prev} ${kw}` : kw)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 hover:bg-accent transition-colors border border-border/40 font-medium">
                    {kw}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <div className="space-y-6">
            {/* Score overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Grade */}
              <Card className={`border ${gradeBg(analysis.grade)}`}>
                <CardContent className="pt-8 pb-7 flex flex-col items-center gap-2">
                  <span className={`text-7xl font-black tabular-nums ${gradeColor(analysis.grade)}`}>{analysis.grade}</span>
                  <span className="text-sm text-muted-foreground font-medium">Overall Grade</span>
                  <span className={`text-3xl font-bold tabular-nums mt-2 ${gradeColor(analysis.grade)}`}>{analysis.totalScore}<span className="text-base font-normal text-muted-foreground">/100</span></span>
                </CardContent>
              </Card>

              {/* Analysed title */}
              <Card className="md:col-span-2 border-border/40">
                <CardHeader>
                  <CardDescription className="font-medium">Analysed title</CardDescription>
                  <CardTitle className="text-base leading-snug font-semibold">&ldquo;{analysis.input}&rdquo;</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.dimensions.map(d => {
                      const pct = d.score / d.max;
                      return (
                        <Badge key={d.label} variant="secondary" className="gap-1.5 font-normal bg-secondary/50">
                          {pct >= 0.8 ? <CheckCircle2 className="w-3 h-3 text-success" /> : <AlertCircle className="w-3 h-3 text-warning" />}
                          {d.label}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dimension breakdown */}
            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Dimension Breakdown</CardTitle>
                    <CardDescription>Score across 7 SEO dimensions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {analysis.dimensions.map((d) => (
                  <div key={d.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{d.label}</span>
                      <span className="text-sm tabular-nums font-semibold">
                        <span className={d.score === d.max ? "text-success" : d.score >= d.max * 0.5 ? "text-warning" : "text-destructive"}>{d.score}</span>
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
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        : <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />}
                      {d.feedback}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Metadata insights */}
            {analysis.meta && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card size="sm" className="border-border/40">
                  <CardHeader>
                    <CardDescription className="text-xs">Search Intent</CardDescription>
                    <CardTitle className="text-sm capitalize">{analysis.meta.searchIntent.intent}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${analysis.meta.searchIntent.confidence * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{Math.round(analysis.meta.searchIntent.confidence * 100)}% confident</p>
                  </CardContent>
                </Card>
                <Card size="sm" className="border-border/40">
                  <CardHeader>
                    <CardDescription className="text-xs">Sentiment</CardDescription>
                    <CardTitle className="text-sm capitalize">{analysis.meta.sentiment.sentiment}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${analysis.meta.sentiment.confidence * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{Math.round(analysis.meta.sentiment.confidence * 100)}% confident</p>
                  </CardContent>
                </Card>
                <Card size="sm" className="border-border/40">
                  <CardHeader>
                    <CardDescription className="text-xs">Emojis</CardDescription>
                    <CardTitle className="text-sm">{analysis.meta.emoji.count}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-muted-foreground">{analysis.meta.emoji.placement === "none" ? "None" : `${analysis.meta.emoji.placement} placement`}</p>
                  </CardContent>
                </Card>
                <Card size="sm" className="border-border/40">
                  <CardHeader>
                    <CardDescription className="text-xs">Character Limit</CardDescription>
                    <CardTitle className="text-sm">{analysis.meta.characterLimits.length}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-muted-foreground">
                      {analysis.meta.characterLimits.mobileTruncated && analysis.meta.characterLimits.desktopTruncated ? "Truncated on both" :
                       analysis.meta.characterLimits.mobileTruncated ? "Truncated on mobile" :
                       analysis.meta.characterLimits.desktopTruncated ? "Truncated on desktop" : "Within limits"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ranked alternatives */}
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Ranked Alternatives</h2>
                <p className="text-sm text-muted-foreground mt-1">Titles ranked by predicted SEO performance — click any to analyse it</p>
              </div>
              <div className="space-y-3">
                {analysis.rankedAlternatives.map((alt, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-border/40 bg-card/50 hover:shadow-lg hover:border-border/60 transition-all group">
                    {/* Rank badge */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
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
                      <span className="text-base font-bold tabular-nums text-success">{alt.totalScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!analysis && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Type className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold">Enter a title above to get started</p>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">We'll score it across 7 SEO dimensions with AI-powered insights — character limits, keyword relevance, power words, structure, search intent, emoji usage, and sentiment</p>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

