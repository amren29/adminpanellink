"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    CustomerTable,
    CustomerFormModal,
    CustomerDetailModal,
    Customer,
    emptyAddress,
} from "@/components/customers";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";
import Spinner from "@/components/ui/spinner/Spinner";
import Pagination from "@/components/ui/pagination/Pagination";
import { toast } from "sonner";
import EmptyState from "@/components/ui/empty-state/EmptyState";

const ITEMS_PER_PAGE = 10;

import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Confirmation State
    const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);

    // Fetch Customers
    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                search: searchQuery,
            });

            const response = await fetch(`/api/customers?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch customers');

            const result = await response.json();

            // Map Prisma result to properties expected by UI components
            const mappedCustomers: Customer[] = result.data.map((c: any) => {
                const shipping = c.addresses?.find((a: any) => a.type === 'shipping') ||
                    c.addresses?.find((a: any) => a.isDefault) ||
                    emptyAddress;
                const billing = c.addresses?.find((a: any) => a.type === 'billing') ||
                    c.addresses?.find((a: any) => a.isDefault) ||
                    emptyAddress;

                return {
                    id: c.id,
                    fullName: c.fullName,
                    email: c.email,
                    phone: c.phone || "",
                    companyName: c.companyName,
                    taxId: c.taxId,
                    marketingOptIn: c.marketingOptIn,
                    accountCreatedDate: c.createdAt,
                    avatar: c.avatarUrl || "/images/user/user-01.jpg",
                    shippingAddress: {
                        street: shipping.street || "",
                        city: shipping.city || "",
                        state: shipping.state || "",
                        zip: shipping.zip || "",
                        country: shipping.country || "",
                    },
                    billingAddress: {
                        street: billing.street || "",
                        city: billing.city || "",
                        state: billing.state || "",
                        zip: billing.zip || "",
                        country: billing.country || "",
                    },
                };
            });

            setCustomers(mappedCustomers);
            setTotalItems(result.pagination.total);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchCustomers]);

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setIsFormModalOpen(true);
    };

    const handleView = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleDelete = (customer: Customer) => {
        setPendingDelete(customer);
    };

    const confirmDelete = async () => {
        if (pendingDelete) {
            try {
                const res = await fetch(`/api/customers/${pendingDelete.id}`, {
                    method: 'DELETE',
                });

                if (!res.ok) throw new Error('Failed to delete');

                toast.success("Customer deleted successfully");
                fetchCustomers();
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete customer");
            } finally {
                setPendingDelete(null);
            }
        }
    };

    const handleSaveCustomer = async (
        customerData: Omit<Customer, "id" | "accountCreatedDate">
    ) => {
        try {
            setIsSaving(true);
            const payload = {
                fullName: customerData.fullName,
                email: customerData.email,
                phone: customerData.phone,
                companyName: customerData.companyName,
                taxId: customerData.taxId,
                marketingOptIn: customerData.marketingOptIn,
                addresses: [
                    { ...customerData.shippingAddress, type: 'shipping', isDefault: true },
                    { ...customerData.billingAddress, type: 'billing' }
                ]
            };

            let res;
            if (selectedCustomer) {
                // Update
                res = await fetch(`/api/customers/${selectedCustomer.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                // Create
                res = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }

            toast.success(selectedCustomer ? "Customer updated successfully" : "Customer created successfully");
            setIsFormModalOpen(false);
            fetchCustomers();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div>
            {/* Page Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                        Customers
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your customer database
                    </p>
                </div>
                <nav>
                    <ol className="flex items-center gap-2 text-sm">
                        <li>
                            <a
                                href="/"
                                className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                            >
                                Home
                            </a>
                        </li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li className="text-brand-500">Customers</li>
                    </ol>
                </nav>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative max-w-md flex-1">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {/* Add Customer Button */}
                <button
                    onClick={handleAddCustomer}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-theme-xs"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M10 4.16667V15.8333M4.16667 10H15.8333"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Add Customer
                </button>
            </div>

            {/* Customer Count */}
            {!loading && (
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {`Showing ${customers.length} of ${totalItems} customers`}
                </div>
            )}

            {/* Customer Table */}
            {loading && customers.length === 0 ? (
                <div className="flex justify-center items-center p-12">
                    <Spinner size="md" />
                </div>
            ) : (
                <CustomerTable
                    customers={customers}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Form Modal */}
            <CustomerFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveCustomer}
                customer={selectedCustomer}
                loading={isSaving}
            />

            {/* Detail Modal */}
            <CustomerDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                customer={selectedCustomer}
                onEdit={handleEdit}
            />

            <ActionConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Customer"
                description={`Are you sure you want to delete ${pendingDelete?.fullName}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
