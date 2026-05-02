"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { DailyMetric } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  PieChart, Pie,
} from "recharts";

interface AnalyticsChartProps {
  data: DailyMetric[];
}

function fmtDate(value: string, dataLength: number) {
  const d = new Date(value);
  return dataLength <= 10
    ? d.toLocaleDateString("en-US", { weekday: "short" })
    : `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtY(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString();
}

function fmtLabel(l: unknown) {
  if (typeof l !== "string") return "";
  return new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const viewsConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
} satisfies ChartConfig;

const subscribersConfig = {
  subscribersGained: { label: "Gained", color: "var(--chart-1)" },
  subscribersLost:   { label: "Lost",   color: "var(--chart-5)" },
} satisfies ChartConfig;

const audienceConfig = {
  subscribed:    { label: "Subscribed",     color: "var(--chart-1)" },
  notSubscribed: { label: "Not subscribed", color: "var(--chart-3)" },
} satisfies ChartConfig;

const DISCLAIMER =
  "Views are spread evenly across each video's active days in the window. Watch time, subscriber changes, and audience split are derived estimates — not YouTube Analytics API data.";

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const audienceTotals = useMemo(() => {
    const sub   = data.reduce((s, d) => s + d.subscribedViews, 0);
    const unsub = data.reduce((s, d) => s + d.unsubscribedViews, 0);
    const total = sub + unsub || 1;
    return [
      { name: "subscribed",    value: sub,   pct: Math.round((sub   / total) * 100), fill: "var(--color-subscribed)"    },
      { name: "notSubscribed", value: unsub, pct: Math.round((unsub / total) * 100), fill: "var(--color-notSubscribed)" },
    ];
  }, [data]);

  const axisProps = {
    tickLine: false as const,
    axisLine: false as const,
    tickMargin: 8,
  };

  return (
    <Tabs defaultValue="views">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <CardTitle>Performance</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-3.5 text-muted-foreground cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-64 text-xs leading-relaxed">
                {DISCLAIMER}
              </TooltipContent>
            </Tooltip>
          </div>
          <CardAction>
            <TabsList>
              <TabsTrigger value="views">Views</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>
          </CardAction>
        </CardHeader>

        <CardContent>
          <TabsContent value="views">
            <ChartContainer config={viewsConfig} className="h-64 w-full">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-views)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" {...axisProps} tickFormatter={(v) => fmtDate(v, data.length)} />
                <YAxis {...axisProps} tickFormatter={fmtY} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={fmtLabel} />} />
                <Area type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} fill="url(#fillViews)" />
              </AreaChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="subscribers">
            <ChartContainer config={subscribersConfig} className="h-64 w-full">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillGained" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-subscribersGained)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-subscribersGained)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillLost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-subscribersLost)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-subscribersLost)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" {...axisProps} tickFormatter={(v) => fmtDate(v, data.length)} />
                <YAxis {...axisProps} tickFormatter={fmtY} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={fmtLabel} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="subscribersGained" stroke="var(--color-subscribersGained)" strokeWidth={2} fill="url(#fillGained)" />
                <Area type="monotone" dataKey="subscribersLost"   stroke="var(--color-subscribersLost)"   strokeWidth={2} fill="url(#fillLost)" strokeDasharray="5 5" />
              </AreaChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="audience">
            <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
              <ChartContainer config={audienceConfig} className="h-48 w-48 shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={audienceTotals} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} />
                </PieChart>
              </ChartContainer>
              <div className="space-y-5 flex-1 w-full">
                {audienceTotals.map((item, i) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-chart-1" : "bg-chart-3"}`} />
                        <span className="text-sm text-muted-foreground">
                          {audienceConfig[item.name as keyof typeof audienceConfig]?.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">{item.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${i === 0 ? "bg-chart-1" : "bg-chart-3"}`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.value.toLocaleString()} views</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
