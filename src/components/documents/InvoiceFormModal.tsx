"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { toast } from "sonner";
import {
    Invoice,
    InvoiceStatus,
    LineItem,
    generateInvoiceNumber,
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
import Select from "@/components/form/Select";
import { sampleAgents } from "@/components/agents/agentData";

interface InvoiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: Omit<Invoice, "id">) => void;
    invoice?: Invoice | null;
}

interface CustomerOption {
    id: string;
    name: string;
    email: string;
}

const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    invoice,
}) => {
    const isEditMode = !!invoice;
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
                    setProducts(rawProducts.map(transformApiProduct));
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
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState<InvoiceStatus>("Draft");
    const [paymentMethod, setPaymentMethod] = useState<string>("manual");
    const [notes, setNotes] = useState("");
    const [agentsList, setAgentsList] = useState<any[]>([]); // Dynamic agents list

    // Product Selector state
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedProductForConfig, setSelectedProductForConfig] = useState<Product | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    useEffect(() => {
        if (invoice) {
            setSelectedCustomerId(invoice.customerId);
            setLineItems([...invoice.lineItems]);
            setTaxRate(invoice.taxRate);
            setDueDate(invoice.dueDate);
            setStatus(invoice.status);
            // setPaymentMethod(invoice.paymentMethod || "manual"); // Assuming invoice has paymentMethod later
            setNotes(invoice.notes || "");
        } else {
            setSelectedCustomerId("");
            setLineItems([
                { id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 },
            ]);
            setTaxRate(6);
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + 30);
            setDueDate(defaultDueDate.toISOString().split("T")[0]);
            setStatus("Draft");
            setPaymentMethod("manual");
            setNotes("");
        }
    }, [invoice, isOpen]);

    // Fetch Agents dynamically
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch('/api/agents');
                if (res.ok) {
                    const response = await res.json();
                    const agentsData = response.data || [];
                    setAgentsList(agentsData);
                }
            } catch (error) {
                console.error("Failed to fetch agents", error);
                // Fallback to sampleAgents if fetch fails (optional)
                setAgentsList(sampleAgents);
            }
        };
        if (isOpen) {
            fetchAgents();
        }
    }, [isOpen]);

    // Derived state for Agent check using dynamic list
    const selectedAgent = React.useMemo(() => {
        return agentsList.find(a => a.id?.toString() === selectedCustomerId) || sampleAgents.find(a => a.id === selectedCustomerId);
    }, [selectedCustomerId, agentsList]);

    // Combine customers and agents for the dropdown
    const customerOptions = React.useMemo(() => {
        const standardCustomers = customers.map(c => ({ value: c.id, label: c.name }));
        const agentCustomers = agentsList.map((a: any) => ({ value: a.id?.toString(), label: `${a.fullName} (Agent)` }));

        // Remove duplicates if any (though IDs should be unique)
        const all = [...standardCustomers, ...agentCustomers];

        // Unique by value
        return Array.from(new Map(all.map(item => [item.value, item])).values());
    }, [customers, agentsList]);

    // Auto-select wallet if agent
    useEffect(() => {
        if (selectedAgent && status === "Paid") { // Only auto-select when status is Paid
            setPaymentMethod("wallet");
        }
    }, [selectedAgent, status]);

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 },
        ]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((item) => item.id !== id));
        }
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
        // Only allow editing via catalog if productId exists
        if (item.productId) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                setSelectedProductForConfig(product);
                setEditingItemId(item.id);
                setIsConfigOpen(true);
                return;
            }
        }
        // Fallback or explicit edit mode logic could go here if we want to allow editing manual items
    };

    const subtotal = calculateSubtotal(lineItems);
    const taxAmount = calculateTaxAmount(subtotal, taxRate);
    const total = calculateTotal(subtotal, taxAmount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let selectedCustomer: any = customers.find((c) => c.id === selectedCustomerId);
        if (!selectedCustomer) {
            // Check agents list
            const agent = agentsList.find((a: any) => a.id === selectedCustomerId);
            if (agent) {
                selectedCustomer = {
                    id: agent.id,
                    name: agent.fullName,
                    email: agent.email
                };
            }
        }

        if (!selectedCustomer) {
            toast.error("Please select a valid customer");
            return;
        }

        // Wallet Deduction Logic if status is Paid and method is Wallet
        if (status === 'Paid' && paymentMethod === 'wallet') {
            const confirmDeduction = window.confirm(`This will deduct RM${formatCurrency(total)} from the customer's wallet. Proceed?`);
            if (!confirmDeduction) return;

            try {
                const response = await fetch('/api/agent/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: selectedCustomerId,
                        amount: total,
                        type: 'debit',
                        description: `Invoice Payment: ${invoice?.invoiceNumber || 'New Invoice'}`
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    alert(`Payment Failed: ${result.error || 'Unknown error'}`);
                    return;
                }

                // Success: Continue to save invoice
            } catch (error) {
                console.error("Payment error:", error);
                alert("Payment processing failed. Please check network or try again.");
                return;
            }
        }

        const invoiceData: Omit<Invoice, "id"> = {
            invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
            customerId: selectedCustomerId,
            customerName: selectedCustomer.name,
            customerEmail: selectedCustomer.email,
            lineItems,
            subtotal,
            taxRate,
            taxAmount,
            total,
            status,
            createdDate: invoice?.createdDate || new Date().toISOString().split("T")[0],
            dueDate,
            paidDate: status === 'Paid' ? (invoice?.paidDate || new Date().toISOString().split("T")[0]) : undefined,
            notes: notes || undefined,
            // paymentMethod // Add if Invoice interface supports it
        };

        onSave(invoiceData);
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
                    {isEditMode ? "Edit Invoice" : "Create New Invoice"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode ? `Editing ${invoice?.invoiceNumber}` : "Create an invoice for your customer"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer *</label>
                        <Select
                            value={selectedCustomerId}
                            onChange={(value) => setSelectedCustomerId(value)}
                            placeholder="Select customer"
                            options={customerOptions}
                            className={inputClasses.replace("h-11 ", "").replace("border border-gray-300 ", "").replace("dark:border-gray-700 ", "").replace("focus:border-brand-300 ", "").replace("px-4 py-2.5 ", "")} // CustomDropdown has h-11 default
                        />
                        {selectedAgent && (
                            <div className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                                Agent Balance: {formatCurrency(selectedAgent.walletBalance)}
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date *</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className={inputClasses}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <Select
                            value={status}
                            onChange={(value) => setStatus(value as InvoiceStatus)}
                            options={[
                                { value: "Draft", label: "Draft" },
                                { value: "Sent", label: "Sent" },
                                { value: "Paid", label: "Paid" },
                                { value: "Overdue", label: "Overdue" },
                            ]}
                            className={inputClasses.replace("h-11 ", "").replace("border border-gray-300 ", "").replace("dark:border-gray-700 ", "").replace("focus:border-brand-300 ", "").replace("px-4 py-2.5 ", "")}
                        />
                    </div>
                    {status === 'Paid' && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                            <Select
                                value={paymentMethod}
                                onChange={(value) => setPaymentMethod(value)}
                                options={[
                                    { value: "manual", label: "Manual / Bank Transfer" },
                                    { value: "wallet", label: "Agent Wallet" },
                                    { value: "gateway", label: "Payment Gateway" },
                                ]}
                                className={inputClasses.replace("h-11 ", "").replace("border border-gray-300 ", "").replace("dark:border-gray-700 ", "").replace("focus:border-brand-300 ", "").replace("px-4 py-2.5 ", "")}
                            />
                        </div>
                    )}
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-white">Line Items</h4>
                        <button type="button" onClick={handleAddFromCatalog} className="text-sm font-medium text-brand-500 hover:text-brand-600 mr-4">
                            + Add from Catalog
                        </button>
                        <button type="button" onClick={addLineItem} className="text-sm text-gray-500 hover:text-gray-700">
                            + Add Manual Item
                        </button>
                    </div>
                    <div className="space-y-3">
                        {lineItems.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="col-span-5">
                                    {index === 0 && <label className="block text-xs text-gray-500 mb-1">Description</label>}
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
                                    {index === 0 && <label className="block text-xs text-gray-500 mb-1">Qty</label>}
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
                                    {index === 0 && <label className="block text-xs text-gray-500 mb-1">Unit Price</label>}
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
                                    {index === 0 && <label className="block text-xs text-gray-500 mb-1">Total</label>}
                                    <div className="h-10 flex items-center px-3 text-sm font-medium text-gray-800 dark:text-white/90">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                                <div className="col-span-1 flex items-end">
                                    {index === 0 && <div className="h-5"></div>}
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(item.id)}
                                        className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-error-500 transition-colors"
                                        disabled={lineItems.length === 1}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
                        placeholder="Payment terms or additional notes..."
                        rows={3}
                        className={`${inputClasses} h-auto`}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" type="submit">{isEditMode ? "Update Invoice" : "Create Invoice"}</Button>
                </div>
            </form>

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

export default InvoiceFormModal;
