"use client";

import { MonthlyReport } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ReportsSectionProps {
  reports: MonthlyReport[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
};

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
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reports.slice().reverse()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toLocaleString(), "Views"]} />
              <Bar dataKey="totalViews" fill="var(--chart-1)" radius={[4, 4, 0, 0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
