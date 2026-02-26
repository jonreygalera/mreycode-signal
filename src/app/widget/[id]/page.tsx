"use client";

import { use, useState, useEffect } from "react";
import { dashboardWidgets } from "@/config/dashboard";
import { WidgetCard } from "@/components/dashboard/widget-card";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export default function WidgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);
  const [iframeTheme, setIframeTheme] = useState<'dark' | 'light'>('dark');
  const widget = dashboardWidgets.find((w) => w.id === id);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  if (!widget) {
    return notFound();
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const iframeUrl = `${origin}/widget/${id}/iframe?theme=${iframeTheme}`;
  const iframeCode = `<iframe src="${iframeUrl}" width="100%" height="400" frameborder="0"></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 flex flex-col gap-8">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-wider">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted/10 rounded-full p-1 border border-border/40">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setIframeTheme(t)}
                className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  iframeTheme === t 
                    ? "bg-foreground text-background shadow-lg" 
                    : "text-muted hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <Link
            href={iframeUrl}
            target="_blank"
            className="text-xs font-mono text-muted hover:text-foreground"
          >
            Launch Independent
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Main Widget Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Live Preview
          </div>
          <div className="aspect-video lg:aspect-auto lg:flex-1 w-full bg-neutral-900 rounded-lg border border-border overflow-hidden shadow-2xl relative">
            <iframe 
              key={iframeUrl}
              src={iframeUrl} 
              className="w-full h-full border-0" 
              title="Iframe Preview"
            />
          </div>
        </div>

        {/* Integration Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
              Embed Configuration
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground font-mono">Iframe Snippet</label>
              <div className="relative group">
                <textarea
                  readOnly
                  value={iframeCode}
                  className="w-full h-32 bg-panel border border-border rounded p-3 text-xs font-mono text-foreground/80 resize-none focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-foreground text-background px-3 py-1.5 rounded-sm hover:scale-105 transition-transform"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>

            <div className="p-4 rounded border border-up/20 bg-up/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-up animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-up">Dynamic Theme Support</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                The widget automatically adjusts its internal UI tokens based on the <code className="text-foreground">?theme</code> query parameter. Toggle the theme above to see it update in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
