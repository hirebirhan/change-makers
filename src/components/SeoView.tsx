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
  recommendedKeywords: { keyword: string; searchVolume: string; competition: string; reason: string }[];
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
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: "Avg Score", value: `${avg}`, sub: "/100", icon: Trophy, iconCn: "text-primary", bg: "bg-primary/10" },
        { label: "Optimized", value: `${good}`, sub: "videos", icon: CheckCircle2, iconCn: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" },
        { label: "Needs Work", value: `${poor}`, sub: "videos", icon: AlertCircle, iconCn: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
        { label: "Tag Gaps", value: `${seo.tagGaps.length}`, sub: "topics", icon: Tag, iconCn: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
      ].map(({ label, value, sub, icon: Icon, iconCn, bg }) => (
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

  const loadSeoData = useCallback(async () => {
    setSeoLoading(true);
    try {
      const response = await fetch("/api/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videos: data.videos, geo }),
      });
      const result = await response.json();
      setSeo(result);
    } finally {
      setSeoLoading(false);
    }
  }, [data.videos, geo]);

  useEffect(() => { loadSeoData(); }, [loadSeoData]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SEO Studio</h1>
            <p className="text-xs text-muted-foreground leading-none">Optimize your content for better discoverability</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={geo}
              onChange={(e) => setGeo(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              {GEO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        {seoLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : seo && <SummaryCards seo={seo} />}

        <Tabs defaultValue="scores" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scores" className="gap-1.5 text-xs"><Trophy className="w-3.5 h-3.5" />Scores</TabsTrigger>
            <TabsTrigger value="trends" className="gap-1.5 text-xs"><TrendingUp className="w-3.5 h-3.5" />Trends</TabsTrigger>
            <TabsTrigger value="keywords" className="gap-1.5 text-xs"><BarChart2 className="w-3.5 h-3.5" />Keywords</TabsTrigger>
            <TabsTrigger value="titles" className="gap-1.5 text-xs"><Lightbulb className="w-3.5 h-3.5" />Ideas</TabsTrigger>
            <TabsTrigger value="practices" className="gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" />Tips</TabsTrigger>
          </TabsList>

          {/* ── Video Scores ── */}
          <TabsContent value="scores" className="space-y-0">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Score list */}
              <div className="xl:col-span-2 space-y-2">
                {seoLoading ? <ScoreSkeleton /> : seo?.videoScores.map((v) => {
                  const scoreColorClass = v.score >= 75 ? 'text-green-600 dark:text-green-400' : v.score >= 50 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
                  const scoreBgClass = v.score >= 75 ? 'bg-green-500/10' : v.score >= 50 ? 'bg-orange-500/10' : 'bg-red-500/10';
                  const progressBgClass = v.score >= 75 ? 'bg-green-500' : v.score >= 50 ? 'bg-orange-500' : 'bg-red-500';
                  
                  return (
                  <div key={v.id} className="rounded-lg border bg-card hover:bg-muted/50 p-3 transition-colors group">
                    <div className="flex items-start gap-3">
                      {/* Score badge */}
                      <div className={`shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${scoreBgClass}`}>
                        <span className={`text-xl font-bold tabular-nums leading-none ${scoreColorClass}`}>{v.score}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1.5">
                          <p className="text-xs font-semibold line-clamp-2 leading-snug flex-1">{v.title}</p>
                          <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div className={`h-full rounded-full transition-all duration-700 ${progressBgClass}`} style={{ width: `${v.score}%` }} />
                        </div>
                        
                        {v.issues.length > 0 && (
                          <div className="space-y-1">
                            {v.issues.slice(0, 2).map((issue) => (
                              <p key={issue} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3 text-orange-500 shrink-0" />
                                <span className="line-clamp-1">{issue}</span>
                              </p>
                            ))}
                            {v.issues.length > 2 && (
                              <p className="text-xs text-muted-foreground pl-4.5">+{v.issues.length - 2} more issues</p>
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Distribution</CardTitle>
                      <CardDescription className="text-xs">SEO health overview</CardDescription>
                    </CardHeader>
                    <div className="p-4 pt-0">
                      <div className="space-y-3">
                      {[
                        { label: "Good", range: "75+", count: seo.videoScores.filter(v => v.score >= 75).length, color: "bg-green-500", textColor: "text-green-600 dark:text-green-400" },
                        { label: "Fair", range: "50-74", count: seo.videoScores.filter(v => v.score >= 50 && v.score < 75).length, color: "bg-orange-500", textColor: "text-orange-600 dark:text-orange-400" },
                        { label: "Poor", range: "<50", count: seo.videoScores.filter(v => v.score < 50).length, color: "bg-red-500", textColor: "text-red-600 dark:text-red-400" },
                      ].map(({ label, range, count, color, textColor }) => {
                        const pct = seo.videoScores.length ? Math.round((count / seo.videoScores.length) * 100) : 0;
                        return (
                          <div key={label} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{label} <span className="text-muted-foreground font-normal">({range})</span></span>
                              <span className={`font-bold tabular-nums ${textColor}`}>{count}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </Card>
                )}

                {seo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Tag Gaps</CardTitle>
                      <CardDescription className="text-xs">Missing trending topics</CardDescription>
                    </CardHeader>
                    <div className="p-4 pt-0">
                      {seo.tagGaps.length === 0 ? (
                        <div className="flex items-center gap-2 text-success text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          No gaps found
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {seo.tagGaps.map((t) => (
                            <Badge key={t} variant="destructive" className="gap-1 font-normal text-xs h-5 px-2">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {seoLoading && <Card><div className="p-10"><Skeleton className="h-48 w-full rounded-xl" /></div></Card>}
              </div>
            </div>
          </TabsContent>

          {/* ── Trends ── */}
          <TabsContent value="trends" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Trending Now</CardTitle>
                      <CardDescription className="text-xs">Top 20 in {GEO_OPTIONS.find(o => o.value === geo)?.label}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <div className="p-4 pt-0">
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-1.5">{[...Array(12)].map((_, i) => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {seo?.trends.map((t, i) => (
                        <a key={t} href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(t)}&geo=${geo}`} target="_blank" rel="noopener noreferrer">
                          <Badge variant={i < 5 ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity gap-1 font-normal text-xs h-6 px-2">
                            <span className="text-xs opacity-60">#{i + 1}</span>{t}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Tag className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Tag Gaps</CardTitle>
                      <CardDescription className="text-xs">Topics not in your tags</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <div className="p-4 pt-0">
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-1.5">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}</div>
                  ) : seo?.tagGaps.length === 0 ? (
                    <div className="flex items-center gap-2 text-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" />No gaps found</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {seo?.tagGaps.map((t) => <Badge key={t} variant="destructive" className="font-normal text-xs h-6 px-2">{t}</Badge>)}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ── Keywords ── */}
          <TabsContent value="keywords" className="space-y-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Recommended Keywords</CardTitle>
                    <CardDescription className="text-xs">Keywords to target based on your content performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="p-4 pt-0">
                {seoLoading ? (
                  <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {seo?.recommendedKeywords.map((kw, i) => {
                      const compColor = kw.competition === "Low" ? "text-green-600 dark:text-green-400" : kw.competition === "Medium" ? "text-orange-600 dark:text-orange-400" : kw.competition === "High" ? "text-red-600 dark:text-red-400" : "text-primary";
                      const compBg = kw.competition === "Low" ? "bg-green-500/10" : kw.competition === "Medium" ? "bg-orange-500/10" : kw.competition === "High" ? "bg-red-500/10" : "bg-primary/10";
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
                              <p className="text-xs font-medium">{kw.searchVolume}</p>
                            </div>
                            <Badge variant="outline" className={`text-xs h-6 px-2 font-medium ${compBg} ${compColor} border-0`}>
                              {kw.competition}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ── Title Ideas ── */}
          <TabsContent value="titles" className="space-y-0">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Title Suggestions</h2>
                <p className="text-xs text-muted-foreground">Based on your top keywords and trends</p>
              </div>
              {seoLoading ? (
                <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seo?.titleSuggestions.map((s, i) => (
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
              )}
            </div>
          </TabsContent>

          {/* ── Best Practices ── */}
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

