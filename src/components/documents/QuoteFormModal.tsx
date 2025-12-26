"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { toast } from "sonner";
import {
    Quote,
    QuoteStatus,
    LineItem,
    generateQuoteNumber,
    generateLineItemId,
    calculateLineItemTotal,
    calculateSubtotal,
    calculateTaxAmount,
    calculateTotal,
    formatCurrency,
} from "./documentData";
import { Product, transformApiProduct } from "@/components/products/productData";
import ProductSelectorModal from "@/components/production-board/ProductSelectorModal";
import ProductConfigurationModal from "@/components/production-board/ProductConfigurationModal";
import { OrderItem } from "@/components/production-board/productionData";
import { CustomDropdown } from "@/components/ui/dropdown/CustomDropdown";

interface QuoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quote: Omit<Quote, "id">) => void;
    quote?: Quote | null;
}

interface CustomerOption {
    id: string;
    name: string;
    email: string;
}

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    quote,
}) => {
    const isEditMode = !!quote;
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Fetch customers and products from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch customers
                const customersRes = await fetch('/api/customers');
                if (customersRes.ok) {
                    const response = await customersRes.json();
                    const customersData = response.data || [];
                    setCustomers(customersData.map((c: any) => ({
                        id: c.id.toString(),
                        name: c.fullName,
                        email: c.email,
                    })));
                }

                // Fetch products
                const productsRes = await fetch('/api/products?limit=1000');
                if (productsRes.ok) {
                    const productsResponse = await productsRes.json();
                    const rawProducts = productsResponse.data || [];
                    const transformed = rawProducts.map(transformApiProduct);
                    console.log('[QuoteFormModal] Raw products[0]:', rawProducts[0]);
                    console.log('[QuoteFormModal] Transformed products[0]:', transformed[0]);
                    setProducts(transformed);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [taxRate, setTaxRate] = useState(6);
    const [validUntil, setValidUntil] = useState("");
    const [status, setStatus] = useState<QuoteStatus>("Draft");
    const [notes, setNotes] = useState("");

    // Product Selector state
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedProductForConfig, setSelectedProductForConfig] = useState<Product | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null); // For editing existing line items

    useEffect(() => {
        if (quote) {
            setSelectedCustomerId(quote.customerId);
            setLineItems([...quote.lineItems]);
            setTaxRate(quote.taxRate);
            setValidUntil(quote.validUntil);
            setStatus(quote.status);
            setNotes(quote.notes || "");
        } else {
            setSelectedCustomerId("");
            setLineItems([
                { id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 },
            ]);
            setTaxRate(6);
            const defaultValidDate = new Date();
            defaultValidDate.setDate(defaultValidDate.getDate() + 30);
            setValidUntil(defaultValidDate.toISOString().split("T")[0]);
            setStatus("Draft");
            setNotes("");
        }
    }, [quote, isOpen]);

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 },
        ]);
    };

    const removeLineItem = (id: string) => {
        setLineItems(lineItems.filter((item) => item.id !== id));
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
        setLineItems(
            lineItems.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    if (field === "quantity" || field === "unitPrice") {
                        updated.total = calculateLineItemTotal(
                            field === "quantity" ? Number(value) : item.quantity,
                            field === "unitPrice" ? Number(value) : item.unitPrice
                        );
                    }
                    return updated;
                }
                return item;
            })
        );
    };

    // Handlers for Product Selector Flow
    const handleAddFromCatalog = () => {
        setIsSelectorOpen(true);
    };

    const handleProductSelect = (product: Product) => {
        setIsSelectorOpen(false);
        setSelectedProductForConfig(product);
        setIsConfigOpen(true);
    };

    const handleConfigConfirm = (items: OrderItem[]) => {
        // Convert OrderItem[] to LineItem[]
        const newLineItems: LineItem[] = items.map(item => ({
            id: editingItemId && items.length === 1 ? editingItemId : generateLineItemId(),
            description: `${item.name}${item.specifications ? ' - ' + item.specifications : ''}`,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            total: item.totalPrice || 0,
            productId: selectedProductForConfig?.id, // Store product ID for re-editing
        }));

        if (editingItemId && newLineItems.length === 1) {
            // Update existing single item
            setLineItems(prev => prev.map(li => li.id === editingItemId ? newLineItems[0] : li));
        } else {
            // Add new items (or multiple items if editing resulted in split - rare but possible)
            // If we are editing, and became multiple, we might want to replace the original.
            if (editingItemId) {
                // Replace the edited item with new items
                setLineItems(prev => {
                    const idx = prev.findIndex(li => li.id === editingItemId);
                    if (idx === -1) return [...prev, ...newLineItems];
                    const newArr = [...prev];
                    newArr.splice(idx, 1, ...newLineItems);
                    return newArr;
                });
            } else {
                setLineItems(prev => [...prev, ...newLineItems]);
            }
        }

        setIsConfigOpen(false);
        setSelectedProductForConfig(null);
        setEditingItemId(null);
    };

    // Handle editing a line item
    const handleEditLineItem = (item: LineItem) => {
        if (item.productId) {
            // Find product from catalog
            const product = products.find(p => p.id === item.productId);
            if (product) {
                setSelectedProductForConfig(product);
                setEditingItemId(item.id);
                setIsConfigOpen(true);
            }
        }
    };

    const subtotal = calculateSubtotal(lineItems);
    const taxAmount = calculateTaxAmount(subtotal, taxRate);
    const total = calculateTotal(subtotal, taxAmount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedCustomerId) {
            alert("Please select a customer");
            return;
        }

        const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
        // If we have an ID but can't find the customer object (e.g. pagination or stale data), 
        // we might still want to proceed if we are in edit mode and the ID hasn't changed, 
        // BUT for safety, strictly requiring the customer object is better to update name/email.
        // However, if the customer list is loaded asynchronously, we might need to handle that.
        // For now, let's assume valid customers are loaded.

        if (!selectedCustomer) {
            // Fallback: If editing and ID matches original, maybe keep original name/email?
            // But simpler to just error out or ensure customers are loaded.
            alert("Invalid Customer selected");
            return;
        }

        const quoteData: Omit<Quote, "id"> = {
            quoteNumber: quote?.quoteNumber || generateQuoteNumber(),
            customerId: selectedCustomerId,
            customerName: selectedCustomer.name,
            customerEmail: selectedCustomer.email,
            lineItems,
            subtotal,
            taxRate,
            taxAmount,
            total,
            status,
            createdDate: quote?.createdDate || new Date().toISOString().split("T")[0],
            validUntil,
            notes: notes || undefined,
        };

        onSave(quoteData);
        onClose();
    };

    const inputClasses =
        "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

    const labelClasses =
        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-4xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
        >
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {isEditMode ? "Edit Quote" : "Create New Quote"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode ? `Editing ${quote?.quoteNumber}` : "Create a quote for your customer"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quote Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClasses}>Customer *</label>
                        <CustomDropdown
                            value={selectedCustomerId}
                            onChange={(val) => setSelectedCustomerId(val as string)}
                            options={[
                                { value: "", label: "Select customer" },
                                ...customers.map((c) => ({ value: c.id, label: c.name }))
                            ]}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Valid Until *</label>
                        <input
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className={inputClasses}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Status</label>
                        <CustomDropdown
                            value={status}
                            onChange={(val) => setStatus(val as QuoteStatus)}
                            options={[
                                { value: "Draft", label: "Draft" },
                                { value: "Sent", label: "Sent" },
                                { value: "Accepted", label: "Accepted" },
                                { value: "Rejected", label: "Rejected" },
                            ]}
                        />
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                            Line Items
                        </h4>
                        <button
                            type="button"
                            onClick={addLineItem}
                            className="text-sm text-brand-500 hover:text-brand-600"
                        >
                            + Add Item
                        </button>
                        <button
                            type="button"
                            onClick={handleAddFromCatalog}
                            className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
                        >
                            Add from Catalog
                        </button>
                    </div>
                    <div className="space-y-3">
                        {lineItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <div className="col-span-5">
                                    {index === 0 && (
                                        <label className="block text-xs text-gray-500 mb-1">Description</label>
                                    )}
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                                        placeholder="Description"
                                        className={`${inputClasses} h-10`}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    {index === 0 && (
                                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                                    )}
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                        min="1"
                                        className={`${inputClasses} h-10`}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    {index === 0 && (
                                        <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                                    )}
                                    <input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                        className={`${inputClasses} h-10`}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    {index === 0 && (
                                        <label className="block text-xs text-gray-500 mb-1">Total</label>
                                    )}
                                    <div className="h-10 flex items-center px-3 text-sm font-medium text-gray-800 dark:text-white/90">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                                <div className="col-span-1 flex items-end gap-1">
                                    {index === 0 && <div className="h-5"></div>}
                                    {/* Edit button - only for catalog items */}
                                    {item.productId && (
                                        <button
                                            type="button"
                                            onClick={() => handleEditLineItem(item)}
                                            className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                            title="Edit product configuration"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.915 1.44775 13.1602 1.49653 13.389 1.59129C13.6178 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.38299 14.4094 2.61178C14.5042 2.84057 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82617 14.4094 4.05496C14.3147 4.28375 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    )}
                                    {/* Delete button */}
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(item.id)}
                                        className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remove item"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.25 4.5H3.75H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-72 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                            <span className="text-gray-800 dark:text-white/90">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-500 dark:text-gray-400">Tax (%)</span>
                            <input
                                type="number"
                                value={taxRate}
                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                                step="0.5"
                                className="w-20 h-8 text-right rounded border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Tax Amount</span>
                            <span className="text-gray-800 dark:text-white/90">{formatCurrency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-800 dark:text-white">Total</span>
                            <span className="text-brand-500">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className={labelClasses}>Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes or terms..."
                        rows={3}
                        className={`${inputClasses} h-auto`}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        {isEditMode && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const link = `${window.location.origin}/view/quote/${quote?.id}`;
                                        navigator.clipboard.writeText(link);
                                        toast.success('Share link copied to clipboard!');
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share Link
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        alert('Generating PDF... (Feature coming soon)');
                                        // TODO: Implement PDF generation
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save
                        </Button>
                    </div>
                </div>
            </form>

            {/* Product Selector Modals */}
            <ProductSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleProductSelect}
                products={products}
            />
            <ProductConfigurationModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                product={selectedProductForConfig}
                onConfirm={handleConfigConfirm}
            />
        </Modal>
    );
};

export default QuoteFormModal;
