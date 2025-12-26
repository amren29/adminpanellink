"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import {
    DollarLineIcon,
    BoxCubeIcon,
    AlertIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from "@/icons";
import Link from "next/link";

// Dashboard stats type
interface DashboardStats {
    totalRevenue: number;
    monthlyRevenue: number;
    revenueChange: number;
    revenueSparkline: number[];
    totalOrders: number;
    activeOrders: number;
    urgentOrders: number;
    lateOrders: number;
    inProduction: number;
    productionLoad: number;
    pendingWalletAmount: number;
    pendingWalletCount: number;
}

// Mini sparkline component
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg className="w-20 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="opacity-60"
            />
        </svg>
    );
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const DashboardMetrics = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Loading skeleton
    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="mt-5">
                            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                            <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            {/* <!-- Metric 1: Total Revenue --> */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 hover:-translate-y-1">
                {/* Gradient accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl dark:from-green-900/30 dark:to-emerald-900/20 shadow-sm">
                        <DollarLineIcon className="text-green-600 size-6 dark:text-green-400" />
                    </div>
                    <Sparkline data={stats?.revenueSparkline || []} color="#22c55e" />
                </div>

                <div className="relative flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Monthly Revenue
                        </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-2xl dark:text-white/90 tracking-tight">
                            RM {formatCurrency(stats?.monthlyRevenue || 0)}
                        </h4>
                    </div>
                    <Badge color={stats?.revenueChange && stats.revenueChange >= 0 ? "success" : "error"}>
                        {stats?.revenueChange && stats.revenueChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                        {Math.abs(stats?.revenueChange || 0)}%
                    </Badge>
                </div>
            </div>

            {/* <!-- Metric 2: Production Load --> */}
            <Link href="/production-board" className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1">
                {/* Gradient accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl dark:from-blue-900/30 dark:to-indigo-900/20 shadow-sm">
                        <BoxCubeIcon className="text-blue-600 size-6 dark:text-blue-400" />
                    </div>
                    {/* Progress ring */}
                    <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                                cx="24" cy="24" r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-gray-100 dark:text-gray-800"
                            />
                            <circle
                                cx="24" cy="24" r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={125.6}
                                strokeDashoffset={125.6 * (1 - (stats?.productionLoad || 0) / 100)}
                                className="text-blue-500 transition-all duration-500"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                            {stats?.productionLoad || 0}%
                        </span>
                    </div>
                </div>

                <div className="relative flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Active Orders
                        </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-2xl dark:text-white/90 tracking-tight">
                            {stats?.activeOrders || 0} Active
                        </h4>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-3 py-1.5 rounded-full font-medium">
                        {stats?.inProduction || 0} In Production
                    </span>
                </div>
            </Link>

            {/* <!-- Metric 3: Attention --> */}
            <Link href="/production-board" className={`group relative overflow-hidden rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${(stats?.lateOrders || 0) > 0
                    ? 'border-2 border-red-200 bg-gradient-to-br from-red-50 to-white dark:border-red-900/50 dark:from-red-900/20 dark:to-transparent hover:shadow-lg hover:shadow-red-500/10'
                    : 'border border-green-200 bg-gradient-to-br from-green-50 to-white dark:border-green-900/50 dark:from-green-900/20 dark:to-transparent hover:shadow-lg hover:shadow-green-500/10'
                }`}>
                {/* Animated pulse background */}
                {(stats?.lateOrders || 0) > 0 && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}

                <div className="relative flex items-center justify-between">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-sm ${(stats?.lateOrders || 0) > 0
                            ? 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/50 dark:to-rose-900/30 animate-[pulse_2s_ease-in-out_infinite]'
                            : 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/50 dark:to-emerald-900/30'
                        }`}>
                        <AlertIcon className={`size-6 ${(stats?.lateOrders || 0) > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`} />
                    </div>
                    {(stats?.lateOrders || 0) > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">URGENT</span>
                        </div>
                    ) : (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-1 rounded-full">All Good!</span>
                    )}
                </div>

                <div className="relative flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {(stats?.lateOrders || 0) > 0 ? 'Late/Urgent Jobs' : 'Job Status'}
                        </span>
                        <h4 className={`mt-2 font-bold text-2xl tracking-tight ${(stats?.lateOrders || 0) > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                            {(stats?.lateOrders || 0) > 0
                                ? `${stats?.lateOrders} Late`
                                : 'On Track ✓'}
                        </h4>
                    </div>
                    {(stats?.urgentOrders || 0) > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                            {stats?.urgentOrders} Urgent
                        </span>
                    )}
                </div>
            </Link>

            {/* <!-- Metric 4: Wallet Requests --> */}
            <Link href="/wallet" className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 hover:-translate-y-1">
                {/* Gradient accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl dark:from-orange-900/30 dark:to-amber-900/20 shadow-sm">
                        <DollarLineIcon className="text-orange-600 size-6 dark:text-orange-400" />
                    </div>
                    <Sparkline data={stats?.revenueSparkline?.map((_, i) => Math.random() * 50 + 20) || []} color="#f97316" />
                </div>

                <div className="relative flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Wallet Requests
                        </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-2xl dark:text-white/90 tracking-tight">
                            RM {formatCurrency(stats?.pendingWalletAmount || 0)}
                        </h4>
                    </div>
                    {(stats?.pendingWalletCount || 0) > 0 ? (
                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            {stats?.pendingWalletCount} Pending
                        </span>
                    ) : (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">No Pending</span>
                    )}
                </div>
            </Link>
        </div>
    );
};
