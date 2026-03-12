import { useEffect, useRef, useState, useMemo } from "react";
import type { WidgetConfig } from "@/types/widget";
import { WidgetCard } from "./widget-card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { saveTempWidget, getTempWidgetsAsync } from "@/lib/widgets";
import { useSearchParams } from "next/navigation";

export function WidgetGrid({ 
  configs, 
  onEdit, 
  onDelete,
  onCopy,
  maximizedWidgetId,
  onMaximizeChange,
  isEditMode = false
}: { 
  configs: WidgetConfig[]; 
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopy?: (config: WidgetConfig) => void;
  maximizedWidgetId?: string | null;
  onMaximizeChange?: (id: string | null) => void;
  isEditMode?: boolean;
}) {
  const [items, setItems] = useState<WidgetConfig[]>(configs);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspace");

  // Reset selection when exiting edit mode
  useEffect(() => {
    if (!isEditMode) {
      setSelectedId(null);
    }
  }, [isEditMode]);

  useEffect(() => {
    setItems(configs);
  }, [configs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setSelectedId(event.active.id as string); // Selecting on drag start
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Persist the new order
      try {
        // In this implementation, we need to update the afterId for the moved widget
        // and potentially others if they depend on it.
        // A simple way is to re-save all widgets in their new order.
        let prevId: string | null = null;
        for (const config of newItems) {
            // We use the same config but update its relative position
            await saveTempWidget(config, prevId, workspaceId);
            prevId = config.id;
        }
      } catch (error) {
        console.error("Failed to save widget order", error);
      }
    }
  };

  const activeWidget = useMemo(
    () => items.find((item) => item.id === activeId),
    [items, activeId]
  );
  const [visibleCount, setVisibleCount] = useState(6);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < configs.length) {
          setVisibleCount((prev) => Math.min(prev + 4, configs.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [configs.length, visibleCount]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex flex-col gap-6 w-full">
        <SortableContext 
          items={items.map(item => item.id)} 
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap items-stretch gap-4">
            {items.slice(0, visibleCount).map((config, index) => (
              <WidgetCard 
                key={config.id} 
                config={config} 
                allConfigs={items}
                index={index} 
                onEdit={onEdit}
                onDelete={onDelete}
                onCopy={onCopy}
                isMaximized={config.id === maximizedWidgetId}
                onMaximize={(max) => onMaximizeChange?.(typeof max === 'string' ? max : (max ? config.id : null))}
                isEditMode={isEditMode}
                isSelected={selectedId === config.id}
                onSelect={() => isEditMode && setSelectedId(config.id)}
              />
            ))}
            {/* Ensure the maximized widget is ALWAYS rendered so its fixed overlay is visible 
                even if it's not in the initial visible slice */}
            {maximizedWidgetId && !items.slice(0, visibleCount).some(c => c.id === maximizedWidgetId) && (
              items.filter(c => c.id === maximizedWidgetId).map((config, index) => (
                <div key={config.id} className="hidden">
                  <WidgetCard 
                    config={config} 
                    allConfigs={items}
                    index={index} 
                    isMaximized={true}
                    onMaximize={(max) => onMaximizeChange?.(typeof max === 'string' ? max : (max ? config.id : null))}
                    isEditMode={isEditMode}
                  />
                </div>
              ))
            )}
          </div>
        </SortableContext>
        
        {visibleCount < items.length && (
          <div ref={observerRef} className="h-10 w-full" />
        )}
      </div>

      <DragOverlay 
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}
      >
        {activeId && activeWidget ? (
          <div className="w-full h-full pointer-events-none opacity-90 scale-[1.05] transition-transform duration-200 ease-out z-50 rotate-1">
            <div className="shadow-2xl shadow-primary/30 ring-2 ring-primary/40 rounded-[4px] overflow-hidden">
              <WidgetCard 
                config={activeWidget} 
                index={0}
                allConfigs={items}
                minimal={true}
                readOnly={true}
              />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
