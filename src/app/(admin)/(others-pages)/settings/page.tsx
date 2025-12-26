"use client";
import React from "react";
import PlanGuard from "@/components/common/PlanGuard";
import DepartmentsSettings from "@/components/settings/DepartmentsSettings";

export default function SettingsPage() {
    return (
        <PlanGuard feature="pricingEngine">
            <div>
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Pricing Engine</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Configure department pricing options
                        </p>
                    </div>
                    <nav>
                        <ol className="flex items-center gap-2 text-sm">
                            <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                            <li className="text-gray-400 dark:text-gray-500">/</li>
                            <li className="text-brand-500">Pricing Engine</li>
                        </ol>
                    </nav>
                </div>

                {/* Departments Settings */}
                <DepartmentsSettings />
            </div>
        </PlanGuard>
    );
}
