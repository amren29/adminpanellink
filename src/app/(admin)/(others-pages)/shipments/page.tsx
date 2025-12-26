"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useDocumentStore } from "@/components/documents/documentStore";
import { ProductionOrder, formatDateTime } from "@/components/production-board/productionData";
import { Modal } from "@/components/ui/modal";

// Extended type for local use
type ShipmentStatus = 'ready' | 'shipped' | 'delivered';

interface ShipmentOrder extends ProductionOrder {
    trackingNumber?: string;
    courier?: string;
    shipmentStatus?: ShipmentStatus; // Optional as we merge with ProductionOrder
}

const COURIERS = [
    { name: "PosLaju", logo: "POS", baseRate: 6.50 },
    { name: "J&T Express", logo: "J&T", baseRate: 7.00 },
    { name: "NinjaVan", logo: "NINJA", baseRate: 6.80 },
    { name: "DHL eCommerce", logo: "DHL", baseRate: 8.50 },
];

import PlanGuard from "@/components/common/PlanGuard";

export default function ShipmentsPage() {
    const { orders, updateOrder } = useDocumentStore();
    const [activeTab, setActiveTab] = useState<ShipmentStatus>('ready');
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ShipmentOrder | null>(null);

    // Shipment Form State
    const [weight, setWeight] = useState("1.0");
    const [selectedCourier, setSelectedCourier] = useState<string>("");
    const [isCalculating, setIsCalculating] = useState(false);
    const [rates, setRates] = useState<any[]>([]);

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const searchMatch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        if (!searchMatch) return false;

        // Mock status mapping
        // Ready = 'completed' (and no tracking number)
        // Shipped = 'shipped' (or has tracking number)
        const hasTracking = (order as any).trackingNumber || order.status === 'shipped';

        if (activeTab === 'ready') return order.status === 'ready-to-ship';
        if (activeTab === 'shipped') return order.status === 'shipped'; // Warning: 'shipped' added to valid statuses now
        // Delivered - for now assume none or specific status
        return false;
    });

    const openCreateShipment = (order: ProductionOrder) => {
        setSelectedOrder(order as ShipmentOrder);
        setIsCreateModalOpen(true);
        setWeight("1.0");
        setSelectedCourier("");
        setRates([]);
    };

    const handleFetchRates = () => {
        setIsCalculating(true);
        // Mock API Call
        setTimeout(() => {
            const mockRates = COURIERS.map(c => ({
                provider: c.name,
                price: c.baseRate + (Number(weight) * 1.5), // Simple mock calc
                estDays: "1-3 Days"
            }));
            setRates(mockRates);
            setIsCalculating(false);
        }, 1000);
    };

    const handleConfirmShipment = () => {
        if (!selectedOrder || !selectedCourier) return;

        // Mock Tracking Number Generation
        const trackingNum = `MY${Math.floor(Math.random() * 1000000000)}PC`;

        updateOrder(selectedOrder.id, {
            status: 'shipped',
            // We are adding custom fields to the store update. 
            // Note: Typescript might complain if ProductionOrder doesn't have these, 
            // but the store might be loose or we'll suppress for MVP.
            // Ideally we extend the interface.
            // For now, assume 'notes' can carry this info if strictly typed, 
            // OR we cast to any if the store permits dynamic fields.
            // I'll append to notes for safety, BUT standard practice is adding fields.
            // Let's rely on the runtime javascript flexibility for now, or just notes.
            // User requested "integrate", so implying data persistence.
            // I will inject properties.
            notes: (selectedOrder.notes ? selectedOrder.notes + '\n' : '') + `[Shipment] ${selectedCourier} - ${trackingNum}`,
        } as any);

        // Also hacking the local state object in memory if store relies on references
        (selectedOrder as any).trackingNumber = trackingNum;
        (selectedOrder as any).courier = selectedCourier;

        alert(`Shipment Created! Tracking: ${trackingNum}`);
        setIsCreateModalOpen(false);
        // Force re-render or let store update trigger it
        // The filter depends on 'status' mostly.
    };

    const handlePrintWaybill = (order: any) => {
        // Parse tracking from notes if not directly on object (fallback)
        let tracking = order.trackingNumber;
        let courier = order.courier;

        if (!tracking && order.notes) {
            const match = order.notes.match(/\[Shipment\] (.*?) - (MY\d+PC)/);
            if (match) {
                courier = match[1];
                tracking = match[2];
            }
        }

        if (!tracking) {
            alert("No tracking information found.");
            return;
        }

        const printWindow = window.open('', '', 'width=850,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Waybill - ${tracking}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; }
                        .waybill-container { border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; align-items: center; }
                        .courier-brand { font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
                        .meta { text-align: right; font-size: 12px; }
                        
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
                        .box { border: 1px solid #333; padding: 15px; position: relative; }
                        .label { position: absolute; top: -10px; left: 10px; background: #fff; padding: 0 5px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                        
                        .address { font-size: 14px; line-height: 1.4; }
                        .address strong { display: block; font-size: 16px; margin-bottom: 5px; }

                        .barcode-area { text-align: center; margin: 40px 0; border-top: 2px dashed #ccc; border-bottom: 2px dashed #ccc; padding: 30px 0; }
                        .barcode-text { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-top: 10px; }
                        
                        .footer { font-size: 10px; text-align: center; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt: 10px; }
                        
                        @media print { 
                            button { display: none; } 
                            body { padding: 0; }
                            .waybill-container { border: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="waybill-container">
                        <div class="header">
                            <div class="courier-brand">${courier}</div>
                            <div class="meta">
                                <div><strong>DOMESTIC</strong></div>
                                <div>Date: ${new Date().toLocaleDateString()}</div>
                                <div>Acc: Available on Integration</div>
                            </div>
                        </div>

                        <div class="grid">
                            <div class="box">
                                <span class="label">Sender (Pengirim)</span>
                                <div class="address">
                                    <strong>Production HQ</strong>
                                    123, Jalan Printing Hub,<br>
                                    Industrial Park,<br>
                                    50000 Kuala Lumpur, Malaysia<br>
                                    Tel: +60 3-1234 5678
                                </div>
                            </div>
                            <div class="box">
                                <span class="label">Receiver (Penerima)</span>
                                <div class="address">
                                    <strong>${order.customerName}</strong>
                                    ${order.customerEmail}<br>
                                    Tel: ${order.customerPhone || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div class="barcode-area">
                             <!-- Simulate Barcode with Fonts or CSS lines -->
                            <div style="height: 60px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 6px); width: 80%; margin: 0 auto;"></div>
                            <div class="barcode-text">*${tracking}*</div>
                        </div>

                        <div class="grid">
                            <div class="box">
                                <span class="label">Order Details</span>
                                <div style="font-size: 12px;">
                                    Ref: ${order.orderNumber}<br>
                                    Items: ${order.items.length}<br>
                                    Content: ${order.items.map((i: any) => i.name).join(', ').substring(0, 50)}...
                                </div>
                            </div>
                             <div class="box">
                                <span class="label">Service Details</span>
                                <div style="font-size: 12px;">
                                    Weight: 1.0 KG<br>
                                    Type: Parcel document<br>
                                    COD: RM 0.00
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            Generated by System Integration • ${new Date().toISOString()}
                        </div>

                        <div style="text-align: center; margin-top: 30px;">
                            <button onclick="window.print();" style="background: #000; color: #fff; padding: 12px 24px; border: none; font-size: 16px; cursor: pointer; border-radius: 4px;">Print Waybill</button>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <PlanGuard feature="shipments">
            <div className="p-6 pb-20">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Shipment Management</h1>
                        <p className="text-sm text-gray-500">Integrate with 3rd party couriers & print waybills</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    {(['ready', 'shipped'] as ShipmentStatus[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300"
                                }`}
                        >
                            {tab === 'ready' ? 'Ready to Ship' : 'Shipped / In Transit'}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search order number..."
                        className="w-full max-w-md px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                                <th className="px-6 py-4 font-medium">Order Info</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                {activeTab === 'shipped' && <th className="px-6 py-4 font-medium">Tracking</th>}
                                <th className="px-6 py-4 text-right font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredOrders.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No orders found</td></tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4">
                                            <span className="block font-medium text-gray-900 dark:text-white">{order.orderNumber}</span>
                                            <span className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order.customerEmail}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge color={order.status === 'completed' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}>
                                                {order.status.replace('-', ' ')}
                                            </Badge>
                                        </td>
                                        {activeTab === 'shipped' && (
                                            <td className="px-6 py-4 font-mono text-sm text-gray-800 dark:text-gray-300">
                                                {/* Extract tracking from notes if possible, else generic */}
                                                {(order as any).trackingNumber || (order.notes?.match(/MY\d+PC/)?.[0]) || "-"}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            {activeTab === 'ready' && (
                                                <Button size="sm" onClick={() => openCreateShipment(order)}>
                                                    Create Shipment
                                                </Button>
                                            )}
                                            {activeTab === 'shipped' && (
                                                <Button size="sm" variant="outline" onClick={() => handlePrintWaybill(order)}>
                                                    Print Waybill
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Create Shipment Modal */}
                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="max-w-xl p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Shipment</h3>
                        <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                            <div className="text-2xl">...</div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">{selectedOrder?.orderNumber}</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    {selectedOrder?.customerName} • {selectedOrder?.items.length} items
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (KG)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dimensions</label>
                                <div className="flex gap-2">
                                    <input placeholder="L" className="w-full border rounded-lg p-2 text-center text-sm dark:bg-gray-800 dark:border-gray-700" />
                                    <input placeholder="W" className="w-full border rounded-lg p-2 text-center text-sm dark:bg-gray-800 dark:border-gray-700" />
                                    <input placeholder="H" className="w-full border rounded-lg p-2 text-center text-sm dark:bg-gray-800 dark:border-gray-700" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Select Courier</label>
                                <button
                                    onClick={handleFetchRates}
                                    className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                                >
                                    Refresh Rates
                                </button>
                            </div>

                            {!rates.length && !isCalculating && (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg dashed border-2 border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-400 text-sm">Enter details and fetch rates</p>
                                    <Button variant="outline" size="sm" className="mt-2" onClick={handleFetchRates}>
                                        Get Rates
                                    </Button>
                                </div>
                            )}

                            {isCalculating && (
                                <div className="text-center py-8">
                                    <div className="animate-spin text-2xl mb-2">...</div>
                                    <p className="text-sm text-gray-500">Fetching best rates...</p>
                                </div>
                            )}

                            {rates.length > 0 && (
                                <div className="space-y-2">
                                    {rates.map(rate => (
                                        <div
                                            key={rate.provider}
                                            onClick={() => setSelectedCourier(rate.provider)}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedCourier === rate.provider
                                                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                                    {rate.provider.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{rate.provider}</div>
                                                    <div className="text-xs text-green-600">{rate.estDays}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900 dark:text-white">RM {rate.price.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!selectedCourier}
                            onClick={handleConfirmShipment}
                        >
                            Confirm Shipment
                        </Button>
                    </div>
                </Modal>
            </div>
        </PlanGuard>
    );
}
