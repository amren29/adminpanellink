"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WalletRequest {
    id: string;
    amount: number;
    createdAt: string;
    proofUrl?: string | null;
    agent: { fullName: string } | null;
}

interface LeaderboardEntry {
    userId: string;
    name: string;
    role: string;
    ordersCompleted: number;
    performance: 'Fast' | 'On Track' | 'Slow';
}

export const DashboardAction = () => {
    const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [proofModalOpen, setProofModalOpen] = useState(false);
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (data.success) {
                    setWalletRequests(data.data.pendingWalletList || []);
                    setLeaderboard(data.data.productionLeaderboard || []);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard action data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle approve wallet action
    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/wallet/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' })
            });
            const data = await res.json();
            if (data.success) {
                // Remove from pending list
                setWalletRequests(prev => prev.filter(r => r.id !== id));
            } else {
                alert(data.error || 'Failed to approve');
            }
        } catch (error) {
            console.error('Error approving wallet:', error);
            alert('Failed to approve transaction');
        } finally {
            setProcessingId(null);
        }
    };

    // Handle view proof
    const handleViewProof = (proofUrl: string | null | undefined) => {
        if (proofUrl) {
            setSelectedProofUrl(proofUrl);
            setProofModalOpen(true);
        } else {
            alert('No proof image available');
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Format relative time
    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    // Performance badge style
    const getPerformanceStyle = (performance: string) => {
        switch (performance) {
            case 'Fast':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'On Track':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            case 'Slow':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Avatar background colors based on role
    const getAvatarStyle = (role: string) => {
        switch (role) {
            case 'designer':
                return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
            case 'production':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
            case 'qc':
                return 'bg-green-100 dark:bg-green-900/30 text-green-600';
            default:
                return 'bg-gray-200 dark:bg-gray-700 text-gray-500';
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">

            {/* Finance Widget (Money In) */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Recent Wallet Requests
                    </h3>
                    <Link
                        href="/wallet"
                        className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 transition-colors"
                    >
                        View All
                    </Link>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {loading ? (
                        // Loading skeleton
                        [1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <div>
                                        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                        <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : walletRequests.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500">No pending requests</p>
                            <p className="text-xs text-gray-400 mt-1">All wallet top-ups have been processed</p>
                        </div>
                    ) : (
                        walletRequests.map(request => (
                            <div key={request.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold">
                                        {getInitials(request.agent?.fullName || 'UN')}
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-800 dark:text-white">{request.agent?.fullName || 'Unknown Agent'}</h5>
                                        <p className="text-xs text-gray-500">
                                            Bank Transfer • {formatCurrency(request.amount)} • {formatRelativeTime(request.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewProof(request.proofUrl)}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="View Proof"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleApprove(request.id)}
                                        disabled={processingId === request.id}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingId === request.id ? 'Processing...' : 'Approve'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Team KPI Widget (Work Out) */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Production Leaderboard
                    </h3>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        This Month
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-5 py-3 font-medium">Team Member</th>
                                <th className="px-5 py-3 font-medium">Orders</th>
                                <th className="px-5 py-3 font-medium text-right">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                // Loading skeleton
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                                                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3"><div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                                        <td className="px-5 py-3 text-right"><div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full ml-auto" /></td>
                                    </tr>
                                ))
                            ) : leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-5 py-8 text-center text-gray-500">
                                        No production data yet
                                    </td>
                                </tr>
                            ) : (
                                leaderboard.map((member, index) => (
                                    <tr key={member.userId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarStyle(member.role)}`}>
                                                        {getInitials(member.name)}
                                                    </div>
                                                    {index === 0 && (
                                                        <span className="absolute -top-1 -right-1 text-xs">🏆</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-800 dark:text-white">{member.name}</span>
                                                    <span className="text-xs text-gray-400 ml-1 capitalize">({member.role})</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">
                                            {member.ordersCompleted} Done
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${getPerformanceStyle(member.performance)}`}>
                                                {member.performance}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Proof Image Modal */}
            {proofModalOpen && selectedProofUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setProofModalOpen(false)}
                >
                    <div
                        className="relative max-w-2xl w-full mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setProofModalOpen(false)}
                            className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Payment Proof</h3>
                        <img
                            src={selectedProofUrl}
                            alt="Payment Proof"
                            className="w-full rounded-lg max-h-[70vh] object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
