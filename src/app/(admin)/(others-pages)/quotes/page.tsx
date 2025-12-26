"use client";
import React, { useState, useMemo } from "react";
import QuoteTable from "@/components/documents/QuoteTable";
import QuoteFormModal from "@/components/documents/QuoteFormModal";
import QuoteDetailModal from "@/components/documents/QuoteDetailModal";
import InvoiceFormModal from "@/components/documents/InvoiceFormModal";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import { Quote, QuoteStatus, sampleQuotes, formatCurrency, Invoice, generateInvoiceNumber } from "@/components/documents/documentData";
import { convertQuoteToInvoice } from "@/components/documents/documentUtils";
import Pagination from "@/components/ui/pagination/Pagination";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";
import { useDocumentStore } from "@/components/documents/documentStore";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { toast } from "sonner";
import { PlusIcon, CloseIcon } from "@/icons/index";

const ITEMS_PER_PAGE = 10;

export default function QuotesPage() {
    const { quotes, setQuotes, addQuote, updateQuote, deleteQuote, addInvoice } = useDocumentStore();

    // Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [invoiceFromQuote, setInvoiceFromQuote] = useState<Invoice | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Quote | null>(null);

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // Fetch Quotes on mount and refresh function
    const fetchQuotes = async () => {
        try {
            setSelectedIds([]); // Clear selection on refresh
            const res = await fetch('/api/documents/quotes', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setQuotes(data);
            }
        } catch (error) {
            console.error("Failed to fetch quotes", error);
        }
    };

    React.useEffect(() => {
        fetchQuotes();
    }, [setQuotes]);

    // Filter quotes
    const filteredQuotes = useMemo(() => {
        let result = quotes;

        if (statusFilter !== "all") {
            result = result.filter((q) => q.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (q) =>
                    q.quoteNumber.toLowerCase().includes(query) ||
                    q.customerName.toLowerCase().includes(query) ||
                    q.customerEmail.toLowerCase().includes(query)
            );
        }

        return result;
    }, [quotes, searchQuery, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
        const accepted = quotes.filter((q) => q.status === "Accepted").length;
        const pending = quotes.filter((q) => q.status === "Sent").length;
        return { totalValue, accepted, pending, total: quotes.length };
    }, [quotes]);

    // Paginate
    const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE);
    const paginatedQuotes = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredQuotes.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredQuotes, currentPage]);

    // Selection Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredQuotes.map(q => q.id)); // Select all VISIBLE/FILTERED quotes? Or all pages? Usually visible page or all filtered. 
            // Let's stick to currently filtered list as that's what user sees or expects usually, OR just page.
            // But paginatedQuotes is only current page.
            // Ideally select all should select all across pages if we want full bulk.
            // For now let's select all filtered results to be powerful.
            // Wait, standard behavior often selects current page unless "Select all 500 items" is clicked.
            // Let's select current visible page for safety, or all filtered?
            // Users usually want to delete what they see. Let's do current page for safety first.
            // Actually, in previous implementations (Products/Orders), I used `products.map` or `orders.map` which were the *fetched* data. 
            // In ProductsPage, `products` was the current page data (becuse pagination was server-side).
            // Here `paginatedQuotes` is current page.
            setSelectedIds(paginatedQuotes.map(q => q.id));
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
            const res = await fetch('/api/documents/quotes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (!res.ok) throw new Error('Failed to delete quotes');

            toast.success(`Deleted ${selectedIds.length} quotes successfully`);
            fetchQuotes();
            setIsBulkDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete quotes');
        }
    };

    const handleCreate = () => {
        setSelectedQuote(null);
        setIsFormModalOpen(true);
    };

    const handleView = (quote: Quote) => {
        setSelectedQuote(quote);
        setIsDetailModalOpen(true);
    };

    const handleEdit = (quote: Quote) => {
        setSelectedQuote(quote);
        setIsDetailModalOpen(false);
        setIsFormModalOpen(true);
    };

    // Confirmation Modal State (Retaining existing single delete/update logic)
    const [actionModal, setActionModal] = useState<{
        open: boolean;
        type: 'delete' | 'update';
        title: string;
        description: string;
    }>({ open: false, type: 'delete', title: '', description: '' });

    // Pending Data
    const [pendingUpdateData, setPendingUpdateData] = useState<Omit<Quote, "id"> | null>(null);

    // 1. DELETE Action
    const handleDelete = (quote: Quote) => {
        setPendingDelete(quote);
        setActionModal({
            open: true,
            type: 'delete',
            title: 'Delete Quote',
            description: `Are you sure you want to delete quote ${quote.quoteNumber}? This action cannot be undone.`
        });
    };

    // 2. UPDATE Action
    const handleSave = async (quoteData: Omit<Quote, "id">) => {
        if (selectedQuote) {
            setPendingUpdateData(quoteData);
            setActionModal({
                open: true,
                type: 'update',
                title: 'Update Quote',
                description: `Are you sure you want to update quote ${selectedQuote.quoteNumber}?`
            });
        } else {
            await executeCreate(quoteData);
        }
    };

    const executeCreate = async (quoteData: Omit<Quote, "id">) => {
        // ... (implementation similar to previous, using execute logic)
        try {
            const res = await fetch('/api/documents/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quoteData) // ID generated by backend DB usually, or here if mock
            });

            if (res.ok) {
                const savedQuote = await res.json();
                addQuote(savedQuote);
                toast.success("Quote created successfully");
                setIsFormModalOpen(false);
            } else {
                toast.error("Failed to create quote");
            }
        } catch (error) {
            console.error("Create error", error);
            toast.error("Error creating quote");
        }
    };

    const confirmAction = async () => {
        if (actionModal.type === 'delete' && pendingDelete) {
            try {
                const res = await fetch(`/api/documents/quotes?id=${pendingDelete.id}`, { method: 'DELETE' });
                if (res.ok) {
                    deleteQuote(pendingDelete.id);
                    toast.success("Quote deleted successfully");
                } else {
                    toast.error("Failed to delete quote");
                }
            } catch (error) {
                console.error("Delete error", error);
                toast.error("Error deleting quote");
            }
        } else if (actionModal.type === 'update' && selectedQuote && pendingUpdateData) {
            const updatedQuote = { ...selectedQuote, ...pendingUpdateData };
            try {
                const res = await fetch('/api/documents/quotes', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedQuote)
                });

                if (res.ok) {
                    updateQuote(selectedQuote.id, pendingUpdateData);
                    toast.success("Quote updated successfully");
                    setIsFormModalOpen(false);
                } else {
                    toast.error("Failed to update quote");
                }
            } catch (error) {
                console.error("Update error", error);
                toast.error("Error updating quote");
            }
        }

        setActionModal({ ...actionModal, open: false });
        setPendingDelete(null);
        setPendingUpdateData(null);
    };

    const handleConvert = async (quote: Quote) => {
        setIsDetailModalOpen(false);
        const newInvoice = convertQuoteToInvoice(quote);
        try {
            const res = await fetch('/api/documents/quotes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: quote.id, status: "Accepted" })
            });

            if (res.ok) {
                updateQuote(quote.id, { status: "Accepted" });
                toast.success("Quote marked as Accepted");
            } else {
                toast.error("Failed to update quote status");
            }
        } catch (error) {
            console.error("Update quote status error", error);
            toast.error("Error updating quote status");
        }
        setInvoiceFromQuote(newInvoice);
        setIsInvoiceModalOpen(true);
    };

    const handleSaveInvoice = async (invoiceData: Omit<Invoice, "id">) => {
        const finalInvoice = invoiceFromQuote
            ? { ...invoiceFromQuote, ...invoiceData }
            : { ...invoiceData } as Invoice;

        try {
            const res = await fetch('/api/documents/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalInvoice)
            });

            if (res.ok) {
                const savedInvoice = await res.json();
                addInvoice(savedInvoice);
                toast.success(`Invoice ${savedInvoice.invoiceNumber} created successfully!`);
            } else {
                toast.error("Failed to create invoice");
            }
        } catch (error) {
            console.error("Create invoice error", error);
            toast.error("Error creating invoice");
        }
        setIsInvoiceModalOpen(false);
        setInvoiceFromQuote(null);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Quotes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your sales quotes
                    </p>
                </div>
                <nav>
                    <ol className="flex items-center gap-2 text-sm">
                        <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li className="text-brand-500">Quotes</li>
                    </ol>
                </nav>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Quotes</p>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                    <p className="text-2xl font-semibold text-brand-500">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
                    <p className="text-2xl font-semibold text-success-500">{stats.accepted}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-semibold text-warning-500">{stats.pending}</p>
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
                                placeholder="Search quotes..."
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
                                { value: "Accepted", label: "Accepted" },
                                { value: "Rejected", label: "Rejected" },
                            ]}
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val as QuoteStatus | "all"); setCurrentPage(1); }}
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
                        Create Quote
                    </button>
                )}
            </div>

            {/* Table */}
            <QuoteTable
                quotes={paginatedQuotes}
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
            <QuoteFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSave}
                quote={selectedQuote}
            />
            <QuoteDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                quote={selectedQuote}
                onEdit={handleEdit}
                onConvert={handleConvert}
            />
            <InvoiceFormModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                onSave={handleSaveInvoice}
                invoice={invoiceFromQuote}
            />

            {/* Single Action Confirmation */}
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
                title="Bulk Delete Quotes"
                description={`Are you sure you want to delete ${selectedIds.length} selected quotes? This action cannot be undone.`}
                confirmText={`Delete ${selectedIds.length} Quotes`}
                variant="danger"
            />
        </div>
    );
}
