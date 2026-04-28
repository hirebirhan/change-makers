import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AnalysisMeta {
  searchIntent: { intent: string; confidence: number };
  sentiment: { sentiment: string; confidence: number };
  emoji: { count: number; placement: string; score: number; feedback: string };
  characterLimits: { length: number; mobileTruncated: boolean; desktopTruncated: boolean; score: number; feedback: string };
}

interface MetadataInsightsProps {
  meta: AnalysisMeta;
}

export function MetadataInsights({ meta }: MetadataInsightsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card size="sm">
        <CardHeader>
          <CardDescription className="text-xs">Search Intent</CardDescription>
          <CardTitle className="text-sm capitalize">{meta.searchIntent.intent}</CardTitle>
        </CardHeader>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardDescription className="text-xs">Sentiment</CardDescription>
          <CardTitle className="text-sm capitalize">{meta.sentiment.sentiment}</CardTitle>
        </CardHeader>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardDescription className="text-xs">Emojis</CardDescription>
          <CardTitle className="text-sm">{meta.emoji.count}</CardTitle>
        </CardHeader>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardDescription className="text-xs">Length</CardDescription>
          <CardTitle className="text-sm">{meta.characterLimits.length} chars</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
