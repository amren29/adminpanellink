"use client";

import { usePlan } from "@/context/PlanContext";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/solid";

interface PlanGuardProps {
    feature: string;
    children: React.ReactNode;
    fallbackUrl?: string; // Optional URL to redirect if needed, but we use modal
}

export default function PlanGuard({ feature, children }: PlanGuardProps) {
    const { can, isLoading } = usePlan();

    if (isLoading) {
        // Can render a skeleton here, or just null
        return <div className="animate-pulse h-96 w-full bg-gray-100 dark:bg-gray-800 rounded-xl" />;
    }

    const hasAccess = can(feature);

    if (hasAccess) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full min-h-[600px]">
            {/* Blurred Content Layer */}
            <div className="absolute inset-0 z-0 filter blur-md opacity-50 pointer-events-none select-none overflow-hidden">
                {children}
            </div>

            {/* Modal Overlay Layer */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 max-w-md mx-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                        <LockClosedIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Feature Locked</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        This feature is available on the <strong>Pro</strong> or <strong>Enterprise</strong> plan.
                        Upgrade your account to unlock full access.
                    </p>
                    <Link
                        href="/billing"
                        className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-full"
                    >
                        View Upgrade Options
                    </Link>
                </div>
            </div>
        </div>
    );
}
