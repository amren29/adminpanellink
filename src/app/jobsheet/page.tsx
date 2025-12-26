"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface OrderData {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    items: {
        name: string;
        quantity: number;
        specifications: string;
    }[];
    proof?: {
        description: string;
        fileName: string;
        status: string;
        approvedAt: string;
        fileUrl: string;
    };
    notes: string;
}

function JobsheetContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;

            setLoading(true);
            try {
                // Fetch order details from API
                const res = await fetch(`/api/orders/${orderId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Order not found');
                    } else {
                        setError('Failed to fetch order');
                    }
                    return;
                }

                const data = await res.json();

                // Get latest approved proof if any
                const approvedProof = data.proofs?.find((p: any) => p.status === 'approved');
                const latestProof = data.proofs?.[0];
                const proofToUse = approvedProof || latestProof;

                setOrder({
                    orderNumber: data.orderNumber,
                    customerName: data.customer?.fullName || 'Unknown',
                    customerEmail: data.customer?.email || '',
                    customerPhone: data.customer?.phone || '',
                    dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-MY') : 'Not set',
                    totalAmount: parseFloat(data.totalAmount) || 0,
                    paidAmount: parseFloat(data.paidAmount) || 0,
                    items: (data.items || []).map((item: any) => ({
                        name: item.name || 'Unknown Product',
                        quantity: item.quantity || 1,
                        specifications: item.specifications || 'N/A',
                    })),
                    proof: proofToUse ? {
                        description: proofToUse.description || '',
                        fileName: proofToUse.proofFileName || 'proof.pdf',
                        status: proofToUse.status || 'pending',
                        approvedAt: proofToUse.approvedAt || proofToUse.createdAt,
                        fileUrl: proofToUse.proofFileUrl || '#',
                    } : undefined,
                    notes: data.notes || '',
                });
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Failed to load order');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const today = new Date().toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const handlePrint = () => {
        window.print();
    };

    if (!orderId) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-gray-800">Invalid Jobsheet Link</h1>
                    <p className="text-gray-500 mt-2">Please provide a valid order ID.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading jobsheet...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-800">{error || 'Order Not Found'}</h1>
                    <p className="text-gray-500 mt-2">Unable to load jobsheet for this order.</p>
                </div>
            </div>
        );
    }

    const hasApprovedProof = order.proof?.status === 'approved';
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const primaryItem = order.items[0];

    return (
        <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
            {/* Print Button - Hidden when printing */}
            <div className="max-w-3xl mx-auto mb-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Jobsheet
                </button>
            </div>

            {/* Jobsheet Content */}
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50 print:bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">PRODUCTION JOBSHEET</h1>
                            <p className="text-sm text-gray-500 mt-1">Generated: {today}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-mono font-bold text-gray-800">{order.orderNumber}</div>
                            {hasApprovedProof ? (
                                <div className="mt-1 px-3 py-1 inline-block text-xs font-bold text-white bg-green-500 rounded-full">
                                    ✓ PROOF APPROVED
                                </div>
                            ) : (
                                <div className="mt-1 px-3 py-1 inline-block text-xs font-bold text-white bg-yellow-500 rounded-full">
                                    PENDING APPROVAL
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customer Section */}
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500">Name</label>
                            <p className="text-gray-800 font-medium">{order.customerName}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Email</label>
                            <p className="text-gray-800">{order.customerEmail || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Phone</label>
                            <p className="text-gray-800">{order.customerPhone || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Due Date</label>
                            <p className="text-gray-800 font-bold text-red-600">{order.dueDate}</p>
                        </div>
                    </div>
                </div>

                {/* Product Section */}
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Product Details</h2>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 mb-3">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500">Quantity</label>
                                    <p className="text-gray-800 font-bold text-xl">{item.quantity} pcs</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Specifications</label>
                                    <p className="text-gray-800">{item.specifications}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Print Notes Section */}
                {order.notes && (
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Print Instructions / Notes</h2>
                        <p className="text-gray-800 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                )}

                {/* Proof Section */}
                {order.proof && (
                    <div className={`p-6 border-b border-gray-200 ${hasApprovedProof ? 'bg-green-50 print:bg-green-100' : 'bg-yellow-50 print:bg-yellow-100'}`}>
                        <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${hasApprovedProof ? 'text-green-800' : 'text-yellow-800'}`}>
                            {hasApprovedProof ? 'Approved Proof' : 'Pending Proof'}
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">{order.proof.description}</p>
                                {hasApprovedProof && order.proof.approvedAt && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Approved on: {new Date(order.proof.approvedAt).toLocaleString('en-MY')}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 print:hidden">
                                {order.proof.fileUrl && order.proof.fileUrl !== '#' && (
                                    <>
                                        <a
                                            href={order.proof.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:bg-gray-50 ${hasApprovedProof ? 'text-green-700 border-green-300' : 'text-yellow-700 border-yellow-300'}`}
                                        >
                                            View Proof
                                        </a>
                                        <a
                                            href={order.proof.fileUrl}
                                            download
                                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${hasApprovedProof ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                                        >
                                            Download
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Section */}
                <div className="p-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Status</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-gray-800">RM {order.totalAmount.toFixed(2)}</p>
                            {order.paidAmount >= order.totalAmount ? (
                                <p className="text-sm text-green-600 font-medium">✓ Fully Paid</p>
                            ) : order.paidAmount > 0 ? (
                                <p className="text-sm text-yellow-600 font-medium">Partially Paid</p>
                            ) : (
                                <p className="text-sm text-red-600 font-medium">Unpaid</p>
                            )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            Paid: RM {order.paidAmount.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 print:bg-white">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="border-r border-gray-200">
                            <p className="text-xs text-gray-500">Prepared By</p>
                            <div className="h-12 border-b border-dotted border-gray-400 mt-4 mb-2"></div>
                            <p className="text-xs text-gray-400">Sign &amp; Date</p>
                        </div>
                        <div className="border-r border-gray-200">
                            <p className="text-xs text-gray-500">Printed By</p>
                            <div className="h-12 border-b border-dotted border-gray-400 mt-4 mb-2"></div>
                            <p className="text-xs text-gray-400">Sign &amp; Date</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">QC Checked</p>
                            <div className="h-12 border-b border-dotted border-gray-400 mt-4 mb-2"></div>
                            <p className="text-xs text-gray-400">Sign &amp; Date</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}

// Wrapper component with Suspense boundary
export default function JobsheetPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading jobsheet...</p>
                </div>
            </div>
        }>
            <JobsheetContent />
        </Suspense>
    );
}
