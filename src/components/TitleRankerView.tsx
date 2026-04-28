"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { TitleInput } from "@/components/title-ranker/TitleInput";
import { ErrorCard } from "@/components/title-ranker/ErrorCard";
import { ScoreOverview } from "@/components/title-ranker/ScoreOverview";
import { DimensionBreakdown } from "@/components/title-ranker/DimensionBreakdown";
import { MetadataInsights } from "@/components/title-ranker/MetadataInsights";
import { AutofixResult } from "@/components/title-ranker/AutofixResult";
import { BestChoice } from "@/components/title-ranker/BestChoice";
import { AlternativesList } from "@/components/title-ranker/AlternativesList";
import { EmptyState } from "@/components/title-ranker/EmptyState";
import { useTopKeywords } from "@/components/title-ranker/useTopKeywords";

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

  const topKeywords = useTopKeywords(data.videos);

  const handleAnalyze = useCallback(async () => {
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
  }, [input, topKeywords, data.videos]);

  const handleAutofix = useCallback(async () => {
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
  }, [input, topKeywords, data.videos]);

  const handleAnalyzeTitle = useCallback((title: string) => {
    setInput(title);
    setTimeout(() => handleAnalyze(), 0);
  }, [handleAnalyze]);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <TitleInput
          input={input}
          topKeywords={topKeywords}
          analyzing={analyzing}
          autofixing={autofixing}
          onInputChange={setInput}
          onAnalyze={handleAnalyze}
          onAutofix={handleAutofix}
        />

        {error && <ErrorCard error={error} />}

        {analysis && (
          <div className="space-y-4">
            <ScoreOverview
              grade={analysis.grade}
              totalScore={analysis.totalScore}
              input={analysis.input}
              dimensions={analysis.dimensions}
            />

            {analysis.dimensions && <DimensionBreakdown dimensions={analysis.dimensions} />}

            {analysis.meta && <MetadataInsights meta={analysis.meta} />}

            {analysis.fixed && <AutofixResult fixed={analysis.fixed} onAnalyze={handleAnalyzeTitle} />}

            {analysis.bestChoice && <BestChoice bestChoice={analysis.bestChoice} />}

            {analysis.rankedAlternatives && (
              <AlternativesList alternatives={analysis.rankedAlternatives} onAnalyze={handleAnalyzeTitle} />
            )}
          </div>
        )}

        {!analysis && <EmptyState />}
      </main>
    </AppShell>
  );
}

