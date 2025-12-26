"use client";
import React, { useState, useEffect, useCallback } from "react";
import OrderTable from "@/components/orders/OrderTable";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import OrderFormModal from "@/components/orders/OrderFormModal";
import Pagination from "@/components/ui/pagination/Pagination";
import { toast } from "sonner";
import { Order } from "@/components/orders/orderData";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import Spinner from "@/components/ui/spinner/Spinner";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";

const ITEMS_PER_PAGE = 20;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete confirmation (Single)
    const [pendingDelete, setPendingDelete] = useState<Order | null>(null);

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setSelectedIds([]); // Clear selection on refresh
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                search: searchQuery,
            });
            if (statusFilter !== "all") {
                params.append("status", statusFilter);
            }

            const res = await fetch(`/api/orders?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch orders");
            const data = await res.json();

            setOrders(data.data);
            setTotalItems(data.pagination.total);
        } catch (error) {
            console.error("Fetch error", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchOrders, 300);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    // Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(orders.map(o => o.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await fetch('/api/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (!res.ok) throw new Error('Failed to delete orders');

            toast.success(`Deleted ${selectedIds.length} orders successfully`);
            fetchOrders();
            setIsBulkDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete orders');
        }
    };

    const handleCreate = () => {
        setSelectedOrder(null);
        setIsFormModalOpen(true);
    };

    const handleView = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const handleEdit = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleDelete = (order: Order) => {
        setPendingDelete(order);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const res = await fetch(`/api/orders/${pendingDelete.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success("Order deleted successfully");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to delete order");
        } finally {
            setPendingDelete(null);
        }
    };

    const handleSave = async (orderData: Partial<Order>) => {
        try {
            setIsSaving(true);
            let res;
            if (selectedOrder) {
                // Update existing order
                res = await fetch(`/api/orders/${selectedOrder.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                });
            } else {
                // Create new order
                res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                });
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save order');
            }

            toast.success(selectedOrder ? "Order updated successfully" : "Order created successfully");
            setIsFormModalOpen(false);
            setSelectedOrder(null);
            fetchOrders();
        } catch (error: any) {
            console.error("Save error", error);
            toast.error(error.message || "Failed to save order");
        } finally {
            setIsSaving(false);
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Orders</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage customer orders and production</p>
                </div>
                <nav>
                    <ol className="flex items-center gap-2 text-sm">
                        <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li className="text-brand-500">Orders</li>
                    </ol>
                </nav>
            </div>

            {/* Filters & Bulk Actions */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-4 w-full bg-brand-50/50 dark:bg-brand-900/10 p-2 rounded-lg border border-brand-100 dark:border-brand-900/20">
                        <span className="text-sm font-medium text-brand-700 dark:text-brand-300 ml-2">
                            {selectedIds.length} selected
                        </span>
                        <div className="flex-1"></div>
                        <button
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="px-3 py-1.5 text-sm font-medium text-error-600 bg-white border border-error-200 rounded-md hover:bg-error-50 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors"
                        >
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative max-w-xs">
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <CompactDropdown
                            options={[
                                { value: "all", label: "All Status" },
                                { value: "new_order", label: "New Order" },
                                { value: "processing", label: "Processing" },
                                { value: "design", label: "Design" },
                                { value: "production", label: "Production" },
                                { value: "completed", label: "Completed" },
                                { value: "cancelled", label: "Cancelled" },
                                { value: "on_hold", label: "On Hold" },
                            ]}
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        />
                    </div>
                )}

                {!selectedIds.length && (
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-theme-xs"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        New Order
                    </button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center items-center p-12">
                    <Spinner size="md" />
                </div>
            ) : (
                <OrderTable
                    orders={orders}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* Detail Modal */}
            <OrderDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                order={selectedOrder}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Form Modal */}
            <OrderFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setSelectedOrder(null); }}
                onSave={handleSave}
                order={selectedOrder}
                loading={isSaving}
            />

            {/* Delete Confirmation (Single) */}
            <ActionConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Order"
                description={`Are you sure you want to delete order ${pendingDelete?.orderNumber}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />

            {/* Bulk Delete Confirmation */}
            <ActionConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Orders"
                description={`Are you sure you want to delete ${selectedIds.length} selected orders? This action cannot be undone.`}
                confirmText={`Delete ${selectedIds.length} Orders`}
                variant="danger"
            />
        </div>
    );
}
