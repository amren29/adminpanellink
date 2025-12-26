"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge"; // Adjust path if needed
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import PlanGuard from "@/components/common/PlanGuard";

interface Transaction {
    id: string;
    userId: string;
    amount: number;
    type: string;
    description: string;
    date: string;
    status: string;
    reference?: string; // Bank transfer ref or payment gateway ID
    proofUrl?: string; // Optional proof image
    agent?: { fullName: string; email: string; agentCode: string }; // Included from API
}

interface Agent {
    id: string;
    fullName: string;
    email: string;
    walletBalance?: number;
}

export default function FinanceTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending"); // Default to pending
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    const { isOpen, openModal, closeModal } = useModal();

    // Fetch Data
    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch Agents for calculating total balance
            const agentsRes = await fetch("/api/agents?limit=100");
            const agentsData = await agentsRes.json();
            setAgents(agentsData.data || []);

            // Fetch All Transactions
            const txnRes = await fetch("/api/agent/transactions");
            const txnData = await txnRes.json();
            setTransactions(Array.isArray(txnData) ? txnData : []);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Stats
    const totalBalance = agents.reduce((sum, agent) => sum + (Number(agent.walletBalance) || 0), 0);
    // Case-insensitive pending count
    const pendingCount = transactions.filter(t => t.status?.toLowerCase() === "pending").length;

    // Formatting
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", {
            style: "currency",
            currency: "MYR",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Actions
    const handleAction = async (transactionId: string, action: "approve" | "reject") => {
        try {
            const res = await fetch("/api/agent/transactions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId, action }),
            });

            if (res.ok) {
                toast.success(action === "approve" ? "Transaction Approved!" : "Transaction Rejected");
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update transaction");
            }
        } catch (error) {
            console.error("Error updating transaction", error);
            toast.error("Error updating transaction");
        }
    };

    // Filter Logic - case insensitive
    const filteredTransactions = transactions.filter(t => {
        const status = t.status?.toLowerCase();
        if (activeTab === "all") return true;
        if (activeTab === "pending") return status === "pending";
        if (activeTab === "completed") return status === "completed" || status === "approved" || status === "failed" || status === "rejected";
        return true;
    });

    // Helper to get agent name - use included agent data or fallback to lookup
    const getAgentName = (txn: Transaction) => {
        if (txn.agent?.fullName) return txn.agent.fullName;
        const agent = agents.find(a => a.id === txn.userId);
        return agent ? agent.fullName : "Unknown Agent";
    };

    return (
        <PlanGuard feature="transactions">
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                        Financial Transactions
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage and approve agent top-up requests
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Total Held in Wallets</span>
                        <span className="block text-2xl font-bold text-gray-800 dark:text-white mt-1">
                            {formatCurrency(totalBalance)}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Pending Approvals</span>
                        <span className="block text-2xl font-bold text-orange-500 mt-1">
                            {pendingCount} Requests
                        </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Approved Deposits</span>
                        <span className="block text-2xl font-bold text-green-600 mt-1">
                            {transactions.filter(t => t.status?.toLowerCase() === "completed" || t.status?.toLowerCase() === "approved").length} Completed
                        </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Total Transactions</span>
                        <span className="block text-2xl font-bold text-brand-600 mt-1">
                            {transactions.length}
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        {["pending", "all", "completed"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    }`}
                            >
                                {tab === "pending" ? "Deposits (Pending)" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Date</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Agent Name</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Type</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Amount</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Proof</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase dark:text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading transactions...</td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No transactions found</td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {formatDate(txn.date)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                <a href={`/agents/${txn.userId}`} className="hover:text-brand-500 hover:underline">
                                                    {getAgentName(txn)}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    color={txn.type === "DEPOSIT" || txn.type === "credit" ? "success" : "warning"}
                                                    size="sm"
                                                >
                                                    {txn.type === "DEPOSIT" ? "Deposit" : txn.type.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className={`px-6 py-4 text-sm font-medium ${txn.type === "DEPOSIT" || txn.type === "credit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                                }`}>
                                                {txn.type === "DEPOSIT" || txn.type === "credit" ? "+" : "-"}{formatCurrency(Number(txn.amount))}
                                            </td>
                                            <td className="px-6 py-4">
                                                {txn.reference ? (
                                                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                                        {txn.reference}
                                                    </span>
                                                ) : txn.proofUrl ? (
                                                    <div
                                                        className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all border border-gray-200 dark:border-gray-600 overflow-hidden"
                                                        onClick={() => { setSelectedProof(txn.proofUrl || ""); openModal(); }}
                                                    >
                                                        {txn.proofUrl.startsWith('data:image') ? (
                                                            <img src={txn.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    color={
                                                        txn.status?.toLowerCase() === "approved" || txn.status?.toLowerCase() === "completed" ? "success" :
                                                            txn.status?.toLowerCase() === "pending" ? "warning" : "error"
                                                    }
                                                    size="sm"
                                                >
                                                    {txn.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {txn.status?.toLowerCase() === "pending" ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(txn.id, "approve")}
                                                                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors border border-green-200"
                                                                title="Approve"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(txn.id, "reject")}
                                                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-200"
                                                                title="Reject"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    ) : (txn.status?.toLowerCase() === "approved" || txn.status?.toLowerCase() === "completed") && txn.proofUrl ? (
                                                        <button
                                                            onClick={() => { setSelectedProof(txn.proofUrl || ""); openModal(); }}
                                                            className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                                                        >
                                                            View Receipt
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Proof Modal */}
                <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl bg-transparent shadow-none border-0 p-0">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 dark:text-white">Transaction Receipt</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-0 bg-gray-100 dark:bg-gray-900 flex justify-center">
                            {selectedProof ? (
                                <Image
                                    src={selectedProof}
                                    alt="Receipt"
                                    width={600}
                                    height={800}
                                    className="object-contain max-h-[80vh] w-auto"
                                />
                            ) : (
                                <div className="p-12 text-gray-500">No Image Available</div>
                            )}
                        </div>
                    </div>
                </Modal>

            </div>
        </PlanGuard>
    );
}
