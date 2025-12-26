"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Product, PriceCalculation, formatCurrency } from "@/components/products/productData";
import PriceCalculator, { ProductConfiguration } from "@/components/products/PriceCalculator";
import { OrderItem } from "./productionData";

interface ProductConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onConfirm: (items: OrderItem[]) => void;
}

export default function ProductConfigurationModal({
    isOpen,
    onClose,
    product,
    onConfirm,
}: ProductConfigurationModalProps) {
    const [priceData, setPriceData] = useState<PriceCalculation | null>(null);
    const [config, setConfig] = useState<ProductConfiguration | null>(null);

    const handleConfirm = () => {
        if (!product || !priceData || !config) return;

        // Handle apparel products with variant rows (multiple sizes)
        if (config.variantRows && config.variantRows.length > 0) {
            const variantItems: OrderItem[] = [];

            // Create multiple items, one for each variant row
            config.variantRows.forEach((row, idx) => {
                // If row quantity is 0, skip? Maybe user wants to add 0 qty? 
                // Usually skip 0 qty rows in batch add.
                if (row.quantity <= 0) return;

                let description = row.size.name;

                // Add selected options for this row (like Collar Style, etc.)
                // In a real app we'd map IDs to names here using department settings

                const variantItem: OrderItem = {
                    id: `${Math.random().toString()}-${idx}`,
                    name: `${product.name} - ${row.size.name}`,
                    quantity: row.quantity,
                    departmentId: product.departmentId,
                    status: "pending",
                    width: row.size.widthInch || 0,
                    height: row.size.heightInch || 0,
                    specifications: description,
                    productName: product.name,
                    // Calculate price per variant
                    unitPrice: priceData.unitPrice, // This is technically "Average Unit Price" across variants if calculated globally?
                    // Actually priceData from Apparel Calc returns TOTAL price and UNIT price (average).
                    // If we want per-row price, we need `rowTotal` from calculation.
                    // But `priceData` (PriceCalculation interface) doesn't have `rows`.
                    // We might need to cast `priceData` if it's apparel.
                    // However, for now, let's use the unitPrice provided (Average).
                    totalPrice: row.quantity * priceData.unitPrice,
                };

                // If priceData has `rows` (from apparel calculation), we should try to use exact row price?
                // But `PriceCalculation` interface might not have it. 
                // We'll stick to provided totals.

                variantItems.push(variantItem);
            });

            if (variantItems.length > 0) {
                onConfirm(variantItems);
            }
            return;
        }

        // Standard product handling (non-apparel)
        let itemName = product.name;
        let description = `${config.selectedSize.name}`;

        if (config.selectedMaterial) {
            description += `, ${config.selectedMaterial.name}`;
        }

        if (config.selectedFinishing.length > 0) {
            description += `, ${config.selectedFinishing.map(f => f.name).join(", ")}`;
        }

        // Add custom dimensions if specified
        if (config.customWidth && config.customHeight) {
            description += ` (${config.customWidth}" x ${config.customHeight}")`;
        }

        const newItem: OrderItem = {
            id: Math.random().toString(),
            name: itemName,
            quantity: config.quantity,
            departmentId: product.departmentId,
            status: "pending",
            width: config.customWidth || (config.selectedSize.widthInch || 0),
            height: config.customHeight || (config.selectedSize.heightInch || 0),
        };

        const itemWithPrice = {
            ...newItem,
            unitPrice: priceData.unitPrice,
            totalPrice: priceData.totalPrice,
            productName: product.name,
            specifications: description,
        };

        onConfirm([itemWithPrice as any]);
    };

    if (!isOpen || !product) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-4xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
        >
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 pr-12">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Configure {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image & Info */}
                <div className="space-y-4">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative border border-gray-200 dark:border-gray-700">
                        {product.images?.[0] ? (
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Product Details</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{product.description}</p>
                    </div>
                </div>

                {/* Calculator */}
                <div>
                    <PriceCalculator
                        product={product}
                        onPriceCalculated={setPriceData}
                        onConfigurationChange={setConfig}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-right">
                    {priceData && (
                        <div>
                            <p className="text-sm text-gray-500">Estimated Total</p>
                            <p className="text-2xl font-bold text-brand-600">{formatCurrency(priceData.totalPrice)}</p>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Back
                    </Button>
                    <Button onClick={handleConfirm} disabled={!priceData}>
                        Add to Order
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
