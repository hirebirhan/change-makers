import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Birhan Tech Corner Analytics | YouTube Channel Dashboard",
    template: "%s | Birhan Tech Corner Analytics",
  },
  description: "Professional YouTube analytics dashboard for Birhan Tech Corner. Track channel performance, video metrics, SEO insights, and AI-powered content recommendations.",
  keywords: [
    "YouTube analytics",
    "Birhan Tech Corner",
    "channel dashboard",
    "video metrics",
    "SEO optimization",
    "content analytics",
    "YouTube insights",
    "AI content tools",
  ],
  authors: [{ name: "Birhan Nega" }],
  creator: "Birhan Nega",
  publisher: "Birhan Tech Corner",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Birhan Tech Corner Analytics | YouTube Channel Dashboard",
    description: "Professional YouTube analytics dashboard for Birhan Tech Corner. Track channel performance, video metrics, SEO insights, and AI-powered content recommendations.",
    siteName: "Birhan Tech Corner Analytics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Birhan Tech Corner Analytics | YouTube Channel Dashboard",
    description: "Professional YouTube analytics dashboard for Birhan Tech Corner. Track channel performance, video metrics, SEO insights, and AI-powered content recommendations.",
    creator: "@birhantechcorner",
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
      className={cn(inter.variable, jetbrainsMono.variable, "font-sans")}
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