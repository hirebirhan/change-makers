"use client";

import { useState, useEffect } from "react";
import { useYouTubeData } from "@/lib/use-youtube-data";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/components/LoginPage";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Lightbulb, Tag, BarChart2, AlertCircle, CheckCircle2, Globe } from "lucide-react";

interface SeoData {
  trends: string[];
  keywords: { keyword: string; count: number; totalViews: number }[];
  titleSuggestions: { suggestion: string; reason: string }[];
  tagGaps: string[];
  videoScores: { id: string; title: string; score: number; issues: string[] }[];
}

const GEO_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "ET", label: "Ethiopia" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
];

function scoreColor(score: number) {
  if (score >= 75) return "text-green-500";
  if (score >= 50) return "text-amber-500";
  return "text-destructive";
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-destructive";
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

  if (dataLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell channel={data?.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
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

        {seoLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="h-40 flex items-center justify-center"><p className="text-sm text-muted-foreground animate-pulse">Analysing…</p></CardContent></Card>
            ))}
          </div>
        ) : seo && (
          <Tabs defaultValue="trends">
            <TabsList>
              <TabsTrigger value="trends"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Trends</TabsTrigger>
              <TabsTrigger value="keywords"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Keywords</TabsTrigger>
              <TabsTrigger value="titles"><Lightbulb className="w-3.5 h-3.5 mr-1.5" />Title Ideas</TabsTrigger>
              <TabsTrigger value="scores"><Tag className="w-3.5 h-3.5 mr-1.5" />Video Scores</TabsTrigger>
            </TabsList>

            {/* ── Trends ── */}
            <TabsContent value="trends" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trending Now</CardTitle>
                    <CardDescription>Top 20 Google Trends in {GEO_OPTIONS.find(o => o.value === geo)?.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {seo.trends.map((t, i) => (
                        <a
                          key={t}
                          href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(t)}&geo=${geo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant={i < 5 ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity">
                            #{i + 1} {t}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tag Gaps</CardTitle>
                    <CardDescription>Trending topics not yet in your video tags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {seo.tagGaps.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Great coverage — no major gaps found.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {seo.tagGaps.map((t) => (
                          <Badge key={t} variant="destructive">{t}</Badge>
                        ))}
                      </div>
                    )}
                    {seo.tagGaps.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-3">Consider adding these as tags or covering them in upcoming videos.</p>
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
                  <div className="space-y-2">
                    {seo.keywords.map((kw, i) => {
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Title Ideas ── */}
            <TabsContent value="titles" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Title Suggestions</CardTitle>
                  <CardDescription>AI-generated ideas based on your top keywords and current trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {seo.titleSuggestions.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                        <p className="text-sm font-medium">{s.suggestion}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3 shrink-0" />{s.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Video Scores ── */}
            <TabsContent value="scores" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Score per Video</CardTitle>
                  <CardDescription>Scored on title length, description, tag count, and engagement rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {seo.videoScores.map((v) => (
                      <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                        <div className="shrink-0 text-center w-10">
                          <p className={`text-lg font-bold tabular-nums ${scoreColor(v.score)}`}>{v.score}</p>
                          <p className="text-[10px] text-muted-foreground">/ 100</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-xs font-medium truncate">{v.title}</p>
                            <a
                              href={`https://www.youtube.com/watch?v=${v.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-[10px] text-primary hover:underline"
                            >
                              ↗
                            </a>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                            <div className={`h-full rounded-full ${scoreBg(v.score)}`} style={{ width: `${v.score}%` }} />
                          </div>
                          {v.issues.length === 0 ? (
                            <p className="text-[11px] text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> All checks passed
                            </p>
                          ) : (
                            <div className="space-y-0.5">
                              {v.issues.map((issue) => (
                                <p key={issue} className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />{issue}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppShell>
  );
}

export default function SeoPage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <SeoStudio /> : <LoginPage />;
}
