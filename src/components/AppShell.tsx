"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LogOut, LayoutDashboard, PlaySquare, Sparkles, RefreshCw,
  MessageCircle, Brain, Type, TrendingUp, CalendarClock, Scissors,
  ExternalLink, BarChart2, Lightbulb, Scroll, KanbanSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChannelStats } from "@/types/youtube";

const NAV = [
  { href: "/",                    label: "Dashboard",          icon: LayoutDashboard },
  { href: "/videos",              label: "Videos",             icon: PlaySquare },
  { href: "/performance",         label: "Performance",        icon: TrendingUp },
  { href: "/publishing-schedule", label: "Publishing Schedule",icon: CalendarClock },
  { href: "/comments",            label: "Comments",           icon: MessageCircle },
  { href: "/short-maker",         label: "Short Maker",        icon: Scissors },
  { href: "/seo",                 label: "SEO Studio",         icon: Sparkles },
  { href: "/title-ranker",        label: "Title Ranker",       icon: Type },
  { href: "/ai",                  label: "AI Studio",          icon: Brain },
  { href: "/growth",              label: "Growth",             icon: BarChart2 },
  { href: "/insights",            label: "Insights",           icon: Lightbulb },
  { href: "/script-maker",        label: "Script Maker",       icon: Scroll },
  { href: "/pipeline",            label: "Pipeline",           icon: KanbanSquare },
];

const YT_LOGO = (
  <svg className="size-4 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60)   return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

interface AppShellProps {
  children: React.ReactNode;
  channel?: ChannelStats;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: Date | null;
}

export function AppShell({ children, channel, onRefresh, refreshing, lastUpdated }: AppShellProps) {
  const { logout } = useAuth();
  const pathname = usePathname();
  // Tick every 30 s so the "Updated X ago" label re-evaluates without a manual refresh
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastUpdated) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <SidebarProvider className="min-h-screen">
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/70 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="h-12 gap-3 rounded-xl px-2 data-[state=open]:bg-sidebar-accent"
                render={<Link href="/" />}
              >
                <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border">
                  {channel?.profileImageUrl ? (
                    <Image
                      src={channel.profileImageUrl}
                      alt={channel.channelName}
                      width={36}
                      height={36}
                      className="size-9 object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-red-500 to-red-700">
                      {YT_LOGO}
                    </div>
                  )}
                </div>

                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold tracking-tight">
                    {channel?.channelName ?? "Birhan Tech Corner"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {channel?.customUrl ?? "YouTube Analytics"}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={pathname === href}
                      tooltip={label}
                      render={<Link href={href} />}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {channel?.customUrl && (
          <SidebarFooter className="border-t border-sidebar-border/70">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="View Channel"
                  render={
                    <a
                      href={`https://www.youtube.com/${channel.customUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <svg className="size-4 shrink-0 text-destructive" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span className="text-sm">View Channel</span>
                  <ExternalLink className="size-3 ml-auto text-muted-foreground" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        )}
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <nav className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="flex items-center gap-1 ml-auto">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:block mr-2">
                Updated {relativeTime(lastUpdated)}
              </span>
            )}
            {onRefresh && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
            <ThemeToggle />
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </nav>

        <div className="flex-1 pb-16 sm:pb-0">
          {children}
        </div>

        {/* Mobile bottom navigation — hidden on sm+ where the sidebar takes over */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex sm:hidden h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {[
            { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
            { href: "/videos",     label: "Videos",     icon: PlaySquare },
            { href: "/ai",         label: "AI Studio",  icon: Brain },
            { href: "/title-ranker", label: "Titles",   icon: Type },
            { href: "/comments",   label: "Comments",   icon: MessageCircle },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`size-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
