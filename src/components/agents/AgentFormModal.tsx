"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import {
    Agent,
    AgentTier,
    ContractStatus,
    emptyAgent,
    agentTiers,
    bankOptions,
    generateAgentCode,
} from "./agentData";
import Select from "@/components/form/Select";

interface AgentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (agent: Omit<Agent, "id" | "createdDate">) => void;
    agent?: Agent | null;
    loading?: boolean;
}

const AgentFormModal: React.FC<AgentFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    agent,
    loading = false,
}) => {
    const isEditMode = !!agent;

    const [formData, setFormData] = useState<Omit<Agent, "id" | "createdDate">>({
        ...emptyAgent,
        agentCode: generateAgentCode(),
    });

    useEffect(() => {
        if (agent) {
            setFormData({
                fullName: agent.fullName,
                email: agent.email,
                phone: agent.phone,
                icNumber: agent.icNumber,
                ssmNumber: agent.ssmNumber || "",
                bankName: agent.bankName,
                bankAccountNumber: agent.bankAccountNumber,
                bankAccountHolder: agent.bankAccountHolder,
                agentCode: agent.agentCode,
                commissionRate: agent.commissionRate,
                agentTier: agent.agentTier,
                contractStatus: agent.contractStatus,
                walletBalance: agent.walletBalance || 0,
            });
        } else {
            setFormData({
                ...emptyAgent,
                agentCode: generateAgentCode(),
            });
        }
    }, [agent, isOpen]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        // onClose() removed to allow parent to handle success/failure
    };

    const inputClasses =
        "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

    const labelClasses =
        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
        >
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {isEditMode ? "Edit Agent" : "Add New Agent"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode ? "Update agent information" : "Enter agent details"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Enter full name"
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email address"
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="e.g. +60 12-345 6789"
                                className={inputClasses}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Identity Verification */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Identity Verification
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>IC / Identity Card Number *</label>
                            <input
                                type="text"
                                name="icNumber"
                                value={formData.icNumber}
                                onChange={handleInputChange}
                                placeholder="e.g. 850615-01-5521"
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>
                                Business Registration / SSM Number
                            </label>
                            <input
                                type="text"
                                name="ssmNumber"
                                value={formData.ssmNumber}
                                onChange={handleInputChange}
                                placeholder="For company agents (optional)"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                {/* Banking Information */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Banking Information (For Commission Payouts)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Bank Name *</label>
                            <Select
                                value={formData.bankName}
                                onChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
                                placeholder="Select bank"
                                options={bankOptions.map(bank => ({ value: bank, label: bank }))}
                                className={inputClasses.replace("h-11 ", "").replace("border border-gray-300 ", "").replace("dark:border-gray-700 ", "").replace("focus:border-brand-300 ", "").replace("px-4 py-2.5 ", "")}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Bank Account Number *</label>
                            <input
                                type="text"
                                name="bankAccountNumber"
                                value={formData.bankAccountNumber}
                                onChange={handleInputChange}
                                placeholder="Enter account number"
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Bank Account Holder Name *</label>
                            <input
                                type="text"
                                name="bankAccountHolder"
                                value={formData.bankAccountHolder}
                                onChange={handleInputChange}
                                placeholder="Name as per bank account"
                                className={inputClasses}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Commission Settings */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Commission Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Agent Code / Referral ID</label>
                            <input
                                type="text"
                                name="agentCode"
                                value={formData.agentCode}
                                onChange={handleInputChange}
                                placeholder="Auto-generated"
                                className={`${inputClasses} bg-gray-50 dark:bg-gray-800`}
                                readOnly={true} // Always read only as it is auto-generated
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Commission Rate (%) *</label>
                            <input
                                type="number"
                                name="commissionRate"
                                value={formData.commissionRate}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                step="0.5"
                                placeholder="e.g. 10"
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Agent Tier / Level *</label>
                            <Select
                                value={formData.agentTier}
                                onChange={(value) => setFormData(prev => ({ ...prev, agentTier: value as AgentTier }))}
                                options={agentTiers.map(tier => ({ value: tier, label: tier }))}
                                className={inputClasses.replace("h-11 ", "").replace("border border-gray-300 ", "").replace("dark:border-gray-700 ", "").replace("focus:border-brand-300 ", "").replace("px-4 py-2.5 ", "")}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Contract / Agreement Status *</label>
                            <Select
                                value={formData.contractStatus}
                                onChange={(value) => setFormData(prev => ({ ...prev, contractStatus: value as ContractStatus }))}
                                options={[
                                    { value: "Unsigned", label: "Unsigned" },
                                    { value: "Signed", label: "Signed" },
                                ]}
                                className={inputClasses.replace("h-11 ", "").replace("border border-gray-300 ", "").replace("dark:border-gray-700 ", "").replace("focus:border-brand-300 ", "").replace("px-4 py-2.5 ", "")}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose} type="button" disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={loading}>
                        {isEditMode ? "Save Changes" : "Add Agent"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AgentFormModal;
