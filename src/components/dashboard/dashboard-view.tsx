"use client";

import { useState, useEffect, useRef, useMemo } from "react";


import { motion, AnimatePresence } from "framer-motion";
import type { WidgetConfig } from "@/types/widget";
import { WidgetGrid } from "./widget-grid";
import { cn } from "@/lib/utils";
import { FastWidgetModal } from "./fast-widget-modal";
import { ExportModal } from "./export-modal";
import { ImportModal } from "./import-modal";
import { appConfig } from "@/config/app";
import { TEMPLATES } from "@/config/templates";
import { HistoryModal } from "./history-modal";
import { WorkspaceModal } from "./workspace-modal";
import { 
  getTempWidgets, 
  getTempWidgetsAsync,
  saveTempWidget, 
  mergeWidgets,
  getHistoryWidgets,
  deleteTempWidget,
  restoreWidgetFromHistory,
  permadeleteFromHistory,
  restoreAllHistory,
  clearHistory,
  getWorkspaces,
  getWorkspacesAsync,
  saveWorkspace,
  deleteWorkspace,
  updateWorkspace,
  duplicateWorkspace,
  MAX_WIDGETS_PER_WORKSPACE,
  type TempWidget,
  type Workspace
} from "@/lib/widgets";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FolderPlus, Copy, Edit2, Trash2, Plus, MonitorOff, Archive, 
  ExternalLink, X as CloseIcon, Download, Upload, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Check, LayoutDashboard, Search, Database, MoreVertical
} from "lucide-react";
import { Clock } from "../clock";
import { ThemeToggle } from "../theme-toggle";
import { useTVMode } from "@/context/tv-mode-context";
import { useAlert } from "@/context/alert-context";
import { RefreshButton } from "../refresh-button";
import { ConnectivityStatus } from "../connectivity-status";
import { useSettings } from "@/context/settings-context";


