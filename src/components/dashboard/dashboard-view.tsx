"use client";

import { useState, useEffect, useRef, useMemo } from "react";


import { motion, AnimatePresence } from "framer-motion";
import type { WidgetConfig } from "@/types/widget";
import { WidgetGrid } from "./widget-grid";
import { cn } from "@/lib/utils";
import { FastWidgetModal } from "./fast-widget-modal";
import { appConfig } from "@/config/app";
import { HistoryModal } from "./history-modal";
import { WorkspaceModal } from "./workspace-modal";
import { 
  getTempWidgets, 
  saveTempWidget, 
  mergeWidgets,
  getHistoryWidgets,
  deleteTempWidget,
  restoreWidgetFromHistory,
  permadeleteFromHistory,
  restoreAllHistory,
  clearHistory,
  getWorkspaces,
  saveWorkspace,
  deleteWorkspace,
  updateWorkspace,
  duplicateWorkspace,
  type TempWidget,
  type Workspace
} from "@/lib/widgets";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FolderPlus, Copy, Edit2, Trash2, Plus, MonitorOff, RotateCcw, 
  ExternalLink, X as CloseIcon, Download, Upload, ChevronDown, Check, LayoutDashboard, Search
} from "lucide-react";
import { Clock } from "../clock";
import { ThemeToggle } from "../theme-toggle";
import { useTVMode } from "@/context/tv-mode-context";
import { useAlert } from "@/context/alert-context";
import { RefreshButton } from "../refresh-button";
import { useSettings } from "@/context/settings-context";


