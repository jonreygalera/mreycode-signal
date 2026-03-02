"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { WidgetConfig } from "@/types/widget";
import { WidgetGrid } from "./widget-grid";
import { cn } from "@/lib/utils";
import { FastWidgetModal } from "./fast-widget-modal";
import { HistoryModal } from "./history-modal";
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
  MAX_WIDGETS_PER_WORKSPACE,
  MAX_WORKSPACES,
  type TempWidget,
  type Workspace
} from "@/lib/widgets";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FolderPlus, Copy, Edit2, Trash2, Plus, MonitorOff, RotateCcw, 
  ExternalLink, X as CloseIcon 
} from "lucide-react";
import { Clock } from "../clock";
import { ThemeToggle } from "../theme-toggle";
import { useTVMode } from "@/context/tv-mode-context";
import { useAlert } from "@/context/alert-context";
import { RefreshButton } from "../refresh-button";


export function DashboardView({ configs: baseConfigs }: { configs: WidgetConfig[] }) {
  const { isTVMode, toggleTVMode } = useTVMode();
  const { showAlert } = useAlert();

  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = searchParams.get("workspace");
  const maximizedWidgetId = searchParams.get("widget");
  
  const handleParamChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  };
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [widgetToEdit, setWidgetToEdit] = useState<{ config: WidgetConfig; afterId: string | null } | null>(null);
  const [tempWidgets, setTempWidgets] = useState<{ config: WidgetConfig; afterId: string | null }[]>([]);
  const [historyWidgets, setHistoryWidgets] = useState<TempWidget[]>([]);

  const isModalOpen = searchParams.get("modal") === "new" || !!widgetToEdit;
  const isHistoryOpen = searchParams.get("widget") === "history";

  const setIsModalOpen = (open: boolean) => {
    handleParamChange("modal", open ? "new" : null);
    if (!open) setWidgetToEdit(null);
  };

  const setIsHistoryOpen = (open: boolean) => {
    handleParamChange("widget", open ? "history" : null);
  };

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
      setIsModalOpen(true);
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

  const handleAddWorkspace = async () => {
    const name = window.prompt("Enter workspace name:");
    if (name && name.trim()) {
      try {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
        const newWS = { id, name: name.trim(), createdAt: Date.now() };
        saveWorkspace(newWS);
        setWorkspaces(getWorkspaces());
        router.push(`/?workspace=${id}`);
      } catch (e: any) {
        showAlert({
          title: "Workspace Error",
          message: e.message,
          type: "error"
        });
      }
    }
  };

  const handleRenameWorkspace = async (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (!ws) return;

    const newName = window.prompt("New workspace name:", ws.name);
    if (newName && newName.trim() && newName.trim() !== ws.name) {
      try {
        updateWorkspace(wsId, newName.trim());
        setWorkspaces(getWorkspaces());
      } catch (e: any) {
        showAlert({
          title: "Rename Error",
          message: e.message,
          type: "error"
        });
      }
    }
  };

  const handleCopyWorkspace = async (wsId: string | null) => {
    const ws = workspaces.find(w => w.id === wsId);
    const sourceName = ws ? ws.name : "Main Dashboard";
    const name = window.prompt("New copied workspace name:", `${sourceName} - COPY`);
    
    if (name && name.trim()) {
      try {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
        const newWS = { id, name: name.trim(), createdAt: Date.now() };
        duplicateWorkspace(wsId, newWS);
        setWorkspaces(getWorkspaces());
        router.push(`/?workspace=${id}`);
      } catch (e: any) {
        showAlert({
          title: "Copy Error",
          message: e.message,
          type: "error"
        });
      }
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


  return (
    <div className={cn("flex flex-col gap-4 pb-32", isTVMode && "pt-6")}>
      {!isTVMode ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-border pb-4 gap-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground uppercase">
                {currentWorkspaceName}
              </h1>
              <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
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
              {tempWidgets.length}/{MAX_WIDGETS_PER_WORKSPACE} Fast Widgets Active
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Workspaces List */}
            <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg mr-2">
              <button
                onClick={() => router.push("/")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap",
                  !workspaceId ? "bg-foreground text-background shadow-lg" : "text-muted hover:text-foreground hover:bg-muted/30"
                )}
              >
                Main
              </button>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => router.push(`/?workspace=${ws.id}`)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap",
                    workspaceId === ws.id ? "bg-foreground text-background shadow-lg" : "text-muted hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {ws.name}
                </button>
              ))}
            </div>

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
              onClick={handleAddWorkspace}
              disabled={workspaces.length >= MAX_WORKSPACES}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-semibold border border-border transition-all active:scale-95 whitespace-nowrap",
                workspaces.length >= MAX_WORKSPACES 
                  ? "bg-muted/5 text-muted/50 cursor-not-allowed opacity-50" 
                  : "bg-muted/10 hover:bg-muted/20 text-foreground"
              )}
              title={workspaces.length >= MAX_WORKSPACES ? "Limit reached (max 3)" : "Add new workspace"}
            >
              <FolderPlus size={14} />
              Workspace
            </button>

            <button
              onClick={() => {
                if (tempWidgets.length >= MAX_WIDGETS_PER_WORKSPACE) {
                  showAlert({
                    title: "Limit Reached",
                    message: `Maximum of ${MAX_WIDGETS_PER_WORKSPACE} widgets allowed per workspace.`,
                    type: "error"
                  });
                  return;
                }
                setWidgetToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-[4px] text-xs font-semibold border border-border transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={14} />
              Fast Widget
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center justify-between mb-4">
           <button
             onClick={toggleTVMode}
             className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors border border-border/40 rounded-[2px] bg-panel/50 backdrop-blur-sm"
             title="Exit TV Mode (Esc)"
           >
             <MonitorOff size={12} />
             Exit TV Mode
           </button>
           <div className="flex items-center gap-4">
             <RefreshButton />
             <ThemeToggle />
             <Clock />
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
    </div>
  );
}
