"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISSED_KEY = "pwa-ios-banner-dismissed";

function isIOSSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  // Safari on iOS doesn't have "Chrome" or "CriOS" or "FxiOS" in the UA
  const isNativeSafari = isIOS && !/crios|fxios|opios|mercury/i.test(ua);
  return isNativeSafari;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

export function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOSSafari()) return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Small delay so it doesn't flash immediately on load
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-xl backdrop-blur">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-4">
        {/* App icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="size-11 shrink-0 rounded-xl"
        />

        <div className="space-y-1">
          <p className="text-sm font-semibold leading-tight">
            Add to Home Screen
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            Tap{" "}
            {/* Share icon inline — matches what Safari actually shows */}
            <svg
              className="inline-block size-3.5 align-middle text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>{" "}
            then{" "}
            <span className="font-medium text-foreground">
              &ldquo;Add to Home Screen&rdquo;
            </span>{" "}
            to install this app.
          </p>
        </div>
      </div>
    </div>
  );
}
