"use client";
import React, { useEffect, useState, useRef } from "react";
import Button from "@/components/ui/button/Button";
import { formatCurrency } from "@/components/products/productData";
import { toast } from "sonner";

export default function WalletPage() {
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Top Up State
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [reference, setReference] = useState("");
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [proofFileName, setProofFileName] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        try {
            // Check for impersonation
            const impersonatedUser = localStorage.getItem("impersonatedUser");
            let query = "";
            if (impersonatedUser) {
                const { id } = JSON.parse(impersonatedUser);
                query = `?userId=${id}`;
            }

            const userRes = await fetch(`/api/agent/profile${query}`);
            const userData = await userRes.json();
            setUser(userData);

            // Fetch transactions for this user
            const userId = impersonatedUser ? JSON.parse(impersonatedUser).id : userData?.id;
            if (userId) {
                const txnRes = await fetch(`/api/agent/transactions?userId=${userId}`);
                const txnData = await txnRes.json();
                setTransactions(Array.isArray(txnData) ? txnData : []);
            }
        } catch (error) {
            console.error("Failed to fetch wallet data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("File too large. Maximum 5MB allowed.");
                return;
            }
            setProofFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) {
            toast.error("User not found");
            return;
        }

        if (!reference.trim() && !proofImage) {
            toast.error("Please provide a reference number or upload proof of payment");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/agent/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    amount: parseFloat(amount),
                    type: 'deposit_request',
                    description: 'Wallet Top Up Request',
                    reference: reference.trim() || null,
                    proofUrl: proofImage || null,
                })
            });

            if (res.ok) {
                toast.success("Top-up request submitted! Waiting for admin approval.");
                setAmount("");
                setReference("");
                setProofImage(null);
                setProofFileName(null);
                setIsTopUpOpen(false);
                fetchData(); // Refresh history
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to submit request");
            }
        } catch (err) {
            toast.error("Error submitting request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6">Loading wallet...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Impersonation Banner */}
            {typeof window !== 'undefined' && localStorage.getItem("impersonatedUser") && (
                <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
                    <div>
                        <span className="font-bold">⚠️ Viewing as {user?.fullName || 'Agent'}</span>
                        <span className="ml-2 text-sm">You are performing actions on behalf of this user.</span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-red-50 text-red-700 border-red-200"
                        onClick={() => {
                            localStorage.removeItem("impersonatedUser");
                            window.location.href = "/agents";
                        }}
                    >
                        Exit View
                    </Button>
                </div>
            )}

            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Wallet</h1>

            {/* Balance Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                        <h2 className={`text-4xl font-bold ${(user?.walletBalance || 0) <= 0 ? 'text-gray-400' : 'text-brand-600'
                            }`}>
                            {formatCurrency(user?.walletBalance || 0)}
                        </h2>
                        {user?.agentStatus === 'pending_deposit' && (
                            <div className="mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md inline-block">
                                Account Locked: Deposit RM1,000 to unlock wholesale pricing.
                            </div>
                        )}
                    </div>
                    <Button onClick={() => setIsTopUpOpen(true)}>
                        Top Up Credit
                    </Button>
                </div>
            </div>

            {/* Transaction History */}
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Transaction History</h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Reference</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Amount</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No transactions found
                                </td>
                            </tr>
                        ) : (
                            transactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {new Date(txn.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${txn.type === 'credit' || txn.type === 'DEPOSIT'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            }`}>
                                            {txn.type?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                                        {txn.reference || '-'}
                                    </td>
                                    <td className={`px-6 py-4 font-medium ${txn.type === 'credit' || txn.type === 'DEPOSIT' ? 'text-success-600' : 'text-gray-800 dark:text-white'
                                        }`}>
                                        {txn.type === 'credit' || txn.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(txn.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 ${txn.status?.toLowerCase() === 'completed' || txn.status?.toLowerCase() === 'approved' ? 'text-success-600' :
                                            txn.status?.toLowerCase() === 'failed' || txn.status?.toLowerCase() === 'rejected' ? 'text-red-600' :
                                                'text-orange-500'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${txn.status?.toLowerCase() === 'completed' || txn.status?.toLowerCase() === 'approved' ? 'bg-success-500' :
                                                txn.status?.toLowerCase() === 'failed' || txn.status?.toLowerCase() === 'rejected' ? 'bg-red-500' :
                                                    'bg-orange-400'
                                                }`}></span>
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Top Up Modal */}
            {isTopUpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Top Up Wallet</h2>
                        <form onSubmit={handleTopUp}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Amount (RM) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="10"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    placeholder="e.g. 500.00"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Reference / Transaction ID
                                </label>
                                <input
                                    type="text"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    placeholder="e.g. Bank transfer ref or Payment Gateway ID"
                                />
                                <p className="text-xs text-gray-400 mt-1">Enter bank reference number or payment gateway transaction ID</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Proof of Payment (Optional)
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {proofImage ? (
                                    <div className="relative">
                                        <img
                                            src={proofImage}
                                            alt="Proof"
                                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setProofImage(null); setProofFileName(null); }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1">{proofFileName}</p>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center text-gray-500 text-sm cursor-pointer hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Click to upload receipt/screenshot
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-1">Upload bank transfer receipt or payment screenshot (Max 5MB)</p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" type="button" onClick={() => {
                                    setIsTopUpOpen(false);
                                    setAmount("");
                                    setReference("");
                                    setProofImage(null);
                                    setProofFileName(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Submitting..." : "Submit Request"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
