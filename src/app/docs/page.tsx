"use client";

import { motion } from "framer-motion";
import { Book, Code, Terminal, Layers, Palette, RefreshCw, Globe, ArrowLeft, ArrowUpRight, CheckCircle2, Github, Webhook } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/app";

import { WIDGET_DOCS } from "@/config/docs";

const SECTIONS = WIDGET_DOCS.map(section => ({
  ...section,
  icon: section.title === "Core Configuration" ? <Terminal className="w-5 h-5" /> :
        section.title === "Data Fetching" ? <RefreshCw className="w-5 h-5" /> :
        section.title === "Widget Config (Nested)" ? <Layers className="w-5 h-5" /> :
        section.title === "Logic & Aesthetics" ? <Palette className="w-5 h-5" /> :
        section.title === "Active Alerts: Signals" ? <Webhook className="w-5 h-5" /> :
        <Code className="w-5 h-5" />
}));

const GUIDES = [
  {
    title: "Vibe Coding Approach",
    icon: <Palette className="w-5 h-5" />,
    content: "Signal is built with a 'Vibe Coding' philosophy. This means prioritizing rapid iteration, elegant design tokens, and human-readable configurations over rigid boilerplates. When adding widgets, focus on the 'vibe'—the colors, the glow, and the real-time feel."
  },
  {
    title: "The Fast Widget Flow",
    icon: <Terminal className="w-5 h-5" />,
    content: "Need a metric quickly? Use the 'Fast Widget' button. Paste your JSON, deploy instantly to local storage, and see it go live. Once you're happy with the vibe, you can permanently add it to `src/config/dashboard.ts`."
  },
  {
    title: "Webhook & Alerts",
    icon: <Webhook className="w-5 h-5" />,
    content: "Beyond visual cues, Signal can trigger outbound Webhooks. Connect your widgets to Slack, Discord, or automated scripts to turn your dashboard into a fully autonomous monitoring engine."
  }
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="bg-panel border-b border-border mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors mb-8 uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-foreground text-panel rounded-lg shadow-lg">
              <Book size={28} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground uppercase">
              Widget Documentation
            </h1>
          </div>
          <p className="text-lg text-muted/80 max-w-2xl leading-relaxed">
            The Signal Engine is powered by a flexible, JSON-driven configuration system. 
            Learn how to build, customize, and automate real-time analytics with signals and webhooks.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Quick Nav (Left) */}
          <aside className="lg:col-span-3 hidden lg:block sticky top-24 h-fit">
            <nav className="space-y-1">
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-4">Introduction</h3>
              <a href="#guides" className="block px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-muted/5 rounded-md transition-all">
                Getting Started
              </a>
              
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-8 mb-4">Widget Schema</h3>
              {SECTIONS.filter(s => !s.title.includes("Signals")).map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-muted/5 rounded-md transition-all"
                >
                  {section.title}
                </a>
              ))}

              <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-8 mb-4">Automation</h3>
              {SECTIONS.filter(s => s.title.includes("Signals")).map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-muted/5 rounded-md transition-all"
                >
                  Signals & Webhooks
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content (Right) */}
          <main className="lg:col-span-9 space-y-20">
            {/* Introduction & Guides */}
            <section id="guides" className="scroll-mt-24 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {GUIDES.map((guide, idx) => (
                  <motion.div
                    key={guide.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-xl border border-border bg-panel shadow-sm group hover:border-muted/50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center text-muted group-hover:text-foreground transition-colors mb-4">
                      {guide.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-tight mb-2">{guide.title}</h3>
                    <p className="text-sm text-muted/70 leading-relaxed">{guide.content}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {SECTIONS.map((section, idx) => (
              <motion.section 
                key={section.title}
                id={section.title.toLowerCase().replace(/\s+/g, "-")}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-muted/60">{section.icon}</div>
                  <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                    {section.title}
                  </h2>
                </div>
                <p className="text-muted leading-relaxed mb-8 border-b border-border/40 pb-4">
                  {section.description}
                </p>

                <div className="grid gap-4">
                  {section.fields.map((field: any) => (
                    <div 
                      key={field.key}
                      className="group p-5 rounded-lg border border-border bg-panel/30 backdrop-blur-md hover:bg-panel/50 hover:border-muted/50 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <code className="text-sm font-bold text-foreground bg-foreground/5 px-2 py-1 rounded">
                            {field.key}
                          </code>
                          <span className="text-xs font-mono text-muted italic">
                            {field.type}
                          </span>
                        </div>
                        {field.required && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                            <CheckCircle2 size={12} className="opacity-50" />
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted/80 leading-relaxed group-hover:text-foreground/80 transition-colors">
                        {field.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}

            {/* Code Example Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl border border-border bg-foreground text-panel shadow-2xl overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:rotate-0">
                <Code size={120} />
              </div>
              <div className="relative">
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Full Example Schema</h3>
                <p className="text-panel/60 text-sm mb-6">A production-ready stat widget configuration.</p>
                <pre className="text-xs font-mono leading-relaxed bg-black/20 p-6 rounded-lg backdrop-blur-sm overflow-x-auto text-panel/90 scrollbar-hide">
{`{
  "id": "global-population",
  "label": "World Population",
  "type": "stat",
  "api": "https://restcountries.com/v3.1/name/philippines",
  "responsePath": "0.population",
  "size": "sm",
  "refreshInterval": 3600000,
  "config": {
    "suffix": " souls",
    "abbreviate": true
  },
  "color": "info",
  "description": "Total estimated global residents"
}`}
                </pre>
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl border border-border bg-foreground text-panel shadow-2xl overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:rotate-0">
                <Code size={120} />
              </div>
              <div className="relative">
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Example: Webhook Signal</h3>
                <p className="text-panel/60 text-sm mb-6">Automate actions when a threshold is met.</p>
                <pre className="text-xs font-mono leading-relaxed bg-black/20 p-6 rounded-lg backdrop-blur-sm overflow-x-auto text-panel/90 scrollbar-hide">
{`{
  "id": "error-rate",
  "label": "API Error Rate",
  "type": "stat",
  "signals": [
    {
      "id": "critical-errors",
      "label": "Critical Error Spike",
      "condition": "above",
      "threshold": 5,
      "action": ["notify", "webhook"],
      "enabled": true,
      "webhook": {
        "url": "https://hooks.slack.com/services/...",
        "method": "POST",
        "body": "{\\"text\\": \\"Critical error spike detected!\\"}"
      }
    }
  ]
}`}
                </pre>
              </div>
            </motion.section>

            {/* Troubleshooting / Tips */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                Tips & Troubleshooting
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "CORS Awareness", content: "Ensure your Webhook endpoints allow cross-origin requests or use a proxy if testing locally." },
                  { title: "Rate Limiting", content: "Webhooks follow the widget's refresh interval. Use 'cooldown' to prevent spamming notifications." },
                  { title: "JSON Schema", content: "Always validate your JSON in the Playground before deploying to avoid engine crashes." }
                ].map((tip) => (
                  <div key={tip.title} className="p-4 rounded-lg bg-muted/5 border border-dashed border-border">
                    <h4 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">{tip.title}</h4>
                    <p className="text-xs text-muted/70 leading-relaxed">{tip.content}</p>
                  </div>
                ))}
              </div>
            </motion.section>
            {/* Quick Links / Footer */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12">
              <a 
                href={appConfig.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-8 rounded-lg border border-border bg-panel hover:bg-muted/5 transition-all group"
              >
                <h4 className="text-sm font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                  Source Code
                  <Github className="w-4 h-4 text-muted group-hover:text-foreground transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                </h4>
                <p className="text-xs text-muted leading-relaxed">Explore the repository, contribute to the project, or report issues on GitHub.</p>
                <span className="mt-4 inline-block text-[10px] font-bold text-foreground border-b border-foreground pb-1 uppercase tracking-widest">View on GitHub</span>
              </a>
              <a 
                href={appConfig.developer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-8 rounded-lg border border-border bg-panel hover:bg-muted/5 transition-all group"
              >
                <h4 className="text-sm font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                  Developer Portfolio
                  <Globe size={16} className="text-muted group-hover:text-foreground transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                </h4>
                <p className="text-xs text-muted leading-relaxed">Visit the creator's portfolio to see more projects and engineering insights.</p>
                <span className="mt-4 inline-block text-[10px] font-bold text-foreground border-b border-foreground pb-1 uppercase tracking-widest">Visit Portfolio</span>
              </a>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
