"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Customer, Address, emptyCustomer, emptyAddress } from "./customerData";

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Omit<Customer, "id" | "accountCreatedDate">) => void;
    customer?: Customer | null; // If provided, it's edit mode
    loading?: boolean;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    customer,
    loading = false,
}) => {
    const isEditMode = !!customer;

    const [formData, setFormData] = useState<Omit<Customer, "id" | "accountCreatedDate">>({
        ...emptyCustomer,
    });
    const [sameAsBilling, setSameAsBilling] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone,
                shippingAddress: { ...customer.shippingAddress },
                billingAddress: { ...customer.billingAddress },
                companyName: customer.companyName || "",
                taxId: customer.taxId || "",
                marketingOptIn: customer.marketingOptIn,
            });
        } else {
            setFormData({ ...emptyCustomer });
        }
        setSameAsBilling(false);
    }, [customer, isOpen]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAddressChange = (
        type: "shippingAddress" | "billingAddress",
        field: keyof Address,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value,
            },
        }));

        // If same as billing is checked, sync billing address
        if (type === "shippingAddress" && sameAsBilling) {
            setFormData((prev) => ({
                ...prev,
                billingAddress: {
                    ...prev.shippingAddress,
                    [field]: value,
                },
            }));
        }
    };

    const handleSameAsBilling = (checked: boolean) => {
        setSameAsBilling(checked);
        if (checked) {
            setFormData((prev) => ({
                ...prev,
                billingAddress: { ...prev.shippingAddress },
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        // Do not onClose here, let parent handle it on success
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
                    {isEditMode ? "Edit Customer" : "Add New Customer"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode
                        ? "Update customer information"
                        : "Enter customer details to add to database"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Basic Information
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

                {/* Shipping Address */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Shipping Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Street Address</label>
                            <input
                                type="text"
                                value={formData.shippingAddress.street}
                                onChange={(e) =>
                                    handleAddressChange("shippingAddress", "street", e.target.value)
                                }
                                placeholder="Enter street address"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>City</label>
                            <input
                                type="text"
                                value={formData.shippingAddress.city}
                                onChange={(e) =>
                                    handleAddressChange("shippingAddress", "city", e.target.value)
                                }
                                placeholder="Enter city"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>State</label>
                            <input
                                type="text"
                                value={formData.shippingAddress.state}
                                onChange={(e) =>
                                    handleAddressChange("shippingAddress", "state", e.target.value)
                                }
                                placeholder="Enter state"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Zip Code</label>
                            <input
                                type="text"
                                value={formData.shippingAddress.zip}
                                onChange={(e) =>
                                    handleAddressChange("shippingAddress", "zip", e.target.value)
                                }
                                placeholder="Enter zip code"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Country</label>
                            <input
                                type="text"
                                value={formData.shippingAddress.country}
                                onChange={(e) =>
                                    handleAddressChange("shippingAddress", "country", e.target.value)
                                }
                                placeholder="Enter country"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                            Billing Address
                        </h4>
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sameAsBilling}
                                onChange={(e) => handleSameAsBilling(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                            Same as shipping
                        </label>
                    </div>
                    {!sameAsBilling && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Street Address</label>
                                <input
                                    type="text"
                                    value={formData.billingAddress.street}
                                    onChange={(e) =>
                                        handleAddressChange("billingAddress", "street", e.target.value)
                                    }
                                    placeholder="Enter street address"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>City</label>
                                <input
                                    type="text"
                                    value={formData.billingAddress.city}
                                    onChange={(e) =>
                                        handleAddressChange("billingAddress", "city", e.target.value)
                                    }
                                    placeholder="Enter city"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>State</label>
                                <input
                                    type="text"
                                    value={formData.billingAddress.state}
                                    onChange={(e) =>
                                        handleAddressChange("billingAddress", "state", e.target.value)
                                    }
                                    placeholder="Enter state"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Zip Code</label>
                                <input
                                    type="text"
                                    value={formData.billingAddress.zip}
                                    onChange={(e) =>
                                        handleAddressChange("billingAddress", "zip", e.target.value)
                                    }
                                    placeholder="Enter zip code"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Country</label>
                                <input
                                    type="text"
                                    value={formData.billingAddress.country}
                                    onChange={(e) =>
                                        handleAddressChange("billingAddress", "country", e.target.value)
                                    }
                                    placeholder="Enter country"
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* B2B Information */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        B2B Information (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Company Name</label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                placeholder="Enter company name"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Tax / SST ID</label>
                            <input
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleInputChange}
                                placeholder="e.g. SST-2024-00123"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                {/* Marketing Opt-in */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Preferences
                    </h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="marketingOptIn"
                            checked={formData.marketingOptIn}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Opt-in to receive marketing communications
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose} type="button" disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={loading}>
                        {isEditMode ? "Save Changes" : "Add Customer"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CustomerFormModal;
