import { DashboardView } from "@/components/dashboard/dashboard-view";
import { dashboardWidgets } from "@/config/dashboard";

export default function Home() {
  return (
    <div className="w-full h-full">
      <DashboardView configs={dashboardWidgets} />
    </div>
  );
}
