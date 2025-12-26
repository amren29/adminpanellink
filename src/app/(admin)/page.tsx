import type { Metadata } from "next";
import React from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardHealth } from "@/components/dashboard/DashboardHealth";
import { DashboardAction } from "@/components/dashboard/DashboardAction";

export const metadata: Metadata = {
  title: "Print Shop Boss Dashboard | Next.js Admin",
  description: "Complete overview of your print business",
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Section 1: The Pulse (Metrics) */}
      <DashboardMetrics />

      {/* Section 2: The Health (Charts & To-Do) */}
      <DashboardHealth />

      {/* Section 3: The Action (Finance & KPI) */}
      <DashboardAction />
    </div>
  );
}
