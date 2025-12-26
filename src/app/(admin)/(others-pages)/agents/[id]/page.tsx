"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DollarLineIcon, ChevronLeftIcon } from "@/icons/index";
import { useDocumentStore } from "@/components/documents/documentStore";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { toast } from "sonner";

// Types (simplified or shared)
interface Agent {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    agentCode: string;
    agentTier: "Silver" | "Gold" | "Platinum";
    avatar?: string;
    status: "Active" | "Inactive";
    contractStatus: "Signed" | "Pending";
    walletBalance: number;
    commissionRate: number;
    createdDate?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    icNumber?: string;
    ssmNumber?: string;
}

const tierColors = {
    Silver: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
    Gold: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-500" },
    Platinum: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" });
};

const DetailRow = ({ label, value, isMono = false }: { label: string; value: React.ReactNode; isMono?: boolean }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors px-2 rounded">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`text-sm font-medium text-gray-900 dark:text-white mt-1 sm:mt-0 ${isMono ? "font-mono" : ""}`}>
            {value}
        </span>
    </div>
);

export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);

    // UI State
    const { orders } = useDocumentStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'orders' | 'settings'>('profile');
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState("");

    // Fetch Agent Data
    useEffect(() => {
        if (!agentId) return;

        // Fetch single agent by ID
        fetch(`/api/agents/${agentId}`)
            .then(res => {
                if (!res.ok) throw new Error('Agent not found');
                return res.json();
            })
            .then((data) => {
                // Map the API response to match our interface
                setAgent({
                    id: data.id,
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone || '',
                    agentCode: data.agentCode,
                    agentTier: data.agentTier || 'Silver',
                    avatar: data.avatarUrl,
                    status: data.isActive !== false ? 'Active' : 'Inactive',
                    contractStatus: data.contractStatus || 'Pending',
                    walletBalance: Number(data.walletBalance) || 0,
                    commissionRate: Number(data.commissionRate) || 0,
                    createdDate: data.createdAt,
                    bankName: data.bankName,
                    bankAccountNumber: data.bankAccountNumber,
                    bankAccountHolder: data.bankAccountHolder,
                    icNumber: data.icNumber,
                    ssmNumber: data.ssmNumber,
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Fetch Transactions
        fetch(`/api/agent/transactions?userId=${agentId}`)
            .then(res => res.json())
            .then(data => setTransactions(Array.isArray(data) ? data : []))
            .catch(err => console.error("Failed to fetch transactions", err));

    }, [agentId]);


    const agentOrders = useMemo(() => {
        if (!agent) return [];
        return orders.filter(o => o.customerEmail === agent.email || o.customerId === agent.id);
    }, [orders, agent]);

    // Helper functions for data refresh
    const fetchAgent = useCallback(async () => {
        if (!agentId) return;
        try {
            const res = await fetch(`/api/agents/${agentId}`);
            if (!res.ok) throw new Error('Agent not found');
            const data = await res.json();
            setAgent({
                id: data.id,
                fullName: data.fullName,
                email: data.email,
                phone: data.phone || '',
                agentCode: data.agentCode,
                agentTier: data.agentTier || 'Silver',
                avatar: data.avatarUrl,
                status: data.isActive !== false ? 'Active' : 'Inactive',
                contractStatus: data.contractStatus || 'Pending',
                walletBalance: Number(data.walletBalance) || 0,
                commissionRate: Number(data.commissionRate) || 0,
                createdDate: data.createdAt,
                bankName: data.bankName,
                bankAccountNumber: data.bankAccountNumber,
                bankAccountHolder: data.bankAccountHolder,
                icNumber: data.icNumber,
                ssmNumber: data.ssmNumber,
            });
        } catch (err) {
            console.error(err);
        }
    }, [agentId]);

    const fetchTransactions = useCallback(async () => {
        if (!agentId) return;
        try {
            const res = await fetch(`/api/agent/transactions?userId=${agentId}`);
            const data = await res.json();
            setTransactions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
        }
    }, [agentId]);

    const handleApproveTransaction = async (txnId: string) => {
        if (!confirm("Approve this deposit?")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/agent/transactions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId: txnId, action: 'approve' })
            });
            if (res.ok) {
                toast.success("Transaction Approved!");
                fetchTransactions();
                fetchAgent();
            } else {
                const err = await res.json();
                toast.error(`Failed to approve: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error approving transaction");
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async () => {
        if (!topUpAmount || isNaN(Number(topUpAmount))) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (!agent) return;

        setLoading(true);
        try {
            const res = await fetch('/api/agent/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: agent.id,
                    amount: Number(topUpAmount),
                    type: 'deposit_request',
                    description: 'Manual Top Up Request'
                })
            });

            if (res.ok) {
                toast.success("Top Up Request Submitted! Pending Approval.");
                setIsTopUpOpen(false);
                setTopUpAmount("");
                fetchTransactions();
            } else {
                const err = await res.json();
                toast.error(`Request Failed: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error processing top up");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Agent Data...</div>;
    if (!agent) return <div className="p-8 text-center">Agent not found</div>;

    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-3 text-sm font-medium transition-all rounded-lg mb-1 ${activeTab === id
                ? "text-brand-600 bg-brand-50 dark:bg-brand-900/20"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20">
            {/* Top Navigation Bar - Floating Card Style */}
            <div className="sticky top-4 z-30 px-4 sm:px-6 lg:px-8 mb-8 pointer-events-none">
                <div className="max-w-7xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700 pointer-events-auto">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16 sm:h-20">
                            <div className="flex items-center gap-4">
                                <Link href="/agents" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition group text-gray-400 hover:text-gray-600">
                                    <ChevronLeftIcon className="w-6 h-6" />
                                </Link>
                                <div className="flex flex-col">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {agent.fullName}
                                    </h1>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 dark:bg-gray-700 dark:text-gray-400">{agent.agentCode}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${tierColors[agent.agentTier].bg} ${tierColors[agent.agentTier].text}`}>
                                            {agent.agentTier}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:block text-right">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Wallet Balance</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                                        RM {agent.walletBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-700/50 pt-1">
                            <TabButton id="profile" label="Profile" />
                            <TabButton id="wallet" label="My Wallet" />
                            <TabButton id="orders" label="Order History" />
                            <TabButton id="settings" label="Settings" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            {/* Avatar Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
                                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4 ring-4 ring-white dark:ring-gray-800 shadow-md">
                                    {agent.avatar ? (
                                        <Image src={agent.avatar} alt={agent.fullName} width={128} height={128} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400 font-bold">{agent.fullName.charAt(0)}</div>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{agent.fullName}</h2>
                                <p className="text-sm text-brand-600 font-mono mb-4">{agent.agentCode}</p>
                                <div className="flex justify-center gap-2">
                                    <Badge>{agent.status}</Badge>
                                    <Badge>{agent.contractStatus}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                                <div className="space-y-1">
                                    <DetailRow label="Email Address" value={agent.email} />
                                    <DetailRow label="Phone Number" value={agent.phone} />
                                    <DetailRow label="Full Address" value="-" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Identity Verification</h3>
                                <div className="space-y-1">
                                    <DetailRow label="IC Number" value={agent.icNumber} isMono />
                                    <DetailRow label="SSM Registration" value={agent.ssmNumber} isMono />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Wallet Tab */}
                {activeTab === 'wallet' && (
                    <div className="space-y-6 max-w-4xl">
                        {/* Balance Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-gray-500 font-medium mb-2">Current Balance</h3>
                                <div className="text-5xl font-bold text-brand-600 dark:text-brand-400">
                                    RM {agent.walletBalance.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div>
                                <Button
                                    size="lg"
                                    variant={isTopUpOpen ? "outline" : "primary"}
                                    className={!isTopUpOpen ? "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-lg shadow-brand-500/20 border-0" : ""}
                                    onClick={() => setIsTopUpOpen(!isTopUpOpen)}
                                >
                                    {isTopUpOpen ? "Cancel" : (
                                        <>
                                            <DollarLineIcon className="w-5 h-5" />
                                            Top Up Credit
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Top Up Form */}
                        {isTopUpOpen && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-top-4 relative overflow-hidden max-w-lg mx-auto sm:mx-0">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <DollarLineIcon className="w-16 h-16 text-brand-600" />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-base">Add Credit (Pending Approval)</h4>

                                    {/* Quick Amounts */}
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                                        {[10, 50, 100, 500].map((amt) => (
                                            <button
                                                key={amt}
                                                onClick={() => setTopUpAmount(amt.toString())}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${topUpAmount === amt.toString()
                                                    ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-400"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                                    }`}
                                            >
                                                +RM {amt}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Input */}
                                    <div className="mb-4">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-light">RM</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full pl-12 pr-3 py-3 text-2xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-300"
                                                value={topUpAmount}
                                                onChange={(e) => setTopUpAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setIsTopUpOpen(false)}>Cancel</Button>
                                        <Button
                                            onClick={handleTopUp}
                                            disabled={loading || !topUpAmount}
                                            className="min-w-[100px]"
                                            size="sm"
                                        >
                                            {loading ? "..." : "Submit Request"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* COMPACT Pending Approvals */}
                        {transactions.some(t => t.status === 'PENDING') && (
                            <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-lg overflow-hidden">
                                <div className="px-4 py-3 bg-orange-100/50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800/50 flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                        Pending Approvals
                                    </h4>
                                    <span className="text-xs font-medium text-orange-700 bg-orange-200/50 px-2 py-0.5 rounded-full">
                                        Action Required
                                    </span>
                                </div>
                                <div className="divide-y divide-orange-100 dark:divide-orange-800/30">
                                    {transactions.filter(t => t.status === 'PENDING').map(txn => (
                                        <div key={txn.id} className="flex items-center justify-between p-3 hover:bg-orange-100/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="text-orange-500 bg-white dark:bg-gray-800 p-1.5 rounded border border-orange-100 dark:border-orange-900/50">
                                                    <DollarLineIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        Deposit Request
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {txn.id} • {formatDate(txn.date)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">RM {txn.amount.toFixed(2)}</span>
                                                <Button size="sm" variant="success" className="h-8 px-3 text-xs" onClick={() => handleApproveTransaction(txn.id)} disabled={loading}>
                                                    Approve
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transaction History Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white">Transaction History</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium">Date</th>
                                            <th className="px-6 py-3 text-left font-medium">Type</th>
                                            <th className="px-6 py-3 text-left font-medium">Reference</th>
                                            <th className="px-6 py-3 text-right font-medium">Amount</th>
                                            <th className="px-6 py-3 text-right font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {transactions.map(txn => (
                                            <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(txn.date)}</td>
                                                <td className="px-6 py-4">
                                                    <Badge size="sm" color={txn.type === 'DEPOSIT' ? 'primary' : txn.type === 'credit' ? 'success' : 'error'}>
                                                        {txn.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{txn.id}</td>
                                                <td className={`px-6 py-4 text-right font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>{txn.type === 'debit' ? '-' : '+'}RM {txn.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-xs font-bold uppercase ${txn.status === 'APPROVED' || txn.status === 'completed' ? 'text-green-500' : txn.status === 'PENDING' ? 'text-orange-500' : 'text-gray-500'}`}>
                                                        {txn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white">Order History</h3>
                                <span className="text-sm text-gray-500">{agentOrders.length} orders</span>
                            </div>
                            {agentOrders.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium">Order #</th>
                                            <th className="px-6 py-3 text-left font-medium">Date</th>
                                            <th className="px-6 py-3 text-left font-medium">Status</th>
                                            <th className="px-6 py-3 text-left font-medium">Items</th>
                                            <th className="px-6 py-3 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {agentOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-6 py-4 font-medium text-brand-600">{order.orderNumber}</td>
                                                <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
                                                <td className="px-6 py-4">
                                                    <Badge size="sm" color="primary">{order.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {order.items.length} items
                                                    <span className="text-xs text-gray-400 block max-w-[200px] truncate">{order.items[0]?.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                                    RM {order.totalAmount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-gray-500">No orders found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Banking Information</h3>
                            <div className="space-y-1">
                                <DetailRow label="Bank Name" value={agent.bankName || "-"} />
                                <DetailRow label="Account Number" value={agent.bankAccountNumber || "-"} isMono />
                                <DetailRow label="Account Holder" value={agent.bankAccountHolder || "-"} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security & Actions</h3>
                            <div className="flex gap-4">
                                <Button variant="primary">Edit Profile</Button>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Reset Password</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