export function DashboardView({ configs: baseConfigs }: { configs: WidgetConfig[] }) {
  const { settings, timeLeft, moveCarousel } = useSettings();
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

    // Always preserve tv-mode if currently active
    if (isTVMode) {
      params.set("tv-mode", "yes");
    }

    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleParamChange = (key: string, value: string | null) => {
    handleParamsChange({ [key]: value });
  };
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [direction, setDirection] = useState(0);
  const prevWorkspaceId = useRef<string | null>(workspaceId);

  useEffect(() => {
    if (workspaceId !== prevWorkspaceId.current) {
      // In TV Mode, we ignore 'null' (Main) if workspaces exist
      const relevantWS = isTVMode && workspaces.length > 0 
        ? workspaces.map(w => w.id) 
        : [null, ...workspaces.map(w => w.id)];
        
      const prevIdx = relevantWS.indexOf(prevWorkspaceId.current as any);
      const currIdx = relevantWS.indexOf(workspaceId as any);
      setDirection(currIdx > prevIdx ? 1 : -1);
      prevWorkspaceId.current = workspaceId;
    }
  }, [workspaceId, workspaces, isTVMode]);

  const [widgetToEdit, setWidgetToEdit] = useState<{ config: WidgetConfig; afterId: string | null } | null>(null);
  const [tempWidgets, setTempWidgets] = useState<{ config: WidgetConfig; afterId: string | null }[]>([]);
  const [historyWidgets, setHistoryWidgets] = useState<TempWidget[]>([]);
  const [workspaceModal, setWorkspaceModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'rename' | 'copy';
    targetId?: string | null;
    initialValue?: string;
    initialSelectedWidgets?: WidgetConfig[];
    title: string;
  }>({ isOpen: false, mode: 'add', title: '' });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileData, setImportFileData] = useState<{ workspaceName: string; widgets: WidgetConfig[] } | null>(null);

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [widgetSearch, setWidgetSearch] = useState("");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle search modal with Cmd+K or Ctrl+K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchModalOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
        setWorkspaceSearch("");
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
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

  const loadData = async () => {
    const ws = await getWorkspacesAsync();
    setWorkspaces(ws);
    
    const visited = localStorage.getItem("mreycode_signal_visited");
    
    // Auto-generate initial workspace ONLY on first visit and if none exist
    if (!workspaceId && ws.length === 0 && !visited) {
      localStorage.setItem("mreycode_signal_visited", "true");
      const suffixes = ["Hub", "Nexus", "Pulse", "Flow", "Vibe", "Base", "Core", "Node"];
      const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const randomName = `${randomSuffix}-${Math.floor(Math.random() * 999)}`;
      const randomId = `ws-auto-${Date.now()}`;
      
      const newWS = { id: randomId, name: randomName, createdAt: Date.now() };
      await saveWorkspace(newWS);
      
      // Always include Signal Vercel Visits as the first widget
      const priorityWidget = TEMPLATES.find(t => t.config.id === 'mreycode-signal-vercel-app-total-visits');
      const otherTemplates = TEMPLATES.filter(t => t.config.id !== 'mreycode-signal-vercel-app-total-visits');
      
      // Select 4 more random widgets from the remaining templates
      const shuffled = [...otherTemplates].sort(() => 0.5 - Math.random());
      const selected = priorityWidget ? [priorityWidget, ...shuffled.slice(0, 4)] : shuffled.slice(0, 5);
      
      let lastId: string | null = null;
      for (const t of selected) {
        const uniqueId = `${t.config.id}-${Math.random().toString(36).substring(2, 6)}`;
        await saveTempWidget({ ...t.config, id: uniqueId } as WidgetConfig, lastId, randomId);
        lastId = uniqueId;
      }
      
      router.replace(`/?workspace=${randomId}`);
      return;
    }

    // Auto-redirect to first workspace if on root and workspaces exist
    if (!workspaceId && ws.length > 0) {
      router.replace(`/?workspace=${ws[0].id}`);
      return;
    }

    const currentWidgets = await getTempWidgetsAsync(workspaceId);
    setTempWidgets(currentWidgets);
    setHistoryWidgets(getHistoryWidgets(workspaceId));
  };

  useEffect(() => {
    loadData();
  }, [workspaceId, router]);

  const currentWorkspaceName = useMemo(() => {
    if (!workspaceId) return "";
    return workspaces.find(w => w.id === workspaceId)?.name || "Unknown Workspace";
  }, [workspaceId, workspaces]);

  const allWidgets = useMemo(() => {
    // Workspaces start as a blank canvas (only show tempWidgets)
    return mergeWidgets([], tempWidgets);
  }, [tempWidgets]);

  const filteredWidgets = useMemo(() => {
    if (!widgetSearch.trim()) return allWidgets;
    const searchLow = widgetSearch.toLowerCase();
    return allWidgets.filter(w => 
      w.label?.toLowerCase().includes(searchLow) || 
      w.type?.toLowerCase().includes(searchLow)
    );
  }, [allWidgets, widgetSearch]);

  const handleSaveWidget = async (config: WidgetConfig, afterId: string | null) => {
    try {
      const currentLimit = settings.storageType === 'supabase' ? settings.maxWidgetsPerWorkspace : MAX_WIDGETS_PER_WORKSPACE;
      
      if (tempWidgets.length >= currentLimit && !tempWidgets.find(w => w.config.id === config.id)) {
         throw new Error(`Workspace limit reached. Maximum ${currentLimit} widgets allowed.`);
      }
      await saveTempWidget(config, afterId, workspaceId);
      const updated = await getTempWidgetsAsync(workspaceId);
      setTempWidgets(updated);
      setWidgetToEdit(null);
      setIsModalOpen(false);
    } catch (e: any) {
      showAlert({
        title: "Error Saving Widget",
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

  const handleCopyWidget = (config: WidgetConfig) => {
    // Generate a new unique ID for the copy to avoid conflicts
    const newId = `${config.id}-copy-${Date.now().toString().slice(-4)}`;
    const copiedConfig = { ...config, id: newId };
    
    // We treat copying as creating a new widget (after the original one)
    setWidgetToEdit({ config: copiedConfig, afterId: config.id });
    handleParamChange("modal", "new");
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
      await deleteTempWidget(id, workspaceId);
      const updatedTemp = await getTempWidgetsAsync(workspaceId);
      setTempWidgets(updatedTemp);
      setHistoryWidgets(getHistoryWidgets(workspaceId));
    }
  };

  const handleRestoreFromHistory = async (id: string) => {
    try {
      await restoreWidgetFromHistory(id, workspaceId);
      const updatedTemp = await getTempWidgetsAsync(workspaceId);
      setTempWidgets(updatedTemp);
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

  const handleRestoreAllHistory = async () => {
    try {
      await restoreAllHistory(workspaceId);
      const updatedTemp = await getTempWidgetsAsync(workspaceId);
      setTempWidgets(updatedTemp);
      setHistoryWidgets(getHistoryWidgets(workspaceId));
      setIsHistoryOpen(false);
    } catch (e: any) {
      showAlert({
        title: "Partial Restore",
        message: "Some widgets were not restored because the workspace limit was reached.",
        type: "warning"
      });
      const updatedTemp = await getTempWidgetsAsync(workspaceId);
      setTempWidgets(updatedTemp);
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
    if (settings.storageType === 'supabase' && workspaces.length >= settings.maxWorkspaces) {
      showAlert({
        title: "Workspace Limit Reached",
        message: `You have reached the maximum of ${settings.maxWorkspaces} workspaces allowed in cloud sync. Please delete an existing one to add more.`,
        type: "warning"
      });
      return;
    }

    const suffixes = ["Hub", "Nexus", "Pulse", "Flow", "Vibe", "Base", "Core", "Node"];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomName = `${randomSuffix}-${Math.floor(Math.random() * 999)}`;

    setWorkspaceModal({
      isOpen: true,
      mode: 'add',
      title: 'Add New Workspace',
      initialValue: randomName.slice(0, 15)
    });
  };

  const handleRenameWorkspace = async (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (!ws) return;

    const currentWidgets = (await getTempWidgetsAsync(wsId)).map(tw => tw.config);
    setWorkspaceModal({
      isOpen: true,
      mode: 'rename',
      title: 'Edit Workspace',
      initialValue: ws.name,
      targetId: wsId,
      initialSelectedWidgets: currentWidgets
    });
  };

  const handleCopyWorkspace = async (wsId: string | null) => {
    if (settings.storageType === 'supabase' && workspaces.length >= settings.maxWorkspaces) {
      showAlert({
        title: "Workspace Limit Reached",
        message: `You have reached the maximum of ${settings.maxWorkspaces} workspaces allowed in cloud sync. Please delete an existing one to copy more.`,
        type: "warning"
      });
      return;
    }

    const ws = workspaces.find(w => w.id === wsId);
    const sourceName = ws ? ws.name : "Main Dashboard";
    
    setWorkspaceModal({
      isOpen: true,
      mode: 'copy',
      title: 'Copy Workspace',
      initialValue: `${sourceName.slice(0, 8)} (Copy)`,
      targetId: wsId
    });
  };

  const handleWorkspaceConfirm = async (name: string, selectedWidgets: WidgetConfig[]) => {
    const { mode, targetId } = workspaceModal;

    try {
      if (mode === 'add') {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
        const newWS = { id, name: name.trim(), createdAt: Date.now() };
        await saveWorkspace(newWS);
        
        // Initialize with selected widgets in order
        let lastId: string | null = null;
        for (const config of selectedWidgets) {
          const uniqueId = `${config.id}-${Math.random().toString(36).substring(2, 6)}`;
          await saveTempWidget({ ...config, id: uniqueId } as WidgetConfig, lastId, id);
          lastId = uniqueId;
        }

        const wsList = await getWorkspacesAsync();
        setWorkspaces(wsList);
        const params = new URLSearchParams(searchParams.toString());
        params.set("workspace", id);
        if (isTVMode) params.set("tv-mode", "yes");
        router.push(`/?${params.toString()}`);
      } else if (mode === 'rename' && targetId) {
        await updateWorkspace(targetId, name.trim());
        
        // reconcile widgets: delete those removed, update/add those kept/added
        const currentInDb = await getTempWidgetsAsync(targetId);
        const selectedIds = new Set(selectedWidgets.map(w => w.id));
        
        // Remove permanently deleted ones
        for (const tw of currentInDb) {
          if (!selectedIds.has(tw.config.id)) {
            await deleteTempWidget(tw.config.id, targetId, true);
          }
        }

        // Save order
        let lastId: string | null = null;
        for (const config of selectedWidgets) {
          let finalConfig = { ...config };
          // If it's a template (not an instance), generate ID
          const isTemplate = TEMPLATES.some(t => t.config.id === config.id);
          if (isTemplate) {
            finalConfig.id = `${config.id}-${Math.random().toString(36).substring(2, 6)}`;
          }
          
          await saveTempWidget(finalConfig, lastId, targetId);
          lastId = finalConfig.id;
        }

        const wsList = await getWorkspacesAsync();
        setWorkspaces(wsList);
        const updatedTemp = await getTempWidgetsAsync(workspaceId);
        setTempWidgets(updatedTemp);
      } else if (mode === 'copy') {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
        const newWS = { id, name: name.trim(), createdAt: Date.now() };
        await saveWorkspace(newWS);

        // Initialize with selected widgets in order
        let lastId: string | null = null;
        for (const config of selectedWidgets) {
          const uniqueId = `${config.id}-${Math.random().toString(36).substring(2, 6)}`;
          await saveTempWidget({ ...config, id: uniqueId } as WidgetConfig, lastId, id);
          lastId = uniqueId;
        }

        const wsList = await getWorkspacesAsync();
        setWorkspaces(wsList);
        const params = new URLSearchParams(searchParams.toString());
        params.set("workspace", id);
        if (isTVMode) params.set("tv-mode", "yes");
        router.push(`/?${params.toString()}`);
      }
    } catch (e: any) {
      showAlert({
        title: "Workspace Error",
        message: e.message,
        type: "error"
      });
      throw e;
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
      await deleteWorkspace(wsId);
      const wsList = await getWorkspacesAsync();
      setWorkspaces(wsList);
      if (workspaceId === wsId) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("workspace");
        if (isTVMode) params.set("tv-mode", "yes");
        router.push(`/?${params.toString()}`);
      }
    }
  };

  const handleClearAll = async () => {
    const confirmed = await showAlert({
      title: "Remove All Widgets",
      message: "This will move all widgets in this workspace to history. You can restore them from the history bin if needed.",
      type: "warning",
      showCancel: true,
      confirmText: "Remove All",
      cancelText: "Cancel"
    });

    if (confirmed) {
      const current = await getTempWidgetsAsync(workspaceId);
      for (const w of current) {
        await deleteTempWidget(w.config.id, workspaceId);
      }
      setTempWidgets([]);
      setHistoryWidgets(getHistoryWidgets(workspaceId));
    }
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async (exportData: { name: string; widgets: WidgetConfig[] }) => {
    // Simulate slight delay for the progress bar to feel natural
    await new Promise(resolve => setTimeout(resolve, 1500));

    const dateFormatted = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const timeFormatted = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const fullTimestamp = `${dateFormatted}-${timeFormatted}`;

    const data = {
      workspaceName: exportData.name,
      version: appConfig.version,
      widgets: exportData.widgets.map((w, index) => ({
        ...w,
        exportOrder: index // Explicitly track order for individual workspace export
      })),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportData.name.toLowerCase().replace(/\s+/g, '-')}-v${appConfig.version}-${fullTimestamp}.json`;
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
        const existing = await getWorkspacesAsync();
        const nameExists = existing.some(ws => ws.name.toLowerCase() === rawName.toLowerCase());
        const finalName = nameExists ? `${rawName} (Imported)` : rawName;

        setImportFileData({
          workspaceName: finalName,
          widgets: data.widgets
        });
        setIsImportModalOpen(true);
        
        // Clear input
        e.target.value = "";
      } catch (err: any) {
        showAlert({ title: "Import Error", message: err.message, type: "error" });
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async (importData: { name: string; widgets: WidgetConfig[] }) => {
    if (settings.storageType === 'supabase' && workspaces.length >= settings.maxWorkspaces) {
      showAlert({
        title: "Import Limit Reached",
        message: `Your cloud storage is limited to ${settings.maxWorkspaces} workspaces. Please clear space to import this new workspace.`,
        type: "warning"
      });
      return;
    }

    // Simulate slight delay for the progress bar
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const newWsId = `ws-import-${Date.now()}`;
      const newWorkspace = {
        id: newWsId,
        name: importData.name.trim(),
        createdAt: Date.now()
      };
      
      saveWorkspace(newWorkspace);
      
      // Sort by exportOrder if available, then import with positional tracking
      const sortedWidgets = [...importData.widgets].sort((a: any, b: any) => 
        (a.exportOrder ?? 0) - (b.exportOrder ?? 0)
      );

      let lastId: string | null = null;
      sortedWidgets.forEach((config: WidgetConfig) => {
        saveTempWidget(config, lastId, newWsId);
        lastId = config.id;
      });
      
      // Direct window location change to refresh state
      window.location.href = `/?workspace=${newWsId}`;
    } catch (err: any) {
      showAlert({ title: "Import Failed", message: err.message, type: "error" });
    }
  };


  return (
    <div className={cn("flex flex-col gap-4 pb-32", isTVMode && "pt-6")}>
      {!isTVMode ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-[56px] z-10 bg-background dark:bg-background flex flex-col lg:flex-row items-start lg:items-end justify-between border-b border-border pb-4 gap-4"
        >
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 relative" ref={workspaceDropdownRef}>
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
                    {workspaces.length}
                  </span>
                </div>
                <ChevronDown size={16} className={cn("text-muted transition-transform duration-300", isWorkspaceOpen && "rotate-180")} />
              </button>

              {/* Widget Search Field - Mac Spotlight Style */}
              <div className="flex w-full sm:w-64 ml-0 sm:ml-4">
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className={cn(
                    "flex-1 flex items-center justify-between border px-3 py-1.5 text-xs transition-all group",
                    widgetSearch 
                      ? "bg-primary/20 border-primary/40 text-primary font-semibold rounded-l-md" 
                      : "bg-foreground/5 border-border/50 text-muted hover:bg-foreground/10 hover:text-foreground rounded-md"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Search size={14} className={cn(widgetSearch ? "text-primary" : "group-hover:text-primary transition-colors shrink-0")} />
                    <span className="truncate">
                      {widgetSearch ? `Filtered: ${widgetSearch}` : "Search widgets..."}
                    </span>
                  </div>
                  {!widgetSearch && (
                    <div className="flex items-center gap-1 font-mono text-[10px] font-bold bg-background/50 px-1.5 py-0.5 rounded border border-border/50 text-muted shrink-0 ml-2">
                      <kbd className="font-sans">⌘</kbd>K
                    </div>
                  )}
                </button>
                {widgetSearch && (
                  <button
                    onClick={() => setWidgetSearch("")}
                    className="flex items-center justify-center px-2 border border-l-0 border-primary/40 bg-primary/20 text-primary hover:bg-primary/30 hover:text-red-400 transition-colors rounded-r-md"
                    title="Clear filter"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>

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
                      <span className="text-[10px] font-black text-muted/50">{workspaces.length} TOTAL</span>
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
                      {workspaces
                        .filter(ws => ws.name.toLowerCase().includes(workspaceSearch.toLowerCase()))
                        .map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("workspace", ws.id);
                            if (isTVMode) params.set("tv-mode", "yes");
                            router.push(`/?${params.toString()}`);
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

                      {workspaces.filter(ws => ws.name.toLowerCase().includes(workspaceSearch.toLowerCase())).length === 0 && (
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
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap shrink-0 overflow-visible mt-2 lg:mt-0">

            {tempWidgets.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 rounded-[4px] whitespace-nowrap"
                title="Remove all widgets from workspace"
              >
                <Trash2 size={14} />
                Remove All
              </button>
            )}
            
            {historyWidgets.length > 0 && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-all border border-border/40 hover:border-border rounded-[4px] whitespace-nowrap bg-panel/30"
                title="View deleted widgets"
              >
                <div className="relative">
                  <Archive size={14} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
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
              Add Widget
            </button>

            <div className="h-6 w-px bg-border mx-1 hidden lg:block" />

            {/* Desktop Export/Import */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                 onClick={handleExport}
                 className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-all hover:bg-muted/10 rounded-[4px]"
                 title="Export workspace configuration"
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <label 
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-muted/10 cursor-pointer transition-all rounded-[4px]"
                title="Import workspace configuration"
              >
                <Upload size={14} />
                <span>Import</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Mobile/Tablet More Menu */}
            <div className="relative lg:hidden" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-2 text-muted hover:text-foreground transition-colors rounded-md hover:bg-muted/10"
              >
                <MoreVertical size={18} />
              </button>

              <AnimatePresence>
                {isMoreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-panel shadow-2xl backdrop-blur-md flex flex-col p-1"
                  >
                    <button
                       onClick={() => {
                         handleExport();
                         setIsMoreMenuOpen(false);
                       }}
                       className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-muted hover:text-foreground transition-all hover:bg-muted/10 rounded-sm text-left w-full"
                    >
                      <Download size={14} />
                      Export
                    </button>

                    <label 
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-muted/10 cursor-pointer transition-all rounded-sm text-left w-full"
                    >
                      <Upload size={14} />
                      Import
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={(e) => {
                          handleImport(e);
                          setIsMoreMenuOpen(false);
                        }} 
                        className="hidden" 
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="contents">
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
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => moveCarousel("prev")}
                  className="relative overflow-hidden p-3.5 hover:bg-primary/10 rounded-2xl transition-all text-muted hover:text-primary active:scale-90 bg-white/5 border border-white/5 hover:border-primary/30 group/prev flex items-center justify-center"
                  title="Previous Workspace (Left Arrow)"
                >
                  <ArrowLeft size={22} className="relative z-10 group-hover/prev:-translate-x-1.5 transition-transform duration-300 ease-out" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/prev:opacity-100 blur-xl transition-opacity" />
                </button>
                <div className="relative" ref={workspaceDropdownRef}>
                  <button 
                    onClick={() => {
                      setIsWorkspaceOpen(!isWorkspaceOpen);
                      if (isWorkspaceOpen) setWorkspaceSearch("");
                    }}
                    className="flex flex-col items-center px-4 py-2 group/ws transition-all hover:bg-foreground/5 rounded-xl border border-transparent hover:border-white/5"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted/40 leading-none mb-1.5 group-hover/ws:text-primary transition-colors">Active View</span>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-foreground uppercase tracking-tighter leading-none text-center min-w-[120px]">
                        {currentWorkspaceName}
                      </h2>
                      <ChevronDown size={14} className={cn("text-muted/40 transition-transform duration-300", isWorkspaceOpen && "rotate-180")} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isWorkspaceOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 10, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 z-50 w-72 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-background/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                      >
                        <div className="p-4 border-b border-white/5 bg-white/5">
                          <div className="relative group/search">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within/search:text-primary transition-colors" />
                            <input
                              type="text"
                              placeholder="Search Workspace..."
                              value={workspaceSearch}
                              onChange={(e) => setWorkspaceSearch(e.target.value)}
                              className="w-full bg-background/40 border-none rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-bold uppercase tracking-wider"
                              autoFocus
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar bg-black/20">
                          {workspaces
                            .filter(ws => ws.name.toLowerCase().includes(workspaceSearch.toLowerCase()))
                            .map((ws) => (
                              <button
                                key={ws.id}
                                onClick={() => {
                                  const params = new URLSearchParams(searchParams.toString());
                                  params.set("workspace", ws.id);
                                  if (isTVMode) params.set("tv-mode", "yes");
                                  router.push(`/?${params.toString()}`);
                                  setIsWorkspaceOpen(false);
                                  setWorkspaceSearch("");
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all mb-1 group/item",
                                  workspaceId === ws.id
                                    ? "bg-primary/20 border border-primary/20 shadow-lg shadow-primary/5" 
                                    : "hover:bg-white/5 border border-transparent"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "text-xs font-black uppercase tracking-wider transition-colors",
                                    workspaceId === ws.id ? "text-primary" : "text-muted group-hover/item:text-foreground"
                                  )}>
                                    {ws.name}
                                  </span>
                                  <span className="text-[9px] font-bold opacity-30 mt-0.5 uppercase tracking-widest">
                                    {new Date(ws.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                {workspaceId === ws.id ? (
                                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Check size={12} className="text-primary" strokeWidth={3} />
                                  </div>
                                ) : (
                                  <ChevronRight size={14} className="text-muted/20 group-hover/item:text-muted transition-all group-hover/item:translate-x-0.5" />
                                )}
                              </button>
                            ))}
                          
                          {workspaces.filter(ws => ws.name.toLowerCase().includes(workspaceSearch.toLowerCase())).length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                              <Search size={24} className="mb-2" />
                              <span className="text-[10px] font-black uppercase tracking-widest">No Matches</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 border-t border-white/5 bg-white/5">
                          <button
                            onClick={() => {
                              handleAddWorkspace();
                              setIsWorkspaceOpen(false);
                              setWorkspaceSearch("");
                            }}
                            className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground hover:bg-white/5 transition-all"
                          >
                            <Plus size={14} />
                            New Workspace
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={() => moveCarousel("next")}
                  className="relative overflow-hidden p-3.5 hover:bg-primary/10 rounded-2xl transition-all text-muted hover:text-primary active:scale-90 bg-white/5 border border-white/5 hover:border-primary/30 group/next flex items-center justify-center"
                  title="Next Workspace (Right Arrow)"
                >
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/next:opacity-100 blur-xl transition-opacity" />
                  <ArrowRight size={22} className="relative z-10 group-hover/next:translate-x-1.5 transition-transform duration-300 ease-out" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <ConnectivityStatus />
              <div className="h-4 w-px bg-border/30" />
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
              <div className="flex items-center gap-4">
                <RefreshButton />
                <ThemeToggle />
                <div className="h-6 w-px bg-border/20 mx-1" />
                <Clock />
              </div>
            </div>
          </div>

          {/* Full-Height Navigation Touch Zones for TV Mode - Optimized for Tablet/Remote */}
        {/* Floating Navigation Arrows for TV Mode - Elegant Glassmorphism */}
        {workspaces.length > 0 && (
          <>
            {/* Left Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveCarousel("prev");
              }}
              className="fixed left-8 top-1/2 -translate-y-1/2 z-50 group/nav-prev active:scale-95 transition-all"
              title="Previous Workspace (Left Arrow)"
            >
              <div className="p-4 rounded-full bg-background/5 backdrop-blur-md border border-white/5 text-muted/20 group-hover/nav-prev:text-primary group-hover/nav-prev:scale-110 group-hover/nav-prev:bg-background/10 transition-all shadow-2xl">
                <ArrowLeft size={32} strokeWidth={2.5} className="group-hover/nav-prev:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Right Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveCarousel("next");
              }}
              className="fixed right-8 top-1/2 -translate-y-1/2 z-50 group/nav-next active:scale-95 transition-all"
              title="Next Workspace (Right Arrow)"
            >
              <div className="p-4 rounded-full bg-background/5 backdrop-blur-md border border-white/5 text-muted/20 group-hover/nav-next:text-primary group-hover/nav-next:scale-110 group-hover/nav-next:bg-background/10 transition-all shadow-2xl">
                <ArrowRight size={32} strokeWidth={2.5} className="group-hover/nav-next:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Mobile/Tablet Specific Bottom Navigation Indicator for TV Mode */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex md:hidden items-center gap-6 p-4 rounded-3xl bg-background/5 backdrop-blur-2xl border border-white/5 shadow-2xl">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted/40 whitespace-nowrap">
                  WS {workspaces.findIndex(w => w.id === workspaceId) + 1} / {workspaces.length}
                </span>
              </div>
            </div>
          </>
        )}
        </div>
      )}
      
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {workspaceId ? (
          <motion.div
            key={workspaceId}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.05}
            onDragEnd={(_, info) => {
              const swipeThreshold = 50;
              if (info.offset.x > swipeThreshold) {
                moveCarousel("prev");
              } else if (info.offset.x < -swipeThreshold) {
                moveCarousel("next");
              }
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex-1 touch-pan-y"
          >
            <WidgetGrid 
              configs={filteredWidgets} 
              onEdit={handleEditWidget}
              onDelete={handleDeleteWidget}
              onCopy={handleCopyWidget}
              maximizedWidgetId={maximizedWidgetId}
              onMaximizeChange={(id) => handleParamChange("widget", id)}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center px-6"
          >
            <div className="mb-12 relative">
               <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
               <div className="relative p-8 bg-panel border-2 border-primary/20 rounded-[40px] shadow-2xl backdrop-blur-3xl animate-float">
                  <LayoutDashboard size={80} className="text-primary" />
               </div>
               <div className="absolute -bottom-4 -right-4 h-12 w-12 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-xl rotate-12">
                  <Plus size={24} strokeWidth={3} />
               </div>
            </div>
            
            <h2 className="text-4xl font-black tracking-tight uppercase mb-4 text-foreground leading-[1.1]">
               Welcome to <span className="text-primary tracking-tighter italic">Signal</span>
            </h2>
            <p className="text-lg text-muted font-medium mb-12 leading-relaxed">
               This represents the peak of performance tracking. Create your first workspace to start monitoring your signals with surgical precision.
            </p>
            
            <button
              onClick={handleAddWorkspace}
              className="group relative flex items-center gap-4 bg-foreground text-background px-10 py-5 rounded-2xl text-base font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-foreground/90 transition-all active:scale-[0.98]"
            >
              <span>Create Workspace</span>
              <div className="p-1 rounded-lg bg-background/20 group-hover:translate-x-1 transition-transform">
                 <Plus size={20} />
              </div>
            </button>
            
            <div className="mt-16 grid grid-cols-3 gap-8 opacity-40">
               <div className="flex flex-col items-center gap-2">
                  <LayoutDashboard size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-nowrap">Infinity Layout</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Database size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-nowrap">100% Local</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Check size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-nowrap">Fast Deployment</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


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

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleConfirmExport}
        defaultName={`${currentWorkspaceName}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`}
        availableWidgets={allWidgets.map(({ isTemp, ...config }: any) => config)}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFileData(null);
        }}
        onConfirm={handleConfirmImport}
        initialData={importFileData}
      />

      <WorkspaceModal
        isOpen={workspaceModal.isOpen}
        onClose={() => setWorkspaceModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleWorkspaceConfirm}
        mode={workspaceModal.mode}
        title={workspaceModal.title}
        initialValue={workspaceModal.initialValue}
        availableWidgets={useMemo(() => 
          workspaceModal.mode === 'copy' 
            ? allWidgets.map(({ isTemp, ...config }: any) => config) 
            : TEMPLATES.map(t => t.config),
          [workspaceModal.mode, allWidgets]
        )}
        initialSelectedWidgets={workspaceModal.initialSelectedWidgets}
      />

      {/* Spotlight Search Modal */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchModalOpen(false)}
              className="absolute inset-0 bg-background/30 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-panel border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center px-4 py-4 border-b border-border bg-background focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <Search size={20} className="text-muted shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="Search widgets by name or type..."
                  value={widgetSearch}
                  onChange={(e) => setWidgetSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsSearchModalOpen(false);
                  }}
                  className="flex-1 bg-transparent border-none text-base placeholder:text-muted/50 focus:outline-none focus:ring-0 text-foreground"
                  autoFocus
                />
                {widgetSearch && (
                  <button
                    onClick={() => setWidgetSearch("")}
                    className="p-1.5 text-muted hover:text-foreground transition-colors ml-2 bg-muted/10 hover:bg-muted/20 rounded-md"
                  >
                    <CloseIcon size={16} />
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] font-bold bg-muted/10 px-2 py-1 rounded border border-border/50 text-muted ml-3">
                   ESC
                </div>
              </div>

              {widgetSearch && (
                <div className="p-2 max-h-[40vh] overflow-y-auto custom-scrollbar bg-muted/5">
                  {filteredWidgets.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {filteredWidgets.map((widget) => (
                        <button
                          key={widget.id}
                          onClick={() => setIsSearchModalOpen(false)}
                          className="flex items-center justify-between p-3 rounded-md hover:bg-foreground/5 transition-colors text-left group"
                        >
                           <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold text-foreground">{widget.label || "Unnamed Widget"}</span>
                              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{widget.type}</span>
                           </div>
                           <Check size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                       <Search size={32} className="text-muted/30" />
                       <p className="text-sm text-muted">No widgets found matching "<span className="text-foreground">{widgetSearch}</span>"</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
