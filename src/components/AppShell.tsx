"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, PlaySquare, Sparkles, RefreshCw, MessageCircle, Brain, Type, TrendingUp, CalendarClock, Scissors } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChannelStats } from "@/types/youtube";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/videos", label: "Videos", icon: PlaySquare },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  // { href: "/insights", label: "Content Insights", icon: Lightbulb },
  // { href: "/growth", label: "Growth", icon: Target },
  { href: "/publishing-schedule", label: "Publishing Schedule", icon: CalendarClock },
  { href: "/comments", label: "Comments", icon: MessageCircle },
  { href: "/short-maker", label: "Short Maker", icon: Scissors },
  { href: "/seo", label: "SEO Studio", icon: Sparkles },
  { href: "/title-ranker", label: "Title Ranker", icon: Type },
  { href: "/ai", label: "AI Studio", icon: Brain },
  // { href: "/debug", label: "Debug API", icon: Bug },
];

const YT_LOGO = (
  <svg className="size-4 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

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
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
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
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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

        {channel && (
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  render={
                    <a
                      href={`https://www.youtube.com/${channel.customUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  {channel.profileImageUrl ? (
                    <Image src={channel.profileImageUrl} alt={channel.channelName} width={32} height={32} className="rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                      {channel.channelName.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col leading-none min-w-0">
                    <span className="font-semibold text-sm truncate">{channel.channelName}</span>
                    {channel.customUrl && (
                      <span className="text-xs text-muted-foreground truncate">{channel.customUrl}</span>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        )}
      </Sidebar>

      <SidebarInset className="flex flex-col">
        {/* Top nav */}
        <nav className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <div className="flex items-center gap-1 ml-auto">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground hidden sm:block mr-2">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {onRefresh && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onRefresh} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              )}
              <ThemeToggle />
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
