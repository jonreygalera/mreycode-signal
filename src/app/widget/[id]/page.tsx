"use client";

import { use } from "react";
import { dashboardWidgets } from "@/config/dashboard";
import { WidgetCard } from "@/components/dashboard/widget-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default function WidgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const widget = dashboardWidgets.find((w) => w.id === id);

  if (!widget) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 flex flex-col">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-wider">Back to Dashboard</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-full max-w-6xl min-h-[600px] flex flex-col">
          <WidgetCard config={{ ...widget, size: 'xl' }} index={0} />
        </div>
      </div>
    </div>
  );
}
