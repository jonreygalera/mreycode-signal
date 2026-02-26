"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { BackToTop } from "@/components/back-to-top";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <MainWrapper>{children}</MainWrapper>
            <BackToTop />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIframe = pathname?.includes('/iframe');
  
  return (
    <main className={cn(
      "mx-auto w-full max-w-7xl flex-1 focus:outline-none",
      isIframe ? "max-w-none px-0 pt-0" : "px-4 pt-16 sm:px-6 lg:px-8"
    )}>
      {children}
    </main>
  );
}
