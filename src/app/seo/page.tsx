"use client";

import { useState, useEffect } from "react";
import { useYouTubeData } from "@/lib/use-youtube-data";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/components/LoginPage";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TrendingUp, Lightbulb, BarChart2, AlertCircle, CheckCircle2,
  Globe, Zap, BookOpen, ArrowUpRight,
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
    category: "Titles",
    color: "text-primary",
    bg: "bg-primary/10",
    tips: [
      "Keep titles 40–70 characters — long enough for context, short enough to avoid truncation.",
      "Put your primary keyword within the first 3 words of the title.",
      "Use numbers, questions, or power words (Ultimate, Complete, Proven) to boost CTR.",
      "Avoid clickbait — YouTube demotes videos with high impressions but low watch time.",
      "A/B test titles using YouTube Studio's 'Test & Compare' feature.",
    ],
  },
  {
    category: "Thumbnails",
    color: "text-warning",
    bg: "bg-warning/10",
    tips: [
      "Use high contrast colors — your thumbnail must stand out on both light and dark backgrounds.",
      "Include a face with a clear emotion — human faces increase CTR by up to 38%.",
      "Limit text to 3–5 bold words maximum — it must be readable at 120×68px.",
      "Keep a consistent visual style so your channel is instantly recognisable in feeds.",
      "Never use the auto-generated thumbnail — custom thumbnails get 90% more clicks.",
    ],
  },
  {
    category: "Descriptions",
    color: "text-muted-foreground",
    bg: "bg-muted",
    tips: [
      "Write the first 2–3 sentences as a standalone hook — this is what shows in search results.",
      "Include your primary keyword naturally in the first 100 characters.",
      "Add timestamps for every major section — this creates chapter links and improves UX.",
      "Include 3–5 relevant hashtags at the very end of the description.",
      "Add links to related videos, playlists, and your social profiles.",
    ],
  },
  {
    category: "Tags & SEO",
    color: "text-success",
    bg: "bg-success/10",
    tips: [
      "Use 10–15 tags: start with your exact title keyword, then broad terms, then long-tail phrases.",
      "Include your channel name as a tag so your videos appear in 'More from this channel'.",
      "Research competitor tags using browser extensions like TubeBuddy or VidIQ.",
      "Use Google Trends to validate that your keywords have rising search interest.",
      "Add closed captions — YouTube indexes your transcript as additional keyword content.",
    ],
  },
  {
    category: "Engagement",
    color: "text-destructive",
    bg: "bg-destructive/10",
    tips: [
      "Ask viewers to like and comment within the first 30 seconds — early engagement boosts distribution.",
      "Reply to every comment in the first 24 hours — it signals activity to the algorithm.",
      "End every video with a specific question to drive comments.",
      "Use cards and end screens to keep viewers in your channel — session time is a key ranking factor.",
      "Pin a comment with a key takeaway or link — it increases comment section engagement.",
    ],
  },
  {
    category: "Upload Strategy",
    color: "text-primary",
    bg: "bg-primary/10",
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
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-border space-y-2">
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SeoStudio() {
  const { data, loading: dataLoading, refresh, refreshing, lastUpdated } = useYouTubeData();
  const [seo, setSeo] = useState<SeoData | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [geo, setGeo] = useState("US");

  useEffect(() => {
    if (!data) return;
    setSeoLoading(true);
    fetch("/api/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videos: data.videos, geo }),
    })
      .then((r) => r.json())
      .then(setSeo)
      .finally(() => setSeoLoading(false));
  }, [data, geo]);

  return (
    <AppShell channel={data?.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="w-full px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">SEO Studio</h1>
            <p className="text-sm text-muted-foreground">Keyword insights, title refinement & Google Trends</p>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <select
              value={geo}
              onChange={(e) => setGeo(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {GEO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview"><Zap className="w-3.5 h-3.5 mr-1.5" />Overview & Scores</TabsTrigger>
            <TabsTrigger value="trends"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Trends</TabsTrigger>
            <TabsTrigger value="keywords"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Keywords</TabsTrigger>
            <TabsTrigger value="titles"><Lightbulb className="w-3.5 h-3.5 mr-1.5" />Title Ideas</TabsTrigger>
            <TabsTrigger value="practices"><BookOpen className="w-3.5 h-3.5 mr-1.5" />Best Practices</TabsTrigger>
          </TabsList>

          {/* ── Overview & Scores ── */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Video scores */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold">Video SEO Scores</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Scored on title, description, tags, and engagement</p>
                </div>
                {seoLoading ? <ScoreSkeleton /> : seo?.videoScores.map((v) => (
                  <div key={v.id} className="p-4 rounded-lg border border-border space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 text-center w-10">
                        <p className={`text-xl font-bold tabular-nums ${scoreColor(v.score)}`}>{v.score}</p>
                        <p className="text-[10px] text-muted-foreground">/ 100</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-xs font-medium truncate">{v.title}</p>
                          <a
                            href={`https://www.youtube.com/watch?v=${v.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${scoreBg(v.score)}`} style={{ width: `${v.score}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Issues */}
                    {v.issues.length > 0 && (
                      <div className="space-y-1 pl-13">
                        {v.issues.map((issue) => (
                          <p key={issue} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-warning shrink-0" />{issue}
                          </p>
                        ))}
                      </div>
                    )}
                    {v.issues.length === 0 && (
                      <p className="text-[11px] text-success flex items-center gap-1.5 pl-13">
                        <CheckCircle2 className="w-3 h-3" />All checks passed
                      </p>
                    )}

                    {/* Suggestions */}
                    {v.suggestions.length > 0 && (
                      <div className="border-t border-border pt-2 space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Suggestions</p>
                        {v.suggestions.map((s, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <Lightbulb className="w-3 h-3 text-primary shrink-0 mt-0.5" />{s}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tag gaps + score summary */}
              <div className="space-y-4">
                {/* Score distribution */}
                {seo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Score Distribution</CardTitle>
                      <CardDescription>How your videos rank across SEO health tiers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Good (75–100)",      count: seo.videoScores.filter(v => v.score >= 75).length,                          color: "bg-success" },
                        { label: "Needs work (50–74)", count: seo.videoScores.filter(v => v.score >= 50 && v.score < 75).length,           color: "bg-warning" },
                        { label: "Poor (0–49)",         count: seo.videoScores.filter(v => v.score < 50).length,                           color: "bg-destructive" },
                      ].map(({ label, count, color }) => {
                        const pct = seo.videoScores.length ? Math.round((count / seo.videoScores.length) * 100) : 0;
                        return (
                          <div key={label} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Tag gaps */}
                {seo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tag Gaps</CardTitle>
                      <CardDescription>Trending topics not yet in your video tags</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {seo.tagGaps.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Great coverage — no major gaps found.</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {seo.tagGaps.map((t) => (
                              <Badge key={t} variant="destructive">{t}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">Add these as tags or cover them in upcoming videos.</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {seoLoading && (
                  <Card><CardContent className="py-8"><Skeleton className="h-32 w-full" /></CardContent></Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Trends ── */}
          <TabsContent value="trends" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trending Now</CardTitle>
                  <CardDescription>Top 20 Google Trends in {GEO_OPTIONS.find(o => o.value === geo)?.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-2">{[...Array(12)].map((_, i) => <Skeleton key={i} className="h-5 w-20 rounded-full" />)}</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {seo?.trends.map((t, i) => (
                        <a key={t} href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(t)}&geo=${geo}`} target="_blank" rel="noopener noreferrer">
                          <Badge variant={i < 5 ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity">
                            #{i + 1} {t}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tag Gaps</CardTitle>
                  <CardDescription>Trending topics not yet in your video tags</CardDescription>
                </CardHeader>
                <CardContent>
                  {seoLoading ? (
                    <div className="flex flex-wrap gap-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-24 rounded-full" />)}</div>
                  ) : seo?.tagGaps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Great coverage — no major gaps found.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {seo?.tagGaps.map((t) => <Badge key={t} variant="destructive">{t}</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Consider adding these as tags or covering them in upcoming videos.</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Keywords ── */}
          <TabsContent value="keywords" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Top Keywords</CardTitle>
                <CardDescription>Extracted from video titles and tags, ranked by total views driven</CardDescription>
              </CardHeader>
              <CardContent>
                {seoLoading ? (
                  <div className="space-y-3">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {seo?.keywords.map((kw, i) => {
                      const maxViews = seo.keywords[0]?.totalViews || 1;
                      const pct = Math.round((kw.totalViews / maxViews) * 100);
                      return (
                        <div key={kw.keyword} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-5 text-right shrink-0">#{i + 1}</span>
                          <span className="text-sm font-medium w-28 shrink-0 truncate">{kw.keyword}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right shrink-0 tabular-nums">
                            {kw.totalViews >= 1000 ? (kw.totalViews / 1000).toFixed(1) + "K" : kw.totalViews} views
                          </span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{kw.count}×</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Title Ideas ── */}
          <TabsContent value="titles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Title Suggestions</CardTitle>
                <CardDescription>Generated from your top keywords and current trends</CardDescription>
              </CardHeader>
              <CardContent>
                {seoLoading ? (
                  <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {seo?.titleSuggestions.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                        <p className="text-sm font-medium">{s.suggestion}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3 shrink-0" />{s.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Best Practices ── */}
          <TabsContent value="practices" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {BEST_PRACTICES.map(({ category, color, bg, tips }) => (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                        <BookOpen className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <CardTitle className="text-sm">{category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className={`mt-0.5 shrink-0 font-bold ${color}`}>•</span>
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

export default function SeoPage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <SeoStudio /> : <LoginPage />;
}
