"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { YouTubeApiResponse } from "@/types/youtube";
import { TagAnalysis, UploadFrequency, VideoLengthDistribution } from "@/lib/analytics-utils";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Hash, Calendar, Clock } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

interface InsightsViewProps {
  initialData: YouTubeApiResponse;
  tagAnalysis: TagAnalysis[];
  uploadFrequency: UploadFrequency[];
  lengthDistribution: VideoLengthDistribution[];
}

const tagChartConfig = {
  count: { label: "Videos", color: "var(--chart-1)" },
} satisfies ChartConfig;

const uploadChartConfig = {
  count: { label: "Uploads", color: "var(--chart-2)" },
} satisfies ChartConfig;

const lengthChartConfig = {
  count: { label: "Videos", color: "var(--chart-1)" },
  avgViews: { label: "Avg Views", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function InsightsView({
  initialData,
  tagAnalysis,
  uploadFrequency,
  lengthDistribution,
}: InsightsViewProps) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Insights</h1>
          <p className="text-sm text-muted-foreground leading-tight">Analyze your content strategy and patterns</p>
        </div>

        <Tabs defaultValue="tags">
          <TabsList>
            <TabsTrigger value="tags">
              <Hash className="w-4 h-4 mr-2" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="frequency">
              <Calendar className="w-4 h-4 mr-2" />
              Upload Frequency
            </TabsTrigger>
            <TabsTrigger value="length">
              <Clock className="w-4 h-4 mr-2" />
              Video Length
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Tags</CardTitle>
                  <CardDescription>Most frequently used tags across your videos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={tagChartConfig} className="h-[300px] w-full">
                    <BarChart data={tagAnalysis.slice(0, 10)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="tag"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + "..." : value}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tag Cloud</CardTitle>
                  <CardDescription>All tags with usage frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                    {tagAnalysis.map((tag) => (
                      <Badge
                        key={tag.tag}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          fontSize: `${Math.min(14, 8 + tag.count * 0.5)}px`,
                        }}
                      >
                        {tag.tag} ({tag.count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tag Performance</CardTitle>
                <CardDescription>Tags ranked by average views per video</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tagAnalysis.slice(0, 15).map((tag, index) => (
                    <div key={tag.tag} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-muted-foreground w-6">{index + 1}.</span>
                        <span className="font-medium truncate">{tag.tag}</span>
                        <Badge variant="outline" className="text-xs shrink-0">{tag.count} videos</Badge>
                      </div>
                      <span className="font-semibold tabular-nums ml-4">{tag.avgViews.toLocaleString()} avg views</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frequency" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Pattern (Last 90 Days)</CardTitle>
                <CardDescription>Track your publishing consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={uploadChartConfig} className="h-[300px] w-full">
                  <LineChart data={uploadFrequency} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip
                      content={<ChartTooltipContent labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />}
                    />
                    <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Uploads (90d)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{uploadFrequency.reduce((sum, d) => sum + d.count, 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Avg per Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {((uploadFrequency.reduce((sum, d) => sum + d.count, 0) / 90) * 7).toFixed(1)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most Active Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {uploadFrequency.length > 0
                      ? new Date(uploadFrequency.reduce((max, d) => (d.count > max.count ? d : max)).date).toLocaleDateString("en-US", { weekday: "short" })
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="length" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Length Distribution</CardTitle>
                <CardDescription>How your content is distributed by duration</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={lengthChartConfig} className="h-[300px] w-full">
                  <BarChart data={lengthDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance by Length</CardTitle>
                <CardDescription>Average views for each duration range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lengthDistribution.map((range) => (
                    <div key={range.range} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{range.range}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">{range.count} videos</span>
                          <span className="font-semibold tabular-nums">{range.avgViews.toLocaleString()} avg views</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-chart-1 rounded-full"
                          style={{
                            width: `${(range.count / Math.max(...lengthDistribution.map((r) => r.count))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
