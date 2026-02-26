"use client";

import { motion } from "framer-motion";
import { Book, Code, Terminal, Layers, Palette, RefreshCw, Globe, ArrowLeft, ArrowUpRight, CheckCircle2, Github } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/app";

const SECTIONS = [
  {
    title: "Core Configuration",
    icon: <Terminal className="w-5 h-5" />,
    description: "The essential properties required to define a widget.",
    fields: [
      { name: "id", type: "string", required: true, desc: "A unique identifier for the widget instance. Used for React keys and internal lookups." },
      { name: "label", type: "string", required: true, desc: "The display name shown at the top of the widget card." },
      { name: "type", type: "'stat' | 'line' | 'bar' | 'area'", required: true, desc: "The visualization engine to use for rendering the data." },
      { name: "api", type: "string", required: true, desc: "The backend endpoint URL. Supports both absolute URLs and local internal API routes." },
      { name: "responsePath", type: "string", required: true, desc: "Dot-notation path to extract data from JSON response (e.g., 'data.metrics.sessions')." },
    ],
  },
  {
    title: "Visual & Layout",
    icon: <Layers className="w-5 h-5" />,
    description: "Control how your widget looks and spans across the dashboard grid.",
    fields: [
      { name: "size", type: "'sm' | 'md' | 'lg' | 'xl'", desc: "Grid footprint. 'sm' is standard 1/3 width, 'lg' spans 2/3, and 'xl' takes the full width." },
      { name: "prefix / suffix", type: "string", desc: "Text to prepend or append to the value (e.g., '$' prefix or '%' suffix)." },
      { name: "description", type: "string", desc: "Sub-text shown under the label for extra context." },
      { name: "source / sourceUrl", type: "string", desc: "Attribution shown at the bottom of the card. If omitted, the API hostname is used." },
    ],
  },
  {
    title: "Dynamic Behavior",
    icon: <RefreshCw className="w-5 h-5" />,
    description: "Configure how data is updated and processed.",
    fields: [
      { name: "refreshInterval", type: "number", desc: "Polling interval in milliseconds. Set to 0 to disable auto-refresh." },
      { name: "abbreviate", type: "boolean", desc: "If true, large numbers like 1,500,000 become 1.5M. Includes a hover-to-view-full tooltip." },
      { name: "method / headers / body", type: "Fetch Options", desc: "Configure standard HTTP request options for the API call." },
    ],
  },
  {
    title: "Intelligent Coloring",
    icon: <Palette className="w-5 h-5" />,
    description: "Apply semantic colors based on theme or data values.",
    fields: [
      { name: "color", type: "ThemeColor", desc: "Static color: 'up' (green), 'down' (red), 'warning' (orange), 'info' (blue), or 'muted'." },
      { name: "colorRules", type: "ColorRuleSet", desc: "Dynamic rules: Define conditions like 'above 1000' or 'below 0' to set state reactively." },
    ],
  },
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
            Learn how to build, customize, and deploy real-time analytics widgets.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Quick Nav (Left) */}
          <aside className="lg:col-span-3 hidden lg:block sticky top-24 h-fit">
            <nav className="space-y-1">
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-4">On this page</h3>
              {SECTIONS.map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-muted/5 rounded-md transition-all"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content (Right) */}
          <main className="lg:col-span-9 space-y-20">
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
                      key={field.name}
                      className="group p-5 rounded-lg border border-border bg-panel/50 hover:border-muted/50 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <code className="text-sm font-bold text-foreground bg-foreground/5 px-2 py-1 rounded">
                            {field.name}
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
                        {field.desc}
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
  "api": "https://disease.sh/v3/covid-19/all",
  "responsePath": "population",
  "size": "sm",
  "refreshInterval": 86400000,
  "abbreviate": true,
  "colorRules": {
    "aboveZero": "info"
  },
  "description": "Total estimated global residents"
}`}
                </pre>
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