export function DashboardView({ configs: baseConfigs }: { configs: WidgetConfig[] }) {
  const { settings, timeLeft } = useSettings();
  const { isTVMode, toggleTVMode } = useTVMode();

  const { showAlert } = useAlert();

  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = searchParams.get("workspace");
  const maximizedWidgetId = searchParams.get("widget");
  
  const handleParamsChange = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleParamChange = (key: string, value: string | null) => {
    handleParamsChange({ [key]: value });
  };
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [widgetToEdit, setWidgetToEdit] = useState<{ config: WidgetConfig; afterId: string | null } | null>(null);
  const [tempWidgets, setTempWidgets] = useState<{ config: WidgetConfig; afterId: string | null }[]>([]);
  const [historyWidgets, setHistoryWidgets] = useState<TempWidget[]>([]);
  const [workspaceModal, setWorkspaceModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'rename' | 'copy';
    targetId?: string | null;
    initialValue?: string;
    title: string;
  }>({ isOpen: false, mode: 'add', title: '' });

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
        setWorkspaceSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isModalOpen = searchParams.get("modal") === "new" || searchParams.get("modal") === "edit";
  const isHistoryOpen = searchParams.get("widget") === "history";

  const setIsModalOpen = (open: boolean) => {
    if (!open) {
      handleParamsChange({
        modal: null,
        editId: null
      });
      setWidgetToEdit(null);
    } else {
      handleParamChange("modal", "new");
    }
  };

  const setIsHistoryOpen = (open: boolean) => {
    handleParamChange("widget", open ? "history" : null);
  };

  useEffect(() => {
    const modal = searchParams.get("modal");
    const editId = searchParams.get("editId");
    
    if (modal === "edit" && editId && tempWidgets.length > 0) {
      const widget = tempWidgets.find(w => w.config.id === editId);
      if (widget) {
        setWidgetToEdit(widget);
      } else {
        // If widget not found (maybe deleted), clear params
        handleParamChange("modal", null);
        handleParamChange("editId", null);
      }
    }
  }, [searchParams, tempWidgets]);

  useEffect(() => {
    setWorkspaces(getWorkspaces());
    setTempWidgets(getTempWidgets(workspaceId));
    setHistoryWidgets(getHistoryWidgets(workspaceId));
  }, [workspaceId]);

  const currentWorkspaceName = useMemo(() => {
    if (!workspaceId) return "Main Dashboard";
    return workspaces.find(w => w.id === workspaceId)?.name || "Unknown Workspace";
  }, [workspaceId, workspaces]);

  const allWidgets = useMemo(() => {
    // Only show default widgets on the Main dashboard
    // Workspaces start as a blank canvas (only show tempWidgets)
    const configsToMerge = workspaceId ? [] : baseConfigs;
    return mergeWidgets(configsToMerge, tempWidgets);
  }, [baseConfigs, tempWidgets, workspaceId]);

  const handleSaveWidget = (config: WidgetConfig, afterId: string | null) => {
    try {
      saveTempWidget(config, afterId, workspaceId);
      setTempWidgets(getTempWidgets(workspaceId));
      setWidgetToEdit(null);
      setIsModalOpen(false);
    } catch (e: any) {
      showAlert({
        title: "Workspace Limit",
        message: e.message,
        type: "error"
      });
    }
  };

  const handleEditWidget = (id: string) => {
    const widget = tempWidgets.find(w => w.config.id === id);
    if (widget) {
      setWidgetToEdit(widget);
      handleParamsChange({
        modal: "edit",
        editId: id
      });
    }
  };

  const handleDeleteWidget = async (id: string) => {
    const confirmed = await showAlert({
      title: "Delete Widget",
      message: "Are you sure you want to remove this widget from your dashboard? It will be moved to history.",
      type: "warning",
      showCancel: true,
      confirmText: "Delete",
      cancelText: "Keep it"
    });

    if (confirmed) {
      deleteTempWidget(id, workspaceId);
      setTempWidgets(getTempWidgets(workspaceId));
      setHistoryWidgets(getHistoryWidgets(workspaceId));
    }
  };

  const handleRestoreFromHistory = (id: string) => {
    try {
      restoreWidgetFromHistory(id, workspaceId);
      setTempWidgets(getTempWidgets(workspaceId));
      setHistoryWidgets(getHistoryWidgets(workspaceId));
    } catch (e: any) {
      showAlert({
        title: "Limit Reached",
        message: e.message,
        type: "error"
      });
    }
  };

  const handlePermadelete = (id: string) => {
    permadeleteFromHistory(id, workspaceId);
    setHistoryWidgets(getHistoryWidgets(workspaceId));
  };

  const handleRestoreAllHistory = () => {
    try {
      restoreAllHistory(workspaceId);
      setTempWidgets(getTempWidgets(workspaceId));
      setHistoryWidgets(getHistoryWidgets(workspaceId));
      setIsHistoryOpen(false);
    } catch (e: any) {
      showAlert({
        title: "Partial Restore",
        message: "Some widgets were not restored because the workspace limit was reached.",
        type: "warning"
      });
      setTempWidgets(getTempWidgets(workspaceId));
      setHistoryWidgets(getHistoryWidgets(workspaceId));
    }
  };

  const handleClearHistory = async () => {
    const confirmed = await showAlert({
      title: "Empty Trash",
      message: "Are you sure you want to permanently delete all widgets in history?",
      type: "error",
      showCancel: true,
      confirmText: "Empty Bin",
      cancelText: "Cancel"
    });

    if (confirmed) {
      clearHistory(workspaceId);
      setHistoryWidgets([]);
    }
  };

  const handleAddWorkspace = () => {

    setWorkspaceModal({
      isOpen: true,
      mode: 'add',
      title: 'Add New Workspace',
      initialValue: ""
    });
  };

  const handleRenameWorkspace = async (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (!ws) return;

    setWorkspaceModal({
      isOpen: true,
      mode: 'rename',
      title: 'Rename Workspace',
      initialValue: ws.name,
      targetId: wsId
    });
  };

  const handleCopyWorkspace = async (wsId: string | null) => {
    const ws = workspaces.find(w => w.id === wsId);
    const sourceName = ws ? ws.name : "Main Dashboard";
    
    setWorkspaceModal({
      isOpen: true,
      mode: 'copy',
      title: 'Copy Workspace',
      initialValue: `${sourceName} - COPY`,
      targetId: wsId
    });
  };

  const handleWorkspaceConfirm = (name: string) => {
    const { mode, targetId } = workspaceModal;

    try {
      if (mode === 'add') {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
        const newWS = { id, name: name.trim(), createdAt: Date.now() };
        saveWorkspace(newWS);
        setWorkspaces(getWorkspaces());
        router.push(`/?workspace=${id}`);
      } else if (mode === 'rename' && targetId) {
        updateWorkspace(targetId, name.trim());
        setWorkspaces(getWorkspaces());
      } else if (mode === 'copy') {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
        const newWS = { id, name: name.trim(), createdAt: Date.now() };
        duplicateWorkspace(targetId || null, newWS);
        setWorkspaces(getWorkspaces());
        router.push(`/?workspace=${id}`);
      }
    } catch (e: any) {
      showAlert({
        title: "Workspace Error",
        message: e.message,
        type: "error"
      });
    }
  };

  const handleDeleteWorkspace = async (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (!ws) return;

    const confirmed = await showAlert({
      title: "Delete Workspace",
      message: `Are you sure you want to delete "${ws.name}"? All its widgets will be permanently lost.`,
      type: "error",
      showCancel: true,
      confirmText: "Delete Workspace",
      cancelText: "Cancel"
    });

    if (confirmed) {
      deleteWorkspace(wsId);
      setWorkspaces(getWorkspaces());
      if (workspaceId === wsId) {
        router.push("/");
      }
    }
  };

  const handleClearAll = async () => {
    const confirmed = await showAlert({
      title: "Clear All Widgets",
      message: "This will move all custom widgets to history. This action can be undone from the recycle bin.",
      type: "warning",
      showCancel: true,
      confirmText: "Clear All",
      cancelText: "Cancel"
    });

    if (confirmed) {
      const current = getTempWidgets(workspaceId);
      current.forEach(w => deleteTempWidget(w.config.id, workspaceId));
      setTempWidgets([]);
      setHistoryWidgets(getHistoryWidgets(workspaceId));
    }
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dateFormatted = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const timeFormatted = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const fullTimestamp = `${dateFormatted}-${timeFormatted}`;

    const data = {
      workspaceName: `${currentWorkspaceName}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      version: appConfig.version,
      // Export all widgets (both predefined and custom)
      // When imported, they will all become "fast widgets"
      widgets: allWidgets.map(({ isTemp, ...config }: any) => config),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-v${appConfig.version}-${fullTimestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;



    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.widgets || !Array.isArray(data.widgets)) {
          throw new Error("Invalid configuration file: Missing widgets array.");
        }

        const rawName = (data.workspaceName || "Imported Dashboard").split('-')[0].trim();
        const existing = getWorkspaces();
        const nameExists = existing.some(ws => ws.name.toLowerCase() === rawName.toLowerCase());
        const finalName = nameExists ? `${rawName} (Imported)` : rawName;

        const confirmed = await showAlert({
          title: "Import Workspace",
          message: `This will create a new workspace "${finalName}" with ${data.widgets.length} widgets. Proceed?`,
          type: "info",
          showCancel: true,
          confirmText: "Import",
          cancelText: "Cancel"
        });

        if (confirmed) {
          const newWsId = `ws-import-${Date.now()}`;
          const newWorkspace = {
            id: newWsId,
            name: finalName,
            createdAt: Date.now()
          };
          
          saveWorkspace(newWorkspace);
          
          // Map widgets and save them synchronously
          data.widgets.forEach((config: WidgetConfig) => {
            saveTempWidget(config, null, newWsId);
          });
          
          // Clear input
          e.target.value = "";

          // THE FIX: Direct window location change is the most reliable way 
          // to ensure Next.js cleans up all internal state and re-reads localStorage
          window.location.href = `/?workspace=${newWsId}`;
        }
      } catch (err: any) {
        showAlert({ title: "Import Error", message: err.message, type: "error" });
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className={cn("flex flex-col gap-4 pb-32", isTVMode && "pt-6")}>
      {!isTVMode ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-[56px] z-10 bg-background dark:bg-background flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-border pb-4 gap-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 relative" ref={workspaceDropdownRef}>
              <button 
                onClick={() => {
                  setIsWorkspaceOpen(!isWorkspaceOpen);
                  if (isWorkspaceOpen) setWorkspaceSearch("");
                }}
                className="group flex items-center gap-3 text-left p-1 -m-1 rounded-md hover:bg-foreground/5 transition-all"
              >
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground uppercase">
                    {currentWorkspaceName}
                  </h1>
                  <span className="flex items-center justify-center bg-foreground/10 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-foreground/10 backdrop-blur-sm">
                    {workspaces.length + 1}
                  </span>
                </div>
                <ChevronDown size={16} className={cn("text-muted transition-transform duration-300", isWorkspaceOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isWorkspaceOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-0 z-60 mt-2 w-64 overflow-hidden rounded-md border border-border bg-panel shadow-2xl backdrop-blur-md"
                  >
                    <div className="px-3 py-2 border-b border-border bg-muted/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutDashboard size={12} className="text-muted" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Workspaces</span>
                      </div>
                      <span className="text-[10px] font-black text-muted/50">{workspaces.length + 1} TOTAL</span>
                    </div>

                    <div className="p-2 border-b border-border bg-background focus-within:bg-muted/10 transition-colors">
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          placeholder="Search workspace..."
                          value={workspaceSearch}
                          onChange={(e) => setWorkspaceSearch(e.target.value)}
                          className="w-full bg-transparent border-none pl-7 pr-2 py-1 text-xs placeholder:text-muted/50 focus:outline-none focus:ring-0"
                          autoFocus
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    <div className="p-1.5 max-h-[320px] overflow-y-auto custom-scrollbar">
                      {/* Main Dashboard option - Only show if it matches search or search is empty */}
                      {("Main Dashboard".toLowerCase().includes(workspaceSearch.toLowerCase())) && (
                        <>
                          <button
                            onClick={() => {
                              router.push("/");
                              setIsWorkspaceOpen(false);
                              setWorkspaceSearch("");
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-xs transition-colors",
                              !workspaceId
                                ? "bg-primary/10 text-primary font-bold" 
                                : "text-muted hover:bg-muted/20 hover:text-foreground"
                            )}
                          >
                            <div className="flex flex-col">
                               <span className="uppercase tracking-tight">Main Dashboard</span>
                               <span className="text-[9px] opacity-60">Master View</span>
                            </div>
                            {!workspaceId && <Check size={14} className="shrink-0" />}
                          </button>
                          <div className="h-px bg-border/40 my-1 mx-2" />
                        </>
                      )}

                      {workspaces
                        .filter(ws => ws.name.toLowerCase().includes(workspaceSearch.toLowerCase()))
                        .map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            router.push(`/?workspace=${ws.id}`);
                            setIsWorkspaceOpen(false);
                            setWorkspaceSearch("");
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-xs transition-colors mb-0.5",
                            workspaceId === ws.id
                              ? "bg-primary/10 text-primary font-bold" 
                              : "text-muted hover:bg-muted/20 hover:text-foreground"
                          )}
                        >
                          <div className="flex flex-col">
                             <span className="uppercase tracking-tight">{ws.name}</span>
                             <span className="text-[9px] opacity-60">Created {new Date(ws.createdAt).toLocaleDateString()}</span>
                          </div>
                          {workspaceId === ws.id && <Check size={14} className="shrink-0" />}
                        </button>
                      ))}

                      {workspaces.filter(ws => ws.name.toLowerCase().includes(workspaceSearch.toLowerCase())).length === 0 && 
                       !"Main Dashboard".toLowerCase().includes(workspaceSearch.toLowerCase()) && (
                        <div className="px-3 py-4 text-center">
                          <p className="text-[10px] text-muted italic">No matching workspaces found</p>
                        </div>
                      )}
                    </div>

                    <div className="p-1.5 border-t border-border bg-muted/5">
                      <button
                        onClick={() => {
                          handleAddWorkspace();
                          setIsWorkspaceOpen(false);
                          setWorkspaceSearch("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold text-muted hover:text-foreground hover:bg-muted/20 transition-all"
                      >
                        <FolderPlus size={14} />
                        CREATE NEW WORKSPACE
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity ml-1">
                {!workspaceId && tempWidgets.length > 0 && (
                   <button 
                     onClick={() => handleCopyWorkspace(null)}
                     className="p-1 px-1.5 text-muted hover:text-primary transition-colors hover:bg-muted/10 rounded-sm"
                     title="Copy main dashboard to new workspace"
                   >
                     <Copy size={12} />
                   </button>
                )}
                {workspaceId && (
                  <>
                    <button 
                      onClick={() => handleRenameWorkspace(workspaceId)}
                      className="p-1 px-1.5 text-muted hover:text-primary transition-colors hover:bg-muted/10 rounded-sm"
                      title="Rename workspace"
                    >
                      <Edit2 size={12} />
                    </button>
                    {tempWidgets.length > 0 && (
                      <button 
                        onClick={() => handleCopyWorkspace(workspaceId)}
                        className="p-1 px-1.5 text-muted hover:text-primary transition-colors hover:bg-muted/10 rounded-sm"
                        title="Copy workspace"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteWorkspace(workspaceId)}
                      className="p-1 px-1.5 text-muted hover:text-red-500 transition-colors hover:bg-muted/10 rounded-sm"
                      title="Delete current workspace"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted font-medium tracking-wide uppercase opacity-60">
              {allWidgets.length} Widgets Active
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">

            {tempWidgets.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 rounded-[4px] whitespace-nowrap"
                title="Clear temporary widgets"
              >
                <Trash2 size={14} />
                Clear Temp
              </button>
            )}
            
            {historyWidgets.length > 0 && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-all border border-border/40 hover:border-border rounded-[4px] whitespace-nowrap bg-panel/30"
                title="View deleted widgets"
              >
                <div className="relative">
                  <RotateCcw size={14} className="group-hover:-rotate-45 transition-transform duration-300" />
                  <span className="absolute -top-2 -right-2 flex items-center justify-center bg-foreground text-background text-[8px] font-black h-3.5 w-3.5 rounded-full shadow-sm ring-2 ring-panel">
                    {historyWidgets.length}
                  </span>
                </div>
                History
              </button>
            )}

            <button
              onClick={() => {
                setWidgetToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-[4px] text-xs font-semibold border border-border transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={14} />
              Fast Widget
            </button>

            <div className="h-6 w-px bg-border mx-1" />
            
            <button
               onClick={handleExport}
               className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-all hover:bg-muted/10 rounded-[4px]"
               title="Export workspace configuration"
            >
              <Download size={14} />
              <span className="hidden lg:inline">Export</span>
            </button>

            <label 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-muted/10 cursor-pointer transition-all rounded-[4px]"
              title="Import workspace configuration"
            >
              <Upload size={14} />
              <span className="hidden lg:inline">Import</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                className="hidden" 
              />
            </label>
          </div>
        </motion.div>
      ) : (
        <div className="sticky top-0 z-20 bg-background/40 dark:bg-background/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 py-3 mb-6 transition-all duration-500 hover:bg-background/60 group">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTVMode}
              className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-foreground transition-all border border-border/20 rounded-md bg-panel/30 hover:bg-panel/50 backdrop-blur-sm"
              title="Exit TV Mode (Esc)"
            >
              <MonitorOff size={14} />
              Exit Mode
            </button>
            <div className="h-4 w-px bg-border/30 mx-1" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 leading-none mb-1">Active View</span>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-tight leading-none">
                {currentWorkspaceName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {timeLeft !== null && settings.tvCarouselEnabled && (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-foreground/5 rounded-full border border-border/10 backdrop-blur-md">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      className="text-foreground/5"
                    />
                    <motion.circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={50}
                      initial={{ strokeDashoffset: 50 }}
                      animate={{ 
                        strokeDashoffset: 50 - (50 * (timeLeft / settings.tvCarouselInterval))
                      }}
                      transition={{ duration: 0.5, ease: "linear" }}
                      className="text-primary"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-foreground">
                    {timeLeft}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/50 leading-none mb-0.5">Next Switch</span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider leading-none">Carousel Active</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-foreground/5 rounded-full border border-border/10">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Live</span>
            </div>
            <div className="flex items-center gap-4">
              <RefreshButton />
              <ThemeToggle />
              <div className="h-6 w-px bg-border/20 mx-1" />
              <Clock />
            </div>
          </div>
        </div>
      )}
      
      <WidgetGrid 
        configs={allWidgets} 
        onEdit={handleEditWidget}
        onDelete={handleDeleteWidget}
        maximizedWidgetId={maximizedWidgetId}
        onMaximizeChange={(id) => handleParamChange("widget", id)}
      />

      <FastWidgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setWidgetToEdit(null);
        }}
        onSave={handleSaveWidget}
        existingWidgets={allWidgets}
        initialConfig={widgetToEdit || undefined}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={historyWidgets}
        onRestore={handleRestoreFromHistory}
        onRestoreAll={handleRestoreAllHistory}
        onDelete={handlePermadelete}
        onClearAll={handleClearHistory}
      />

      <WorkspaceModal
        isOpen={workspaceModal.isOpen}
        onClose={() => setWorkspaceModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleWorkspaceConfirm}
        mode={workspaceModal.mode}
        title={workspaceModal.title}
        initialValue={workspaceModal.initialValue}
      />
    </div>
  );
}
