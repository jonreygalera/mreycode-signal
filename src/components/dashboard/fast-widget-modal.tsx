"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Save, Hash, Terminal, BookOpen, ChevronRight, ChevronDown, Copy, Check, Search, Type, Layout, Code } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { cn } from "@/lib/utils";
import { TEMPLATES, WidgetTemplate } from "@/config/templates";

import { FLAT_CONFIG_DOCS } from "@/config/docs";

const CONFIG_DOCS = FLAT_CONFIG_DOCS;
const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (e) {
    return [BROWSER_TIMEZONE, "UTC"];
  }
})();

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
      if (key === 'isTemp') return; // Exclude isTemp as requested
      const value = cleanWidgetConfig(obj[key], key === 'headers');
      // Special case: allow empty strings if they are direct children of 'headers' (to allow typing)
      const allowEmpty = isHeaderValue;
      if (value !== null && value !== undefined && (allowEmpty || value !== "") && (typeof value !== 'object' || Object.keys(value).length > 0)) {
        cleaned[key] = value;
      }
    });
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return obj;
}



interface FastWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfig, afterId: string | null) => void;
  existingWidgets: WidgetConfig[];
  initialConfig?: { config: WidgetConfig; afterId: string | null };
}

export function FastWidgetModal({ isOpen, onClose, onSave, existingWidgets, initialConfig }: FastWidgetModalProps) {
  const [afterId, setAfterId] = useState<string | null>(initialConfig?.afterId || null);
  const [configText, setConfigText] = useState(initialConfig ? JSON.stringify(initialConfig.config, null, 2) : "");
  const [error, setError] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplateLabel, setSelectedTemplateLabel] = useState<string | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'form'>(initialConfig ? 'form' : 'form'); // Default to form for better UX
  const [parsedConfig, setParsedConfig] = useState<any>(initialConfig ? initialConfig.config : {});
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  // Attempt to sync parsedConfig when configText changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(configText);
      if (typeof parsed === 'object' && parsed !== null) {
        setParsedConfig(parsed);
      }
    } catch (e) {
      // Ignore invalid JSON during typing
    }
  }, [configText]);

  // Update configText when parsedConfig changes (from form)
  const updateParsedConfig = (updates: any) => {
    const newConfig = cleanWidgetConfig({ ...parsedConfig, ...updates });
    setParsedConfig(newConfig || {});
    setConfigText(JSON.stringify(newConfig || {}, null, 2));
  };

  const updateNestedConfig = (updates: any) => {
    const currentNested = parsedConfig.config || {};
    const newNested = { ...currentNested, ...updates };
    updateParsedConfig({ config: newNested });
  };

  // Sync state if initialConfig changes (when modal opens for a different widget)
  useEffect(() => {
    if (initialConfig) {
      setAfterId(initialConfig.afterId);
      setConfigText(JSON.stringify(initialConfig.config, null, 2));
    } else {
      setAfterId(null);
      const randomId = `widget-${Math.floor(1000 + Math.random() * 9000)}`;
      const defaultConfig = {
        id: randomId,
        label: `New Widget ${randomId.split('-')[1]}`,
        type: "stat",
        size: "sm"
      };
      setConfigText(JSON.stringify(defaultConfig, null, 2));
      setParsedConfig(defaultConfig);
      setSelectedTemplateLabel(null);
    }
  }, [initialConfig]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplatesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    try {
      const config = JSON.parse(configText);
      
      // Basic requirements
      if (!config.id || !config.type || !config.label) {
        setError("Invalid config: id, type, and label are required.");
        return;
      }

      // Unique ID validation
      const isRecordUpdate = initialConfig && initialConfig.config.id === config.id;
      const isIdTaken = existingWidgets.some(w => w.id === config.id);

      if (isIdTaken && !isRecordUpdate) {
        setError(`The ID "${config.id}" is already taken. Please use a unique identifier.`);
        return;
      }

      onSave(config, afterId);
      setConfigText("");
      setAfterId(null);
      setError(null);
      onClose();
    } catch (e) {
      setError("Invalid JSON format.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={cn(
              "relative bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] transition-all duration-300 w-full",
              showDocs ? "max-w-4xl" : "max-w-2xl"
            )}
          >
            <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 rounded-md text-foreground">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight uppercase">
                    {initialConfig ? "Edit Widget" : "Add Widget"}
                  </h2>
                  <p className="text-xs text-muted/70">
                    {initialConfig ? "Update existing widget configuration" : "Create a new custom widget in this workspace"}
                  </p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDocs(!showDocs)}
                    className={cn(
                      "p-2 rounded-full transition-all",
                      showDocs ? "bg-primary/10 text-primary" : "hover:bg-muted/10 text-muted hover:text-foreground"
                    )}
                    title="Documentation"
                  >
                    <BookOpen size={20} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-6 pb-2 space-y-6 shrink-0 bg-panel/50 backdrop-blur-sm z-10 border-b border-border/10">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted/70">
                    <Hash size={14} />
                    Insert After
                  </label>
                  <select
                    value={afterId || ""}
                    onChange={(e) => setAfterId(e.target.value || null)}
                    className="w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all appearance-none cursor-pointer text-foreground"
                  >
                    <option value="">(At the Beginning)</option>
                    {existingWidgets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                    <option value="end">(At the End)</option>
                  </select>
                </div>

                {!initialConfig && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                       Quick Template
                    </label>
                    <div className="relative" ref={templateDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                        className={cn(
                          "w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all flex items-center justify-between group",
                          isTemplatesOpen && "ring-1 ring-foreground/20 border-foreground/20"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-sm bg-foreground/5 text-foreground/70">
                            <Type size={12} />
                          </div>
                          <span className={cn(
                            "font-bold uppercase tracking-wider",
                            selectedTemplateLabel ? "text-foreground" : "text-muted"
                          )}>
                            {selectedTemplateLabel || "Select a base template..."}
                          </span>
                        </div>
                        <ChevronDown size={14} className={cn("text-muted transition-transform duration-300", isTemplatesOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isTemplatesOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col mt-1"
                          >
                            <div className="p-2 border-b border-border bg-background focus-within:bg-muted/10 transition-colors">
                              <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                  type="text"
                                  placeholder="Search widgets..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full bg-transparent border-none pl-8 pr-2 py-1.5 text-xs placeholder:text-muted/50 focus:outline-none focus:ring-0"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1.5 max-h-[260px] overflow-y-auto custom-scrollbar bg-background">
                              {TEMPLATES
                                .filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()) || t.config.type.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((template, i) => (
                                  <button
                                    key={`${template.config.id}-${i}`}
                                    type="button"
                                    onClick={() => {
                                      const newId = `${template.config.id}-${Date.now().toString().slice(-4)}`;
                                      const newConfig = { ...template.config, id: newId };
                                      setConfigText(JSON.stringify(newConfig, null, 2));
                                      setParsedConfig(newConfig);
                                      setSelectedTemplateLabel(template.label);
                                      setIsTemplatesOpen(false);
                                      setError(null);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between p-3 rounded-md border transition-all group shrink-0",
                                      selectedTemplateLabel === template.label
                                        ? "bg-foreground/5 border-foreground/10 shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-foreground/5 hover:border-border/10"
                                    )}
                                  >
                                    <div className="flex flex-col items-start gap-1 text-left">
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tight transition-colors",
                                        selectedTemplateLabel === template.label ? "text-foreground" : "text-muted group-hover:text-foreground"
                                      )}>
                                        {template.label}
                                      </span>
                                       <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest flex items-center gap-1">
                                         <Type size={8} /> {template.config.type}
                                       </span>
                                    </div>
                                    {selectedTemplateLabel === template.label && (
                                      <div className="p-0.5 rounded-sm bg-foreground text-background">
                                        <Check size={10} />
                                      </div>
                                    )}
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 p-1 bg-foreground/5 rounded-lg border border-border/50">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      activeTab === 'form' 
                        ? "bg-background text-primary shadow-sm border border-border/50" 
                        : "text-muted hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Layout size={12} />
                    Form View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('json')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                      activeTab === 'json' 
                        ? "bg-background text-primary shadow-sm border border-border/50" 
                        : "text-muted hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Code size={12} />
                    JSON Editor
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 custom-scrollbar">
                {error && <p className="text-xs text-red-500 font-medium mb-4">{error}</p>}

                {activeTab === 'form' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 flex items-center gap-1">
                          Widget ID
                          <span className="text-red-500 font-black text-xs">*</span>
                        </label>
                        <input
                          type="text"
                          value={parsedConfig.id || ""}
                          onChange={(e) => updateParsedConfig({ id: e.target.value })}
                          placeholder="unique-id"
                          className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 flex items-center gap-1">
                          Display Label
                          <span className="text-red-500 font-black text-xs">*</span>
                        </label>
                        <input
                          type="text"
                          value={parsedConfig.label || ""}
                          onChange={(e) => updateParsedConfig({ label: e.target.value })}
                          placeholder="My Awesome Widget"
                          className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 flex items-center gap-1">
                          Widget Type
                          <span className="text-red-500 font-black text-xs">*</span>
                        </label>
                        <select
                          value={parsedConfig.type || ""}
                          onChange={(e) => updateParsedConfig({ type: e.target.value })}
                          className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                        >
                          <option value="">Select Type</option>
                          <option value="stat">Stat (Single Value)</option>
                          <option value="chart">Chart (Time Series)</option>
                          <option value="clock">Clock (Time/Date)</option>
                          <option value="iframe">Iframe (External Site)</option>
                          <option value="list">List (Data Table)</option>
                          <option value="progress">Progress (Target tracking)</option>
                          <option value="label">Label (Text/Header)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Grid Size</label>
                        <select
                          value={parsedConfig.size || "sm"}
                          onChange={(e) => updateParsedConfig({ size: e.target.value })}
                          className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                        >
                          <option value="sm">Small (1x1)</option>
                          <option value="md">Medium (2x1)</option>
                          <option value="lg">Large (2x2)</option>
                          <option value="xl">Extra Large (3x2)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <CollapsibleSection title="Data Fetching" defaultOpen={!!parsedConfig.api}>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">API Endpoint (URL)</label>
                            <input
                              type="text"
                              value={parsedConfig.api || ""}
                              onChange={(e) => updateParsedConfig({ api: e.target.value })}
                              placeholder="https://api.example.com/data"
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Method</label>
                            <select
                              value={parsedConfig.method || "GET"}
                              onChange={(e) => updateParsedConfig({ method: e.target.value })}
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Response Path</label>
                            <input
                              type="text"
                              value={parsedConfig.responsePath || ""}
                              onChange={(e) => updateParsedConfig({ responsePath: e.target.value })}
                              placeholder="data.value"
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Refresh Interval (ms)</label>
                            <input
                              type="number"
                              value={parsedConfig.refreshInterval || ""}
                              onChange={(e) => updateParsedConfig({ refreshInterval: parseInt(e.target.value) || undefined })}
                              placeholder="60000"
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Transformer (Function)</label>
                          <input
                            type="text"
                            value={parsedConfig.transformer || ""}
                            onChange={(e) => updateParsedConfig({ transformer: e.target.value })}
                            placeholder="data => data.val * 10"
                            className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">HTTP Headers</label>
                          <div className="space-y-2">
                            {Object.entries(parsedConfig.headers || {}).map(([key, value], idx) => (
                              <div key={idx} className="flex gap-2 group/header">
                                <input
                                  type="text"
                                  value={key}
                                  onChange={(e) => {
                                    const newHeaders = { ...parsedConfig.headers };
                                    delete newHeaders[key];
                                    if (e.target.value) newHeaders[e.target.value] = value;
                                    updateParsedConfig({ headers: newHeaders });
                                  }}
                                  placeholder="Header Name"
                                  className="flex-1 bg-background border border-border rounded-[4px] px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                                />
                                <input
                                  type="text"
                                  value={value as string}
                                  onChange={(e) => {
                                    const newHeaders = { ...parsedConfig.headers, [key]: e.target.value };
                                    updateParsedConfig({ headers: newHeaders });
                                  }}
                                  placeholder="Value"
                                  className="flex-1 bg-background border border-border rounded-[4px] px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newHeaders = { ...parsedConfig.headers };
                                    delete newHeaders[key];
                                    updateParsedConfig({ headers: newHeaders });
                                  }}
                                  className="p-1.5 text-muted hover:text-red-500 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                updateParsedConfig({ headers: { ...(parsedConfig.headers || {}), "": "" } });
                              }}
                              className="text-[10px] font-bold uppercase tracking-wider text-primary/80 hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <Plus size={10} /> Add Header
                            </button>
                          </div>
                        </div>

                        {parsedConfig.method === 'POST' && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Request Body (JSON)</label>
                            <textarea
                              value={typeof parsedConfig.body === 'object' ? JSON.stringify(parsedConfig.body, null, 2) : parsedConfig.body || ""}
                              onChange={(e) => {
                                try {
                                  const val = JSON.parse(e.target.value);
                                  updateParsedConfig({ body: val });
                                } catch {
                                  updateParsedConfig({ body: e.target.value });
                                }
                              }}
                              placeholder='{ "key": "value" }'
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono min-h-[80px]"
                            />
                          </div>
                        )}
                      </CollapsibleSection>

                      <CollapsibleSection title="Metadata & Visuals">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Description</label>
                          <textarea
                            value={parsedConfig.description || ""}
                            onChange={(e) => updateParsedConfig({ description: e.target.value })}
                            placeholder="A brief description of this widget..."
                            className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all min-h-[60px] resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Source Name</label>
                            <input
                              type="text"
                              value={parsedConfig.source || ""}
                              onChange={(e) => updateParsedConfig({ source: e.target.value })}
                              placeholder="GitHub, AWS, etc."
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Source URL</label>
                            <input
                              type="text"
                              value={parsedConfig.sourceUrl || ""}
                              onChange={(e) => updateParsedConfig({ sourceUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Accent Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={parsedConfig.accentColor || "#000000"}
                                onChange={(e) => updateParsedConfig({ accentColor: e.target.value })}
                                className="w-9 h-9 p-0 border-0 bg-transparent cursor-pointer rounded overflow-hidden"
                              />
                              <input
                                type="text"
                                value={parsedConfig.accentColor || ""}
                                onChange={(e) => updateParsedConfig({ accentColor: e.target.value })}
                                placeholder="#00ff00"
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Theme Color</label>
                            <select
                              value={parsedConfig.color || ""}
                              onChange={(e) => updateParsedConfig({ color: e.target.value })}
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                            >
                              <option value="">Default</option>
                              <option value="up">System Up (Green)</option>
                              <option value="down">System Down (Red)</option>
                              <option value="warning">Warning (Orange)</option>
                              <option value="info">Info (Blue)</option>
                              <option value="muted">Muted (Gray)</option>
                            </select>
                          </div>
                        </div>
                      </CollapsibleSection>
                      <CollapsibleSection title="Visual Rules">
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { key: 'aboveZero', label: 'Above 0' },
                            { key: 'belowZero', label: 'Below 0' },
                            { key: 'atZero', label: 'At 0' },
                          ].map((rule) => (
                            <div key={rule.key} className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">{rule.label}</label>
                              <select
                                value={parsedConfig.colorRules?.[rule.key] || ""}
                                onChange={(e) => {
                                  const newColorRules = { ...(parsedConfig.colorRules || {}), [rule.key]: e.target.value };
                                  updateParsedConfig({ colorRules: newColorRules });
                                }}
                                className="w-full bg-background border border-border rounded-[4px] px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                              >
                                <option value="">Default</option>
                                <option value="up">Up</option>
                                <option value="down">Down</option>
                                <option value="warning">Warning</option>
                                <option value="info">Info</option>
                                <option value="muted">Muted</option>
                              </select>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Advanced Coloring Rules</label>
                          {(parsedConfig.colorRules?.rules || []).map((rule: any, idx: number) => (
                            <div key={idx} className="p-3 bg-foreground/[0.03] border border-border/20 rounded-md relative group/rule">
                              <button
                                type="button"
                                onClick={() => {
                                  const newRules = [...parsedConfig.colorRules.rules];
                                  newRules.splice(idx, 1);
                                  updateParsedConfig({ colorRules: { ...parsedConfig.colorRules, rules: newRules } });
                                }}
                                className="absolute top-2 right-2 p-1 text-muted hover:text-red-500 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  value={rule.condition || "above"}
                                  onChange={(e) => {
                                    const newRules = [...parsedConfig.colorRules.rules];
                                    newRules[idx] = { ...rule, condition: e.target.value };
                                    updateParsedConfig({ colorRules: { ...parsedConfig.colorRules, rules: newRules } });
                                  }}
                                  className="bg-background border border-border rounded px-2 py-1 text-xs"
                                >
                                  <option value="above">Above</option>
                                  <option value="below">Below</option>
                                  <option value="at">At</option>
                                </select>
                                <input
                                  type="number"
                                  value={rule.value || 0}
                                  onChange={(e) => {
                                    const newRules = [...parsedConfig.colorRules.rules];
                                    newRules[idx] = { ...rule, value: parseFloat(e.target.value) || 0 };
                                    updateParsedConfig({ colorRules: { ...parsedConfig.colorRules, rules: newRules } });
                                  }}
                                  className="bg-background border border-border rounded px-2 py-1 text-xs font-mono"
                                />
                                <select
                                  value={rule.color || "muted"}
                                  onChange={(e) => {
                                    const newRules = [...parsedConfig.colorRules.rules];
                                    newRules[idx] = { ...rule, color: e.target.value };
                                    updateParsedConfig({ colorRules: { ...parsedConfig.colorRules, rules: newRules } });
                                  }}
                                  className="bg-background border border-border rounded px-2 py-1 text-xs"
                                >
                                  <option value="up">Up</option>
                                  <option value="down">Down</option>
                                  <option value="warning">Warning</option>
                                  <option value="info">Info</option>
                                  <option value="muted">Muted</option>
                                </select>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newRule = { condition: "above", value: 0, color: "up" };
                              const currentRules = parsedConfig.colorRules?.rules || [];
                              updateParsedConfig({ colorRules: { ...(parsedConfig.colorRules || {}), rules: [...currentRules, newRule] } });
                            }}
                            className="w-full py-1.5 border border-dashed border-border/50 rounded-md text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all flex items-center justify-center gap-1"
                          >
                            <Plus size={10} /> Add Rule
                          </button>
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection title="Signals (Alerting)">
                        <div className="space-y-3">
                          {(parsedConfig.signals || []).map((signal: any, index: number) => (
                            <div key={index} className="p-3 bg-foreground/[0.03] border border-border/20 rounded-md relative group/signal">
                              <button
                                type="button"
                                onClick={() => {
                                  const newSignals = [...parsedConfig.signals];
                                  newSignals.splice(index, 1);
                                  updateParsedConfig({ signals: newSignals });
                                }}
                                className="absolute top-2 right-2 p-1 text-muted hover:text-red-500 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-muted/60">Signal Label</label>
                                  <input
                                    type="text"
                                    value={signal.label || ""}
                                    onChange={(e) => {
                                      const newSignals = [...parsedConfig.signals];
                                      newSignals[index] = { ...signal, label: e.target.value };
                                      updateParsedConfig({ signals: newSignals });
                                    }}
                                    className="w-full bg-background border border-border rounded-[4px] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-muted/60">Condition</label>
                                  <select
                                    value={signal.condition || "above"}
                                    onChange={(e) => {
                                      const newSignals = [...parsedConfig.signals];
                                      newSignals[index] = { ...signal, condition: e.target.value };
                                      updateParsedConfig({ signals: newSignals });
                                    }}
                                    className="w-full bg-background border border-border rounded-[4px] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                                  >
                                    <option value="above">Above</option>
                                    <option value="below">Below</option>
                                    <option value="equals">Equals</option>
                                    <option value="diff">Difference</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-muted/60">Threshold</label>
                                  <input
                                    type="number"
                                    value={signal.threshold || 0}
                                    onChange={(e) => {
                                      const newSignals = [...parsedConfig.signals];
                                      newSignals[index] = { ...signal, threshold: parseFloat(e.target.value) || 0 };
                                      updateParsedConfig({ signals: newSignals });
                                    }}
                                    className="w-full bg-background border border-border rounded-[4px] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-muted/60">Duration (sec)</label>
                                  <input
                                    type="number"
                                    value={signal.duration || 10}
                                    onChange={(e) => {
                                      const newSignals = [...parsedConfig.signals];
                                      newSignals[index] = { ...signal, duration: parseInt(e.target.value) || 10 };
                                      updateParsedConfig({ signals: newSignals });
                                    }}
                                    className="w-full bg-background border border-border rounded-[4px] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1.5 mb-3">
                                <label className="text-[8px] font-black uppercase tracking-widest text-muted/60">Actions</label>
                                <div className="flex flex-wrap gap-2">
                                  {['notify', 'pulse', 'sound', 'notify-in-app'].map((action) => (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={() => {
                                        const actions = signal.action || [];
                                        const newActions = actions.includes(action)
                                          ? actions.filter((a: string) => a !== action)
                                          : [...actions, action];
                                        const newSignals = [...parsedConfig.signals];
                                        newSignals[index] = { ...signal, action: newActions };
                                        updateParsedConfig({ signals: newSignals });
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

                              <div className="space-y-1">
                                <label className="flex items-center gap-2 cursor-pointer pt-1">
                                  <input
                                    type="checkbox"
                                    checked={signal.enabled}
                                    onChange={(e) => {
                                      const newSignals = [...parsedConfig.signals];
                                      newSignals[index] = { ...signal, enabled: e.target.checked };
                                      updateParsedConfig({ signals: newSignals });
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="w-7 h-4 bg-muted/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary relative"></div>
                                  <span className="text-[10px] font-bold text-muted peer-checked:text-foreground">Enabled</span>
                                </label>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newSignal = {
                                id: `sig-${Date.now()}`,
                                label: "New Signal",
                                condition: "above",
                                threshold: 0,
                                action: ["notify"],
                                enabled: true
                              };
                              updateParsedConfig({ signals: [...(parsedConfig.signals || []), newSignal] });
                            }}
                            className="w-full py-2 border border-dashed border-border/50 rounded-md text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:bg-foreground/[0.02] transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={12} />
                            Add Signal
                          </button>
                        </div>
                      </CollapsibleSection>
                    </div>

                    {/* Specific Config based on type */}
                    <div className="pt-2 border-t border-border/30">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Widget Configuration</h3>
                      {parsedConfig.type === 'pulse' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Pulse Speed</label>
                              <select
                                value={parsedConfig.config?.pulseSpeed || "normal"}
                                onChange={(e) => updateNestedConfig({ pulseSpeed: e.target.value })}
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                              >
                                <option value="slow">Slow</option>
                                <option value="normal">Normal</option>
                                <option value="fast">Fast</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Value Label</label>
                              <input
                                type="text"
                                value={parsedConfig.config?.valueLabel || ""}
                                onChange={(e) => updateNestedConfig({ valueLabel: e.target.value })}
                                placeholder="Score"
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {parsedConfig.type === 'stat' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-left-2 duration-300">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Prefix</label>
                            <input
                              type="text"
                              value={parsedConfig.config?.prefix || ""}
                              onChange={(e) => updateNestedConfig({ prefix: e.target.value })}
                              placeholder="$"
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Suffix</label>
                            <input
                              type="text"
                              value={parsedConfig.config?.suffix || ""}
                              onChange={(e) => updateNestedConfig({ suffix: e.target.value })}
                              placeholder="%"
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                            />
                          </div>
                        </div>
                      )}

                      {parsedConfig.type === 'chart' && (
                        <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Chart Style</label>
                              <select
                                value={parsedConfig.config?.chart || "line"}
                                onChange={(e) => updateNestedConfig({ chart: e.target.value })}
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                              >
                                <option value="line">Line Chart</option>
                                <option value="bar">Bar Chart</option>
                                <option value="area">Area Chart</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">X-Axis Key</label>
                              <input
                                type="text"
                                value={parsedConfig.config?.xKey || ""}
                                onChange={(e) => updateNestedConfig({ xKey: e.target.value })}
                                placeholder="timestamp"
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Y-Axis Key</label>
                              <input
                                type="text"
                                value={parsedConfig.config?.yKey || ""}
                                onChange={(e) => updateNestedConfig({ yKey: e.target.value })}
                                placeholder="value"
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Suffix</label>
                              <input
                                type="text"
                                value={parsedConfig.config?.suffix || ""}
                                onChange={(e) => updateNestedConfig({ suffix: e.target.value })}
                                placeholder=" units"
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {parsedConfig.type === 'clock' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-left-2 duration-300">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Display Style</label>
                            <select
                              value={parsedConfig.config?.displayType || "digital"}
                              onChange={(e) => updateNestedConfig({ displayType: e.target.value })}
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                            >
                              <option value="digital">Digital</option>
                              <option value="analog">Analog</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Timezone</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={parsedConfig.config?.timezone || ""}
                                onChange={(e) => updateNestedConfig({ timezone: e.target.value })}
                                placeholder={BROWSER_TIMEZONE}
                                list="timezone-options"
                                className="w-full bg-background border border-border rounded-[4px] px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                              />
                              {(parsedConfig.config?.timezone) && (
                                <button
                                  type="button"
                                  onClick={() => updateNestedConfig({ timezone: "" })}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                            <datalist id="timezone-options">
                              {TIMEZONES.map((tz) => (
                                <option key={tz} value={tz} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      )}

                      {parsedConfig.type === 'iframe' && (
                        <div className="space-y-1.5 animate-in slide-in-from-left-2 duration-300">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Iframe Source URL</label>
                          <input
                            type="text"
                            value={parsedConfig.config?.iframeUrl || ""}
                            onChange={(e) => updateNestedConfig({ iframeUrl: e.target.value })}
                            placeholder="https://example.com/embed"
                            className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                          />
                        </div>
                      )}

                      {parsedConfig.type === 'progress' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-left-2 duration-300">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Target Value</label>
                            <input
                              type="number"
                              value={parsedConfig.config?.target || ""}
                              onChange={(e) => updateNestedConfig({ target: parseFloat(e.target.value) || 0 })}
                              placeholder="100"
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Suffix</label>
                            <input
                              type="text"
                              value={parsedConfig.config?.suffix || ""}
                              onChange={(e) => updateNestedConfig({ suffix: e.target.value })}
                              placeholder="%"
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {parsedConfig.type === 'list' && (
                        <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">List Orientation</label>
                            <select
                              value={parsedConfig.config?.orientation || "vertical"}
                              onChange={(e) => updateNestedConfig({ orientation: e.target.value })}
                              className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                            >
                              <option value="vertical">Vertical</option>
                              <option value="horizontal">Horizontal</option>
                            </select>
                           </div>
                         </div>
                       )}

                       {parsedConfig.type === 'label' && (
                         <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Subtitle</label>
                               <input
                                 type="text"
                                 value={parsedConfig.config?.subtitle || ""}
                                 onChange={(e) => updateNestedConfig({ subtitle: e.target.value })}
                                 placeholder="Optional subtitle text"
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm"
                               />
                             </div>
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Icon (Lucide Name)</label>
                               <input
                                 type="text"
                                 value={parsedConfig.config?.icon || ""}
                                 onChange={(e) => updateNestedConfig({ icon: e.target.value })}
                                 placeholder="Zap, Activity, etc."
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm font-mono"
                               />
                             </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Alignment</label>
                               <select
                                 value={parsedConfig.config?.align || "left"}
                                 onChange={(e) => updateNestedConfig({ align: e.target.value })}
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm"
                               >
                                 <option value="left">Left</option>
                                 <option value="center">Center</option>
                                 <option value="right">Right</option>
                               </select>
                             </div>
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">Variant</label>
                               <select
                                 value={parsedConfig.config?.variant || "simple"}
                                 onChange={(e) => updateNestedConfig({ variant: e.target.value })}
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm"
                               >
                                 <option value="simple">Simple</option>
                                 <option value="pill">Pill (Badge)</option>
                                 <option value="hero">Hero (Large)</option>
                               </select>
                             </div>
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">External Link</label>
                             <input
                               type="text"
                               value={parsedConfig.config?.link || ""}
                               onChange={(e) => updateNestedConfig({ link: e.target.value })}
                               placeholder="https://google.com"
                               className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm font-mono"
                             />
                           </div>
                         </div>
                       )}

                       {parsedConfig.type === 'status' && (
                         <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">True Label</label>
                               <input
                                 type="text"
                                 value={parsedConfig.config?.trueLabel || ""}
                                 onChange={(e) => updateNestedConfig({ trueLabel: e.target.value })}
                                 placeholder="SYSTEM ONLINE"
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                               />
                             </div>
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">False Label</label>
                               <input
                                 type="text"
                                 value={parsedConfig.config?.falseLabel || ""}
                                 onChange={(e) => updateNestedConfig({ falseLabel: e.target.value })}
                                 placeholder="SYSTEM DOWN"
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                               />
                             </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">True Icon</label>
                               <input
                                 type="text"
                                 value={parsedConfig.config?.trueIcon || ""}
                                 onChange={(e) => updateNestedConfig({ trueIcon: e.target.value })}
                                 placeholder="Zap"
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                               />
                             </div>
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-muted/60">False Icon</label>
                               <input
                                 type="text"
                                 value={parsedConfig.config?.falseIcon || ""}
                                 onChange={(e) => updateNestedConfig({ falseIcon: e.target.value })}
                                 placeholder="Zap"
                                 className="w-full bg-background border border-border rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                               />
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted/70">
                        <Terminal size={14} />
                        Widget Config (JSON)
                      </label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(configText);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-all"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <><Check size={12} className="text-up" /> Copied</>
                        ) : (
                          <><Copy size={12} /> Copy Config</>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={configText}
                      onChange={(e) => {
                        setConfigText(e.target.value);
                        setSelectedTemplateLabel(null);
                        setError(null);
                      }}
                      placeholder='{ "id": "my-widget", "type": "stat", "label": "My Widget", ... }'
                      className="w-full bg-background border border-border rounded-[4px] px-4 py-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all min-h-[400px] flex-1 resize-none text-foreground leading-relaxed shadow-inner"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-muted/5 border-t border-border/50 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-[4px] text-sm font-semibold hover:bg-foreground/90 transition-all active:scale-[0.98]"
              >
                <Save size={16} />
                {initialConfig ? "Update Widget" : "Add Widget"}
              </button>
            </div>
          </div>

          {showDocs && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/50 bg-background/30 flex flex-col shrink-0 max-h-[40vh] md:max-h-none">
              <div className="p-4 md:p-6 border-b border-border/50 bg-panel sticky top-0 z-10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <BookOpen size={14} />
                  Dictionary
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono custom-scrollbar">
                {CONFIG_DOCS.map((doc) => (
                  <div key={doc.key} className="space-y-1 p-2 hover:bg-foreground/5 rounded transition-colors group">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-bold text-foreground bg-foreground/10 px-1 rounded">
                        {doc.key}
                      </code>
                      {doc.required && (
                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">Required</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted italic leading-tight">{doc.type}</p>
                    <p className="text-[11px] text-muted/80 leading-snug group-hover:text-foreground/80 transition-colors">
                      {doc.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
