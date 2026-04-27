"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, PlaySquare, Sparkles, RefreshCw } from "lucide-react";
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
  { href: "/",        label: "Dashboard", icon: LayoutDashboard },
  { href: "/videos",  label: "Videos",    icon: PlaySquare },
  { href: "/seo",     label: "SEO Studio",icon: Sparkles },
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
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/" />}>
                <div className="w-8 h-8 rounded-xl bg-destructive flex items-center justify-center shadow-md shadow-destructive/30 shrink-0">
                  {YT_LOGO}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-sm">ChangeMakers</span>
                  <span className="text-xs text-muted-foreground">Analytics</span>
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

      <SidebarInset>
        {/* Top nav */}
        <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20 shadow-sm">
          <div className="px-4 h-14 flex items-center justify-between gap-4">
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
              {channel && (
                <>
                  {channel.profileImageUrl ? (
                    <Image src={channel.profileImageUrl} alt={channel.channelName} width={28} height={28} className="rounded-full object-cover ring-2 ring-border" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {channel.channelName.charAt(0)}
                    </div>
                  )}
                  <div className="hidden md:block ml-1 mr-1">
                    <a
                      href={`https://www.youtube.com/${channel.customUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold leading-none hover:text-primary transition-colors block"
                    >
                      {channel.channelName}
                    </a>
                    {channel.customUrl && (
                      <a
                        href={`https://www.youtube.com/${channel.customUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors block"
                      >
                        {channel.customUrl}
                      </a>
                    )}
                  </div>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                </>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
