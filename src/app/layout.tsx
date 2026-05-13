import type { Metadata } from "next";
import { JetBrains_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { IOSInstallBanner } from "@/components/IOSInstallBanner";

const publicSans = Public_Sans({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Change Makers | YouTube Analytics",
    template: "%s | Change Makers",
  },
  description: "YouTube channel analytics, AI tools, and content insights for Birhan tech corner.",
  authors: [{ name: "Birhan Nega" }],
  creator: "Birhan Nega",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  robots: { index: false, follow: false },
  // PWA manifest
  manifest: "/manifest.json",
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // PWA / mobile browser chrome
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Change Makers",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Change Makers | YouTube Analytics",
    description: "YouTube channel analytics, AI tools, and content insights for Birhan tech corner.",
    siteName: "Change Makers",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(publicSans.variable, jetbrainsMono.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#09090b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ServiceWorkerRegistration />
        <IOSInstallBanner />
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>{children}</AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
