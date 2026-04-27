"use client";

import { MonthlyReport } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ReportsSectionProps {
  reports: MonthlyReport[];
}

const chartConfig = {
  totalViews: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ReportsSection({ reports }: ReportsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Table */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Views, watch time, and subscriber growth per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Month</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Views</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Watch Time (h)</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">New Subs</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.month} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-2 font-medium">{r.month}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-muted-foreground">{r.totalViews.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-muted-foreground">{r.totalWatchTimeHours.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right">
                      <Badge variant="secondary" className="ml-auto">+{r.newSubscribers.toLocaleString()}</Badge>
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-muted-foreground">{r.engagementRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Views by Month</CardTitle>
          <CardDescription>Monthly view count trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={reports.slice().reverse()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.split(" ")[0].slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="totalViews"
                fill="var(--color-totalViews)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
