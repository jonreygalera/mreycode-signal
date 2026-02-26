import { DashboardView } from "@/components/dashboard/dashboard-view";
import { dashboardWidgets } from "@/config/dashboard";
import type { Metadata } from 'next';
import { appConfig } from "@/config/app";

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
};

export default function Home() {
  return (
    <div className="w-full h-full">
      <DashboardView configs={dashboardWidgets} />
    </div>
  );
}
