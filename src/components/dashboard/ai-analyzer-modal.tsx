"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Sparkles, AlertCircle, RefreshCcw, Check, Copy, Wand2, Trash2, Search } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { useAlert } from "@/context/alert-context";
import { WidgetConfig } from "@/types/widget";
import { cn, getNestedProperty } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { getProviderApiUrl, AiProviderId } from "@/config/ai";
import { AI_PROMPT_TEMPLATES, DEFAULT_PROMPT_TEMPLATE_ID } from "@/config/ai-prompts";
import { ChevronDown, Info } from "lucide-react";

interface AiAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  widgets: WidgetConfig[];
}

export function AiAnalyzerModal({ isOpen, onClose, workspaceId, widgets }: AiAnalyzerModalProps) {
  const { settings } = useSettings();
  const { showAlert } = useAlert();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_PROMPT_TEMPLATE_ID);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  // Load persistence
  useEffect(() => {
    if (isOpen && workspaceId && !result && !isAnalyzing) {
      const stored = localStorage.getItem(`ai-analysis-${workspaceId}`);
      if (stored) {
        setResult(stored);
      }
    }
  }, [isOpen, workspaceId]);

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplateOpen(false);
        setTemplateSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAnalyze = async () => {
    if (settings.aiProvider !== 'custom' && !settings.aiApiKey) {
      showAlert({
        title: "API Not Configured",
        message: "Please configure your AI Provider and API Key in Settings first.",
        type: "warning"
      });
      return;
    }
    
    if (settings.aiProvider === 'custom' && !settings.aiCustomUrl) {
      showAlert({
        title: "Endpoint Not Configured",
        message: "Please provide a Custom Endpoint URL in Settings.",
        type: "warning"
      });
      return;
    }

    if (widgets.length === 0) {
       showAlert({
        title: "No Content",
        message: "This workspace is empty. Add some widgets first to analyze.",
        type: "warning"
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const template = AI_PROMPT_TEMPLATES.find(t => t.id === selectedTemplateId) || AI_PROMPT_TEMPLATES[0];
      let systemPrompt = template.systemPrompt;

      if (selectedTemplateId === 'custom' && customPrompt.trim()) {
        systemPrompt = customPrompt.trim();
      } else if (customPrompt.trim()) {
        systemPrompt += `\n\nUSER SPECIFIC DIRECTIVE:\n${customPrompt.trim()}\n`;
      }

      // Fetch the actual current values for data-driven widgets
      const enrichedWidgets = await Promise.all(widgets.map(async (w) => {
        let currentValue = "No live data / static widget";
        
        if (w.api) {
          try {
            const res = await fetch(w.api, {
              method: w.method || "GET",
              headers: { "Content-Type": "application/json", ...w.headers },
              body: w.body ? JSON.stringify(w.body) : undefined,
            });
            if (res.ok) {
              const data = await res.json();
              currentValue = JSON.stringify(w.responsePath ? getNestedProperty(data, w.responsePath) : data);
            } else {
              currentValue = `API Error: ${res.status}`;
            }
          } catch {
            currentValue = "Failed to fetch current telemetry";
          }
        } else if (w.type === 'clock') {
          currentValue = new Date().toISOString();
        }
        
        return {
          ...w,
          currentValue
        };
      }));

      // 1. Prepare Workspace Content
      const rawWidgetData = `=== WIDGET TELEMETRY & CONFIGURATION ===\n` + enrichedWidgets.map(w => {
         return `[Widget: ${w.label} | API/Source: ${w.api || w.source || 'N/A'} | Type: ${w.type}]\n=> State/Description: ${w.description || "No description provided"}\n=> Live Value: ${w.currentValue}`;
      }).join("\n\n") + `\n\n========================================\n\nProvide direct analysis now:`;

      let apiUrl = getProviderApiUrl(settings.aiProvider as AiProviderId);
      let headersConfig: Record<string, string> = { "Content-Type": "application/json" };
      let bodyConfig: Record<string, unknown> = {};

      const resolveApiKey = () => {
        try {
          return settings.aiApiKey ? atob(settings.aiApiKey) : '';
        } catch {
          return settings.aiApiKey;
        }
      };

      if (settings.aiProvider === 'openai') {
        headersConfig["Authorization"] = `Bearer ${resolveApiKey()}`;
        bodyConfig = {
          model: settings.aiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: rawWidgetData }
          ]
        };
      } else if (settings.aiProvider === 'gemini') {
        apiUrl = `${apiUrl}/${settings.aiModel}:generateContent?key=${resolveApiKey()}`;
        bodyConfig = {
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [{ parts: [{ text: rawWidgetData }] }]
        };
      } else if (settings.aiProvider === 'custom') {
        apiUrl = settings.aiCustomUrl;
        
        try {
          headersConfig = JSON.parse(settings.aiCustomHeaders || "{}");
        } catch {
          throw new Error("Invalid JSON in Custom AI Headers.");
        }

        let bodyConfigStr = settings.aiCustomBody || "{}";
        const safeSystemPrompt = JSON.stringify(systemPrompt).slice(1, -1);
        
        const rawContent = widgets.map(w => {
         return `[Widget: ${w.label} | API/Source: ${w.api || w.source || 'N/A'} | Type: ${w.type}] => Description/State: ${w.description || "No description provided"}`;
        }).join("\n");
        const safeContent = JSON.stringify(rawContent).slice(1, -1);

        bodyConfigStr = bodyConfigStr.replace("__SYSTEM_PROMPT__", safeSystemPrompt);
        bodyConfigStr = bodyConfigStr.replace("__CONTENT__", safeContent);
        
        try {
          bodyConfig = JSON.parse(bodyConfigStr);
        } catch {
          throw new Error("Invalid JSON in Custom AI Body after injecting content.");
        }
      }

      // 4. Send Request
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify(bodyConfig)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 5. Extract Result Extracting common structures like OpenAI's choices[0].message.content
      let outputText = "";
      if (data.choices && data.choices[0] && data.choices[0].message) {
         outputText = data.choices[0].message.content;
      } else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
         // Gemini style
         outputText = data.candidates[0].content.parts.map((p: { text: string }) => p.text).join("");
      } else if (data.message) {
         outputText = data.message;
      } else if (typeof data === "string") {
         outputText = data;
      } else if (data.response) {
         outputText = data.response;
      } else {
         outputText = JSON.stringify(data, null, 2);
      }

      setResult(outputText);
      if (workspaceId) {
         localStorage.setItem(`ai-analysis-${workspaceId}`, outputText);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setError(errorMessage);
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setResult(null);
    setCustomPrompt("");
    if (workspaceId) {
      localStorage.removeItem(`ai-analysis-${workspaceId}`);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-panel border-y sm:border border-border/80 shadow-[0_0_80px_rgba(0,0,0,0.3)] sm:rounded-2xl flex flex-col overflow-hidden"
          >
             {/* Decorative Elements */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <Bot size={240} className="text-primary transform rotate-12" />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between p-6 border-b border-border/40 bg-muted/5 z-10">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary shadow-inner">
                  <Bot size={24} />
                  {isAnalyzing && (
                    <motion.div 
                      className="absolute inset-0 rounded-xl border border-primary"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                    {widgets.length === 1 ? 'Widget Inspector' : 'Workspace Insights'}
                    <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest bg-primary/20 text-primary border border-primary/30 ml-2">BETA</span>
                  </h2>
                  <p className="text-xs text-muted/80 font-medium">
                    Run LLM analysis on {widgets.length === 1 ? 'this specific widget' : 'your current workspace configuration'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-muted/10 rounded-full transition-all text-muted hover:text-foreground active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="relative flex-1 p-6 overflow-y-auto custom-scrollbar z-10 min-h-[300px]">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1">Analysis Failed</h3>
                    <p className="text-xs text-red-500/80 leading-relaxed font-mono">{error}</p>
                  </div>
                </div>
              )}

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center p-12 h-full text-center space-y-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <Sparkles className="text-primary animate-pulse w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold uppercase tracking-widest animate-pulse">Analyzing Workflow...</h3>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Connecting to your configured intelligence endpoint to process {widgets.length} widget{widgets.length !== 1 && 's'}...
                    </p>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                       <Check size={12} />
                       Analysis Complete
                     </span>
                     <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                        <button 
                          onClick={copyToClipboard}
                          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-foreground/5 hover:text-foreground rounded transition-colors"
                        >
                          {isCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          {isCopied ? "Copied" : "Copy"}
                        </button>
                        <button 
                          onClick={clearAnalysis}
                          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 size={12} />
                          Clear
                        </button>
                     </div>
                  </div>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none bg-panel text-foreground/90 p-6 rounded-xl border border-border/50 shadow-inner
                                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                                prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground/80
                                prose-a:text-primary hover:prose-a:text-primary/80 
                                prose-strong:text-foreground prose-strong:font-bold
                                prose-ul:text-sm prose-ul:text-foreground/80
                                prose-li:marker:text-primary
                                prose-code:bg-muted/10 prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                                prose-pre:bg-background/50 prose-pre:border prose-pre:border-border/40 prose-pre:shadow-lg
                                [&>*:first-child]:mt-0"
                  >
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/40 rounded-xl bg-muted/5 group">
                   <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                     <Wand2 size={32} />
                   </div>
                   <h3 className="text-lg font-bold uppercase tracking-tight mb-2">Ready to Analyze</h3>
                   <p className="text-xs text-muted max-w-md mx-auto leading-relaxed mb-6">
                     You are analyzing <strong className="text-foreground">{widgets.length === 1 ? widgets[0].label : `${widgets.length} widgets`}</strong>. 
                     Ask the AI to generate data insights, find anomalies, or summarize the layout configuration.
                   </p>

                   <div className="w-full max-w-lg mx-auto mb-8 text-left space-y-6">
                     {/* Template Selection */}
                     <div className="relative" ref={templateDropdownRef}>
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Analysis Template</label>
                       <button
                         onClick={() => setIsTemplateOpen(!isTemplateOpen)}
                         className="w-full flex items-center justify-between bg-background border border-border/50 rounded-lg p-3 text-xs hover:border-primary/50 transition-all font-medium"
                       >
                         <div className="flex items-center gap-2">
                           <Bot size={14} className="text-primary" />
                           {AI_PROMPT_TEMPLATES.find(t => t.id === selectedTemplateId)?.label}
                         </div>
                         <ChevronDown size={14} className={cn("text-muted transition-transform", isTemplateOpen && "rotate-180")} />
                       </button>

                       <AnimatePresence>
                         {isTemplateOpen && (
                           <motion.div
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 5, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute top-full left-0 right-0 z-50 bg-panel border border-border/50 rounded-lg shadow-2xl mt-1 max-h-[300px] overflow-hidden flex flex-col"
                           >
                             <div className="p-2 border-b border-border/50 sticky top-0 bg-panel z-10 shrink-0">
                               <div className="relative">
                                 <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                                 <input
                                   type="text"
                                   placeholder="Search analysts..."
                                   value={templateSearchQuery}
                                   onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                   className="w-full bg-background border border-border/50 rounded flex items-center px-8 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                                   onClick={(e) => e.stopPropagation()}
                                 />
                               </div>
                             </div>
                             
                             <div className="p-1 overflow-y-auto custom-scrollbar flex-1">
                               {AI_PROMPT_TEMPLATES.filter(t => 
                                 t.label.toLowerCase().includes(templateSearchQuery.toLowerCase()) || 
                                 t.description.toLowerCase().includes(templateSearchQuery.toLowerCase())
                               ).length === 0 ? (
                                 <div className="p-3 text-center text-xs text-muted">No templates found.</div>
                               ) : (
                                 AI_PROMPT_TEMPLATES.filter(t => 
                                   t.label.toLowerCase().includes(templateSearchQuery.toLowerCase()) || 
                                   t.description.toLowerCase().includes(templateSearchQuery.toLowerCase())
                                 ).map((template) => (
                                   <button
                                     key={template.id}
                                     onClick={() => {
                                       setSelectedTemplateId(template.id);
                                       setIsTemplateOpen(false);
                                       setTemplateSearchQuery("");
                                     }}
                                     className={cn(
                                       "w-full text-left p-2.5 rounded-md transition-all group hover:bg-primary/10",
                                       selectedTemplateId === template.id ? "bg-primary/5 border-l-2 border-primary" : "border-l-2 border-transparent"
                                     )}
                                     type="button"
                                   >
                                     <div className="font-bold text-[11px] uppercase tracking-tight mb-0.5 group-hover:text-primary transition-colors">
                                       {template.label}
                                     </div>
                                     <div className="text-[9px] text-muted leading-tight">
                                       {template.description}
                                     </div>
                                   </button>
                                 ))
                               )}
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>

                       {/* Template Description Hint */}
                       <div className="mt-2 flex items-start gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                          <Info size={12} className="text-primary mt-0.5 shrink-0" />
                          <p className="text-[10px] text-primary/80 leading-relaxed italic">
                            {AI_PROMPT_TEMPLATES.find(t => t.id === selectedTemplateId)?.description}
                          </p>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted block">
                         {selectedTemplateId === 'custom' ? 'Override System Prompt' : 'Additional Instructions (Optional)'}
                       </label>
                       <textarea
                         value={customPrompt}
                         onChange={(e) => setCustomPrompt(e.target.value)}
                         placeholder={
                           selectedTemplateId === 'custom' 
                             ? "Enter your own system prompt or strict rules here..." 
                             : (widgets.length === 1 ? "What do you want to focus on for this widget?" : "What do you want to focus on for this workspace?")
                         }
                         className="w-full bg-background border border-border/50 rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none h-24 custom-scrollbar"
                       />
                     </div>
                   </div>
                   
                   {(settings.aiProvider !== 'custom' && !settings.aiApiKey) || (settings.aiProvider === 'custom' && !settings.aiCustomUrl) ? (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-sm w-full text-left">
                        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">
                           <AlertCircle size={14} />
                           Setup Required
                        </div>
                        <p className="text-[10px] text-amber-500/80 leading-relaxed font-mono">
                           You need to configure your selected AI Provider in the global settings first before you can run an analysis.
                        </p>
                      </div>
                   ) : (
                      <button
                        onClick={handleAnalyze}
                        className="group/btn relative px-8 py-3 bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all active:scale-95 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                        <span className="relative flex items-center gap-2">
                          <Sparkles size={14} />
                          Run Analysis
                        </span>
                      </button>
                   )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {result && !isAnalyzing && (
               <div className="p-4 border-t border-border/40 bg-muted/5 flex justify-end z-10">
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest rounded-md hover:bg-foreground/90 transition-colors shadow-lg active:scale-95"
                  >
                    <RefreshCcw size={14} />
                    Regenerate
                  </button>
               </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
