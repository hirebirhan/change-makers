"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { YouTubeApiResponse } from "@/types/youtube";
import { fetchYouTubeAnalytics } from "@/lib/youtube-api";
import { Lightbulb, TrendingUp, Target, Zap, Users, Video, Hash, Clock, ThumbsUp, MessageSquare, Eye } from "lucide-react";

interface InsightsViewProps {
  initialData: YouTubeApiResponse;
}

export function InsightsView({ initialData }: InsightsViewProps) {
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

  const recommendations = [
    {
      category: "Content Strategy",
      icon: Target,
      color: "chart-1",
      items: [
        { title: "Create Series Content", desc: "Build playlists with 5-10 related videos to increase watch time and session duration" },
        { title: "Leverage Trending Topics", desc: "Use Google Trends to identify rising topics in your niche before they peak" },
        { title: "Repurpose Top Content", desc: "Turn your best-performing videos into Shorts, blog posts, or social media content" },
        { title: "Collaborate with Creators", desc: "Partner with channels of similar size for cross-promotion and audience growth" },
      ]
    },
    {
      category: "Video Optimization",
      icon: Video,
      color: "chart-2",
      items: [
        { title: "Hook in First 8 Seconds", desc: "Capture attention immediately with a compelling question or statement" },
        { title: "Optimize Video Length", desc: "Aim for 8-12 minutes for regular videos, under 60 seconds for Shorts" },
        { title: "Add Chapters & Timestamps", desc: "Improve viewer experience and watch time with clear video sections" },
        { title: "Use Pattern Interrupts", desc: "Change camera angles, add B-roll every 15-20 seconds to maintain engagement" },
      ]
    },
    {
      category: "SEO & Discoverability",
      icon: Hash,
      color: "chart-3",
      items: [
        { title: "Target Long-Tail Keywords", desc: "Use specific 3-4 word phrases with lower competition for better ranking" },
        { title: "Optimize First 200 Characters", desc: "Front-load descriptions with keywords and value proposition" },
        { title: "Create Custom Thumbnails", desc: "Use high contrast, readable text, and faces with emotion for 10%+ CTR" },
        { title: "Strategic Tagging", desc: "Use 5-8 highly relevant tags, mix broad and specific terms" },
      ]
    },
    {
      category: "Engagement Tactics",
      icon: ThumbsUp,
      color: "chart-4",
      items: [
        { title: "Ask Specific Questions", desc: "End videos with clear CTAs: 'Comment your favorite tip' vs 'Leave a comment'" },
        { title: "Pin Top Comments", desc: "Pin engaging questions or valuable insights to encourage discussion" },
        { title: "Respond Within 1 Hour", desc: "Reply to early comments to boost engagement signals and build community" },
        { title: "Create Polls & Community Posts", desc: "Use Community tab 2-3x per week to maintain audience connection" },
      ]
    },
    {
      category: "Growth Strategies",
      icon: TrendingUp,
      color: "chart-1",
      items: [
        { title: "Consistent Upload Schedule", desc: "Publish same day/time weekly to train audience and algorithm" },
        { title: "Analyze Retention Graphs", desc: "Identify drop-off points and improve pacing in future videos" },
        { title: "Create Playlist Loops", desc: "End videos with 'Watch this next' to increase session time" },
        { title: "Leverage YouTube Shorts", desc: "Post 3-5 Shorts weekly to reach new audiences and drive channel traffic" },
      ]
    },
    {
      category: "Monetization Tips",
      icon: Zap,
      color: "chart-2",
      items: [
        { title: "Mid-Roll Ad Placement", desc: "Videos 8+ minutes can have mid-rolls; place at natural breaks" },
        { title: "Diversify Revenue", desc: "Explore memberships, Super Thanks, affiliate links, and sponsorships" },
        { title: "Create Evergreen Content", desc: "Focus on timeless topics that generate views and revenue long-term" },
        { title: "Optimize CPM Topics", desc: "Finance, tech, and business niches typically have 2-3x higher CPM" },
      ]
    },
  ];

  const quickWins = [
    { icon: Eye, title: "Update Old Thumbnails", desc: "Refresh thumbnails on videos with high impressions but low CTR", impact: "High" },
    { icon: Hash, title: "Add Missing Tags", desc: "Ensure all videos have 5-8 relevant tags for better discoverability", impact: "Medium" },
    { icon: MessageSquare, title: "Reply to Comments", desc: "Respond to recent comments to boost engagement signals", impact: "High" },
    { icon: Clock, title: "Add End Screens", desc: "Include end screens on all videos to increase watch time", impact: "High" },
    { icon: Video, title: "Create Playlists", desc: "Organize content into themed playlists for binge-watching", impact: "Medium" },
    { icon: Users, title: "Cross-Promote Shorts", desc: "Mention your channel in Shorts to drive subscribers", impact: "High" },
  ];

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Content Insights</h1>
          <p className="text-xs text-muted-foreground leading-none">Actionable recommendations to grow your channel</p>
        </div>

        {/* Quick Wins */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 text-chart-5" />
              <CardTitle className="text-base font-semibold">Quick Wins</CardTitle>
            </div>
            <CardDescription className="text-xs">High-impact actions you can take today</CardDescription>
          </CardHeader>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickWins.map((win, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
                      <win.icon className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold">{win.title}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${win.impact === 'High' ? 'bg-chart-1/10 text-chart-1' : 'bg-chart-3/10 text-chart-3'}`}>
                          {win.impact}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight">{win.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recommendations by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${category.color}/10`}>
                    <category.icon className={`size-3.5 text-${category.color}`} />
                  </div>
                  <CardTitle className="text-base font-semibold">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <div className="p-4 pt-0">
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold leading-tight">{item.title}</div>
                        <div className="text-xs text-muted-foreground leading-tight mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Best Practices Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">YouTube Algorithm Best Practices</CardTitle>
            <CardDescription className="text-xs">Key factors that influence video performance</CardDescription>
          </CardHeader>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold">Click-Through Rate (CTR)</div>
                <div className="text-xs text-muted-foreground leading-tight">Target: 4-10% | Improved by: Compelling thumbnails, curiosity-driven titles</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-1" style={{ width: '70%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold">Average View Duration (AVD)</div>
                <div className="text-xs text-muted-foreground leading-tight">Target: 50%+ | Improved by: Strong hooks, pacing, pattern interrupts</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-2" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold">Session Time</div>
                <div className="text-xs text-muted-foreground leading-tight">Goal: Keep viewers on YouTube | Improved by: Playlists, end screens, series</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-3" style={{ width: '55%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold">Engagement Rate</div>
                <div className="text-xs text-muted-foreground leading-tight">Target: 4-8% | Improved by: CTAs, questions, community interaction</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-4" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
