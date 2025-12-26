"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Product, categoryColors } from "./productData";
import PriceCalculator from "./PriceCalculator";

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onEdit: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
    isOpen,
    onClose,
    product,
    onEdit,
}) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    if (!product) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            className="max-w-4xl max-h-[90vh]"
        >
            {/* Header */}
            <ModalHeader
                onClose={onClose}
                actions={
                    <Button variant="outline" onClick={() => onEdit(product)}>
                        Edit Product
                    </Button>
                }
            >
                <div className="flex flex-col gap-1.5">
                    <span>{product.name}</span>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${categoryColors[product.category].bg
                                } ${categoryColors[product.category].text}`}
                        >
                            {product.category}
                        </span>
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${product.isActive
                                ? "bg-success-50 dark:bg-success-500/15 text-success-600 dark:text-success-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }`}
                        >
                            {product.isActive ? "Active" : "Inactive"}
                        </span>
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                {product.tags.map(tag => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full border border-gray-200 dark:border-gray-700">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ModalHeader>

            <ModalBody>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Product Info */}
                    <div className="space-y-6">
                        {/* Image Gallery */}
                        <div className="space-y-3">
                            <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative border border-gray-200 dark:border-gray-700">
                                {product.images?.[activeImageIndex] ? (
                                    <Image
                                        src={product.images[activeImageIndex]}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === idx
                                                ? "border-brand-500 ring-2 ring-brand-500/20"
                                                : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}
                                        >
                                            <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Description
                            </h4>
                            <p className="text-gray-800 dark:text-white">{product.description}</p>
                        </div>

                        {/* Quick Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Lead Time</p>
                                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {product.leadTimeDays} days
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Min Quantity</p>
                                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {product.minQuantity} pcs
                                </p>
                            </div>
                        </div>

                        {/* Available Sizes */}
                        {product.availableSizes && product.availableSizes.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Available Sizes
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {product.availableSizes.map((size, idx) => (
                                        <span
                                            key={size.id || idx}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            {size.name}
                                            {size.priceAddon && size.priceAddon > 0 && (
                                                <span className="ml-1 text-xs text-brand-600 dark:text-brand-400 font-medium">
                                                    (+RM{size.priceAddon.toFixed(2)})
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Available Materials */}
                        {product.availableMaterials && product.availableMaterials.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Available Materials
                                </h4>
                                <div className="space-y-2">
                                    {product.availableMaterials.map((mat) => (
                                        <div
                                            key={mat.id}
                                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <div>
                                                <span className="text-sm text-gray-800 dark:text-white">
                                                    {mat.name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                    {mat.description}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-brand-500">
                                                ×{mat.multiplier}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Finishing Options */}
                        {product.availableFinishing && product.availableFinishing.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Finishing Options
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {product.availableFinishing.map((finish) => (
                                        <div
                                            key={finish.id}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            {finish.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Price Calculator */}
                    <div>
                        <PriceCalculator product={product} />
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ProductDetailModal;
