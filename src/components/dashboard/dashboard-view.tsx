"use client";

import { motion } from "framer-motion";
import { WidgetConfig } from "@/types/widget";
import { WidgetGrid } from "./widget-grid";

export function DashboardView({ configs }: { configs: WidgetConfig[] }) {
  return (
    <div className="flex flex-col gap-4 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-row items-center justify-between border-b border-border pb-4"
      >
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-foreground uppercase">
            Metrics Overview
          </h1>
          <p className="text-sm text-muted">
            Monitor key performance indicators
          </p>
        </div>
      </motion.div>
      <WidgetGrid configs={configs} />
    </div>
  );
}
