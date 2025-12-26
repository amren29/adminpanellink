import React from "react";
import { Order, OrderItem, orderStatusColors, formatCurrency } from "./orderData";
import Badge from "@/components/ui/badge/Badge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onEdit: (order: Order) => void;
    onDelete?: (order: Order) => void;
}

export default function OrderDetailModal({
    isOpen,
    onClose,
    order,
    onEdit,
    onDelete,
}: OrderDetailModalProps) {
    if (!order) return null;

    const statusStyle = orderStatusColors[order.status] || { bg: "bg-gray-100", text: "text-gray-800" };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false} // Using Header close button
            className="max-w-2xl max-h-[90vh]"
        >
            {/* Header */}
            <ModalHeader onClose={onClose}>
                <div className="flex flex-col gap-1.5">
                    <span>{order.orderNumber}</span>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                            {order.status.replace("_", " ")}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {order.priority.toUpperCase()}
                        </span>
                    </div>
                </div>
            </ModalHeader>

            {/* Content */}
            <ModalBody>
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Customer</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Name</label>
                                <p className="text-gray-800 dark:text-white font-medium">
                                    {order.customer?.fullName || "Guest"}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                                <p className="text-gray-800 dark:text-white">{order.customer?.email || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Agent Info (if any) */}
                    {order.agent && (
                        <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                            <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-300 mb-2">Agent</h3>
                            <p className="text-sm text-gray-800 dark:text-white">{order.agent.fullName}</p>
                        </div>
                    )}

                    {/* Order Items */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Items</h3>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Item</th>
                                        <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Qty</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Unit Price</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {order.items && order.items.length > 0 ? (
                                        order.items.map((item, idx) => (
                                            <tr key={item.id || idx}>
                                                <td className="px-4 py-3 text-gray-800 dark:text-white">{item.name}</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white">{formatCurrency(item.totalPrice)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No items</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                <span className="text-gray-800 dark:text-white">{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(order.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Tax</span>
                                <span className="text-gray-800 dark:text-white">{formatCurrency(order.taxAmount)}</span>
                            </div>
                            {order.shippingAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                                    <span className="text-gray-800 dark:text-white">{formatCurrency(order.shippingAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-base">
                                <span className="text-gray-800 dark:text-white">Total</span>
                                <span className="text-brand-600 dark:text-brand-400">{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery & Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Delivery Method</label>
                            <p className="font-medium text-gray-800 dark:text-white capitalize">{order.deliveryMethod || "Standard"}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Due Date</label>
                            <p className="font-medium text-gray-800 dark:text-white">
                                {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "-"}
                            </p>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Notes</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
                        </div>
                    )}
                </div>
            </ModalBody>

            {/* Actions */}
            <ModalFooter className={onDelete ? "justify-between" : ""}>
                {onDelete ? (
                    <button
                        onClick={() => onDelete(order)}
                        className="px-4 py-2 text-sm font-medium text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                    >
                        Delete Order
                    </button>
                ) : <div></div>}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => onEdit(order)}>
                        Edit Order
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    );
}
