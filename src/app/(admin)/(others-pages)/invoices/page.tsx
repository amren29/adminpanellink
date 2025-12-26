"use client";
import React, { useState, useMemo } from "react";
import InvoiceTable from "@/components/documents/InvoiceTable";
import InvoiceFormModal from "@/components/documents/InvoiceFormModal";
import InvoiceDetailModal from "@/components/documents/InvoiceDetailModal";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import { Invoice, InvoiceStatus, sampleInvoices, formatCurrency } from "@/components/documents/documentData";
import { convertInvoiceToOrders } from "@/components/documents/documentUtils";
import NewOrderModal from "@/components/production-board/NewOrderModal";
import { ProductionOrder, OrderItem, defaultStatuses } from "@/components/production-board/productionData";
import Pagination from "@/components/ui/pagination/Pagination";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";
import { useDocumentStore } from "@/components/documents/documentStore";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { toast } from "sonner";
import { CloseIcon } from "@/icons/index";

const ITEMS_PER_PAGE = 10;

export default function InvoicesPage() {
    const { invoices, setInvoices, addInvoice, updateInvoice, deleteInvoice, addOrder } = useDocumentStore();

    // Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [orderFromInvoice, setOrderFromInvoice] = useState<ProductionOrder | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null);

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // Fetch Invoices on mount
    const fetchInvoices = async () => {
        try {
            setSelectedIds([]); // Clear selection on refresh
            const res = await fetch('/api/documents/invoices', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error("Failed to fetch invoices", error);
        }
    };

    React.useEffect(() => {
        fetchInvoices();
    }, [setInvoices]);

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        let result = invoices;

        if (statusFilter !== "all") {
            result = result.filter((i) => i.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (i) =>
                    i.invoiceNumber.toLowerCase().includes(query) ||
                    i.customerName.toLowerCase().includes(query) ||
                    i.customerEmail.toLowerCase().includes(query)
            );
        }

        return result;
    }, [invoices, searchQuery, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalValue = invoices.reduce((sum, i) => sum + i.total, 0);
        const paid = invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.total, 0);
        const outstanding = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((sum, i) => sum + i.total, 0);
        const overdue = invoices.filter((i) => i.status === "Overdue").length;
        return { totalValue, paid, outstanding, overdue, total: invoices.length };
    }, [invoices]);

    // Paginate
    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const paginatedInvoices = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredInvoices, currentPage]);

    // Selection Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedInvoices.map(i => i.id));
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
            const res = await fetch('/api/documents/invoices', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (!res.ok) throw new Error('Failed to delete invoices');

            toast.success(`Deleted ${selectedIds.length} invoices successfully`);
            fetchInvoices();
            setIsBulkDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete invoices');
        }
    };

    const handleCreate = () => {
        setSelectedInvoice(null);
        setIsFormModalOpen(true);
    };

    const handleView = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(true);
    };

    const handleEdit = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(false);
        setIsFormModalOpen(true);
    };

    // Confirmation Modal State (Retained logic)
    const [actionModal, setActionModal] = useState<{
        open: boolean;
        type: 'delete' | 'update';
        title: string;
        description: string;
    }>({ open: false, type: 'delete', title: '', description: '' });

    // Pending Data
    const [pendingUpdateData, setPendingUpdateData] = useState<Omit<Invoice, "id"> | null>(null);

    // 1. DELETE Action
    const handleDelete = (invoice: Invoice) => {
        setPendingDelete(invoice);
        setActionModal({
            open: true,
            type: 'delete',
            title: 'Delete Invoice',
            description: `Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`
        });
    };

    // 2. UPDATE Action
    const handleSave = async (invoiceData: Omit<Invoice, "id">) => {
        if (selectedInvoice) {
            setPendingUpdateData(invoiceData);
            setActionModal({
                open: true,
                type: 'update',
                title: 'Update Invoice',
                description: `Are you sure you want to update invoice ${selectedInvoice.invoiceNumber}?`
            });
        } else {
            await executeCreate(invoiceData);
        }
    };

    const executeCreate = async (invoiceData: Omit<Invoice, "id">) => {
        const newInvoice = {
            ...invoiceData,
            id: `inv-${Date.now()}`,
        };
        try {
            const res = await fetch('/api/documents/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newInvoice)
            });

            if (res.ok) {
                const savedInvoice = await res.json();
                addInvoice(savedInvoice);
                toast.success("Invoice created successfully");
                setIsFormModalOpen(false);
            } else {
                console.error("Create failed", await res.text());
                toast.error("Failed to create invoice");
            }
        } catch (error) {
            console.error("Create error", error);
            toast.error("Error creating invoice");
        }
    };

    const confirmAction = async () => {
        if (actionModal.type === 'delete' && pendingDelete) {
            try {
                const res = await fetch(`/api/documents/invoices?id=${pendingDelete.id}`, { method: 'DELETE' });
                if (res.ok) {
                    deleteInvoice(pendingDelete.id);
                    toast.success("Invoice deleted successfully");
                } else {
                    toast.error("Failed to delete invoice");
                }
            } catch (error) {
                console.error("Delete error", error);
                toast.error("Error deleting invoice");
            }
        } else if (actionModal.type === 'update' && selectedInvoice && pendingUpdateData) {
            const updatedInvoice = { ...selectedInvoice, ...pendingUpdateData };
            try {
                const res = await fetch('/api/documents/invoices', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedInvoice)
                });

                if (res.ok) {
                    updateInvoice(selectedInvoice.id, pendingUpdateData);
                    toast.success("Invoice updated successfully");
                    setIsFormModalOpen(false);
                } else {
                    console.error("Update failed", await res.text());
                    toast.error("Failed to update invoice");
                }
            } catch (error) {
                console.error("Update error", error);
                toast.error("Error updating invoice");
            }
        }

        setActionModal({ ...actionModal, open: false });
        setPendingDelete(null);
        setPendingUpdateData(null);
    };

    const handleConvert = (invoice: Invoice) => {
        setIsDetailModalOpen(false);
        const orders = convertInvoiceToOrders(invoice, "dept-general");
        const orderData = orders[0];
        const orderForModal: Partial<ProductionOrder> = {
            ...orderData,
            status: "new-order",
        };
        setOrderFromInvoice(orderForModal as ProductionOrder);
        setIsOrderModalOpen(true);
    };

    const handleSaveOrder = async (order: Omit<ProductionOrder, "id" | "proofHistory" | "proofData"> | Omit<ProductionOrder, "id" | "proofHistory" | "proofData">[]) => {
        const ordersToSave = Array.isArray(order) ? order : [order];

        try {
            for (const o of ordersToSave) {
                const orderData = {
                    customerId: (o as any).customerId || null,
                    customerName: o.customerName,
                    customerEmail: o.customerEmail,
                    customerPhone: o.customerPhone,
                    agentId: (o as any).agentId || null,
                    departmentId: o.departmentId || null,
                    assignedTo: (o as any).assignedTo || null,
                    status: o.status === 'new-order' ? 'new_order' : o.status,
                    priority: o.priority || 'normal',
                    subtotal: o.totalAmount || 0,
                    discountAmount: 0,
                    taxAmount: 0,
                    shippingAmount: 0,
                    totalAmount: o.totalAmount || 0,
                    deliveryMethod: (o as any).deliveryMethod || 'pickup',
                    notes: o.notes || '',
                    dueDate: o.dueDate || null,
                    items: o.items?.map((item: any) => ({
                        name: item.name,
                        quantity: item.quantity,
                        specifications: item.specifications || '',
                        width: item.width || null,
                        height: item.height || null,
                        unitPrice: item.unitPrice || 0,
                        totalPrice: item.totalPrice || 0,
                        productId: item.productId || null,
                    })) || [],
                };

                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (res.ok) {
                    const savedOrder = await res.json();
                    addOrder({ ...o, id: savedOrder.id } as any);
                    toast.success(`Order ${savedOrder.orderNumber} created successfully!`);
                } else {
                    const text = await res.text();
                    let errData;
                    try {
                        errData = JSON.parse(text);
                    } catch (e) {
                        errData = { error: text || `Error ${res.status}` };
                    }
                    console.error("Failed to create order. Status:", res.status, "Error:", errData);
                    toast.error(`Failed to create order: ${errData.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error("Error saving order:", error);
            toast.error("Error creating order");
        }

        setIsOrderModalOpen(false);
        setOrderFromInvoice(null);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Invoices</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your invoices and payments</p>
                </div>
                <nav>
                    <ol className="flex items-center gap-2 text-sm">
                        <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li className="text-brand-500">Invoices</li>
                    </ol>
                </nav>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Invoices</p>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
                    <p className="text-2xl font-semibold text-success-500">{formatCurrency(stats.paid)}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                    <p className="text-2xl font-semibold text-warning-500">{formatCurrency(stats.outstanding)}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-semibold text-error-500">{stats.overdue}</p>
                </div>
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
                                placeholder="Search invoices..."
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
                                { value: "Draft", label: "Draft" },
                                { value: "Sent", label: "Sent" },
                                { value: "Paid", label: "Paid" },
                                { value: "Overdue", label: "Overdue" },
                            ]}
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val as InvoiceStatus | "all"); setCurrentPage(1); }}
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
                        Create Invoice
                    </button>
                )}
            </div>

            {/* Table */}
            <InvoiceTable
                invoices={paginatedInvoices}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* Modals */}
            <InvoiceFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSave}
                invoice={selectedInvoice}
            />
            <InvoiceDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                invoice={selectedInvoice}
                onEdit={handleEdit}
                onConvert={handleConvert}
            />
            <NewOrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onCreate={handleSaveOrder}
                statuses={defaultStatuses}
                initialData={orderFromInvoice || undefined}
            />

            <ActionConfirmationModal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ ...actionModal, open: false })}
                onConfirm={confirmAction}
                title={actionModal.title}
                description={actionModal.description}
                variant={actionModal.type === 'delete' ? 'danger' : 'default'}
                confirmText={actionModal.type === 'delete' ? 'Delete' : 'Update'}
            />

            {/* Bulk Delete Confirmation */}
            <ActionConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Invoices"
                description={`Are you sure you want to delete ${selectedIds.length} selected invoices? This action cannot be undone.`}
                confirmText={`Delete ${selectedIds.length} Invoices`}
                variant="danger"
            />
        </div>
    );
}
