"use client";

import { use, useState, useEffect } from "react";
import { dashboardWidgets } from "@/config/dashboard";
import { WidgetCard } from "@/components/dashboard/widget-card";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { notFound } from "next/navigation";

export default function WidgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);
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

  const copyToClipboard = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const iframeCode = `<iframe src="${origin}/widget/${id}/iframe" width="100%" height="400" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-wider">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-xs font-mono text-muted hover:text-foreground border border-border px-3 py-1.5 rounded bg-panel transition-colors"
          >
            {copied ? <Check size={14} className="text-up" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy Iframe Code"}
          </button>
          <Link
            href={`/widget/${id}/iframe`}
            className="text-xs font-mono text-muted hover:text-foreground border border-border px-3 py-1.5 rounded bg-panel transition-colors"
          >
            Open Iframe Mode
          </Link>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-full max-w-6xl min-h-[600px] flex flex-col">
          <WidgetCard config={{ ...widget, size: 'xl' }} index={0} />
        </div>
      </div>
    </div>
  );
}
