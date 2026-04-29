"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthCtx {
  isAuthenticated: boolean;
  loading: boolean;
  authMode: "google" | "legacy" | null;
  user: { id: string; email: string; name: string; avatarUrl: string | null } | null;
  youtube: {
    connected: boolean;
    revoked: boolean;
    googleAccountEmail: string | null;
    youtubeChannelId: string | null;
    grantedScopes: string[];
    tokenExpiry: string | null;
  };
  login: (username: string, password: string) => Promise<boolean>;
  googleLogin: () => void;
  logout: () => Promise<void>;
  connectYouTube: (revenue?: boolean) => void;
  disconnectYouTube: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);
const emptyYouTube = {
  connected: false,
  revoked: false,
  googleAccountEmail: null,
  youtubeChannelId: null,
  grantedScopes: [],
  tokenExpiry: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthCtx["authMode"]>(null);
  const [user, setUser] = useState<AuthCtx["user"]>(null);
  const [youtube, setYouTube] = useState<AuthCtx["youtube"]>(emptyYouTube);
  const router = useRouter();

  useEffect(() => {
    refreshMe();
  }, []);

  async function refreshMe() {
    setLoading(true);
    try {
      const res = await fetch("/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
      setAuthMode(data.authMode ?? null);
      setYouTube(data.youtube ?? emptyYouTube);
    } catch {
      setUser(null);
      setAuthMode(null);
      setYouTube(emptyYouTube);
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return false;
    await refreshMe();
    router.push("/");
    router.refresh();
    return true;
  }

  function googleLogin() {
    window.location.href = "/auth/google/start";
  }

  function connectYouTube(revenue = false) {
    window.location.href = revenue ? "/auth/youtube/start?revenue=1" : "/auth/youtube/start";
  }

  async function logout() {
    await fetch("/auth/logout", { method: "POST" });
    setUser(null);
    setAuthMode(null);
    setYouTube(emptyYouTube);
    router.refresh();
  }

  async function disconnectYouTube() {
    await fetch("/auth/youtube/disconnect", { method: "POST" });
    await refreshMe();
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        loading,
        authMode,
        user,
        youtube,
        login,
        googleLogin,
        logout,
        connectYouTube,
        disconnectYouTube,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
