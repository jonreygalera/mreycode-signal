import { DashboardView } from "@/components/dashboard/dashboard-view";
import { dashboardWidgets } from "@/config/dashboard";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "mreycode-signal",
  description: "A single-page, elegant, bento-style metrics dashboard.",
};

export default function Home() {
  return (
    <div className="w-full h-full">
      <DashboardView configs={dashboardWidgets} />
    </div>
  );
}
