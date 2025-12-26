"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Proof approval storage key
const PROOF_APPROVAL_KEY = 'proof_approvals';

// Get stored approvals from localStorage
const getStoredApprovals = (): Record<string, { status: string; comment?: string; timestamp: string }> => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(PROOF_APPROVAL_KEY);
    return stored ? JSON.parse(stored) : {};
};

// Save approval to localStorage
const saveApproval = (proofId: string, status: string, comment?: string) => {
    const approvals = getStoredApprovals();
    approvals[proofId] = {
        status,
        comment,
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem(PROOF_APPROVAL_KEY, JSON.stringify(approvals));

    // Dispatch custom event to notify other tabs/components
    window.dispatchEvent(new CustomEvent('proofApprovalChanged', {
        detail: { proofId, status, comment }
    }));
};

function ProofReviewContent() {
    const searchParams = useSearchParams();
    const proofId = searchParams.get('id');

    const [status, setStatus] = useState<'pending' | 'approved' | 'revision'>('pending');
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [notFound, setNotFound] = useState(false); // New state for invalid links
    const [proofData, setProofData] = useState<{
        orderNumber: string;
        customerName: string;
        product: string;
        quantity: number;
        specifications: string;
        proof: {
            description: string;
            fileName: string;
            fileUrl: string;
        }
    } | null>(null);

    // Fetch proof data based on ID (approvalLink)
    useEffect(() => {
        const fetchProofFromAPI = async () => {
            setNotFound(false);

            if (!proofId) return;

            console.log('[ProofReview] Looking for proof with approvalLink:', proofId);

            try {
                // Fetch proof directly from database using approvalLink
                const res = await fetch(`/api/proofs?approvalLink=${encodeURIComponent(proofId)}`);

                if (!res.ok) {
                    if (res.status === 404) {
                        console.log('[ProofReview] Proof not found in database');
                        setNotFound(true);
                        return;
                    }
                    throw new Error('Failed to fetch proof');
                }

                const proofData = await res.json();
                console.log('[ProofReview] Found proof:', proofData);

                // Check if already approved/revision from localStorage fallback
                const approvals = getStoredApprovals();
                if (approvals[proofId]) {
                    setStatus(approvals[proofId].status as 'approved' | 'revision');
                    setComment(approvals[proofId].comment || '');
                    setSubmitted(true);
                } else if (proofData.status === 'approved') {
                    setStatus('approved');
                    setSubmitted(true);
                } else if (proofData.status === 'needs_revision') {
                    setStatus('revision');
                    setSubmitted(true);
                }

                // Set proof data for display
                const order = proofData.order;
                setProofData({
                    orderNumber: order?.orderNumber || 'Unknown',
                    customerName: order?.customer?.fullName || 'Unknown',
                    product: order?.items?.[0]?.name || 'Unknown Product',
                    quantity: order?.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0,
                    specifications: order?.items?.[0]?.specifications || 'N/A',
                    proof: {
                        description: proofData.description || 'Please review the attached proof.',
                        fileName: proofData.proofFileName || 'proof-document.pdf',
                        fileUrl: proofData.proofFileUrl || proofData.imageUrl || '#',
                    }
                });
            } catch (error) {
                console.error('[ProofReview] Error fetching proof:', error);
                setNotFound(true);
            }
        };

        fetchProofFromAPI();
    }, [proofId]);

    const handleApprove = async () => {
        if (!proofId) return;

        try {
            // Save to database
            await fetch('/api/proofs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvalLink: proofId, status: 'approved' }),
            });
        } catch (error) {
            console.error('Failed to save approval to database:', error);
        }

        // Also save to localStorage as fallback
        saveApproval(proofId, 'approved');

        setStatus('approved');
        setSubmitted(true);
    };

    const handleRequestRevision = async () => {
        if (!proofId) return;

        if (!comment.trim()) {
            alert('Please provide feedback for the revision request.');
            return;
        }

        try {
            // Save to database
            await fetch('/api/proofs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvalLink: proofId,
                    status: 'needs_revision',
                    customerComment: comment
                }),
            });
        } catch (error) {
            console.error('Failed to save revision to database:', error);
        }

        // Also save to localStorage as fallback
        saveApproval(proofId, 'needs-revision', comment);

        setStatus('revision');
        setSubmitted(true);
    };

    if (!proofId || notFound) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">Invalid Link</h1>
                    <p className="text-gray-500">This proof review link is invalid, expired, or the order was not found.</p>
                </div>
            </div>
        );
    }

    if (!proofData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="text-gray-500 flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-brand-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading proof details...</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${status === 'approved' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                        {status === 'approved' ? (
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">
                        {status === 'approved' ? 'Proof Approved!' : 'Revision Requested'}
                    </h1>
                    <p className="text-gray-500 mb-4">
                        {status === 'approved'
                            ? 'Thank you! Your order will now proceed to printing.'
                            : 'We have received your feedback and will revise the design.'}
                    </p>
                    {status === 'revision' && comment && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                            <p className="text-xs text-gray-500 mb-1">Your feedback:</p>
                            <p className="text-sm text-gray-700">&quot;{comment}&quot;</p>
                        </div>
                    )}
                    <p className="mt-4 text-xs text-gray-400">
                        You can close this window now.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Proof Review</h1>
                    <p className="text-gray-500">Please review your artwork proof before we proceed to printing</p>
                </div>

                {/* Order Info Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {proofData.orderNumber}
                            </span>
                            <span className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                                Awaiting Review
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">{proofData.product}</h2>
                        <p className="text-sm text-gray-500">Customer: {proofData.customerName}</p>
                    </div>

                    {/* Product Details */}
                    <div className="p-6 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="text-xs text-gray-500">Quantity</label>
                                <p className="text-gray-800 font-medium">{proofData.quantity} pcs</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Specifications</label>
                                <p className="text-gray-800">{proofData.specifications}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proof Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div className="p-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">Artwork Proof</h3>
                        <p className="text-sm text-gray-600 mb-4">{proofData.proof.description}</p>

                        {/* Proof File */}
                        <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl border border-brand-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{proofData.proof.fileName}</p>
                                    <p className="text-xs text-gray-500">PDF Document</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={proofData.proof.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    View
                                </a>
                                <a
                                    href={proofData.proof.fileUrl}
                                    download
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                                >
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comment Section */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div className="p-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">Feedback (Optional)</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="If you need any changes, please describe them here..."
                            rows={4}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleRequestRevision}
                        className="flex-1 px-6 py-4 text-sm font-medium text-orange-700 bg-orange-100 rounded-xl hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Request Revision
                    </button>
                    <button
                        onClick={handleApprove}
                        className="flex-1 px-6 py-4 text-sm font-medium text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve & Print
                    </button>
                </div>

                {/* Info Note */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    By clicking &quot;Approve & Print&quot;, you confirm the design is final and ready for production.
                </p>
            </div>
        </div>
    );
}

export default function ProofReviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        }>
            <ProofReviewContent />
        </Suspense>
    );
}
