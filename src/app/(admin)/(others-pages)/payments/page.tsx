"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface Payment {
    id: string;
    amount: number;
    paymentMethod: string;
    reference: string;
    status: 'pending' | 'verified' | 'rejected';
    proofImage?: string;
    customer?: { fullName: string; email: string };
    order?: { orderNumber: string; totalAmount: number };
    invoice?: { invoiceNumber: string };
    verifier?: { name: string };
    createdAt: string;
    notes?: string;
}

import PlanGuard from "@/components/common/PlanGuard";

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

    // Modal State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [viewPayment, setViewPayment] = useState<Payment | null>(null);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/payments?status=${filterStatus}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data);
            }
        } catch (error) {
            console.error("Failed to fetch payments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [filterStatus]);

    const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
        if (!confirm(`Are you sure you want to mark this payment as ${status}?`)) return;

        try {
            const res = await fetch(`/api/payments/${id}/verify`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    verifiedBy: 'user-id-placeholder' // In real app, get from session
                })
            });

            if (res.ok) {
                toast.success(`Payment ${status}`);
                fetchPayments();
                setViewPayment(null);
            } else {
                toast.error("Failed to verify payment");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error verifying payment");
        }
    };

    return (
        <PlanGuard feature="payments">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Verification</h1>
                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                    >
                        + Manual Entry
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['all', 'pending', 'verified', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filterStatus === status
                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Reference</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No payments found</td></tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{payment.reference || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{payment.paymentMethod}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 dark:text-white">{payment.customer?.fullName || 'Guest'}</div>
                                            <div className="text-xs text-gray-500">{payment.customer?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {payment.order && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        Order: {payment.order.orderNumber}
                                                    </span>
                                                )}
                                                {payment.invoice && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                        Inv: {payment.invoice.invoiceNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            RM {Number(payment.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={payment.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setViewPayment(payment)}
                                                className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* View/Verify Modal */}
                {viewPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Details</h3>
                                <button onClick={() => setViewPayment(null)} className="text-gray-400 hover:text-gray-500">✕</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Amount</label>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">RM {Number(viewPayment.amount).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Status</label>
                                        <div className="mt-1"><StatusBadge status={viewPayment.status} /></div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Reference</label>
                                        <p className="text-gray-700 dark:text-gray-300">{viewPayment.reference || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Method</label>
                                        <p className="text-gray-700 dark:text-gray-300 capitalize">{viewPayment.paymentMethod}</p>
                                    </div>
                                </div>

                                {viewPayment.proofImage && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase mb-2 block">Proof Receipt</label>
                                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <Image
                                                src={viewPayment.proofImage}
                                                alt="Proof"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <a href={viewPayment.proofImage} target="_blank" className="text-xs text-brand-600 hover:underline mt-1 block">View Full Image</a>
                                    </div>
                                )}

                                {viewPayment.status === 'pending' && (
                                    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            onClick={() => handleVerify(viewPayment.id, 'rejected')}
                                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleVerify(viewPayment.id, 'verified')}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                                        >
                                            Verify & Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Entry Component would go here (or imported) */}
                {isManualModalOpen && (
                    <ManualPaymentModal onClose={() => setIsManualModalOpen(false)} onSuccess={fetchPayments} />
                )}
            </div>
        </PlanGuard>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        verified: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${(colors as any)[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
}

// Temporary internal component for Manual Entry
function ManualPaymentModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: 'cash',
        reference: '',
        invoiceId: '',
        notes: ''
    });

    useEffect(() => {
        // Fetch invoices for selection
        fetch('/api/documents/invoices')
            .then(res => res.json())
            .then(data => {
                // Show all invoices including Paid ones, just in case we need to backfill payment records
                setInvoices(data);
            })
            .catch(err => console.error("Failed to load invoices", err));
    }, []);

    const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const invoiceId = e.target.value;
        const selectedInvoice = invoices.find(inv => inv.id === invoiceId);

        if (selectedInvoice) {
            setFormData(prev => ({
                ...prev,
                invoiceId: invoiceId,
                amount: selectedInvoice.total?.toString() || '',
                notes: `Payment for Invoice ${selectedInvoice.invoiceNumber}`
            }));
        } else {
            setFormData(prev => ({ ...prev, invoiceId: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    status: 'verified' // Manual entry by admin is auto-verified
                })
            });
            if (res.ok) {
                toast.success("Payment recorded");
                onSuccess();
                onClose();
            } else {
                toast.error("Failed");
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Manual Payment Entry</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Link Invoice</label>
                        <select
                            className="w-full p-2 border rounded"
                            onChange={handleInvoiceChange}
                            value={formData.invoiceId}
                        >
                            <option value="">-- Select Invoice --</option>
                            {invoices.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.invoiceNumber} - {inv.customerName} (RM {inv.total}) {inv.status === 'Paid' ? '[PAID]' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <input required type="number" className="w-full p-2 border rounded"
                            step="0.01"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Method</label>
                        <select className="w-full p-2 border rounded"
                            value={formData.paymentMethod}
                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reference / Note</label>
                        <input className="w-full p-2 border rounded"
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })} />
                    </div>
                    <div className="pt-2 flex gap-2 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded">
                            {loading ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
