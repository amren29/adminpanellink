"use client";
import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { toast } from "sonner";
import { Invoice, invoiceStatusColors, formatCurrency, formatDate } from "./documentData";

interface InvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onEdit: (invoice: Invoice) => void;
    onConvert?: (invoice: Invoice) => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
    isOpen,
    onClose,
    invoice,
    onEdit,
    onConvert,
}) => {
    if (!invoice) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false} // Managed by Header
            className="max-w-2xl max-h-[90vh]"
        >
            {/* Header */}
            <ModalHeader onClose={onClose}>
                <div className="flex flex-col gap-1.5">
                    <span>{invoice.invoiceNumber}</span>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${invoiceStatusColors[invoice.status].bg
                            } ${invoiceStatusColors[invoice.status].text}`}>
                            {invoice.status}
                        </span>
                        <span className="text-xs text-gray-400 font-normal">
                            Created {formatDate(invoice.createdDate)}
                        </span>
                    </div>
                </div>
            </ModalHeader>

            <ModalBody>
                {/* Customer Info */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Customer</h4>
                    <p className="text-gray-800 dark:text-white font-medium">{invoice.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.customerEmail}</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Invoice Date</h4>
                        <p className="text-gray-800 dark:text-white">{formatDate(invoice.createdDate)}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</h4>
                        <p className={invoice.status === "Overdue" ? "text-error-500 font-medium" : "text-gray-800 dark:text-white"}>
                            {formatDate(invoice.dueDate)}
                        </p>
                    </div>
                    {invoice.paidDate && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Paid Date</h4>
                            <p className="text-success-500 font-medium">{formatDate(invoice.paidDate)}</p>
                        </div>
                    )}
                </div>

                {/* Line Items */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Items</h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Qty</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Unit Price</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {invoice.lineItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{item.description}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{item.quantity}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-white/90 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                            <span className="text-gray-800 dark:text-white/90">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Tax ({invoice.taxRate}%)</span>
                            <span className="text-gray-800 dark:text-white/90">{formatCurrency(invoice.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-800 dark:text-white">Total</span>
                            <span className="text-brand-500">{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{invoice.notes}</p>
                    </div>
                )}

                {/* Share Actions */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <button
                        onClick={() => {
                            const link = `${window.location.origin}/view/invoice/${invoice.id}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Share link copied to clipboard!');
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Copy Share Link
                    </button>
                    <a
                        href={`/view/invoice/${invoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View & Download PDF
                    </a>
                </div>
            </ModalBody>

            <ModalFooter>
                <Button variant="outline" onClick={onClose}>Close</Button>
                {/* Only show Convert button for Paid/Sent invoices? Or any? Usually Paid or Sent. */}
                {(invoice.status === "Paid" || invoice.status === "Sent" || invoice.status === "Draft") && (
                    <Button
                        variant="outline"
                        onClick={() => onConvert?.(invoice)}
                        className="border-brand-200 text-brand-600 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-900/20"
                    >
                        Convert to Order
                    </Button>
                )}
                <Button variant="primary" onClick={() => onEdit(invoice)}>Edit Invoice</Button>
            </ModalFooter>
        </Modal>
    );
};

export default InvoiceDetailModal;
