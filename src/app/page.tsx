import { DashboardView } from "@/components/dashboard/dashboard-view";
import { dashboardWidgets } from "@/config/dashboard";
import type { Metadata } from 'next';
import { appConfig } from "@/config/app";

export const metadata: Metadata = {
  title: "Real-time Metrics Dashboard",
  description: "Monitor your system performance with our elegant, bento-style real-time analytics dashboard.",
};


export default function Home() {
  return (
    <div className="w-full h-full">
      <DashboardView configs={dashboardWidgets} />
    </div>
  );
}
