"use client";
import React, { useState, useEffect } from "react";
import { Order, OrderItem, OrderStatus, OrderPriority, formatCurrency } from "./orderData";
import { CloseIcon } from "@/icons/index";
import { toast } from "sonner";
import Select from "@/components/form/Select";

interface OrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (orderData: Partial<Order>) => void;
    order?: Order | null;
    loading?: boolean;
}

interface Customer {
    id: string;
    fullName: string;
    email: string;
}

interface Agent {
    id: string;
    fullName: string;
}

const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: "new_order", label: "New Order" },
    { value: "processing", label: "Processing" },
    { value: "design", label: "Design" },
    { value: "production", label: "Production" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "on_hold", label: "On Hold" },
];

const priorityOptions: { value: OrderPriority; label: string }[] = [
    { value: "normal", label: "Normal" },
    { value: "urgent", label: "Urgent" },
];

const deliveryMethods = [
    { value: "pickup", label: "Self Pickup" },
    { value: "courier", label: "Courier" },
];

const emptyItem: Omit<OrderItem, "id"> = {
    productId: "",
    name: "",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
};

export default function OrderFormModal({
    isOpen,
    onClose,
    onSave,
    order,
    loading = false,
}: OrderFormModalProps) {
    const isEditing = !!order;

    // Form state
    const [customerId, setCustomerId] = useState("");
    const [agentId, setAgentId] = useState("");
    const [status, setStatus] = useState<OrderStatus>("new_order");
    const [priority, setPriority] = useState<OrderPriority>("normal");
    const [deliveryMethod, setDeliveryMethod] = useState("pickup");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<Omit<OrderItem, "id">[]>([{ ...emptyItem }]);

    // Lists
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);

    // Fetch customers and agents
    useEffect(() => {
        if (isOpen) {
            fetch("/api/customers?limit=100")
                .then((res) => res.json())
                .then((data) => setCustomers(data.data || []))
                .catch(console.error);

            fetch("/api/agents?limit=100")
                .then((res) => res.json())
                .then((data) => setAgents(data.data || []))
                .catch(console.error);
        }
    }, [isOpen]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && order) {
            setCustomerId(order.customerId || "");
            setAgentId(order.agentId || "");
            setStatus(order.status);
            setPriority(order.priority);
            setDeliveryMethod(order.deliveryMethod || "pickup");
            setDueDate(order.dueDate ? order.dueDate.split("T")[0] : "");
            setNotes(order.notes || "");
            setItems(order.items?.map((i) => ({
                productId: i.productId || "",
                name: i.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
                width: i.width,
                height: i.height,
                specifications: i.specifications,
            })) || [{ ...emptyItem }]);
        } else if (isOpen) {
            // Reset for new order
            setCustomerId("");
            setAgentId("");
            setStatus("new_order");
            setPriority("normal");
            setDeliveryMethod("pickup");
            setDueDate("");
            setNotes("");
            setItems([{ ...emptyItem }]);
        }
    }, [isOpen, order]);

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            // Recalculate total
            if (field === "quantity" || field === "unitPrice") {
                updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
            }
            return updated;
        });
    };

    const addItem = () => {
        setItems((prev) => [...prev, { ...emptyItem }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0; // Can be configurable
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!customerId) {
            toast.error("Please select a customer");
            return;
        }

        if (items.every((i) => !i.name.trim())) {
            toast.error("Please add at least one item");
            return;
        }

        const validItems = items.filter((i) => i.name.trim());

        const orderData: Partial<Order> = {
            customerId,
            agentId: agentId || undefined,
            status,
            priority,
            deliveryMethod,
            dueDate: dueDate || undefined,
            notes: notes || undefined,
            subtotal,
            discountAmount: 0,
            taxAmount,
            shippingAmount: 0,
            totalAmount,
            items: validItems as OrderItem[],
        };

        onSave(orderData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {isEditing ? "Edit Order" : "Create New Order"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-6">
                    {/* Customer & Agent */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Customer <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={customerId}
                                onChange={(val) => setCustomerId(val)}
                                options={customers.map((c) => ({
                                    value: c.id,
                                    label: `${c.fullName} (${c.email})`
                                }))}
                                placeholder="Select Customer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Agent (Optional)
                            </label>
                            <Select
                                value={agentId}
                                onChange={(val) => setAgentId(val)}
                                options={[
                                    { value: "", label: "No Agent" },
                                    ...agents.map((a) => ({
                                        value: a.id,
                                        label: a.fullName
                                    }))
                                ]}
                                placeholder="Select Agent"
                            />
                        </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <Select
                                value={status}
                                onChange={(val) => setStatus(val as OrderStatus)}
                                options={statusOptions}
                                placeholder="Select Status"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority
                            </label>
                            <Select
                                value={priority}
                                onChange={(val) => setPriority(val as OrderPriority)}
                                options={priorityOptions}
                                placeholder="Select Priority"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Delivery Method
                            </label>
                            <Select
                                value={deliveryMethod}
                                onChange={(val) => setDeliveryMethod(val)}
                                options={deliveryMethods}
                                placeholder="Select Method"
                            />
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>

                    {/* Order Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Order Items
                            </label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                            >
                                + Add Item
                            </button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Item name"
                                            value={item.name}
                                            onChange={(e) => updateItem(index, "name", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div className="w-20">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm text-center"
                                        />
                                    </div>
                                    <div className="w-28">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Unit Price"
                                            value={item.unitPrice || ""}
                                            onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div className="w-28 flex items-center justify-end">
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                                            {formatCurrency(item.totalPrice)}
                                        </span>
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals Summary */}
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                            <span className="text-gray-800 dark:text-white font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold">
                            <span className="text-gray-800 dark:text-white">Total</span>
                            <span className="text-brand-600 dark:text-brand-400">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Add any notes for this order..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Saving..." : isEditing ? "Update Order" : "Create Order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
