"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import ProductTable from "@/components/products/ProductTable";
import ProductDetailModal from "@/components/products/ProductDetailModal";
import ProductFormModal from "@/components/products/ProductFormModal";
import { Product, ProductCategory, categoryColors, formatCurrency, defaultQuantityTiers, standardSizes, apparelSizes } from "@/components/products/productData";
import Pagination from "@/components/ui/pagination/Pagination";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/spinner/Spinner";
import EmptyState from "@/components/ui/empty-state/EmptyState";

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal states
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Bulk Actions State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // Fetch Products
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setSelectedIds([]); // Clear selection on fetch
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                search: searchQuery,
            });

            if (categoryFilter !== 'all') {
                params.append('category', categoryFilter);
            }

            const res = await fetch(`/api/products?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch products');

            const result = await res.json();

            // Map API/Prisma result to Product interface
            const mappedProducts = result.data.map((p: any) => {
                // Map DB Enum to Frontend Type
                const engineMap: Record<string, "sqft" | "qty_tier" | "qty_fixed" | "apparel_multiline"> = {
                    "SQFT": "sqft",
                    "QTY_TIER": "qty_tier",
                    "FIXED_QTY": "qty_fixed",
                    "FIXED": "apparel_multiline", // Default/Apparel fallback
                    // Handle lowercase just in case
                    "sqft": "sqft",
                    "qty_tier": "qty_tier",
                    "qty_fixed": "qty_fixed",
                    "fixed": "apparel_multiline"
                };

                const mappedEngine = engineMap[p.pricingEngine] || "sqft";

                return {
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    category: p.category,
                    departmentId: p.departmentId,
                    description: p.description || "",
                    pricingEngine: mappedEngine,
                    basePrice: Number(p.basePrice),
                    basePricePerSqft: Number(p.basePricePerSqft),
                    minimumPrice: Number(p.minimumPrice),
                    unitPrice: Number(p.unitPrice) || 0, // Fallback
                    bulkDiscount: Number(p.bulkDiscount) || 0,
                    minQuantity: p.minQuantity,
                    maxQuantity: p.maxQuantity,
                    leadTimeDays: p.leadTimeDays,
                    isActive: p.isActive,
                    images: p.images,
                    tags: p.tags,
                    createdDate: p.createdAt, // Or format it
                    hasSizeOptions: p.hasSizeOptions,
                    availableSizes: p.options ? p.options.filter((o: any) => o.optionType && o.optionType.toLowerCase() === 'size').map((o: any) => {
                        let sizeId = o.value;
                        let width = 0;
                        let height = 0;
                        let multiplier = 1;

                        // Try to parse JSON from o.value (Stored as {"id": "...", "w": 1, "h": 2, "m": 1.5})
                        let parsed: any = null;
                        try {
                            if (o.value && o.value.trim().startsWith('{')) {
                                parsed = JSON.parse(o.value);
                                sizeId = parsed.id;
                                width = parsed.w || 0;
                                height = parsed.h || 0;
                                multiplier = parsed.m || 1; // Get multiplier from JSON
                            }
                        } catch (e) {
                            // Fallback to raw string if not JSON
                            sizeId = o.value;
                        }

                        // Lookup standard size info (for fallback dimensions if w/h are 0)
                        const found = [...standardSizes, ...apparelSizes].find(s => s.id === sizeId);

                        // Fallback: If dimensions are 0 (legacy data or standard sizes stored as plain ID), look them up
                        if (found && width === 0 && height === 0) {
                            width = found.widthInch;
                            height = found.heightInch;
                        }
                        // Fallback: If multiplier is still 1 and we have a standard size match, use its multiplier
                        if (multiplier === 1 && found) {
                            multiplier = found.multiplier;
                        }

                        return {
                            id: sizeId,
                            name: o.name,
                            widthInch: width,
                            heightInch: height,
                            priceAddon: Number(o.priceAddon),
                            isDefault: o.isDefault,
                            multiplier: multiplier,
                            basePrice: parsed?.bp || undefined // NEW: base price per sqft for this size
                        };
                    }) : [],
                    pricingTiers: p.pricingTiers ? p.pricingTiers.map((t: any) => ({
                        id: t.id,
                        minQty: t.minQty,
                        maxQty: t.maxQty,
                        price: Number(t.price),
                        variantId: t.variantId || null  // FIX: Include variantId for per-size tiers
                    })) : [],
                    fixedQuantities: p.fixedQuantities ? p.fixedQuantities.map((fq: any) => ({
                        id: fq.id,
                        quantity: fq.quantity,
                        price: Number(fq.price),
                        variantId: fq.variantId || null  // FIX: Include variantId for per-size fixed quantities
                    })) : [],
                    selectedOptions: p.selectedOptions || {},
                    optionGroups: (() => {
                        const groups: Record<string, any> = {};
                        (p.options || []).forEach((o: any) => {
                            if (['size'].includes(o.optionType)) return; // Skip sizes

                            // Determine group name
                            let gName = o.groupName;
                            if (!gName) {
                                if (o.optionType === 'material') gName = 'Materials';
                                else if (o.optionType === 'finishing') gName = 'Finishing';
                                else gName = 'General';
                            }

                            if (!groups[gName]) {
                                groups[gName] = { id: `grp-${gName}-${p.id}`, name: gName, options: [] };
                            }

                            // Parse value JSON (fallback to defaults)
                            let scope = 'unit';
                            let customQty = false;
                            try {
                                if (o.value && o.value.startsWith('{')) {
                                    const parsed = JSON.parse(o.value);
                                    scope = parsed.scope || (parsed.priceScope || 'unit');
                                    customQty = parsed.customQty || (parsed.hasCustomQuantity || false);
                                } else {
                                    // Legacy fallback
                                    scope = o.value || (o.optionType === 'material' ? 'sqft' : 'unit');
                                }
                            } catch (e) { }

                            groups[gName].options.push({
                                id: o.id,
                                name: o.name,
                                pricingMode: o.pricingMode || 'x',
                                priceValue: Number(o.priceValue) || 1,
                                priceScope: scope,
                                hasCustomQuantity: customQty
                            });
                        });
                        return Object.values(groups);
                    })(),
                    productMaterials: [],
                    productFinishing: [],
                };
            });

            setProducts(mappedProducts);
            setTotalItems(result.pagination.total);
        } catch (error) {
            console.error("Failed to load products", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, categoryFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [fetchProducts]);

    // Get unique categories
    const categories: ProductCategory[] = ["Banners", "Business Cards", "Flyers", "Stickers", "Signage", "Posters", "Packaging", "Apparel"];

    // Selection Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(products.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await fetch('/api/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (!res.ok) throw new Error('Failed to delete products');

            toast.success(`Deleted ${selectedIds.length} products successfully`);
            fetchProducts();
            setIsBulkDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete products');
        }
    };

    const handleView = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleDelete = (product: Product) => {
        setPendingDeleteProduct(product);
    };

    const confirmDelete = async () => {
        if (pendingDeleteProduct) {
            try {
                const res = await fetch(`/api/products/${pendingDeleteProduct.id}`, {
                    method: 'DELETE',
                });

                if (!res.ok) throw new Error('Failed to delete');

                toast.success('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete product');
            } finally {
                setPendingDeleteProduct(null);
            }
        }
    };

    const handleCreate = () => {
        setSelectedProduct(null);
        setIsFormModalOpen(true);
    };

    const handleSaveProduct = async (productData: Omit<Product, "id" | "createdDate">) => {
        try {
            setIsSaving(true);
            const method = selectedProduct ? 'PUT' : 'POST';
            const url = selectedProduct ? `/api/products/${selectedProduct.id}` : '/api/products';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save product');
            }

            toast.success(selectedProduct ? 'Product updated successfully' : 'Product created successfully');
            setIsFormModalOpen(false);
            fetchProducts();
        } catch (error: any) {
            console.error("Save error", error);
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Products</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your product catalog with dynamic pricing
                    </p>
                </div>
                <nav>
                    <ol className="flex items-center gap-2 text-sm">
                        <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li className="text-brand-500">Products</li>
                    </ol>
                </nav>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white">{totalItems}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-semibold text-success-500">
                        {products.filter((p) => p.isActive).length}
                    </p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                    <p className="text-2xl font-semibold text-brand-500">
                        {new Set(products.map((p) => p.category)).size}
                    </p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Lead Time</p>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                        {products.length ? Math.round(products.reduce((sum, p) => sum + p.leadTimeDays, 0) / products.length) : 0} days
                    </p>
                </div>
            </div>

            {/* Filters & Bulk Actions */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-4 w-full bg-brand-50/50 dark:bg-brand-900/10 p-2 rounded-lg border border-brand-100 dark:border-brand-900/20">
                        <span className="text-sm font-medium text-brand-700 dark:text-brand-300 ml-2">
                            {selectedIds.length} selected
                        </span>
                        <div className="flex-1"></div>
                        <button
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="px-3 py-1.5 text-sm font-medium text-error-600 bg-white border border-error-200 rounded-md hover:bg-error-50 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors"
                        >
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative max-w-xs">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <CompactDropdown
                            options={[
                                { value: "all", label: "All Categories" },
                                ...categories.map((cat) => ({ value: cat, label: cat }))
                            ]}
                            value={categoryFilter}
                            onChange={(val) => { setCategoryFilter(val as ProductCategory | "all"); setCurrentPage(1); }}
                        />
                    </div>
                )}

                {!selectedIds.length && (
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-theme-xs"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Add Product
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center p-12">
                    <Spinner size="md" />
                </div>
            ) : (
                <ProductTable
                    products={products}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* Detail Modal with Calculator */}
            <ProductDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                product={selectedProduct}
                onEdit={handleEdit}
            />

            {/* Form Modal for Add/Edit */}
            <ProductFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveProduct}
                product={selectedProduct}
                // @ts-ignore
                loading={isSaving}
            />

            {/* Delete Confirmation Modal */}
            <ActionConfirmationModal
                isOpen={!!pendingDeleteProduct}
                onClose={() => setPendingDeleteProduct(null)}
                onConfirm={confirmDelete}
                title="Delete Product"
                description={`Are you sure you want to delete "${pendingDeleteProduct?.name}"? This action cannot be undone.`}
                confirmText="Delete Product"
                variant="danger"
            />

            {/* Bulk Delete Confirmation Modal */}
            <ActionConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Products"
                description={`Are you sure you want to delete ${selectedIds.length} selected products? This action cannot be undone.`}
                confirmText={`Delete ${selectedIds.length} Products`}
                variant="danger"
            />
        </div>
    );
}
