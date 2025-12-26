'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface OrderView {
    orderNumber: string;
    status: string;
    customerName?: string;
    items: {
        name: string;
        quantity: number;
        status?: string;
    }[];
    createdAt: string;
    dueDate?: string;
    deliveryMethod?: string;
    trackingNumber?: string;
}

// Outline Icons matching the steps
const icons = {
    new_order: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    ),
    designing: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
    ),
    in_production: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    completed: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    shipped: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    ),
};

const steps = [
    { id: 'new_order', label: 'Order Placed', icon: icons.new_order },
    { id: 'designing', label: 'Designing', icon: icons.designing },
    { id: 'in_production', label: 'Production', icon: icons.in_production },
    { id: 'completed', label: 'Completed', icon: icons.completed },
    { id: 'shipped', label: 'Shipped', icon: icons.shipped },
];

const statusMap: Record<string, number> = {
    'new_order': 0,
    'pending_artwork': 0,
    'designing': 1,
    'proof_sent': 1,
    'design_revision': 1,
    'artwork_ready': 1,
    'in_production': 2,
    'qc_check': 2,
    'completed': 3,
    'ready_to_ship': 3,
    'shipped': 4,
    'delivered': 4,
    'collected': 4,
};

export default function OrderTrackingPage() {
    const params = useParams();
    const orderNumber = params?.orderNumber as string;

    const [order, setOrder] = useState<OrderView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!orderNumber) return;

        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/view/order/${orderNumber}`);
                if (!res.ok) throw new Error('Order not found');
                const data = await res.json();
                setOrder(data);
            } catch (err) {
                setError('Order not found or invalid link.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderNumber]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
                    <div className="text-error-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    const currentStepIndex = statusMap[order.status] ?? 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
            <style jsx global>{`
                @keyframes progress-loading {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
                .animate-progress {
                    background: linear-gradient(90deg, 
                        var(--brand-500) 0%, 
                        var(--brand-400) 25%, 
                        var(--brand-300) 50%, 
                        var(--brand-400) 75%, 
                        var(--brand-500) 100%
                    );
                    background-size: 200% 100%;
                    animation: progress-loading 2s infinite linear;
                }
            `}</style>

            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-theme-xs p-6 border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                            <p className="text-gray-500 text-sm mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-100">
                            {order.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </div>
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="bg-white rounded-2xl shadow-theme-xs p-8 border border-gray-100 overflow-hidden">
                    <h2 className="text-lg font-semibold text-gray-900 mb-8">Order Progress</h2>
                    <div className="relative">
                        {/* Connecting Line (Background) */}
                        <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full -z-0"></div>

                        {/* Connecting Line (Active) - Animated */}
                        <div
                            className="absolute top-5 left-0 h-1 rounded-full -z-0 transition-all duration-1000 ease-out animate-progress"
                            style={{
                                width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                                // Force plain color if completed, animation only if in progress
                                animation: order.status === 'delivered' || order.status === 'collected' ? 'none' : 'progress-loading 2s infinite linear',
                                backgroundColor: order.status === 'delivered' || order.status === 'collected' ? 'var(--brand-500)' : undefined
                            }}
                        ></div>

                        <div className="relative z-10 flex justify-between w-full">
                            {steps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div key={step.id} className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
                                                ${isCompleted
                                                    ? 'border-brand-500 text-brand-500 shadow-md shadow-brand-500/10'
                                                    : 'border-gray-200 text-gray-300'
                                                }
                                                ${isCurrent ? 'scale-110 ring-4 ring-brand-50' : ''}
                                            `}
                                        >
                                            {/* Icon */}
                                            {step.icon}
                                        </div>
                                        <span className={`mt-3 text-xs sm:text-sm font-medium transition-colors duration-300 text-center max-w-[80px]
                                            ${isCompleted ? 'text-gray-900' : 'text-gray-400'}
                                        `}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Shipping Info if Shipped */}
                    {(order.status === 'shipped' || order.status === 'delivered') && order.trackingNumber && (
                        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
                            <div className="bg-white p-2 rounded-lg shadow-xs text-blue-500">
                                🚚
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900">Tracking Information</h3>
                                <p className="text-blue-700 text-sm mt-1 mb-2">
                                    Your package is on its way via {order.deliveryMethod?.toUpperCase() || 'Courier'}.
                                </p>
                                <div className="font-mono bg-white px-3 py-1.5 rounded-lg border border-blue-100 inline-block text-blue-800 text-sm select-all">
                                    {order.trackingNumber}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Items & Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Items List */}
                    <div className="md:col-span-2 bg-white rounded-2xl shadow-theme-xs border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
                        <div className="divide-y divide-gray-100">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="py-4 flex items-start gap-4 first:pt-0 last:pb-0">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                        📦
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                        {item.status && (
                                            <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {item.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-theme-xs border border-gray-100 p-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Customer</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                    {order.customerName?.charAt(0) || 'C'}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{order.customerName || 'Customer'}</p>
                                </div>
                            </div>
                        </div>

                        {order.dueDate && (
                            <div className="bg-white rounded-2xl shadow-theme-xs border border-gray-100 p-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Estimated Completion</h3>
                                <p className="text-lg font-bold text-gray-900">
                                    {new Date(order.dueDate).toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 pb-4 text-gray-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} EJ Event Management. All rights reserved.</p>
                </div>

            </div>
        </div>
    );
}
