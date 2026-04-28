"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { SeoData } from "@/lib/seo-server";
import { Lightbulb, BarChart2, AlertCircle, CheckCircle2, Trophy, Tag, Type, BookOpen } from "lucide-react";

interface SeoViewProps {
  initialData: YouTubeApiResponse;
  initialSeoData: SeoData;
}

function getScoreColor(score: number) {
  if (score >= 75) return "text-chart-1";
  if (score >= 50) return "text-chart-5";
  return "text-destructive";
}

function getScoreBg(score: number) {
  if (score >= 75) return "bg-chart-1/10";
  if (score >= 50) return "bg-chart-5/10";
  return "bg-destructive/10";
}

function getProgressBg(score: number) {
  if (score >= 75) return "bg-chart-1";
  if (score >= 50) return "bg-chart-5";
  return "bg-destructive";
}

function getCompetitionColor(comp: string) {
  if (comp === "Low") return "text-chart-1";
  if (comp === "Medium") return "text-chart-5";
  if (comp === "High") return "text-destructive";
  return "text-primary";
}

function getCompetitionBg(comp: string) {
  if (comp === "Low") return "bg-chart-1/10";
  if (comp === "Medium") return "bg-chart-5/10";
  if (comp === "High") return "bg-destructive/10";
  return "bg-primary/10";
}

const BEST_PRACTICES = [
  {
    category: "Titles", icon: Type, color: "text-primary", bg: "bg-primary/5",
    tips: [
      "Keep titles 40–70 characters",
      "Put primary keyword in first 3 words",
      "Use numbers or power words",
      "Avoid clickbait",
      "A/B test titles in YouTube Studio",
    ],
  },
  {
    category: "Descriptions", icon: BookOpen, color: "text-muted-foreground", bg: "bg-muted/30",
    tips: [
      "Write strong first 2-3 sentences",
      "Include keyword in first 100 characters",
      "Add timestamps for sections",
      "Include 3-5 hashtags at end",
      "Link to related videos",
    ],
  },
  {
    category: "Tags & SEO", icon: Tag, color: "text-primary", bg: "bg-primary/5",
    tips: [
      "Use 10-15 tags total",
      "Include channel name as tag",
      "Research competitor tags",
      "Validate with Google Trends",
      "Add closed captions",
    ],
  },
];

export function SeoView({ initialData, initialSeoData }: SeoViewProps) {
  const [data, setData] = useState(initialData);
  const [seo] = useState(initialSeoData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetchYouTubeAnalytics();
      setData(r);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const avg = seo.videoScores.length
    ? Math.round(seo.videoScores.reduce((s, v) => s + v.score, 0) / seo.videoScores.length)
    : 0;
  const good = seo.videoScores.filter(v => v.score >= 75).length;
  const poor = seo.videoScores.filter(v => v.score < 50).length;

  const summaryCards = [
    { label: "Avg Score", value: `${avg}`, sub: "/100", icon: Trophy, iconCn: "text-primary", bg: "bg-primary/10" },
    { label: "Optimized", value: `${good}`, sub: "videos", icon: CheckCircle2, iconCn: "text-chart-1", bg: "bg-chart-1/10" },
    { label: "Needs Work", value: `${poor}`, sub: "videos", icon: AlertCircle, iconCn: "text-destructive", bg: "bg-destructive/10" },
    { label: "Keywords", value: `${seo.recommendedKeywords.length}`, sub: "found", icon: Tag, iconCn: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">SEO Studio</h1>
          <p className="text-xs text-muted-foreground leading-none">Optimize your content for better discoverability</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {summaryCards.map(({ label, value, sub, icon: Icon, iconCn, bg }) => (
            <Card key={label} size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`size-3.5 ${iconCn}`} />
                  </div>
                  <CardDescription className="text-xs">{label}</CardDescription>
                </div>
                <CardTitle className="text-xl tabular-nums">
                  {value}<span className="text-xs font-normal text-muted-foreground">{sub}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList>
            <TabsTrigger value="keywords" className="gap-1.5 text-xs"><BarChart2 className="w-3.5 h-3.5" />Keywords</TabsTrigger>
            <TabsTrigger value="scores" className="gap-1.5 text-xs"><Trophy className="w-3.5 h-3.5" />Scores</TabsTrigger>
            <TabsTrigger value="titles" className="gap-1.5 text-xs"><Lightbulb className="w-3.5 h-3.5" />Ideas</TabsTrigger>
            <TabsTrigger value="practices" className="gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" />Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="space-y-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Recommended Keywords</CardTitle>
                    <CardDescription className="text-xs">Keywords to target based on your content</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="p-4 pt-0">
                <div className="space-y-2">
                  {seo.recommendedKeywords.map((kw, i) => {
                    const compColor = getCompetitionColor(kw.competition);
                    const compBg = getCompetitionBg(kw.competition);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <span className="text-xs text-muted-foreground w-6 shrink-0 tabular-nums">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold mb-0.5">{kw.keyword}</p>
                          <p className="text-xs text-muted-foreground">{kw.reason}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">Source</p>
                            <p className="text-xs font-medium">{kw.source}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs h-6 px-2 font-medium ${compBg} ${compColor} border-0`}>
                            {kw.competition}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="scores" className="space-y-0">
            <div className="space-y-2">
              {seo.videoScores.map((v) => {
                const scoreColorClass = getScoreColor(v.score);
                const scoreBgClass = getScoreBg(v.score);
                const progressBgClass = getProgressBg(v.score);
                
                return (
                  <div key={v.id} className="rounded-lg border bg-card hover:bg-muted/50 p-3 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${scoreBgClass}`}>
                        <span className={`text-xl font-bold tabular-nums leading-none ${scoreColorClass}`}>{v.score}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold line-clamp-2 leading-snug mb-1.5">{v.title}</p>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div className={`h-full rounded-full transition-all ${progressBgClass}`} style={{ width: `${v.score}%` }} />
                        </div>
                        {v.issues.length > 0 && (
                          <div className="space-y-1">
                            {v.issues.slice(0, 2).map((issue) => (
                              <p key={issue} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3 text-chart-5 shrink-0" />
                                <span className="line-clamp-1">{issue}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="titles" className="space-y-0">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Title Suggestions</h2>
                <p className="text-xs text-muted-foreground">Based on your top keywords</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seo.titleSuggestions.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-primary tabular-nums mt-0.5 shrink-0">#{i + 1}</span>
                      <p className="text-xs font-semibold leading-snug">{s.suggestion}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5 pl-5 leading-relaxed">
                      <Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-primary" />{s.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="practices" className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {BEST_PRACTICES.map(({ category, icon: Icon, color, bg, tips }) => (
                <Card key={category} className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <CardTitle className="text-base font-semibold">{category}</CardTitle>
                    </div>
                  </CardHeader>
                  <div className="p-4 pt-0">
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                          <span className={`mt-0.5 shrink-0 font-bold text-sm leading-none ${color}`}>·</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
