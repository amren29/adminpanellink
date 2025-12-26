"use client";
import React, { useEffect, useState } from "react";
import { ProductionAnalytics } from "./ProductionAnalytics";
import Link from "next/link";

interface UrgentOrder {
    id: string;
    orderNumber: string;
    status: string;
    priority: string;
    dueDate: string | null;
    customer: { fullName: string } | null;
}

export const DashboardHealth = () => {
    const [urgentOrders, setUrgentOrders] = useState<UrgentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (data.success && data.data.urgentOrdersList) {
                    setUrgentOrders(data.data.urgentOrdersList);
                }
            } catch (error) {
                console.error('Failed to fetch urgent orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Format date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No due date';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `${Math.abs(diffDays)} days overdue`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        }
        return `Due in ${diffDays} days`;
    };

    // Get priority color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30';
            case 'high':
                return 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30';
            default:
                return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30';
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'urgent') {
            return (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        if (priority === 'high') {
            return (
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    };

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 md:gap-6">
            {/* Revenue Trend Chart (2/3 width) -> Replaced with Production Analytics */}
            <div className="col-span-1 xl:col-span-2">
                <ProductionAnalytics />
            </div>

            {/* Urgent Orders List (1/3 width) */}
            <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Urgent Attention
                    </h3>
                    <Link
                        href="/production-board"
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
                                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded mt-0.5" />
                                <div className="flex-1">
                                    <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                    <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : urgentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-800 dark:text-white">All Clear!</h4>
                        <p className="text-sm text-gray-500 mt-1">No urgent orders at the moment</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {urgentOrders.map((order) => (
                            <Link
                                key={order.id}
                                href="/production-board"
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:scale-[1.02] ${getPriorityColor(order.priority)}`}
                            >
                                <div className="mt-0.5">
                                    {getPriorityIcon(order.priority)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                        Order #{order.orderNumber}
                                    </h5>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {order.customer?.fullName || 'Unknown Customer'} • {formatDate(order.dueDate)}
                                    </p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.priority === 'urgent'
                                    ? 'bg-red-500 text-white'
                                    : order.priority === 'high'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-blue-500 text-white'
                                    }`}>
                                    {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
