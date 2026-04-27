"use client";

import { useState, useMemo } from "react";
import { DailyMetric } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

type Range = "7" | "30";

function fmtDate(value: string, range: Range) {
  const d = new Date(value);
  return range === "7"
    ? d.toLocaleDateString("en-US", { weekday: "short" })
    : `${d.getMonth() + 1}/${d.getDate()}`;
}

const viewsConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const subscribersConfig = {
  subscribersGained: {
    label: "Gained",
    color: "hsl(var(--chart-1))",
  },
  subscribersLost: {
    label: "Lost",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const audienceConfig = {
  subscribed: {
    label: "Subscribed",
    color: "hsl(var(--chart-1))",
  },
  notSubscribed: {
    label: "Not subscribed",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [range, setRange] = useState<Range>("7");

  const sliced = useMemo(() => data.slice(-parseInt(range)), [data, range]);

  const audienceTotals = useMemo(() => {
    const sub = sliced.reduce((s, d) => s + d.subscribedViews, 0);
    const unsub = sliced.reduce((s, d) => s + d.unsubscribedViews, 0);
    const total = sub + unsub || 1;
    return [
      { name: "subscribed", value: sub, pct: Math.round((sub / total) * 100), fill: "var(--color-subscribed)" },
      { name: "notSubscribed", value: unsub, pct: Math.round((unsub / total) * 100), fill: "var(--color-notSubscribed)" },
    ];
  }, [sliced]);

  return (
    <Tabs defaultValue="views">
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardAction className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["7", "30"] as Range[]).map((r) => (
                <Button
                  key={r}
                  size="xs"
                  variant={range === r ? "outline" : "ghost"}
                  onClick={() => setRange(r)}
                >
                  {r === "7" ? "7d" : "30d"}
                </Button>
              ))}
            </div>
            <TabsList>
              <TabsTrigger value="views">Views</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>
          </CardAction>
        </CardHeader>

        <CardContent>
          <TabsContent value="views">
            <ChartContainer config={viewsConfig} className="h-[260px] w-full">
              <AreaChart data={sliced} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => fmtDate(v, range)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()}
                />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  strokeWidth={2}
                  fill="url(#fillViews)"
                />
              </AreaChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="subscribers">
            <ChartContainer config={subscribersConfig} className="h-[260px] w-full">
              <AreaChart data={sliced} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillGained" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-subscribersGained)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-subscribersGained)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillLost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-subscribersLost)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-subscribersLost)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => fmtDate(v, range)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()}
                />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="subscribersGained"
                  stroke="var(--color-subscribersGained)"
                  strokeWidth={2}
                  fill="url(#fillGained)"
                />
                <Area
                  type="monotone"
                  dataKey="subscribersLost"
                  stroke="var(--color-subscribersLost)"
                  strokeWidth={2}
                  fill="url(#fillLost)"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="audience">
            <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
              <ChartContainer config={audienceConfig} className="h-[180px] w-[180px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={audienceTotals}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  />
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
                      <div
                        className={`h-full rounded-full transition-all ${i === 0 ? "bg-chart-1" : "bg-chart-3"}`}
                        style={{ width: `${item.pct}%` }}
                      />
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
