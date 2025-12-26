"use client";
import React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Customer, formatAddress, formatDate } from "./customerData";

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
    onEdit: (customer: Customer) => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
    isOpen,
    onClose,
    customer,
    onEdit,
}) => {
    if (!customer) return null;

    const DetailRow = ({
        label,
        value,
        fullWidth = false,
    }: {
        label: string;
        value: React.ReactNode;
        fullWidth?: boolean;
    }) => (
        <div className={fullWidth ? "col-span-2" : ""}>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {label}
            </dt>
            <dd className="text-sm text-gray-800 dark:text-white/90">{value || "—"}</dd>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto"
        >
            {/* Header with Avatar */}
            <div className="flex items-start gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {customer.avatar ? (
                        <Image
                            src={customer.avatar}
                            alt={customer.fullName}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 text-xl font-medium">
                            {customer.fullName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {customer.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.email}
                    </p>
                    {customer.companyName && (
                        <p className="text-sm text-brand-500 mt-1">{customer.companyName}</p>
                    )}
                </div>
                <Badge color={customer.marketingOptIn ? "success" : "light"} size="sm">
                    {customer.marketingOptIn ? "Marketing: Yes" : "Marketing: No"}
                </Badge>
            </div>

            {/* Details */}
            <div className="space-y-6">
                {/* Contact Info */}
                <div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-3">
                        Contact Information
                    </h4>
                    <dl className="grid grid-cols-2 gap-4">
                        <DetailRow label="Phone" value={customer.phone} />
                        <DetailRow label="Email" value={customer.email} />
                        <DetailRow
                            label="Account Created"
                            value={formatDate(customer.accountCreatedDate)}
                        />
                    </dl>
                </div>

                {/* B2B Info */}
                {(customer.companyName || customer.taxId) && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-3">
                            Business Information
                        </h4>
                        <dl className="grid grid-cols-2 gap-4">
                            <DetailRow label="Company Name" value={customer.companyName} />
                            <DetailRow label="Tax / SST ID" value={customer.taxId} />
                        </dl>
                    </div>
                )}

                {/* Shipping Address */}
                <div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-3">
                        Shipping Address
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatAddress(customer.shippingAddress) || "No address provided"}
                    </p>
                </div>

                {/* Billing Address */}
                <div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-3">
                        Billing Address
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatAddress(customer.billingAddress) || "No address provided"}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={() => onEdit(customer)}>
                    Edit Customer
                </Button>
            </div>
        </Modal>
    );
};

export default CustomerDetailModal;
