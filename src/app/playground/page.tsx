"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  X, Plus, Save, Hash, Terminal, BookOpen, ChevronRight, 
  ChevronDown, Copy, Check, Search, Type, Layout, Code, Eye, ExternalLink, RefreshCcw, Play
} from "lucide-react";
import { WidgetConfig, WidgetType, WidgetSize } from "@/types/widget";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/config/templates";
import { configToSearchParams, searchParamsToConfig } from "@/lib/widget-url";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { parseCurl } from "@/lib/curl";

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/30 rounded-lg overflow-hidden bg-foreground/[0.02]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-foreground/[0.03] transition-colors"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{title}</span>
        <ChevronDown size={14} className={cn("text-muted transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="p-4 pt-0 space-y-4 border-t border-border/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cleanWidgetConfig(obj: any, isHeaderValue = false): any {
  if (Array.isArray(obj)) {
    const cleaned = obj.map(v => cleanWidgetConfig(v)).filter(v => 
      v !== null && v !== undefined && v !== "" && (typeof v !== 'object' || Object.keys(v).length > 0)
    );
    return cleaned.length > 0 ? cleaned : undefined;
  } else if (typeof obj === 'object' && obj !== null) {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (key === 'isTemp') return;
      const value = cleanWidgetConfig(obj[key], key === 'headers');
      const allowEmpty = isHeaderValue;
      if (value !== null && value !== undefined && (allowEmpty || value !== "") && (typeof value !== 'object' || Object.keys(value).length > 0)) {
        cleaned[key] = value;
      }
    });
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return obj;
}

function PlaygroundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL - Using any to avoid union type fighting during partial edits
  const [config, setConfig] = useState<any>(() => {
    const fromUrl = searchParamsToConfig(searchParams);
    if (!fromUrl.id) {
      return {
        id: `widget-${Math.floor(1000 + Math.random() * 9000)}`,
        label: "My Playground Widget",
        type: "stat",
        size: "sm",
        config: {}
      };
    }
    return fromUrl;
  });

  const [copied, setCopied] = useState(false);
  const [activeIframeTheme, setActiveIframeTheme] = useState<'dark' | 'light'>('dark');
  const [showForm, setShowForm] = useState(() => searchParams.get("hideForm") !== "true");
  const [showMinimal, setShowMinimal] = useState(() => searchParams.get("minimal") === "true");
  const [templateSearch, setTemplateSearch] = useState("");
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [configText, setConfigText] = useState(() => JSON.stringify(config, null, 2));
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlInput, setCurlInput] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<{msg: string, type: 'info'|'success'|'error'|'warn'}[]>([]);
  const [testResponse, setTestResponse] = useState<any>(null);
  
  const templateSearchRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateSearchRef.current && !templateSearchRef.current.contains(event.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return TEMPLATES;
    const search = templateSearch.toLowerCase();
    return TEMPLATES.filter(t => 
      t.label.toLowerCase().includes(search) || 
      t.config.type?.toLowerCase().includes(search) ||
      t.config.description?.toLowerCase().includes(search)
    );
  }, [templateSearch]);

  const categorizedTemplates = useMemo(() => {
    const categories: Record<string, typeof TEMPLATES> = {};
    filteredTemplates.slice(0, 100).forEach(t => {
      let cat = "Other";
      if (t.label.toLowerCase().includes("github")) cat = "GitHub";
      else if (t.label.toLowerCase().includes("covid") || t.label.toLowerCase().includes("health")) cat = "Health";
      else if (t.label.toLowerCase().includes("stat:") || t.label.toLowerCase().includes("metrics:")) cat = "Stats";
      else if (t.label.toLowerCase().includes("chart:")) cat = "Charts";
      else if (t.label.toLowerCase().includes("gold") || t.label.toLowerCase().includes("btc") || t.label.toLowerCase().includes("price")) cat = "Finance";
      else if (t.label.toLowerCase().includes("iframe") || t.label.toLowerCase().includes("clock")) cat = "Interactive";
      
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(t);
    });
    return categories;
  }, [filteredTemplates]);

  // Sync state to URL
  useEffect(() => {
    const params = configToSearchParams(config);
    if (!showForm) params.set("hideForm", "true");
    if (showMinimal) params.set("minimal", "true");
    const newUrl = `/playground?${params.toString()}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  }, [config, showForm, showMinimal]);

  const updateConfig = (updates: any) => {
    setConfig((prev: any) => {
      const newConfig = cleanWidgetConfig({ ...prev, ...updates });
      const finalConfig = newConfig || {};
      // Update configText if not in JSON tab to keep them in sync
      if (activeTab !== 'json') {
        setConfigText(JSON.stringify(finalConfig, null, 2));
      }
      return finalConfig;
    });
  };

  const updateNestedConfig = (updates: any) => {
    const currentNested = config.config || {};
    updateConfig({ config: { ...currentNested, ...updates } });
  };

  // Sync configText -> config when in JSON tab
  useEffect(() => {
    if (activeTab === 'json') {
      try {
        const parsed = JSON.parse(configText);
        if (typeof parsed === 'object' && parsed !== null) {
          setConfig(parsed);
        }
      } catch (e) {
        // Ignore invalid JSON while typing
      }
    }
  }, [configText, activeTab]);

  const handleImportCurl = () => {
    if (!curlInput.trim()) return;
    const result = parseCurl(curlInput);
    const updates: any = {};
    if (result.url) updates.api = result.url;
    if (result.method) updates.method = result.method;
    if (Object.keys(result.headers || {}).length > 0) updates.headers = result.headers;
    if (result.body) updates.body = result.body;
    
    updateConfig(updates);
    setCurlInput("");
    setShowCurlModal(false);
  };

  const handleTestApi = async () => {
    if (!config.api) return;
    setIsTesting(true);
    setTestResponse(null);
    
    let displayHostname = "remote host";
    try {
      displayHostname = new URL(config.api).hostname;
    } catch (e) {}

    setTestLogs([{ msg: `Initializing request to ${displayHostname}...`, type: 'info' }]);
    const startTime = Date.now();
    
    try {
      await new Promise(r => setTimeout(r, 600)); // Aesthetic delay
      setTestLogs(prev => [...prev, { msg: `${config.method || 'GET'} ${config.api}`, type: 'info' }]);
      
      const response = await fetch(config.api, {
        method: config.method || 'GET',
        headers: config.headers || {},
        body: config.method === 'POST' ? (typeof config.body === 'object' ? JSON.stringify(config.body) : config.body) : undefined
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        setTestLogs(prev => [...prev, { msg: `Response received in ${duration}ms. Status: ${response.status} ${response.statusText}`, type: 'success' }]);
        const data = await response.json();
        setTestResponse(data);
        setTestLogs(prev => [...prev, { msg: `Successfully parsed ${JSON.stringify(data).length} bytes of JSON data.`, type: 'success' }]);
      } else {
        setTestLogs(prev => [...prev, { msg: `Request failed with status ${response.status}: ${response.statusText}`, type: 'error' }]);
        try {
           const errorData = await response.json();
           setTestResponse(errorData);
        } catch(e) {}
      }
    } catch (err: any) {
      setTestLogs(prev => [...prev, { msg: `Network error: ${err.message}`, type: 'error' }]);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [testLogs]);

  const iframeUrl = useMemo(() => {
    const params = configToSearchParams(config);
    params.set("theme", activeIframeTheme);
    params.set("maximized", "true");
    if (showMinimal) params.set("minimal", "true");
    return `/widget/preview?${params.toString()}`;
  }, [config, activeIframeTheme, showMinimal]);

  const embedCode = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}${iframeUrl}`;
    return `<iframe src="${fullUrl}" width="100%" height="400" frameborder="0"></iframe>`;
  }, [iframeUrl]);

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 shrink-0 bg-panel/50 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-background font-black text-xl">S</span>
            </div>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Widget Playground</h1>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Design & Embed</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted/10 rounded-full p-1 border border-border/40">
            <button
              onClick={() => setShowForm(!showForm)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                !showForm ? "bg-primary text-primary-foreground shadow-lg" : "text-muted hover:text-foreground"
              )}
              title={showForm ? "Focus Preview" : "Show Editor"}
            >
              <Eye size={12} />
              <span className="hidden sm:inline">{showForm ? "Focus" : "Edit"}</span>
            </button>
            <div className="w-px h-4 bg-border/40 mx-1" />
            <button
              onClick={() => setShowMinimal(!showMinimal)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                showMinimal ? "bg-foreground text-background shadow-lg" : "text-muted hover:text-foreground"
              )}
              title={showMinimal ? "Show Widget Header" : "Minimal Widget View"}
            >
              <Hash size={12} />
              <span className="hidden sm:inline">Minimal</span>
            </button>
          </div>

          <div className="h-6 w-px bg-border/40 mx-2 hidden sm:block" />

          <div className="flex items-center bg-muted/10 rounded-full p-1 border border-border/40">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveIframeTheme(t)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  activeIframeTheme === t 
                    ? "bg-foreground text-background shadow-lg" 
                    : "text-muted hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-muted hover:text-foreground transition-colors"
            title="Reset All"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Pane - Form */}
        {showForm && (
          <aside className="w-full md:w-[400px] lg:w-[450px] border-r border-border/40 flex flex-col shrink-0 bg-panel/30 overflow-hidden animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-border/20 bg-panel/50 backdrop-blur-sm z-10">
              <div className="flex items-center gap-1 p-1 bg-foreground/5 rounded-lg border border-border/50">
                {(['form', 'json'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      activeTab === tab 
                        ? "bg-background text-primary shadow-sm border border-border/50" 
                        : "text-muted hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    {tab === 'form' ? <Layout size={12} /> : <Code size={12} />}
                    {tab === 'form' ? 'Form' : 'JSON'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {activeTab === 'json' ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">JSON Editor</label>
                      <button 
                        onClick={() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const fullUrl = `${origin}${iframeUrl}`;
                          navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors flex items-center gap-2"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <textarea
                      value={configText}
                      onChange={(e) => setConfigText(e.target.value)}
                      className="w-full h-[calc(100vh-250px)] bg-background/50 border border-border/50 rounded-lg p-4 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none custom-scrollbar"
                      placeholder='{ "id": "my-widget", ... }'
                    />
                  </div>
                ) : (
                  <>
                {/* Template Selector Autocomplete */}
                <div className="space-y-1.5 relative border border-border/40 bg-foreground/[0.02] p-4 rounded-lg" ref={templateSearchRef}>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-3">
                    <Search size={14} /> Browse Templates
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="text"
                      placeholder="Search 10,000+ templates..."
                      value={templateSearch}
                      onChange={(e) => {
                        setTemplateSearch(e.target.value);
                        setIsTemplateDropdownOpen(true);
                      }}
                      onFocus={() => setIsTemplateDropdownOpen(true)}
                      className="w-full bg-background border border-border rounded-[4px] pl-9 pr-8 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-bold tracking-wide"
                    />
                    {templateSearch && (
                      <button 
                        onClick={() => {
                          setTemplateSearch("");
                          setIsTemplateDropdownOpen(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  
                  {isTemplateDropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-panel border border-border/50 rounded-xl shadow-2xl z-50 max-h-[350px] overflow-y-auto custom-scrollbar p-2 origin-top animate-in fade-in zoom-in-95 duration-200">
                      {Object.entries(categorizedTemplates).map(([cat, items]) => (
                        <div key={cat} className="space-y-1 mb-3 last:mb-0">
                          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted/50 flex items-center gap-2 px-2 py-1 sticky top-0 bg-panel/90 backdrop-blur-sm z-10">
                            <span className="w-1 h-1 rounded-full bg-primary/40" /> {cat} ({items.length})
                          </h4>
                          <div className="grid grid-cols-1 gap-1">
                            {items.map((t, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setConfig(t.config);
                                  setIsTemplateDropdownOpen(false);
                                  // Scroll to top of preview if on mobile
                                  if (window.innerWidth < 768) {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                                }}
                                className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 rounded-lg transition-all text-left flex items-center justify-between group",
                                  config.label === t.label ? "bg-primary/10 text-primary" : "hover:bg-foreground/5 text-muted hover:text-foreground"
                                )}
                              >
                                <span className="truncate pr-4">{t.label.replace(`${cat}: `, "").replace(`${cat} `, "")}</span>
                                {config.label === t.label ? (
                                  <Check size={12} className="text-primary shrink-0" />
                                ) : (
                                  <Plus size={12} className="text-muted/0 group-hover:text-primary transition-colors shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {filteredTemplates.length === 0 && (
                        <div className="py-6 text-center space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">No templates found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary pt-2 border-t border-border/20">
                  <Layout size={14} /> Basic Settings
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">ID</label>
                    <input
                      type="text"
                      value={config.id || ""}
                      onChange={(e) => updateConfig({ id: e.target.value })}
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Label</label>
                    <input
                      type="text"
                      value={config.label || ""}
                      onChange={(e) => updateConfig({ label: e.target.value })}
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Type</label>
                    <select
                      value={config.type || "stat"}
                      onChange={(e) => updateConfig({ type: e.target.value as WidgetType, config: {} })}
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="stat">Stat (Single Value)</option>
                      <option value="chart">Chart (Time Series)</option>
                      <option value="clock">Clock (Time/Date)</option>
                      <option value="iframe">Iframe (External Site)</option>
                      <option value="list">List (Data Table)</option>
                      <option value="progress">Progress</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Grid Size</label>
                    <select
                      value={config.size || "sm"}
                      onChange={(e) => updateConfig({ size: e.target.value as WidgetSize })}
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="sm">Small (1x1)</option>
                      <option value="md">Medium (2x1)</option>
                      <option value="lg">Large (2x2)</option>
                      <option value="xl">Extra Large (3x2)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Type-Specific Config */}
              {config.type === 'stat' && (
                <CollapsibleSection title="Stat Configuration" defaultOpen={true}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Prefix</label>
                      <input
                        type="text"
                        value={(config.config as any)?.prefix || ""}
                        onChange={(e) => updateNestedConfig({ prefix: e.target.value })}
                        placeholder="$"
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Suffix</label>
                      <input
                        type="text"
                        value={(config.config as any)?.suffix || ""}
                        onChange={(e) => updateNestedConfig({ suffix: e.target.value })}
                        placeholder="%"
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(config.config as any)?.abbreviate || false}
                      onChange={(e) => updateNestedConfig({ abbreviate: e.target.checked })}
                      className="rounded border-border bg-background text-primary"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">Abbreviate Values (e.g. 1.2k)</span>
                  </label>
                </CollapsibleSection>
              )}

              {config.type === 'chart' && (
                <CollapsibleSection title="Chart Configuration" defaultOpen={true}>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Chart Type</label>
                      <select
                        value={(config.config as any)?.chart || "line"}
                        onChange={(e) => updateNestedConfig({ chart: e.target.value })}
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs"
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="area">Area Chart</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">X-Axis Key</label>
                        <input
                          type="text"
                          value={(config.config as any)?.xKey || ""}
                          onChange={(e) => updateNestedConfig({ xKey: e.target.value })}
                          placeholder="timestamp"
                          className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Y-Axis Key</label>
                        <input
                          type="text"
                          value={(config.config as any)?.yKey || ""}
                          onChange={(e) => updateNestedConfig({ yKey: e.target.value })}
                          placeholder="value"
                          className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {config.type === 'clock' && (
                <CollapsibleSection title="Clock Configuration" defaultOpen={true}>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Display Style</label>
                      <select
                        value={(config.config as any)?.displayType || "digital"}
                        onChange={(e) => updateNestedConfig({ displayType: e.target.value })}
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs"
                      >
                        <option value="digital">Digital</option>
                        <option value="analog">Analog</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Timezone</label>
                      <input
                        type="text"
                        value={(config.config as any)?.timezone || ""}
                        onChange={(e) => updateNestedConfig({ timezone: e.target.value })}
                        placeholder="Asia/Singapore"
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {config.type === 'iframe' && (
                <CollapsibleSection title="Iframe Configuration" defaultOpen={true}>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Source URL</label>
                    <input
                      type="text"
                      value={(config.config as any)?.iframeUrl || ""}
                      onChange={(e) => updateNestedConfig({ iframeUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </CollapsibleSection>
              )}

              <CollapsibleSection title="Data Fetching" defaultOpen={!!config.api}>
                <div className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleTestApi}
                      disabled={!config.api || isTesting}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/10 shadow-sm disabled:opacity-50"
                    >
                      <Play size={10} fill="currentColor" />
                      Test API
                    </button>
                    <button
                      onClick={() => setShowCurlModal(true)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest transition-all border border-primary/10 shadow-sm"
                    >
                      <Terminal size={12} />
                      Import cURL
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">API Endpoint</label>
                    <input
                      type="text"
                      value={config.api || ""}
                      onChange={(e) => updateConfig({ api: e.target.value })}
                      placeholder="https://api.example.com/data"
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Method</label>
                      <select
                        value={config.method || "GET"}
                        onChange={(e) => updateConfig({ method: e.target.value as any })}
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Refresh (ms)</label>
                      <input
                        type="number"
                        value={config.refreshInterval || ""}
                        onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) || undefined })}
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {config.method === 'POST' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Request Body (JSON)</label>
                      <textarea
                        value={typeof config.body === 'object' ? JSON.stringify(config.body, null, 2) : config.body || ""}
                        onChange={(e) => {
                          try {
                            const val = JSON.parse(e.target.value);
                            updateConfig({ body: val });
                          } catch {
                            updateConfig({ body: e.target.value });
                          }
                        }}
                        placeholder='{ "key": "value" }'
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-[10px] font-mono min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Response Path</label>
                    <input
                      type="text"
                      value={config.responsePath || ""}
                      onChange={(e) => updateConfig({ responsePath: e.target.value })}
                      placeholder="data.count"
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Transformer (JS)</label>
                    <input
                      type="text"
                      value={config.transformer || ""}
                      onChange={(e) => updateConfig({ transformer: e.target.value })}
                      placeholder="(v) => v * 10"
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  {/* Test API Terminal Logs */}
                  {(testLogs.length > 0 || isTesting) && (
                    <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", isTesting ? "bg-green-500 animate-pulse" : "bg-muted/40")} />
                            Diagnostic Logs
                         </label>
                         {(testLogs.length > 0 && !isTesting) && (
                           <button 
                             onClick={() => { setTestLogs([]); setTestResponse(null); }}
                             className="text-[9px] font-bold uppercase tracking-tighter text-muted hover:text-foreground transition-colors"
                           >
                              Clear
                           </button>
                         )}
                      </div>
                      <div 
                        ref={terminalRef}
                        className="w-full bg-[#0a0a0b] border border-white/5 rounded-lg p-3 font-mono text-[10px] min-h-[100px] max-h-[180px] overflow-y-auto custom-scrollbar shadow-2xl relative"
                      >
                        <div className="space-y-1">
                          {testLogs.map((log, i) => (
                            <div key={i} className={cn(
                              "flex gap-2 leading-relaxed break-all",
                              log.type === 'error' ? "text-red-400" : 
                              log.type === 'success' ? "text-green-400" : 
                              log.type === 'warn' ? "text-amber-400" : "text-zinc-400"
                            )}>
                              <span className="opacity-30 shrink-0">[{i+1}]</span>
                              <span>{log.msg}</span>
                            </div>
                          ))}
                          {isTesting && (
                            <div className="flex gap-2 text-primary animate-pulse">
                               <span className="opacity-30 shrink-0">[_]</span>
                               <span className="flex items-center gap-2">
                                 Running...
                                 <RefreshCcw size={10} className="animate-spin" />
                               </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {testResponse && !isTesting && (
                         <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Response Preview</label>
                            <div className="bg-[#0a0a0b]/40 border border-white/5 rounded-lg p-3 overflow-x-auto custom-scrollbar">
                               <pre className="text-[9px] font-mono text-zinc-300 leading-relaxed">
                                  {JSON.stringify(testResponse, null, 2)}
                               </pre>
                            </div>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="HTTP Headers" defaultOpen={Object.keys(config.headers || {}).length > 0}>
                <div className="space-y-2">
                  {Object.entries(config.headers || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-2 group/header">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newHeaders = { ...config.headers };
                          delete newHeaders[key];
                          if (e.target.value) newHeaders[e.target.value] = value;
                          updateConfig({ headers: newHeaders });
                        }}
                        placeholder="Header"
                        className="flex-1 bg-background border border-border rounded-[4px] px-2 py-1.5 text-[10px] font-mono"
                      />
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => {
                          const newHeaders = { ...config.headers, [key]: e.target.value };
                          updateConfig({ headers: newHeaders });
                        }}
                        placeholder="Value"
                        className="flex-1 bg-background border border-border rounded-[4px] px-2 py-1.5 text-[10px] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newHeaders = { ...config.headers };
                          delete newHeaders[key];
                          updateConfig({ headers: newHeaders });
                        }}
                        className="p-1.5 text-muted hover:text-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateConfig({ headers: { ...(config.headers || {}), "": "" } })}
                    className="text-[10px] font-bold uppercase tracking-wider text-primary/80 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Plus size={10} /> Add Header
                  </button>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Visual Rules" defaultOpen={!!config.colorRules}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'aboveZero', label: 'Above 0' },
                      { key: 'belowZero', label: 'Below 0' },
                      { key: 'atZero', label: 'At 0' },
                    ].map((rule) => (
                      <div key={rule.key} className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted/60">{rule.label}</label>
                        <select
                          value={config.colorRules?.[rule.key] || ""}
                          onChange={(e) => updateConfig({ colorRules: { ...(config.colorRules || {}), [rule.key]: e.target.value } })}
                          className="w-full bg-background border border-border rounded px-1 py-1 text-[9px]"
                        >
                          <option value="">Def</option>
                          <option value="up">Up</option>
                          <option value="down">Down</option>
                          <option value="warning">Warn</option>
                          <option value="info">Info</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Advanced Rules</label>
                    {(config.colorRules?.rules || []).map((rule: any, idx: number) => (
                      <div key={idx} className="flex gap-1 items-center">
                        <select
                          value={rule.condition}
                          onChange={(e) => {
                            const rules = [...(config.colorRules?.rules || [])];
                            rules[idx] = { ...rule, condition: e.target.value };
                            updateConfig({ colorRules: { ...config.colorRules, rules } });
                          }}
                          className="bg-background border border-border rounded px-1 py-1 text-[9px] flex-1"
                        >
                          <option value="above">Above</option>
                          <option value="below">Below</option>
                          <option value="at">At</option>
                        </select>
                        <input
                          type="number"
                          value={rule.value}
                          onChange={(e) => {
                            const rules = [...(config.colorRules?.rules || [])];
                            rules[idx] = { ...rule, value: parseFloat(e.target.value) || 0 };
                            updateConfig({ colorRules: { ...config.colorRules, rules } });
                          }}
                          className="w-12 bg-background border border-border rounded px-1 py-1 text-[9px] font-mono"
                        />
                        <select
                          value={rule.color}
                          onChange={(e) => {
                            const rules = [...(config.colorRules?.rules || [])];
                            rules[idx] = { ...rule, color: e.target.value };
                            updateConfig({ colorRules: { ...config.colorRules, rules } });
                          }}
                          className="bg-background border border-border rounded px-1 py-1 text-[9px] flex-1"
                        >
                          <option value="up">Up</option>
                          <option value="down">Down</option>
                          <option value="warning">Warn</option>
                        </select>
                        <button onClick={() => {
                          const rules = config.colorRules.rules.filter((_: any, i: number) => i !== idx);
                          updateConfig({ colorRules: { ...config.colorRules, rules } });
                        }} className="text-muted hover:text-red-500"><X size={10} /></button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateConfig({ colorRules: { ...(config.colorRules || {}), rules: [...(config.colorRules?.rules || []), { condition: "above", value: 0, color: "up" }] } })}
                      className="w-full py-1 border border-dashed border-border/50 rounded text-[9px] font-bold uppercase text-muted hover:text-foreground transition-all"
                    >
                      + Add Rule
                    </button>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Signals (Alerting)" defaultOpen={(config.signals?.length || 0) > 0}>
                 <div className="space-y-4">
                  {(config.signals || []).map((signal: any, idx: number) => (
                    <div key={idx} className="p-3 bg-foreground/5 rounded-lg border border-border/20 space-y-3 relative group/sig">
                      <button onClick={() => {
                        const signals = config.signals.filter((_: any, i: number) => i !== idx);
                        updateConfig({ signals });
                      }} className="absolute top-2 right-2 text-muted opacity-0 group-hover/sig:opacity-100 hover:text-red-500 transition-all"><X size={14} /></button>
                      
                      <div className="flex items-center gap-2">
                         <input
                          type="checkbox"
                          checked={signal.enabled}
                          onChange={(e) => {
                            const signals = [...config.signals];
                            signals[idx] = { ...signal, enabled: e.target.checked };
                            updateConfig({ signals });
                          }}
                          className="rounded border-border bg-background text-primary"
                        />
                        <input
                          type="text"
                          value={signal.label}
                          onChange={(e) => {
                            const signals = [...config.signals];
                            signals[idx] = { ...signal, label: e.target.value };
                            updateConfig({ signals });
                          }}
                          placeholder="Signal Label"
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-muted/60">Condition</label>
                          <select
                            value={signal.condition}
                            onChange={(e) => {
                              const signals = [...config.signals];
                              signals[idx] = { ...signal, condition: e.target.value };
                              updateConfig({ signals });
                            }}
                            className="w-full bg-background border border-border rounded px-1 py-1 text-[9px]"
                          >
                            <option value="above">Above</option>
                            <option value="below">Below</option>
                            <option value="equals">Equals</option>
                            <option value="diff">Diff (Abs Change)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-muted/60">Threshold</label>
                          <input
                            type="number"
                            value={signal.threshold}
                            onChange={(e) => {
                              const signals = [...config.signals];
                              signals[idx] = { ...signal, threshold: parseFloat(e.target.value) || 0 };
                              updateConfig({ signals });
                            }}
                            className="w-full bg-background border border-border rounded px-1 py-1 text-[9px] font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[8px] font-black uppercase text-muted/60">Actions</label>
                        <div className="flex flex-wrap gap-2">
                          {['pulse', 'notify', 'sound', 'notify-in-app', 'webhook'].map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => {
                                const actions = signal.action || [];
                                const newActions = actions.includes(action)
                                  ? actions.filter((a: string) => a !== action)
                                  : [...actions, action];
                                const signals = [...config.signals];
                                signals[idx] = { ...signal, action: newActions };
                                updateConfig({ signals });
                              }}
                              className={cn(
                                "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tight transition-all",
                                (signal.action || []).includes(action)
                                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                  : "bg-muted/10 text-muted hover:bg-muted/20"
                              )}
                            >
                              {action.replace(/-/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(signal.action || []).includes('webhook') && (
                        <div className="space-y-3 p-3 bg-primary/5 rounded border border-primary/10 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-primary/60">Webhook URL</label>
                              <input
                                type="text"
                                value={signal.webhook?.url || ""}
                                onChange={(e) => {
                                  const signals = [...config.signals];
                                  signals[idx] = { ...signal, webhook: { ...(signal.webhook || { method: 'POST' }), url: e.target.value } };
                                  updateConfig({ signals });
                                }}
                                placeholder="https://..."
                                className="w-full bg-background border border-primary/20 rounded-[4px] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-primary/60">Method</label>
                              <select
                                value={signal.webhook?.method || "POST"}
                                onChange={(e) => {
                                  const signals = [...config.signals];
                                  signals[idx] = { ...signal, webhook: { ...(signal.webhook || { url: '' }), method: e.target.value } };
                                  updateConfig({ signals });
                                }}
                                className="w-full bg-background border border-primary/20 rounded-[4px] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                              >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-[8px] font-black uppercase text-primary/60">
                              Headers (JSON)
                            </label>
                            <textarea
                              value={typeof signal.webhook?.headers === 'string' ? signal.webhook.headers : (signal.webhook?.headers ? JSON.stringify(signal.webhook.headers, null, 2) : "")}
                              onChange={(e) => {
                                const val = e.target.value;
                                let updatedHeaders: any = val;
                                try {
                                  updatedHeaders = val ? JSON.parse(val) : undefined;
                                } catch { /* keep as string */ }
                                const signals = [...config.signals];
                                signals[idx] = { ...signal, webhook: { ...(signal.webhook || { url: '', method: 'POST' }), headers: updatedHeaders } };
                                updateConfig({ signals });
                              }}
                              placeholder='{ "Authorization": "BearerToken" }'
                              className="w-full bg-background border border-primary/20 rounded-[4px] px-2 py-1 text-[9px] focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono min-h-[50px]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-[8px] font-black uppercase text-primary/60">
                              Body (JSON)
                            </label>
                            <textarea
                              value={signal.webhook?.body || ""}
                              onChange={(e) => {
                                const signals = [...config.signals];
                                signals[idx] = { ...signal, webhook: { ...(signal.webhook || { url: '', method: 'POST' }), body: e.target.value } };
                                updateConfig({ signals });
                              }}
                              placeholder='{ "value": "{{value}}", "msg": "{{label}} triggered" }'
                              className="w-full bg-background border border-primary/20 rounded-[4px] px-2 py-1 text-[9px] focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono min-h-[50px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => updateConfig({ 
                      signals: [
                        ...(config.signals || []), 
                        { 
                          id: `sig-${Math.floor(Math.random() * 10000)}`,
                          label: "Alert", 
                          condition: "above", 
                          threshold: 0, 
                          enabled: true,
                          action: ["pulse", "notify"] 
                        }
                      ] 
                    })}
                    className="w-full py-2 border border-dashed border-border/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-border transition-all bg-foreground/[0.02]"
                  >
                    + Add Alert Signal
                  </button>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Visual Appearance">
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Accent Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.accentColor || "#000000"}
                          onChange={(e) => updateConfig({ accentColor: e.target.value })}
                          className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer rounded overflow-hidden shrink-0"
                        />
                        <input
                          type="text"
                          value={config.accentColor || ""}
                          onChange={(e) => updateConfig({ accentColor: e.target.value })}
                          className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Theme Color</label>
                      <select
                        value={config.color || ""}
                        onChange={(e) => updateConfig({ color: e.target.value as any })}
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs"
                      >
                        <option value="">Default</option>
                        <option value="up">System Up</option>
                        <option value="down">System Down</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Source Name</label>
                      <input
                        type="text"
                        value={config.source || ""}
                        onChange={(e) => updateConfig({ source: e.target.value })}
                        placeholder="GitHub, AWS, etc."
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Source URL</label>
                      <input
                        type="text"
                        value={config.sourceUrl || ""}
                        onChange={(e) => updateConfig({ sourceUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Description</label>
                    <textarea
                      value={config.description || ""}
                      onChange={(e) => updateConfig({ description: e.target.value })}
                      className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs min-h-[60px] resize-none"
                    />
                  </div>
                </div>
              </CollapsibleSection>

              <div className="p-4 rounded-lg bg-up/5 border border-up/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-up animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-up">Dynamic Persistence</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your changes are automatically synced to the URL. You can share this URL or bookmark it to save your widget design. No data is stored on our servers.
                </p>
              </div>
                  </>
                )}
            </div>
          </aside>
        )}

        {/* Right Pane - Preview & Embed */}
        <section className="flex-1 bg-background relative flex flex-col min-w-0">
          <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-2 text-muted whitespace-nowrap">
                    <Eye size={14} className="text-primary" /> Live Preview
                  </div>
                  <div className="h-3 w-px bg-border/40 shrink-0" />
                  <div className="text-foreground flex items-center gap-2 truncate">
                    <span className="text-muted/40">#</span>
                    <span className="truncate">{config.label || "Untitled Widget"}</span>
                  </div>
                </div>
                <Link 
                  href={iframeUrl} 
                  target="_blank"
                  className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open Standalone
                </Link>
              </div>

              <div className="flex-1 w-full max-w-6xl mx-auto max-h-[500px] lg:max-h-[700px] bg-neutral-900 rounded-xl border border-border/60 overflow-hidden shadow-2xl relative group mt-4">
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03] text-foreground transition-opacity duration-700 group-hover:opacity-[0.05]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-[150%] h-[150%] sm:w-[120%] sm:h-[120%] -rotate-12"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <iframe 
                  key={iframeUrl}
                  src={iframeUrl}
                  className="w-full h-full border-0 relative z-10"
                />
              </div>
            </div>

            <div className="space-y-4 shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Code size={14} className="text-primary" /> Embed Snippet
              </div>
              
              <div className="relative group/embed">
                <textarea
                  readOnly
                  value={embedCode}
                  className="w-full h-24 bg-panel border border-border/60 rounded-lg p-4 text-[11px] font-mono text-foreground/80 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  onClick={copyEmbed}
                  className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-foreground text-background px-4 py-2 rounded-md hover:scale-105 transition-transform active:scale-95 shadow-xl"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy Embed Code"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Curl Modal */}
      <AnimatePresence>
        {showCurlModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setShowCurlModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-panel border border-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Import cURL</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Paste command to extract config</p>
                  </div>
                </div>
                <button onClick={() => setShowCurlModal(false)} className="text-muted hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  autoFocus
                  value={curlInput}
                  onChange={(e) => setCurlInput(e.target.value)}
                  placeholder="curl 'https://api.example.com/data' ..."
                  className="w-full h-40 bg-background border border-border rounded-lg p-4 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none custom-scrollbar"
                />
                <button
                  onClick={handleImportCurl}
                  disabled={!curlInput.trim()}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Import Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background animate-pulse" />}>
      <PlaygroundContent />
    </Suspense>
  );
}
