import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Figtree, Public_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const publicSans = Public_Sans({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Change Makers | YouTube Analytics Dashboard",
    template: "%s | Change Makers",
  },
  description: "Comprehensive YouTube channel analytics and management platform. Track performance, optimize SEO, get AI-powered insights, and grow your channel.",
  keywords: [
    "YouTube analytics",
    "channel dashboard",
    "video metrics",
    "SEO optimization",
    "content analytics",
    "YouTube insights",
    "AI content tools",
    "growth tracking",
    "title ranker",
    "comment management",
  ],
  authors: [{ name: "Birhan Nega" }],
  creator: "Birhan Nega",
  publisher: "Change Makers",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Change Makers | YouTube Analytics Dashboard",
    description: "Comprehensive YouTube channel analytics and management platform. Track performance, optimize SEO, get AI-powered insights, and grow your channel.",
    siteName: "Change Makers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Change Makers | YouTube Analytics Dashboard",
    description: "Comprehensive YouTube channel analytics and management platform. Track performance, optimize SEO, get AI-powered insights, and grow your channel.",
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(publicSans.variable, jetbrainsMono.variable, "font-sans")}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>{children}</AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}