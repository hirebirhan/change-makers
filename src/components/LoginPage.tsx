"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

const YT_LOGO = (
  <svg className="size-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const success = await login(username, password);
    if (!success) {
      setError("Invalid username or password");
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
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && (
                  <Badge variant="destructive" className="w-full justify-start h-auto py-1.5 px-3 text-xs">
                    ⚠ {error}
                  </Badge>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
