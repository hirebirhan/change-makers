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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Avg SEO Score", value: `${avg}`, sub: "out of 100", icon: Trophy, iconCn: "text-primary", bg: "bg-primary/5" },
        { label: "Well Optimised", value: `${good}`, sub: "videos ≥ 75", icon: CheckCircle2, iconCn: "text-success", bg: "bg-success/5" },
        { label: "Need Attention", value: `${poor}`, sub: "videos < 50", icon: AlertCircle, iconCn: "text-destructive", bg: "bg-destructive/5" },
        { label: "Tag Gaps", value: `${seo.tagGaps.length}`, sub: "trending topics missed", icon: Tag, iconCn: "text-warning", bg: "bg-warning/5" },
      ].map(({ label, value, sub, icon: Icon, iconCn, bg }) => (
        <Card key={label} size="sm" className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`size-4 ${iconCn}`} />
              </div>
              <CardDescription className="text-xs font-medium">{label}</CardDescription>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <CardTitle className="text-3xl tabular-nums font-bold">{value}</CardTitle>
              <span className="text-xs text-muted-foreground font-normal">{sub}</span>
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
      <main className="flex-1 w-full px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              SEO Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-2 ml-[52px]">Keyword insights, video scores & Google Trends</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={geo}
              onChange={(e) => setGeo(e.target.value)}
              className="h-9 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
            >
              {GEO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        {seoLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : seo && <SummaryCards seo={seo} />}

        <Tabs defaultValue="scores" className="space-y-6">
          <TabsList className="bg-muted/30 p-1">
            <TabsTrigger value="scores" className="gap-2"><Trophy className="w-3.5 h-3.5" />Video Scores</TabsTrigger>
            <TabsTrigger value="trends" className="gap-2"><TrendingUp className="w-3.5 h-3.5" />Trends</TabsTrigger>
            <TabsTrigger value="keywords" className="gap-2"><BarChart2 className="w-3.5 h-3.5" />Keywords</TabsTrigger>
            <TabsTrigger value="titles" className="gap-2"><Lightbulb className="w-3.5 h-3.5" />Title Ideas</TabsTrigger>
            <TabsTrigger value="practices" className="gap-2"><BookOpen className="w-3.5 h-3.5" />Best Practices</TabsTrigger>
          </TabsList>

          {/* ── Video Scores ── */}
          <TabsContent value="scores" className="space-y-0">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Score list */}
              <div className="xl:col-span-3 space-y-4">
                {seoLoading ? <ScoreSkeleton /> : seo?.videoScores.map((v) => (
                  <div key={v.id} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5 space-y-4 transition-all hover:shadow-lg hover:border-border/60">
                    <div className="flex items-start gap-4">
                      {/* Score circle */}
                      <div className={`shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${scoreBg(v.score)}/10 border border-${scoreBg(v.score)}/20`}>
                        <span className={`text-2xl font-bold tabular-nums leading-none ${scoreColor(v.score)}`}>{v.score}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">/ 100</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-2.5">
                          <p className="text-sm font-semibold truncate leading-snug">{v.title}</p>
                          <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        </div>
                        <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${scoreBg(v.score)}`} style={{ width: `${v.score}%` }} />
                        </div>
                      </div>
                    </div>

                    {v.issues.length > 0 ? (
                      <div className="space-y-2 pl-20">
                        {v.issues.map((issue) => (
                          <p key={issue} className="text-xs text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />{issue}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-success flex items-center gap-2 pl-20">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />All checks passed
                      </p>
                    )}

                    {v.suggestions.length > 0 && (
                      <div className="border-t border-border/30 pt-4 space-y-2 pl-20">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Suggestions</p>
                        {v.suggestions.map((s, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                            <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />{s}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right sidebar */}
              <div className="xl:col-span-2 space-y-4">
                {seo && (
                  <Card className="border-border/40">
                    <CardHeader>
                      <CardTitle className="text-base">Score Distribution</CardTitle>
                      <CardDescription>SEO health across your videos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {[
                        { label: "Good", range: "75–100", count: seo.videoScores.filter(v => v.score >= 75).length, color: "bg-success", textColor: "text-success" },
                        { label: "Needs work", range: "50–74", count: seo.videoScores.filter(v => v.score >= 50 && v.score < 75).length, color: "bg-warning", textColor: "text-warning" },
                        { label: "Poor", range: "0–49", count: seo.videoScores.filter(v => v.score < 50).length, color: "bg-destructive", textColor: "text-destructive" },
                      ].map(({ label, range, count, color, textColor }) => {
                        const pct = seo.videoScores.length ? Math.round((count / seo.videoScores.length) * 100) : 0;
                        return (
                          <div key={label} className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{label} <span className="text-muted-foreground font-normal">({range})</span></span>
                              <span className={`font-bold tabular-nums ${textColor}`}>{count} videos</span>
                            </div>
                            <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
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
                      <CardTitle className="text-base">Tag Gaps</CardTitle>
                      <CardDescription>Trending topics missing from your tags</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {seo.tagGaps.length === 0 ? (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Great coverage — no major gaps found.
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {seo.tagGaps.map((t) => (
                              <Badge key={t} variant="destructive" className="gap-1.5 font-normal">
                                <AlertCircle className="w-3 h-3" />{t}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Add these as tags or cover them in upcoming videos.</p>
                        </>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Trending Now</CardTitle>
                      <CardDescription>Top 20 in {GEO_OPTIONS.find(o => o.value === geo)?.label}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-2">{[...Array(12)].map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {seo?.trends.map((t, i) => (
                        <a key={t} href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(t)}&geo=${geo}`} target="_blank" rel="noopener noreferrer">
                          <Badge variant={i < 5 ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity gap-1.5 font-normal">
                            <span className="text-[10px] opacity-60">#{i + 1}</span>{t}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/5 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Tag Gaps</CardTitle>
                      <CardDescription>Trending topics not in your tags</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}</div>
                  ) : seo?.tagGaps.length === 0 ? (
                    <div className="flex items-center gap-2 text-success text-sm"><CheckCircle2 className="w-4 h-4" />Great coverage — no gaps found.</div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {seo?.tagGaps.map((t) => <Badge key={t} variant="destructive" className="font-normal">{t}</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Consider adding these as tags or covering them in upcoming videos.</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Keywords ── */}
          <TabsContent value="keywords" className="space-y-0">
            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Your Top Keywords</CardTitle>
                    <CardDescription>Extracted from titles & tags, ranked by total views driven</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {seoLoading ? (
                  <div className="space-y-3.5">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-6 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {seo?.keywords.map((kw, i) => {
                      const maxViews = seo.keywords[0]?.totalViews || 1;
                      const pct = Math.round((kw.totalViews / maxViews) * 100);
                      return (
                        <div key={kw.keyword} className="flex items-center gap-3.5 group">
                          <span className="text-xs text-muted-foreground w-7 text-right shrink-0 tabular-nums font-medium">#{i + 1}</span>
                          <span className="text-sm font-medium w-36 shrink-0 truncate">{kw.keyword}</span>
                          <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-24 text-right shrink-0 tabular-nums">
                            {kw.totalViews >= 1000 ? (kw.totalViews / 1000).toFixed(1) + "K" : kw.totalViews} views
                          </span>
                          <Badge variant="outline" className="text-[10px] shrink-0 w-11 justify-center font-normal">{kw.count}×</Badge>
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
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold">Title Suggestions</h2>
                <p className="text-sm text-muted-foreground mt-1">Generated from your top keywords and current trends</p>
              </div>
              {seoLoading ? (
                <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seo?.titleSuggestions.map((s, i) => (
                    <div key={i} className="p-5 rounded-2xl border border-border/40 bg-card/50 hover:shadow-lg hover:border-border/60 transition-all space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-bold text-primary tabular-nums mt-0.5 shrink-0">#{i + 1}</span>
                        <p className="text-sm font-semibold leading-snug">{s.suggestion}</p>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-start gap-2 pl-6 leading-relaxed">
                        <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />{s.reason}
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
                <Card key={category} className="border-border/40 hover:shadow-lg hover:border-border/60 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <CardTitle className="text-base">{category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                          <span className={`mt-0.5 shrink-0 font-bold text-base leading-none ${color}`}>·</span>
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

