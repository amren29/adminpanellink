"use client";

import { useState, useEffect, useCallback } from 'react';
import { usePlan } from "@/context/PlanContext";
import PricingTable from "@/components/pricing/PricingTable";
import dynamic from 'next/dynamic';
import { CreditCardIcon, XMarkIcon, PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';

// Dynamic import to avoid SSR issues with Stripe Elements
const StripeCardForm = dynamic(() => import('@/components/billing/StripeCardForm'), {
    ssr: false,
    loading: () => <div className="p-4 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div></div>
});

interface PaymentMethod {
    id: string;
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    planName: string;
    status: 'paid' | 'pending' | 'failed';
}

interface ScheduledChange {
    newPlanSlug: string;
    newPlanName: string;
    effectiveDate: string;
}

const PLAN_ORDER = ['free', 'basic', 'pro', 'enterprise'];
const PLAN_PRICES = { free: 0, basic: 299, pro: 599, enterprise: 999 };
const PLAN_NAMES = { free: 'Free', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };

export default function BillingPage() {
    const { planName, planSlug, subscription, refreshPlan } = usePlan();
    const [showPricing, setShowPricing] = useState(false);
    const [showAddCard, setShowAddCard] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [scheduledChange, setScheduledChange] = useState<ScheduledChange | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null);

    // Fetch payment methods from Stripe API
    const fetchPaymentMethods = useCallback(async () => {
        try {
            setLoadingMethods(true);
            const res = await fetch('/api/billing/payment-methods');
            const data = await res.json();
            if (data.paymentMethods) {
                setPaymentMethods(data.paymentMethods);
            }
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        } finally {
            setLoadingMethods(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        fetchPaymentMethods();

        const savedInvoices = localStorage.getItem('billing_invoices');
        const savedScheduledChange = localStorage.getItem('scheduled_plan_change');

        if (savedInvoices) {
            setInvoices(JSON.parse(savedInvoices));
        } else {
            const initialInvoices: Invoice[] = [
                {
                    id: 'INV-001001',
                    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    amount: 299,
                    planName: 'Basic',
                    status: 'paid',
                },
            ];
            setInvoices(initialInvoices);
            localStorage.setItem('billing_invoices', JSON.stringify(initialInvoices));
        }

        if (savedScheduledChange) {
            setScheduledChange(JSON.parse(savedScheduledChange));
        }
    }, [fetchPaymentMethods]);

    // Update invoices when plan changes
    useEffect(() => {
        if (subscription?.currentPeriodStart && planName !== 'Basic') {
            const newInvoice: Invoice = {
                id: `INV-${Date.now().toString().slice(-6)}`,
                date: subscription.currentPeriodStart,
                amount: planSlug === 'pro' ? 599 : planSlug === 'enterprise' ? 999 : 299,
                planName: planName,
                status: 'paid',
            };

            const existingInvoices = JSON.parse(localStorage.getItem('billing_invoices') || '[]');
            const exists = existingInvoices.some((inv: Invoice) =>
                new Date(inv.date).toDateString() === new Date(newInvoice.date).toDateString() &&
                inv.planName === newInvoice.planName
            );

            if (!exists) {
                const updatedInvoices = [newInvoice, ...existingInvoices];
                setInvoices(updatedInvoices);
                localStorage.setItem('billing_invoices', JSON.stringify(updatedInvoices));
            }
        }
    }, [subscription, planName, planSlug]);

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    // Quick upgrade - uses Stripe Checkout if configured, otherwise database
    const handleQuickUpgrade = async (targetPlanSlug: string) => {
        setIsProcessing(true);

        try {
            // Try Stripe Checkout first
            const stripeRes = await fetch('/api/billing/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planSlug: targetPlanSlug,
                    billingCycle: 'monthly',
                }),
            });

            // Handle unauthorized (not logged in)
            if (stripeRes.status === 401) {
                alert('Please complete your account setup or login first.');
                window.location.href = '/signin';
                return;
            }

            const stripeData = await stripeRes.json();

            // If Stripe Checkout URL is returned, redirect to it
            if (stripeData.url) {
                window.location.href = stripeData.url;
                return;
            }

            // Fallback: Direct database upgrade (when Stripe not configured)
            const res = await fetch('/api/billing/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planSlug: targetPlanSlug,
                    billingCycle: 'monthly',
                }),
            });

            if (res.status === 401) {
                alert('Please complete your account setup or login first.');
                window.location.href = '/signin';
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Upgrade failed');
            }

            // Clear any scheduled downgrade
            setScheduledChange(null);
            localStorage.removeItem('scheduled_plan_change');

            await refreshPlan();
            alert(`Successfully upgraded to ${PLAN_NAMES[targetPlanSlug as keyof typeof PLAN_NAMES]}!`);
        } catch (error) {
            console.error('Upgrade error:', error);
            alert(error instanceof Error ? error.message : 'Failed to process upgrade. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Schedule downgrade - takes effect at end of billing period
    const handleConfirmDowngrade = () => {
        if (!downgradeTarget) return;

        const effectiveDate = subscription?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const change: ScheduledChange = {
            newPlanSlug: downgradeTarget,
            newPlanName: PLAN_NAMES[downgradeTarget as keyof typeof PLAN_NAMES],
            effectiveDate,
        };

        setScheduledChange(change);
        localStorage.setItem('scheduled_plan_change', JSON.stringify(change));
        setDowngradeTarget(null);
    };

    const handleCancelScheduledChange = () => {
        setScheduledChange(null);
        localStorage.removeItem('scheduled_plan_change');
    };

    // Card added successfully via StripeCardForm
    const handleCardAdded = () => {
        setShowAddCard(false);
        fetchPaymentMethods();
    };

    // Delete card via Stripe API
    const handleDeleteCard = async (id: string) => {
        const method = paymentMethods.find(m => m.id === id);
        if (method?.isDefault && paymentMethods.length > 1) {
            alert('Please set another card as default before deleting this one.');
            return;
        }

        try {
            const res = await fetch('/api/billing/payment-methods', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethodId: id }),
            });

            if (!res.ok) throw new Error('Failed to delete card');

            fetchPaymentMethods();
        } catch (error) {
            console.error('Delete card error:', error);
            alert('Failed to delete card. Please try again.');
        }
    };

    // Set default payment method via Stripe API
    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetch('/api/billing/payment-methods', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethodId: id }),
            });

            if (!res.ok) throw new Error('Failed to set default');

            fetchPaymentMethods();
        } catch (error) {
            console.error('Set default error:', error);
            alert('Failed to set default card. Please try again.');
        }
    };

    const handleDownloadInvoice = (invoice: Invoice) => {
        const content = `INVOICE\n=======\n\nInvoice ID: ${invoice.id}\nDate: ${new Date(invoice.date).toLocaleDateString()}\nPlan: ${invoice.planName}\nAmount: RM ${invoice.amount.toFixed(2)}\nStatus: ${invoice.status.toUpperCase()}\n\nThank you for your business!`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const currentPlanIndex = PLAN_ORDER.indexOf(planSlug || 'basic');
    const canUpgradeTo = PLAN_ORDER.filter((_, i) => i > currentPlanIndex && _ !== 'enterprise');
    const canDowngradeTo = PLAN_ORDER.filter((_, i) => i < currentPlanIndex);

    // Pricing Table View
    if (showPricing) {
        return (
            <div className="relative isolate overflow-hidden bg-white dark:bg-gray-900">
                <div className="px-6 py-4">
                    <button
                        onClick={() => setShowPricing(false)}
                        className="text-sm font-semibold leading-6 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        &larr; Back to Billing Dashboard
                    </button>
                </div>
                <PricingTable />
            </div>
        );
    }

    return (
        <>
            {/* Downgrade Confirmation Modal */}
            {downgradeTarget && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={() => setDowngradeTarget(null)} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Confirm Downgrade
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Downgrade to {PLAN_NAMES[downgradeTarget as keyof typeof PLAN_NAMES]}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        <strong>No refunds:</strong> You will continue to have access to your current <strong>{planName}</strong> plan features until your billing period ends on{' '}
                                        <strong>
                                            {subscription?.currentPeriodEnd
                                                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                                : 'the end of your current period'}
                                        </strong>.
                                    </p>
                                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                                        After that, your plan will change to <strong>{PLAN_NAMES[downgradeTarget as keyof typeof PLAN_NAMES]}</strong>.
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setDowngradeTarget(null)}
                                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmDowngrade}
                                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500"
                                    >
                                        Confirm Downgrade
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-10">
                    {/* Subscription Section */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
                        <div className="px-4 sm:px-0">
                            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Subscription</h2>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                Manage your plan and billing.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-xl md:col-span-2">
                            <div className="px-4 py-6 sm:p-8">
                                {/* Current Plan */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Plan</h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{planName}</span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                RM {PLAN_PRICES[planSlug as keyof typeof PLAN_PRICES] || 299}/mo
                                            </span>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
                                        Active
                                    </span>
                                </div>

                                {/* Scheduled Change Notice */}
                                {scheduledChange && (
                                    <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                                        <div className="flex items-start gap-3">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                                    Your plan will change to <strong>{scheduledChange.newPlanName}</strong> on{' '}
                                                    {new Date(scheduledChange.effectiveDate).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}.
                                                </p>
                                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                                    You'll continue to have access to {planName} features until then.
                                                </p>
                                                <button
                                                    onClick={handleCancelScheduledChange}
                                                    className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
                                                >
                                                    Cancel scheduled change
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Plan Details */}
                                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Next Billing Date</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {subscription?.currentPeriodEnd
                                                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {/* Upgrade buttons */}
                                        {canUpgradeTo.map(targetSlug => (
                                            <button
                                                key={targetSlug}
                                                onClick={() => handleQuickUpgrade(targetSlug)}
                                                disabled={isProcessing}
                                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ArrowUpIcon className="h-4 w-4" />
                                                Upgrade to {PLAN_NAMES[targetSlug as keyof typeof PLAN_NAMES]}
                                                <span className="text-blue-200">RM{PLAN_PRICES[targetSlug as keyof typeof PLAN_PRICES]}/mo</span>
                                            </button>
                                        ))}

                                        {/* Downgrade buttons */}
                                        {canDowngradeTo.map(targetSlug => (
                                            <button
                                                key={targetSlug}
                                                onClick={() => setDowngradeTarget(targetSlug)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                                <ArrowDownIcon className="h-4 w-4" />
                                                Downgrade to {PLAN_NAMES[targetSlug as keyof typeof PLAN_NAMES]}
                                            </button>
                                        ))}

                                        {/* Compare Plans link */}
                                        <button
                                            onClick={() => setShowPricing(true)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Compare All Plans
                                        </button>
                                    </div>
                                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                        {canUpgradeTo.length > 0 && "Upgrades take effect immediately. "}
                                        {canDowngradeTo.length > 0 && "Downgrades take effect at end of billing period (no refunds)."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Details Section */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
                        <div className="px-4 sm:px-0">
                            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Billing Details</h2>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                This information appears on invoices.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-xl md:col-span-2">
                            <div className="px-4 py-6 sm:p-8">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            defaultValue="My Company Sdn Bhd"
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax ID / SST No.</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Email</label>
                                        <input
                                            type="email"
                                            defaultValue="billing@mycompany.com"
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="+60 12-345 6789"
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Address</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Street address, City, State, Postcode"
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods Section */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
                        <div className="px-4 sm:px-0">
                            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Payment Methods</h2>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                Cards will be charged monthly.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-xl md:col-span-2">
                            <div className="px-4 py-6 sm:p-8">
                                <ul role="list" className="space-y-4">
                                    {paymentMethods.map((method) => (
                                        <li key={method.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 p-4 gap-4 sm:gap-0">
                                            <div className="flex items-center">
                                                <CreditCardIcon className="h-8 w-8 text-gray-400" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {method.brand} ending in {method.last4}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Expires {method.expMonth}/{method.expYear}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {method.isDefault ? (
                                                    <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                                                        Default
                                                    </span>
                                                ) : (
                                                    <button onClick={() => handleSetDefault(method.id)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                                        Set default
                                                    </button>
                                                )}
                                                {!method.isDefault && (
                                                    <button onClick={() => handleDeleteCard(method.id)} className="text-gray-400 hover:text-red-500">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {showAddCard ? (
                                    <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add New Card</h4>
                                            <button type="button" onClick={() => setShowAddCard(false)} className="text-gray-400 hover:text-gray-600">
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <StripeCardForm
                                            onSuccess={handleCardAdded}
                                            onCancel={() => setShowAddCard(false)}
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-6">
                                        <button onClick={() => setShowAddCard(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500">
                                            <PlusIcon className="h-4 w-4" />
                                            Add new payment method
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Billing History Section */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 pb-8">
                        <div className="px-4 sm:px-0">
                            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Billing History</h2>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                View past invoices.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-xl md:col-span-2 overflow-hidden">
                            <div className="overflow-x-auto">
                                {invoices.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No invoices yet
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-300 dark:divide-white/10">
                                        <thead>
                                            <tr>
                                                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 dark:text-white sm:pl-6">Invoice</th>
                                                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-white">Date</th>
                                                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-white">Plan</th>
                                                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-white">Amount</th>
                                                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Download</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{invoice.id}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{invoice.planName}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">RM {invoice.amount.toFixed(2)}</td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                        <button onClick={() => handleDownloadInvoice(invoice)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900">
                                                            Download
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
