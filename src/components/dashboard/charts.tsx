"use client";

import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartProps = {
  data: any[];
  xKey: string;
  yKey: string;
  className?: string;
  prefix?: string;
};

// Custom tooltip for better styling
const CustomTooltip = ({ active, payload, label, prefix }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-border bg-panel p-2 shadow-sm font-mono text-sm leading-tight">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-foreground tracking-tight font-medium">
          {prefix}{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function WidgetLineChart({ data, xKey, yKey, className, prefix }: ChartProps) {

  return (
    <div className={cn("h-full w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" className="opacity-50" />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-muted)" }} minTickGap={30} />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip content={<CustomTooltip prefix={prefix} />} cursor={{ stroke: 'var(--color-muted)', strokeDasharray: '4 4' }} />
        <Line type="monotone" dataKey={yKey} stroke="var(--color-up)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--color-up)" }} />
      </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WidgetAreaChart({ data, xKey, yKey, className, prefix }: ChartProps) {
  return (
    <div className={cn("h-full w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-up)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-up)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" className="opacity-50" />
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-muted)" }} minTickGap={30} />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip content={<CustomTooltip prefix={prefix} />} cursor={{ stroke: 'var(--color-muted)', strokeDasharray: '4 4' }} />
          <Area type="monotone" dataKey={yKey} stroke="var(--color-up)" strokeWidth={2} fillOpacity={1} fill="url(#colorY)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WidgetBarChart({ data, xKey, yKey, className, prefix }: ChartProps) {
  return (
    <div className={cn("h-full w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" className="opacity-50" />
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-muted)" }} />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip prefix={prefix} />} cursor={{ fill: 'var(--color-muted)', opacity: 0.1 }} />
          <Bar dataKey={yKey} fill="var(--color-up)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
