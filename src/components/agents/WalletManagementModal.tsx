"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Agent } from "./agentData";

interface WalletManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: Agent | null;
    onSubmit: (transaction: { type: 'credit' | 'debit'; amount: number; description: string }) => void;
}

export const WalletManagementModal: React.FC<WalletManagementModalProps> = ({
    isOpen,
    onClose,
    agent,
    onSubmit,
}) => {
    const [type, setType] = useState<'credit' | 'debit'>('credit');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!agent) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(parseFloat(amount))) return;

        setIsSubmitting(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        onSubmit({
            type,
            amount: parseFloat(amount),
            description: description || (type === 'credit' ? 'Manual Deposit' : 'Manual Withdrawal')
        });

        await fetch('/api/notifications/create', {
            method: 'POST',
            body: JSON.stringify({
                type: 'finance',
                title: type === 'credit' ? 'Wallet Credited' : 'Wallet Debited',
                message: `Manual ${type} of RM${amount} for ${agent.fullName}`,
                link: `/agents/${agent.id}`
            })
        });

        setIsSubmitting(false);
        onClose();
        // Reset form
        setAmount('');
        setDescription('');
        setType('credit');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md w-full">
            <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">
                    Manage Wallet
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    Adjust balance for {agent.fullName} ({agent.agentCode})
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Transaction Type */}
                    <div>
                        <Label>Transaction Type</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setType('credit')}
                                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${type === 'credit'
                                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Deposit (Credit)
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('debit')}
                                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${type === 'debit'
                                    ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                                Withdraw (Debit)
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <Label htmlFor="amount">Amount (RM)</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0.01"
                            step={0.01}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="mt-2"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Reference / Description</Label>
                        <Input
                            id="description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === 'credit' ? "e.g. Bank Transfer Ref: 123" : "e.g. Correction / Refund"}
                            className="mt-2"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" onClick={onClose} className="w-full">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={`w-full text-white ${type === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : (type === 'credit' ? 'Confirm Deposit' : 'Confirm Withdrawal')}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
