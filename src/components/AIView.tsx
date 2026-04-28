"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Sparkles, Brain, Lightbulb, FileText, Type, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="font-semibold text-sm mt-3">{line.slice(4)}</p>;
        if (line.startsWith("## ")) return <p key={i} className="font-bold text-base mt-4">{line.slice(3)}</p>;
        if (line.startsWith("# ")) return <p key={i} className="font-bold text-lg mt-4">{line.slice(2)}</p>;
        if (line.startsWith("- ") || line.startsWith("* ")) return (
          <p key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-primary mt-0.5 shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          </p>
        );
        if (/^\d+\./.test(line)) return (
          <p key={i} className="text-sm text-muted-foreground pl-1" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        );
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />;
      })}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

function ResultCard({ result, loading }: { result: string | null; loading: boolean }) {
  if (loading) return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Gemini is thinking…</p>
      </CardContent>
    </Card>
  );
  if (!result) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Gemini Response</CardTitle>
          </div>
          <CopyButton text={result} />
        </div>
      </CardHeader>
      <CardContent><MarkdownText text={result} /></CardContent>
    </Card>
  );
}

export function AIView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [trends, setTrends] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, string | null>>({});
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [descTitleInput, setDescTitleInput] = useState("");
  const [modelName, setModelName] = useState<string>("gemini-pro");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await fetchYouTubeAnalytics();
      setData(result);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/gemini")
      .then((r) => r.json())
      .then((d) => { if (d.model) setModelName(d.model); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videos: data.videos, geo: "US" }),
    })
      .then((r) => r.json())
      .then((d) => setTrends(d.trends ?? []));
  }, [data]);

  async function callGemini(mode: string, extra: Record<string, unknown> = {}) {
    setLoadingMode(mode);
    setApiError(null);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, channel: data.channel, videos: data.videos, trends, ...extra }),
      });
      const json = await res.json();
      if (json.error) { setApiError(json.error); return; }
      if (json.modelUsed) setModelName(json.modelUsed);
      setResults((prev) => ({ ...prev, [mode]: json.result }));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-6 py-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AI Studio</h1>
            <p className="text-sm text-muted-foreground leading-tight">Powered by Google Gemini — channel analysis, topic ideas, and content writing</p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">{modelName}</Badge>
        </div>

        {apiError && (
          <Card>
            <CardContent className="py-4 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {apiError}
              {apiError.includes("GEMINI_API_KEY") && (
                <span className="text-muted-foreground ml-1">— Add your key to <code className="text-xs bg-muted px-1 rounded">.env.local</code></span>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="analyze">
          <TabsList>
            <TabsTrigger value="analyze"><Brain className="w-3.5 h-3.5 mr-1.5" />Channel Analysis</TabsTrigger>
            <TabsTrigger value="topics"><Lightbulb className="w-3.5 h-3.5 mr-1.5" />Topic Ideas</TabsTrigger>
            <TabsTrigger value="description"><FileText className="w-3.5 h-3.5 mr-1.5" />Description Writer</TabsTrigger>
            <TabsTrigger value="title"><Type className="w-3.5 h-3.5 mr-1.5" />Title Optimizer</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Analysis</CardTitle>
                <CardDescription>Gemini will analyze your channel data — top videos, tags, subscriber count, and engagement — to surface strengths, gaps, and growth recommendations.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => callGemini("analyze")} disabled={loadingMode === "analyze"}>
                  {loadingMode === "analyze" ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Analysing…</> : <><Sparkles className="w-3.5 h-3.5 mr-2" />Analyse My Channel</>}
                </Button>
              </CardContent>
            </Card>
            <ResultCard result={results["analyze"] ?? null} loading={loadingMode === "analyze"} />
          </TabsContent>

          <TabsContent value="topics" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Next Video Topic Ideas</CardTitle>
                <CardDescription>Gemini combines your best-performing content with current Google Trends to suggest 8 specific video ideas with titles, hooks, and key points.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => callGemini("topics")} disabled={loadingMode === "topics"}>
                  {loadingMode === "topics" ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Generating…</> : <><Lightbulb className="w-3.5 h-3.5 mr-2" />Generate Topic Ideas</>}
                </Button>
              </CardContent>
            </Card>
            <ResultCard result={results["topics"] ?? null} loading={loadingMode === "topics"} />
          </TabsContent>

          <TabsContent value="description" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Description Writer</CardTitle>
                <CardDescription>Enter a video title and Gemini will write an SEO-optimized description with hook, overview, timestamps placeholder, and hashtags.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Enter your video title…" value={descTitleInput} onChange={(e) => setDescTitleInput(e.target.value)} className="max-w-lg" />
                <Button onClick={() => callGemini("description", { existingTitle: descTitleInput })} disabled={!descTitleInput.trim() || loadingMode === "description"}>
                  {loadingMode === "description" ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Writing…</> : <><FileText className="w-3.5 h-3.5 mr-2" />Write Description</>}
                </Button>
              </CardContent>
            </Card>
            <ResultCard result={results["description"] ?? null} loading={loadingMode === "description"} />
          </TabsContent>

          <TabsContent value="title" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Title Optimizer</CardTitle>
                <CardDescription>Paste an existing title and optionally a target keyword. Gemini will generate 6 optimized variations with CTR reasoning.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Existing title to optimize…" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} className="max-w-lg" />
                <Input placeholder="Target keyword (optional)…" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} className="max-w-lg" />
                <Button onClick={() => callGemini("title", { existingTitle: titleInput, keyword: keywordInput })} disabled={!titleInput.trim() || loadingMode === "title"}>
                  {loadingMode === "title" ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Optimizing…</> : <><Type className="w-3.5 h-3.5 mr-2" />Optimize Title</>}
                </Button>
              </CardContent>
            </Card>
            <ResultCard result={results["title"] ?? null} loading={loadingMode === "title"} />
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}

