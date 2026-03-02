"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Clock } from "./clock";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, Zap, Cpu, Sparkles, ExternalLink, BookOpen, Download, Monitor, MonitorOff, Settings, Menu, RotateCcw } from "lucide-react";
import { appConfig } from "@/config/app";
import { useTVMode } from "@/context/tv-mode-context";
import { SettingsModal } from "./settings-modal";
import Link from "next/link";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";
import { RefreshButton } from "./refresh-button";

export function Header() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const showAbout = searchParams.get("widget") === "about";
  const showSettings = searchParams.get("widget") === "settings";
  
  const setShowAbout = (show: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (show) params.set("widget", "about");
    else params.delete("widget");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const setShowSettings = (show: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (show) params.set("widget", "settings");
    else params.delete("widget");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { isTVMode, toggleTVMode } = useTVMode();
  const { settings } = useSettings();
  
  const pathname = usePathname();
  const isIframe = pathname?.includes("/iframe");

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);


  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (isIframe) return null;

  const navItems = [
    {
      label: "Clone",
      icon: <ExternalLink size={16} />,
      href: appConfig.github,
      external: true,
      onClick: undefined
    },
    {
      label: "Docs",
      icon: <BookOpen size={16} />,
      href: "/docs",
      external: false,
      onClick: undefined
    },
    {
      label: "About",
      icon: <Info size={16} />,
      href: undefined,
      external: false,
      onClick: () => setShowAbout(true)
    },
    {
      label: "Settings",
      icon: <Settings size={16} />,
      href: undefined,
      external: false,
      onClick: () => setShowSettings(true)
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-panel">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-[0.98]">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-foreground text-panel shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-foreground uppercase text-sm">
              {appConfig.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Clock />
            <div className="h-6 w-px bg-border mx-2" />
            
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors animate-pulse-subtle"
                title="Install App"
              >
                <Download size={14} />
                <span className="hidden lg:inline">Install</span>
              </button>
            )}

            {navItems.map((item) => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              )
            ))}

            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={toggleTVMode}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
              title={isTVMode ? "Exit TV Mode" : "Enter TV Mode"}
            >
              {isTVMode ? <MonitorOff size={14} /> : <Monitor size={14} />}
              <span className="hidden lg:inline">TV Mode</span>
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <RefreshButton />
            <div className="h-4 w-px bg-border mx-1" />
            <ThemeToggle />
          </div>

          {/* Mobile Bar Actions */}
          <div className="flex md:hidden items-center gap-3">
             <div className="scale-90 origin-right">
               <Clock />
             </div>
             <button 
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className="p-2 -mr-2 text-muted hover:text-foreground transition-colors relative"
             >
               <AnimatePresence mode="wait">
                 {isMenuOpen ? (
                   <motion.div
                     key="close"
                     initial={{ rotate: -90, opacity: 0 }}
                     animate={{ rotate: 0, opacity: 1 }}
                     exit={{ rotate: 90, opacity: 0 }}
                     transition={{ duration: 0.2 }}
                   >
                     <X size={20} />
                   </motion.div>
                 ) : (
                   <motion.div
                     key="menu"
                     initial={{ rotate: 90, opacity: 0 }}
                     animate={{ rotate: 0, opacity: 1 }}
                     exit={{ rotate: -90, opacity: 0 }}
                     transition={{ duration: 0.2 }}
                   >
                     <Menu size={20} />
                   </motion.div>
                 )}
               </AnimatePresence>
             </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-border bg-panel overflow-hidden"
            >
              <div className="flex flex-col p-4 space-y-1">
                {isInstallable && (
                  <button
                    onClick={() => {
                      handleInstallClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-4 px-4 py-4 rounded-lg bg-primary/5 text-primary text-sm font-bold active:bg-primary/10 transition-colors"
                  >
                    <Download size={18} />
                    Install System App
                  </button>
                )}

                {navItems.map((item) => (
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-4 px-4 py-4 rounded-lg text-foreground hover:bg-muted/10 transition-colors"
                    >
                      <span className="text-muted">{item.icon}</span>
                      <span className="text-sm font-semibold uppercase tracking-tight">{item.label}</span>
                      <ExternalLink size={12} className="ml-auto opacity-20" />
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.onClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-4 px-4 py-4 rounded-lg text-foreground hover:bg-muted/10 text-left transition-colors"
                    >
                      <span className="text-muted">{item.icon}</span>
                      <span className="text-sm font-semibold uppercase tracking-tight">{item.label}</span>
                    </button>
                  )
                ))}

                <button
                  onClick={() => {
                    toggleTVMode();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-4 px-4 py-4 rounded-lg text-foreground hover:bg-muted/10 text-left transition-colors"
                >
                  <span className="text-muted">{isTVMode ? <MonitorOff size={18} /> : <Monitor size={18} />}</span>
                  <span className="text-sm font-semibold uppercase tracking-tight">
                    {isTVMode ? "Exit TV Mode" : "Enter TV Mode"}
                  </span>
                </button>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between px-4 py-2">
                   <span className="text-xs font-bold text-muted uppercase tracking-widest">Theme Mode</span>
                   <ThemeToggle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAbout(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-panel shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-foreground text-panel">
                    <Zap size={14} />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-tight">System Intel</h2>
                </div>
                <button
                  onClick={() => setShowAbout(false)}
                  className="rounded-full p-1 text-muted hover:bg-muted/10 hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                    <Cpu size={12} />
                    Project Origins
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed font-mono">
                    This project was built with a <span className="text-primary font-bold">Vibe Coding</span> approach using the <span className="text-primary font-bold">Google Antigravity IDE</span>. It focuses on high-density data visualization and modularity.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                    <Sparkles size={12} />
                    Tech Stack
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {appConfig.techStack.map((tech) => (
                      <div
                        key={tech}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border/40 bg-muted/5 text-[11px] font-mono text-muted/90"
                      >
                        <div className="h-1 w-1 rounded-full bg-primary/60" />
                        {tech}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                    <span className="text-muted">Open Source</span>
                    <a 
                      href={appConfig.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      GitHub Repo
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                    <span className="text-muted">Developer</span>
                    <a 
                      href={appConfig.developer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {appConfig.developer.website.replace("https://", "")}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <p className="text-[10px] text-center text-muted/50 mt-2 uppercase tracking-[0.3em]">
                    Version {appConfig.version}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

