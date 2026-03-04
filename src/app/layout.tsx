import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { appConfig } from "@/config/app";
import { TVModeProvider } from "@/context/tv-mode-context";
import { SettingsProvider } from "@/context/settings-context";
import { SecurityProvider } from "@/context/security-context";
import { ConnectivityProvider } from "@/context/connectivity-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.url),
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
  keywords: appConfig.keywords,
  authors: [{ name: appConfig.developer.name, url: appConfig.developer.website }],
  creator: appConfig.developer.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appConfig.url,
    title: appConfig.name,
    description: appConfig.description,
    siteName: appConfig.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: appConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appConfig.name,
    description: appConfig.description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: appConfig.name,
  },
  formatDetection: {
    telephone: false,
  },
};


export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AlertProvider } from "@/context/alert-context";
import { SignalProvider } from "@/context/signal-context";
import GuestTracker from "@/components/guest-tracker";

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-neutral-50 dark:bg-black antialiased min-h-screen font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TVModeProvider>
            <SettingsProvider>
              <ConnectivityProvider>
                <AlertProvider>
                  <SecurityProvider>
                    <SignalProvider>
                      <GuestTracker />
                      <LayoutWrapper>{children}</LayoutWrapper>
                    </SignalProvider>
                  </SecurityProvider>
                </AlertProvider>
              </ConnectivityProvider>
            </SettingsProvider>
          </TVModeProvider>
        </ThemeProvider>
        <Script 
          src="http://mrey-ai.vercel.app/js/embed-mreyagent.js?agentName=mreycode-signal-kb" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}


