"use client";

import { useState, useMemo } from "react";
import { DailyMetric } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface AnalyticsChartProps {
  data: DailyMetric[];
}

type Range = "7" | "30";

function fmt(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toLocaleString();
}

function fmtDate(value: string, range: Range) {
  const d = new Date(value);
  return range === "7"
    ? d.toLocaleDateString("en-US", { weekday: "short" })
    : `${d.getMonth() + 1}/${d.getDate()}`;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
};

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [range, setRange] = useState<Range>("30");

  const sliced = useMemo(() => data.slice(-parseInt(range)), [data, range]);

  const audienceTotals = useMemo(() => {
    const sub = sliced.reduce((s, d) => s + d.subscribedViews, 0);
    const unsub = sliced.reduce((s, d) => s + d.unsubscribedViews, 0);
    const total = sub + unsub || 1;
    return [
      { name: "Subscribed", value: sub, pct: Math.round((sub / total) * 100) },
      { name: "Not subscribed", value: unsub, pct: Math.round((unsub / total) * 100) },
    ];
  }, [sliced]);

  return (
    <Tabs defaultValue="views">
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardAction className="flex items-center gap-2">
            {/* Range — plain buttons, NOT inside Tabs so values don't conflict */}
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
            {/* Metric tabs */}
            <TabsList>
              <TabsTrigger value="views">Views</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>
          </CardAction>
        </CardHeader>

        <CardContent>
          <TabsContent value="views">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={sliced} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmtDate(v, range)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toLocaleString(), "Views"]} labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                <Area type="monotone" dataKey="views" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="subscribers">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sliced} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmtDate(v, range)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                <Line type="monotone" dataKey="subscribersGained" name="Gained" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="subscribersLost" name="Lost" stroke="var(--chart-5)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="audience">
            <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={audienceTotals} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    <Cell fill="var(--chart-1)" />
                    <Cell fill="var(--chart-3)" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [Number(v).toLocaleString(), name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-5 flex-1 w-full">
                {audienceTotals.map((item, i) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-chart-1" : "bg-chart-3"}`} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
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
