"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import {
  Scroll, Sparkles, RefreshCw, Copy, Check, Plus, Trash2, AlertCircle, FileText, Tag,
} from "lucide-react";

const FORMATS = [
  { value: "educational", label: "Educational" },
  { value: "tutorial", label: "Tutorial / How-To" },
  { value: "review", label: "Review" },
  { value: "vlog", label: "Vlog / Story" },
  { value: "listicle", label: "Listicle" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs gap-1.5"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function ScriptOutput({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed font-mono">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-semibold text-foreground mt-4 first:mt-0 not-italic">{line.slice(2, -2)}</p>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        if (line.startsWith("[ON SCREEN:"))
          return <p key={i} className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">{line}</p>;
        return <p key={i} className="text-muted-foreground">{line}</p>;
      })}
    </div>
  );
}

export function ScriptMakerView({ initialData }: { initialData: YouTubeApiResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("educational");
  const [keyPoints, setKeyPoints] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [tags, setTags] = useState<string | null>(null);
  const [modelName, setModelName] = useState("gemini");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await fetchYouTubeAnalytics(); setData(r); setLastUpdated(new Date()); }
    finally { setRefreshing(false); }
  }, []);

  function updatePoint(i: number, val: string) {
    setKeyPoints((pts) => pts.map((p, idx) => idx === i ? val : p));
  }
  function addPoint() { if (keyPoints.length < 7) setKeyPoints((pts) => [...pts, ""]); }
  function removePoint(i: number) { if (keyPoints.length > 1) setKeyPoints((pts) => pts.filter((_, idx) => idx !== i)); }

  async function generate() {
    setLoading(true);
    setError(null);
    setScript(null);
    setDescription(null);
    setTags(null);

    const filledPoints = keyPoints.filter(Boolean);

    try {
      // Run script + description + tags in parallel
      const [scriptRes, descRes, tagsRes] = await Promise.all([
        fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "script", channel: data.channel, existingTitle: title, format, keyPoints: filledPoints }),
        }),
        fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "description", channel: data.channel, existingTitle: title }),
        }),
        fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "title",
            channel: data.channel,
            existingTitle: `Tags for: ${title}. Key topics: ${filledPoints.join(", ")}`,
          }),
        }),
      ]);

      const [s, d, t] = await Promise.all([scriptRes.json(), descRes.json(), tagsRes.json()]);

      if (s.error) { setError(s.error); return; }
      if (s.modelUsed) setModelName(s.modelUsed);
      setScript(s.result ?? null);
      setDescription(d.result ?? null);
      setTags(t.result ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = title.trim().length > 0 && keyPoints.some(Boolean) && !loading;

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 md:px-6 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Scroll className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">Script Maker</h1>
            <p className="text-xs text-muted-foreground">Generate a full video script, SEO description, and tags with Gemini</p>
          </div>
          <Badge variant="secondary" className="shrink-0">{modelName}</Badge>
        </div>

        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video Details</CardTitle>
            <CardDescription>Fill in the title, format, and what you want to cover — Gemini handles the rest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Video Title</label>
              <Input
                placeholder="e.g. How to Build a REST API with Node.js in 20 Minutes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-2xl"
              />
            </div>

            {/* Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Format</label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      format === f.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Key points */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Points to Cover</label>
              <div className="space-y-2 max-w-2xl">
                {keyPoints.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                    <Input
                      placeholder={`Key point ${i + 1}…`}
                      value={pt}
                      onChange={(e) => updatePoint(i, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground shrink-0"
                      onClick={() => removePoint(i)}
                      disabled={keyPoints.length <= 1}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {keyPoints.length < 7 && (
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-7 px-2" onClick={addPoint}>
                    <Plus className="size-3" /> Add point
                  </Button>
                )}
              </div>
            </div>

            <Button onClick={generate} disabled={!canGenerate} className="gap-2">
              {loading
                ? <><RefreshCw className="size-3.5 animate-spin" />Generating…</>
                : <><Sparkles className="size-3.5" />Generate Script</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card>
            <CardContent className="py-4 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="size-4 shrink-0" />{error}
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="size-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Writing your script, description, and tags…</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {script && (
          <Tabs defaultValue="script">
            <TabsList>
              <TabsTrigger value="script" className="gap-1.5"><Scroll className="size-3.5" />Script</TabsTrigger>
              <TabsTrigger value="description" className="gap-1.5"><FileText className="size-3.5" />Description</TabsTrigger>
              <TabsTrigger value="tags" className="gap-1.5"><Tag className="size-3.5" />Title Ideas</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Full Script</CardTitle>
                    <CopyButton text={script} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScriptOutput text={script} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">SEO Description</CardTitle>
                    {description && <CopyButton text={description} />}
                  </div>
                </CardHeader>
                <CardContent>
                  {description
                    ? <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{description}</p>
                    : <p className="text-sm text-muted-foreground">Description not available.</p>
                  }
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Title Variations & Ideas</CardTitle>
                    {tags && <CopyButton text={tags} />}
                  </div>
                </CardHeader>
                <CardContent>
                  {tags
                    ? <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{tags}</p>
                    : <p className="text-sm text-muted-foreground">Not available.</p>
                  }
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppShell>
  );
}
