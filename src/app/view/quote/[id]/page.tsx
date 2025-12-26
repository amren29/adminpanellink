"use client";
import React, { useEffect, useState, useRef, use } from "react";
import { Quote, formatCurrency } from "@/components/documents/documentData";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch(`/api/documents/quotes?id=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setQuote(data);
                } else {
                    setError("Quote not found");
                }
            } catch (err) {
                setError("Failed to load quote");
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchQuote();
        }
    }, [id]);

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;

        const canvas = await html2canvas(contentRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Quote-${quote?.quoteNumber || "document"}.pdf`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading quote...</p>
                </div>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">Quote Not Found</h1>
                    <p className="text-gray-600">{error || "This quote does not exist or has been deleted."}</p>
                </div>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        Draft: "bg-gray-100 text-gray-700",
        Sent: "bg-blue-100 text-blue-700",
        Accepted: "bg-green-100 text-green-700",
        Rejected: "bg-red-100 text-red-700",
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            {/* Action Bar */}
            <div className="max-w-4xl mx-auto px-4 mb-6 flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-800">Quote Preview</h1>
                <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                </button>
            </div>

            {/* Document Content */}
            <div ref={contentRef} className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-brand-500 text-white p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">QUOTE</h1>
                            <p className="text-brand-100 mt-1">{quote.quoteNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold">Your Company Name</p>
                            <p className="text-brand-100 text-sm">123 Business Street</p>
                            <p className="text-brand-100 text-sm">City, State 12345</p>
                        </div>
                    </div>
                </div>

                {/* Quote Info */}
                <div className="p-8 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Bill To</h3>
                            <p className="text-lg font-semibold text-gray-800">{quote.customerName}</p>
                            <p className="text-gray-600">{quote.customerEmail}</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[quote.status]}`}>
                                    {quote.status}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500">Date:</span> <span className="text-gray-800">{quote.createdDate}</span></p>
                                <p><span className="text-gray-500">Valid Until:</span> <span className="text-gray-800">{quote.validUntil}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="p-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Description</th>
                                <th className="text-center py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
                                <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Unit Price</th>
                                <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.lineItems.map((item, idx) => (
                                <tr key={item.id} className={idx !== quote.lineItems.length - 1 ? "border-b border-gray-100" : ""}>
                                    <td className="py-4 text-gray-800">{item.description}</td>
                                    <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-4 text-right font-medium text-gray-800">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="p-8 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end">
                        <div className="w-80 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-800">{formatCurrency(quote.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax ({quote.taxRate}%)</span>
                                <span className="text-gray-800">{formatCurrency(quote.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                                <span className="text-gray-800">Total</span>
                                <span className="text-brand-600">{formatCurrency(quote.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                    <div className="p-8 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
                        <p className="text-gray-600">{quote.notes}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="p-8 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">If you have any questions, please contact us.</p>
                </div>
            </div>
        </div>
    );
}
