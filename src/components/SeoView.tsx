"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import {
  TrendingUp, Lightbulb, BarChart2, AlertCircle, CheckCircle2,
  Globe, Zap, BookOpen, ArrowUpRight, Trophy, Tag, Type, Sparkles,
} from "lucide-react";

interface VideoScore {
  id: string;
  title: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

interface SeoData {
  trends: string[];
  keywords: { keyword: string; count: number; totalViews: number }[];
  titleSuggestions: { suggestion: string; reason: string }[];
  tagGaps: string[];
  videoScores: VideoScore[];
}

const GEO_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "ET", label: "Ethiopia" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
];

const BEST_PRACTICES = [
  {
    category: "Titles", icon: Type, color: "text-primary", bg: "bg-primary/5",
    tips: [
      "Keep titles 40–70 characters — long enough for context, short enough to avoid truncation.",
      "Put your primary keyword within the first 3 words of the title.",
      "Use numbers, questions, or power words (Ultimate, Complete, Proven) to boost CTR.",
      "Avoid clickbait — YouTube demotes videos with high impressions but low watch time.",
      "A/B test titles using YouTube Studio's 'Test & Compare' feature.",
    ],
  },
  {
    category: "Thumbnails", icon: Zap, color: "text-warning", bg: "bg-warning/5",
    tips: [
      "Use high contrast colors — your thumbnail must stand out on both light and dark backgrounds.",
      "Include a face with a clear emotion — human faces increase CTR by up to 38%.",
      "Limit text to 3–5 bold words maximum — it must be readable at 120×68px.",
      "Keep a consistent visual style so your channel is instantly recognisable in feeds.",
      "Never use the auto-generated thumbnail — custom thumbnails get 90% more clicks.",
    ],
  },
  {
    category: "Descriptions", icon: BookOpen, color: "text-muted-foreground", bg: "bg-muted/30",
    tips: [
      "Write the first 2–3 sentences as a standalone hook — this is what shows in search results.",
      "Include your primary keyword naturally in the first 100 characters.",
      "Add timestamps for every major section — this creates chapter links and improves UX.",
      "Include 3–5 relevant hashtags at the very end of the description.",
      "Add links to related videos, playlists, and your social profiles.",
    ],
  },
  {
    category: "Tags & SEO", icon: Tag, color: "text-success", bg: "bg-success/5",
    tips: [
      "Use 10–15 tags: start with your exact title keyword, then broad terms, then long-tail phrases.",
      "Include your channel name as a tag so your videos appear in 'More from this channel'.",
      "Research competitor tags using browser extensions like TubeBuddy or VidIQ.",
      "Use Google Trends to validate that your keywords have rising search interest.",
      "Add closed captions — YouTube indexes your transcript as additional keyword content.",
    ],
  },
  {
    category: "Engagement", icon: TrendingUp, color: "text-destructive", bg: "bg-destructive/5",
    tips: [
      "Ask viewers to like and comment within the first 30 seconds — early engagement boosts distribution.",
      "Reply to every comment in the first 24 hours — it signals activity to the algorithm.",
      "End every video with a specific question to drive comments.",
      "Use cards and end screens to keep viewers in your channel — session time is a key ranking factor.",
      "Pin a comment with a key takeaway or link — it increases comment section engagement.",
    ],
  },
  {
    category: "Upload Strategy", icon: Trophy, color: "text-primary", bg: "bg-primary/5",
    tips: [
      "Publish consistently — even once a week beats sporadic uploads in the algorithm.",
      "Upload at peak times for your audience (check YouTube Studio Analytics > When your viewers are on YouTube).",
      "Promote every video in the first hour of publishing — early velocity signals quality to YouTube.",
      "Create playlists around topics — playlists increase session time and surface more of your content.",
      "Repurpose your best videos into Shorts to reach a new audience and cross-promote.",
    ],
  },
];

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}
function scoreBg(score: number) {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

function ScoreSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-5 rounded-2xl border border-border/40 bg-card/50 space-y-3">
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2.5 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryCards({ seo }: { seo: SeoData }) {
  const avg = seo.videoScores.length
    ? Math.round(seo.videoScores.reduce((s, v) => s + v.score, 0) / seo.videoScores.length)
    : 0;
  const good = seo.videoScores.filter(v => v.score >= 75).length;
  const poor = seo.videoScores.filter(v => v.score < 50).length;

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Avg Score", value: `${avg}`, sub: "/100", icon: Trophy, iconCn: "text-primary", bg: "bg-primary/5" },
        { label: "Optimized", value: `${good}`, sub: "videos", icon: CheckCircle2, iconCn: "text-success", bg: "bg-success/5" },
        { label: "Needs Work", value: `${poor}`, sub: "videos", icon: AlertCircle, iconCn: "text-destructive", bg: "bg-destructive/5" },
        { label: "Tag Gaps", value: `${seo.tagGaps.length}`, sub: "topics", icon: Tag, iconCn: "text-warning", bg: "bg-warning/5" },
      ].map(({ label, value, sub, icon: Icon, iconCn, bg }) => (
        <Card key={label} size="sm" className="border-border/40">
          <CardHeader className="space-y-0">
            <div className="flex items-center justify-between mb-1.5">
              <CardDescription className="text-[10px] font-medium uppercase tracking-wide">{label}</CardDescription>
              <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`size-3 ${iconCn}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <CardTitle className="text-2xl tabular-nums font-bold">{value}</CardTitle>
              <span className="text-[10px] text-muted-foreground font-normal">{sub}</span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function SeoView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [seo, setSeo] = useState<SeoData | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [geo, setGeo] = useState("US");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await fetchYouTubeAnalytics(); setData(r); setLastUpdated(new Date()); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    setSeoLoading(true);
    fetch("/api/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videos: data.videos, geo }),
    }).then(r => r.json()).then(setSeo).finally(() => setSeoLoading(false));
  }, [data, geo]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">SEO Studio</h1>
            <p className="text-xs text-muted-foreground mt-1">Optimize your content for better discoverability</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={geo}
              onChange={(e) => setGeo(e.target.value)}
              className="h-8 rounded-lg border border-border/40 bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
            >
              {GEO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        {seoLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : seo && <SummaryCards seo={seo} />}

        <Tabs defaultValue="scores" className="space-y-4">
          <TabsList className="bg-muted/30 p-0.5 h-9">
            <TabsTrigger value="scores" className="gap-1.5 text-xs h-8"><Trophy className="w-3 h-3" />Scores</TabsTrigger>
            <TabsTrigger value="trends" className="gap-1.5 text-xs h-8"><TrendingUp className="w-3 h-3" />Trends</TabsTrigger>
            <TabsTrigger value="keywords" className="gap-1.5 text-xs h-8"><BarChart2 className="w-3 h-3" />Keywords</TabsTrigger>
            <TabsTrigger value="titles" className="gap-1.5 text-xs h-8"><Lightbulb className="w-3 h-3" />Ideas</TabsTrigger>
            <TabsTrigger value="practices" className="gap-1.5 text-xs h-8"><BookOpen className="w-3 h-3" />Tips</TabsTrigger>
          </TabsList>

          {/* ── Video Scores ── */}
          <TabsContent value="scores" className="space-y-0">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Score list */}
              <div className="xl:col-span-2 space-y-2">
                {seoLoading ? <ScoreSkeleton /> : seo?.videoScores.map((v) => {
                  const scoreColorClass = v.score >= 75 ? 'text-green-600 dark:text-green-400' : v.score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                  const scoreBgClass = v.score >= 75 ? 'bg-green-500/10 border-green-500/20' : v.score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';
                  const progressBgClass = v.score >= 75 ? 'bg-green-500' : v.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                  
                  return (
                  <div key={v.id} className="rounded-lg border border-border/40 bg-card hover:bg-accent/5 p-3 transition-all hover:border-border/60 group">
                    <div className="flex items-start gap-3">
                      {/* Score badge */}
                      <div className={`shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${scoreBgClass}`}>
                        <span className={`text-xl font-bold tabular-nums leading-none ${scoreColorClass}`}>{v.score}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1.5">
                          <p className="text-xs font-semibold line-clamp-2 leading-snug flex-1">{v.title}</p>
                          <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mb-2">
                          <div className={`h-full rounded-full transition-all duration-700 ${progressBgClass}`} style={{ width: `${v.score}%` }} />
                        </div>
                        
                        {v.issues.length > 0 && (
                          <div className="space-y-1">
                            {v.issues.slice(0, 2).map((issue) => (
                              <p key={issue} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3 text-warning shrink-0" />
                                <span className="line-clamp-1">{issue}</span>
                              </p>
                            ))}
                            {v.issues.length > 2 && (
                              <p className="text-[10px] text-muted-foreground pl-4.5">+{v.issues.length - 2} more issues</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              {/* Right sidebar */}
              <div className="xl:col-span-1 space-y-3">
                {seo && (
                  <Card className="border-border/40">
                    <CardHeader>
                      <CardTitle className="text-sm">Distribution</CardTitle>
                      <CardDescription className="text-xs">SEO health overview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Good", range: "75+", count: seo.videoScores.filter(v => v.score >= 75).length, color: "bg-green-500", textColor: "text-green-600 dark:text-green-400" },
                        { label: "Fair", range: "50-74", count: seo.videoScores.filter(v => v.score >= 50 && v.score < 75).length, color: "bg-yellow-500", textColor: "text-yellow-600 dark:text-yellow-400" },
                        { label: "Poor", range: "<50", count: seo.videoScores.filter(v => v.score < 50).length, color: "bg-red-500", textColor: "text-red-600 dark:text-red-400" },
                      ].map(({ label, range, count, color, textColor }) => {
                        const pct = seo.videoScores.length ? Math.round((count / seo.videoScores.length) * 100) : 0;
                        return (
                          <div key={label} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-medium">{label} <span className="text-muted-foreground font-normal">({range})</span></span>
                              <span className={`font-bold tabular-nums ${textColor}`}>{count}</span>
                            </div>
                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {seo && (
                  <Card className="border-border/40">
                    <CardHeader>
                      <CardTitle className="text-sm">Tag Gaps</CardTitle>
                      <CardDescription className="text-xs">Missing trending topics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {seo.tagGaps.length === 0 ? (
                        <div className="flex items-center gap-2 text-success text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          No gaps found
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {seo.tagGaps.map((t) => (
                            <Badge key={t} variant="destructive" className="gap-1 font-normal text-[10px] h-5">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {seoLoading && <Card className="border-border/40"><CardContent className="py-10"><Skeleton className="h-48 w-full rounded-xl" /></CardContent></Card>}
              </div>
            </div>
          </TabsContent>

          {/* ── Trends ── */}
          <TabsContent value="trends" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card className="border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Trending Now</CardTitle>
                      <CardDescription className="text-[10px]">Top 20 in {GEO_OPTIONS.find(o => o.value === geo)?.label}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-1.5">{[...Array(12)].map((_, i) => <Skeleton key={i} className="h-6 w-24 rounded-full" />)}</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {seo?.trends.map((t, i) => (
                        <a key={t} href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(t)}&geo=${geo}`} target="_blank" rel="noopener noreferrer">
                          <Badge variant={i < 5 ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity gap-1 font-normal text-[10px] h-6">
                            <span className="text-[9px] opacity-60">#{i + 1}</span>{t}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-destructive/5 flex items-center justify-center">
                      <Tag className="w-3.5 h-3.5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Tag Gaps</CardTitle>
                      <CardDescription className="text-[10px]">Topics not in your tags</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-1.5">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-6 w-24 rounded-full" />)}</div>
                  ) : seo?.tagGaps.length === 0 ? (
                    <div className="flex items-center gap-2 text-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" />No gaps found</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {seo?.tagGaps.map((t) => <Badge key={t} variant="destructive" className="font-normal text-[10px] h-6">{t}</Badge>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Keywords ── */}
          <TabsContent value="keywords" className="space-y-0">
            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center">
                    <BarChart2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Top Keywords</CardTitle>
                    <CardDescription className="text-[10px]">Ranked by total views driven</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {seoLoading ? (
                  <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-5 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {seo?.keywords.map((kw, i) => {
                      const maxViews = seo.keywords[0]?.totalViews || 1;
                      const pct = Math.round((kw.totalViews / maxViews) * 100);
                      return (
                        <div key={kw.keyword} className="flex items-center gap-2.5 group">
                          <span className="text-[10px] text-muted-foreground w-6 text-right shrink-0 tabular-nums font-medium">#{i + 1}</span>
                          <span className="text-xs font-medium w-32 shrink-0 truncate">{kw.keyword}</span>
                          <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0 tabular-nums">
                            {kw.totalViews >= 1000 ? (kw.totalViews / 1000).toFixed(1) + "K" : kw.totalViews}
                          </span>
                          <Badge variant="outline" className="text-[9px] shrink-0 w-9 justify-center font-normal h-5">{kw.count}×</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Title Ideas ── */}
          <TabsContent value="titles" className="space-y-0">
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold">Title Suggestions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Based on your top keywords and trends</p>
              </div>
              {seoLoading ? (
                <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {seo?.titleSuggestions.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/40 bg-card hover:bg-accent/5 hover:border-border/60 transition-all space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-primary tabular-nums mt-0.5 shrink-0">#{i + 1}</span>
                        <p className="text-xs font-semibold leading-snug">{s.suggestion}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 pl-5 leading-relaxed">
                        <Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-primary" />{s.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Best Practices ── */}
          <TabsContent value="practices" className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {BEST_PRACTICES.map(({ category, icon: Icon, color, bg, tips }) => (
                <Card key={category} className="border-border/40 hover:border-border/60 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <CardTitle className="text-sm">{category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                          <span className={`mt-0.5 shrink-0 font-bold text-sm leading-none ${color}`}>·</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}

