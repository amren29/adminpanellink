"use client";
import React, { useState, useMemo } from "react";
import { Product, ProductCategory, sampleProducts, categoryColors } from "@/components/products/productData";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import ProductTable from "@/components/products/ProductTable"; // Reusing table or creating simplified grid?
// reusing table might be too wide for a modal. Let's create a simplified grid view here.

interface ProductSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    products?: Product[]; // Optional - if provided, use these instead of sampleProducts
}

export default function ProductSelectorModal({
    isOpen,
    onClose,
    onSelect,
    products,
}: ProductSelectorModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");

    // Use provided products or fallback to sampleProducts
    const productList = products || sampleProducts;

    // Filter products
    const filteredProducts = useMemo(() => {
        let result = productList;
        if (categoryFilter !== "all") {
            result = result.filter((p) => p.category === categoryFilter);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    p.category.toLowerCase().includes(query)
            );
        }
        return result;
    }, [searchQuery, categoryFilter, productList]);

    const categories: ProductCategory[] = ["Banners", "Business Cards", "Flyers", "Stickers", "Signage", "Posters", "Packaging", "Apparel", "Display", "Print", "DTF Shirt"];

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 pr-12">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Select Product</h2>
                    <p className="text-sm text-gray-500">
                        {productList.length} products available
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        autoFocus
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <CompactDropdown
                    options={[
                        { value: "all", label: "All Categories" },
                        ...categories.map((cat) => ({ value: cat, label: cat }))
                    ]}
                    value={categoryFilter}
                    onChange={(val) => setCategoryFilter(val as ProductCategory | "all")}
                />
            </div>

            {/* Product Grid */}
            <div className="flex-grow overflow-y-auto min-h-0 -mr-2 pr-2">
                {productList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <p>No products available in the catalog.</p>
                        <p className="text-xs mt-2">Check if products are active and exist in the database.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer shadow-sm hover:shadow-md h-full"
                                    onClick={() => onSelect(product)}
                                >
                                    {/* Image Placeholder */}
                                    <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-t-xl relative overflow-hidden">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-300">
                                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[product.category]?.bg || 'bg-gray-100 dark:bg-gray-700'} ${categoryColors[product.category]?.text || 'text-gray-600 dark:text-gray-300'}`}>
                                                {product.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-grow">
                                            {product.description}
                                        </p>

                                        {/* Price Preview */}
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-xs text-gray-400">
                                                {product.leadTimeDays}d lead time
                                            </span>
                                            <div className="text-right">
                                                {/* Simple Pricing Hint */}
                                                <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                                                    Select →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <p>No products found matching your search.</p>
                                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }} className="mt-2">
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
