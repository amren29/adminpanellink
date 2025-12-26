"use client";
import React from "react";
import { DollarLineIcon } from "../../icons/index";
import Image from "next/image";
import { useDocumentStore } from "@/components/documents/documentStore";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Agent, tierColors, formatDate } from "./agentData";

interface AgentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: Agent | null;
    onEdit: (agent: Agent) => void;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
    isOpen,
    onClose,
    agent,
    onEdit,
}) => {
    if (!agent) return null;

    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);
    const [topUpAmount, setTopUpAmount] = React.useState("");
    const [loading, setLoading] = React.useState(false);


    const [transactions, setTransactions] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (agent?.id) {
            fetch(`/api/agent/transactions?userId=${agent.id}`)
                .then(res => res.json())
                .then(data => setTransactions(Array.isArray(data) ? data : []))
                .catch(err => console.error("Failed to fetch transactions", err));
        }
    }, [agent]);

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
                alert("Transaction Approved");
                window.location.reload();
            } else {
                const err = await res.json();
                alert(`Failed to approve: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error approving transaction. Check logs.");
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async () => {
        if (!topUpAmount || isNaN(Number(topUpAmount))) {
            alert("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/agent/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: agent.id,
                    amount: Number(topUpAmount),
                    type: 'credit',
                    description: 'Manual Top Up by Admin'
                })
            });

            if (res.ok) {
                alert("Top Up Successful!");
                setIsTopUpOpen(false);
                setTopUpAmount("");
                window.location.reload(); // Refresh to show new balance
            } else {
                const err = await res.json();
                alert(`Top Up Failed: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error processing top up. Check logs.");
        } finally {
            setLoading(false);
        }
    };

    const DetailRow = ({
        label,
        value,
        isMono = false,
    }: {
        label: string;
        value: React.ReactNode;
        isMono?: boolean;
    }) => (
        <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {label}
            </dt>
            <dd
                className={`text-sm text-gray-800 dark:text-white/90 ${isMono ? "font-mono" : ""
                    }`}
            >
                {value || "—"}
            </dd>
        </div>
    );

    const { orders } = useDocumentStore();
    const [activeTab, setActiveTab] = React.useState<'profile' | 'wallet' | 'orders' | 'settings'>('profile');

    const agentOrders = React.useMemo(() => {
        return orders.filter(o => o.customerEmail === agent.email || o.customerId === agent.id);
    }, [orders, agent]);

    // ... existing handlers ...

    const TabButton = ({ id, label, icon }: { id: typeof activeTab, label: string, icon?: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                {icon}
                {label}
            </div>
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-4xl p-0 mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        >
            {/* Header / Banner - Always Visible */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
                        {agent.avatar ? (
                            <Image
                                src={agent.avatar}
                                alt={agent.fullName}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-brand-600 text-xl font-bold bg-brand-50">
                                {agent.fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {agent.fullName}
                                </h3>
                                <p className="text-sm font-mono text-gray-500">{agent.agentCode}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColors[agent.agentTier].bg} ${tierColors[agent.agentTier].text}`}>
                                    {agent.agentTier}
                                </span>
                                <Badge size="sm" color={agent.contractStatus === "Signed" ? "success" : "warning"}>
                                    {agent.contractStatus}
                                </Badge>
                            </div>
                        </div>
                        <div className="mt-2 flex gap-4 text-sm text-gray-500">
                            <span>since {formatDate(agent.createdDate)}</span>
                            <span>•</span>
                            <span>{agent.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
                <TabButton id="profile" label="Profile" />
                <TabButton id="wallet" label="My Wallet" />
                <TabButton id="orders" label="Order History" />
                <TabButton id="settings" label="Settings" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">

                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Contact Details</h4>
                                <dl className="space-y-3">
                                    <DetailRow label="Email" value={agent.email} />
                                    <DetailRow label="Phone" value={agent.phone} />
                                    <DetailRow label="Address" value="-" />
                                </dl>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Identity</h4>
                                <dl className="space-y-3">
                                    <DetailRow label="IC Number" value={agent.icNumber} isMono />
                                    <DetailRow label="SSM Number" value={agent.ssmNumber} isMono />
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="space-y-8">
                        {/* Balance Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg">
                                <h4 className="text-brand-100 text-sm font-medium mb-1">Current Balance</h4>
                                <div className="text-4xl font-bold mb-4">RM {agent.walletBalance.toFixed(2)}</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsTopUpOpen(!isTopUpOpen)}
                                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                                    >
                                        {isTopUpOpen ? 'Cancel Top Up' : 'Top Up Credit'}
                                    </button>
                                    <div className="text-xs bg-white/10 px-2 py-1.5 rounded text-white/80">
                                        Commission: {agent.commissionRate}%
                                    </div>
                                </div>
                            </div>

                            {/* Top Up Form */}
                            {isTopUpOpen && (
                                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">Manual Top Up</h5>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={topUpAmount}
                                            onChange={(e) => setTopUpAmount(e.target.value)}
                                            placeholder="Amount (RM)"
                                            className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                                        />
                                        <Button variant="primary" onClick={handleTopUp} disabled={loading}>
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pending Approvals Card */}
                        {transactions.some(t => t.status === 'PENDING') && (
                            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-orange-800 dark:text-orange-200 mb-3 uppercase tracking-wide">
                                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                    Pending Approval Actions
                                </h4>
                                <div className="space-y-3">
                                    {transactions.filter(t => t.status === 'PENDING').map(txn => (
                                        <div key={txn.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-orange-100 dark:border-orange-900/50">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-orange-600 dark:text-orange-400">
                                                    <DollarLineIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        Top Up Request
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatDate(txn.date)} • Ref: <span className="font-mono">{txn.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right mr-2">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">RM {txn.amount.toFixed(2)}</div>
                                                    <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Awaiting Approval</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="success" onClick={() => handleApproveTransaction(txn.id)} disabled={loading}>
                                                        Approve
                                                    </Button>
                                                    <Button variant="danger" onClick={() => {/* Handle Reject */ }} disabled={loading}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transaction History */}
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Transaction History</h4>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                {transactions.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                                <th className="px-4 py-3 text-left font-medium">Type</th>
                                                <th className="px-4 py-3 text-left font-medium">Reference</th>
                                                <th className="px-4 py-3 text-right font-medium">Amount</th>
                                                <th className="px-4 py-3 text-right font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {transactions.map(txn => (
                                                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{txn.date.split('T')[0]}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase
                                                            ${txn.type === 'DEPOSIT' ? 'bg-blue-100 text-blue-700' :
                                                                txn.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {txn.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{txn.id}</td>
                                                    <td className={`px-4 py-3 text-right font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                        {txn.type === 'debit' ? '-' : '+'}RM {txn.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`text-xs font-medium uppercase
                                                            ${txn.status === 'APPROVED' || txn.status === 'completed' ? 'text-green-500' :
                                                                txn.status === 'PENDING' ? 'text-orange-500' : 'text-gray-500'}`}>
                                                            • {txn.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">No transactions found</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Order History</h4>
                            <span className="text-sm text-gray-500">{agentOrders.length} orders found</span>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            {agentOrders.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Order #</th>
                                            <th className="px-4 py-3 text-left font-medium">Date</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-left font-medium">Items</th>
                                            <th className="px-4 py-3 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {agentOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 font-medium text-brand-600">{order.orderNumber}</td>
                                                <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <Badge size="sm" color={order.status === 'completed' ? 'success' : 'primary'}>
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {order.items.length} items
                                                    <div className="text-xs text-gray-400 truncate max-w-[150px]">{order.items[0]?.name}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    RM {order.totalAmount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-gray-500">
                                    No orders found for this agent.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Banking Details</h4>
                            <dl className="space-y-3">
                                <DetailRow label="Bank Name" value={agent.bankName} />
                                <DetailRow label="Account Number" value={agent.bankAccountNumber} isMono />
                                <DetailRow label="Holder Name" value={agent.bankAccountHolder} />
                            </dl>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Actions</h4>
                            <div className="flex gap-3">
                                <Button variant="primary" onClick={() => onEdit(agent)}>Edit Profile</Button>
                                <Button variant="outline" className="text-error-600 border-error-200 hover:bg-error-50">Reset Password</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
                <Button variant="outline" onClick={onClose}>Close Dashboard</Button>
            </div>
        </Modal>
    );
};

export default AgentDetailModal;
