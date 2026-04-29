"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { LogIn } from "lucide-react";

const GOOGLE_OAUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH === "true";

const YT_LOGO = (
  <svg className="size-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export function LoginPage({ errorMessage }: { errorMessage?: string }) {
  const { login } = useAuth();
  const [username, setUsername] = useState(process.env.NODE_ENV === "development" ? "admin" : "");
  const [password, setPassword] = useState(process.env.NODE_ENV === "development" ? "changem@kers2025" : "");
  const [legacyError, setLegacyError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLegacySubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setLegacyError("");
    const success = await login(username, password);
    if (!success) {
      setLegacyError("Invalid username or password");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand panel — gold background */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-yt-red flex items-center justify-center shadow-md">
            {YT_LOGO}
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Birhan tech corner</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white leading-tight tracking-wide">
            YOUR CHANNEL,<br />FULLY UNDERSTOOD.
          </h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs font-medium">
            Real-time analytics, audience insights, and monthly reports — all in one clean dashboard.
          </p>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase">STEM Educator · Innovation · Tech Content</p>
        </div>
        <p className="text-white/40 text-xs">Powered by YouTube Data API v3</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col bg-background min-h-screen lg:min-h-0">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1 lg:hidden">
                <div className="w-7 h-7 rounded-lg bg-yt-red flex items-center justify-center">
                  <svg className="size-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm">Birhan tech corner</span>
              </div>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Sign in to your analytics dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {GOOGLE_OAUTH_ENABLED && errorMessage && (
                <Badge variant="destructive" className="w-full justify-start h-auto whitespace-normal py-1.5 px-3 text-xs">
                  {errorMessage}
                </Badge>
              )}
              {GOOGLE_OAUTH_ENABLED && (
                <>
                  <Badge variant="secondary" className="w-full justify-start h-auto py-1.5 px-3 text-xs">
                    Public API-key dashboards remain available without Google sign-in.
                  </Badge>
                  <Button className="w-full" size="lg" render={<a href="/auth/google/start" />}>
                    <LogIn className="size-4" />
                    Sign in with Google
                  </Button>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    Legacy access
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}
              <form onSubmit={handleLegacySubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    required
                  />
                </div>
                {legacyError && (
                  <Badge variant="destructive" className="w-full justify-start h-auto py-1.5 px-3 text-xs">
                    {legacyError}
                  </Badge>
                )}
                <Button type="submit" variant="outline" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Use legacy login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
