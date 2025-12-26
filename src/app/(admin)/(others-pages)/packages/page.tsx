"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { CloseIcon, TrashBinIcon } from "@/icons/index";
import Select from "@/components/form/Select";
import FileInput from "@/components/form/input/FileInput";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import PlanGuard from "@/components/common/PlanGuard";
import Spinner from "@/components/ui/spinner/Spinner";
import { toast } from "sonner";

type ModalMode = "view" | "edit" | "create" | null;

interface PackageItem {
    id?: string;
    productId?: string;
    product?: { id: string; name: string; basePrice: number };
    quantity: number;
    unitPrice?: number;
    variantDescription?: string;
}

interface Package {
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    image?: string;
    campaignStart?: string;
    campaignEnd?: string;
    isActive: boolean;
    stockLimit?: number;
    soldCount?: number;
    items: PackageItem[];
}

interface Product {
    id: string;
    name: string;
    basePrice: number;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [formData, setFormData] = useState<Partial<Package>>({});
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch packages
    const fetchPackages = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (statusFilter !== "all") params.append("status", statusFilter);

            const res = await fetch(`/api/packages?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch packages");
            const data = await res.json();
            setPackages(data);
        } catch (error) {
            console.error("Fetch error", error);
            toast.error("Failed to load packages");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    // Fetch products for dropdown
    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch("/api/products?limit=100");
            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            setProducts(data.data || []);
        } catch (error) {
            console.error("Fetch products error", error);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchPackages, 300);
        return () => clearTimeout(timer);
    }, [fetchPackages]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleView = (pkg: Package) => {
        setSelectedPackage(pkg);
        setModalMode("view");
    };

    const handleEdit = (pkg: Package) => {
        setSelectedPackage(pkg);
        setFormData({
            ...pkg,
            image: pkg.imageUrl,
            campaignStart: pkg.campaignStart ? new Date(pkg.campaignStart).toISOString().split("T")[0] : "",
            campaignEnd: pkg.campaignEnd ? new Date(pkg.campaignEnd).toISOString().split("T")[0] : "",
        });
        setModalMode("edit");
    };

    const handleCreate = () => {
        setSelectedPackage(null);
        setFormData({ name: "", description: "", price: 0, originalPrice: 0, items: [], isActive: true });
        setModalMode("create");
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            const res = await fetch(`/api/packages?id=${pendingDeleteId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Package deleted successfully");
            fetchPackages();
        } catch (error) {
            toast.error("Failed to delete package");
        } finally {
            setPendingDeleteId(null);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            if (!formData.name?.trim()) {
                toast.error("Please enter a package name");
                return;
            }

            let res;
            if (modalMode === "edit" && selectedPackage) {
                res = await fetch("/api/packages", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedPackage.id, ...formData }),
                });
            } else {
                res = await fetch("/api/packages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
            }

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save package");
            }

            toast.success(modalMode === "edit" ? "Package updated" : "Package created");
            closeModal();
            fetchPackages();
        } catch (error: any) {
            toast.error(error.message || "Failed to save package");
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedPackage(null);
        setFormData({});
        setSelectedProductId("");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddItem = () => {
        if (!selectedProductId) return;
        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const newItem: PackageItem = {
            productId: product.id,
            product: { id: product.id, name: product.name, basePrice: product.basePrice },
            quantity: 1,
            unitPrice: product.basePrice,
            variantDescription: ""
        };

        const currentItems = formData.items || [];
        const updatedItems = [...currentItems, newItem];

        recalculatePrices(updatedItems);
        setSelectedProductId("");
    };

    const handleRemoveItem = (index: number) => {
        const currentItems = formData.items || [];
        const updatedItems = currentItems.filter((_, i) => i !== index);
        recalculatePrices(updatedItems);
    };

    const handleItemChange = (index: number, field: keyof PackageItem, value: any) => {
        const currentItems = formData.items || [];
        const updatedItems = currentItems.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });

        if (field === 'quantity' || field === 'unitPrice') {
            recalculatePrices(updatedItems);
        } else {
            setFormData({ ...formData, items: updatedItems });
        }
    };

    const recalculatePrices = (items: PackageItem[]) => {
        let totalOriginal = 0;
        let totalPrice = 0;

        items.forEach(item => {
            const basePrice = item.product?.basePrice || 0;
            totalOriginal += basePrice * item.quantity;
            totalPrice += (item.unitPrice || 0) * item.quantity;
        });

        setFormData({
            ...formData,
            items: items,
            originalPrice: totalOriginal,
            price: totalPrice
        });
    };

    return (
        <PlanGuard feature="packages">
            <div>
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Packages & Bundles</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage product combos and special offers</p>
                    </div>
                    <nav>
                        <ol className="flex items-center gap-2 text-sm">
                            <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                            <li className="text-gray-400 dark:text-gray-500">/</li>
                            <li className="text-brand-500">Packages</li>
                        </ol>
                    </nav>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative max-w-xs">
                            <input
                                type="text"
                                placeholder="Search packages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <CompactDropdown
                            options={[
                                { value: "all", label: "All Status" },
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                            ]}
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val as "all" | "active" | "inactive")}
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-theme-xs"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Create Package
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center p-12">
                        <Spinner size="md" />
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                        <div className="max-w-full overflow-x-auto">
                            <div className="min-w-[900px]">
                                <Table>
                                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                        <TableRow>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Package</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Price</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Campaign Dates</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Actions</TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                        {packages.length === 0 ? (
                                            <TableRow>
                                                <TableCell className="px-5 py-12 text-center text-gray-500 dark:text-gray-400" colSpan={5}>
                                                    No packages found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            packages.map((pkg) => (
                                                <TableRow key={pkg.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-gray-800 dark:text-white">{pkg.name}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{pkg.description}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-brand-600">RM{Number(pkg.price).toFixed(2)}</span>
                                                            {pkg.originalPrice && <span className="text-xs text-gray-400 line-through">RM{Number(pkg.originalPrice).toFixed(2)}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                                            {pkg.campaignStart && pkg.campaignEnd ? (
                                                                <span className="text-xs">
                                                                    {new Date(pkg.campaignStart).toLocaleDateString()} - <br />
                                                                    {new Date(pkg.campaignEnd).toLocaleDateString()}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">No Date</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge color={pkg.isActive ? "success" : "error"}>{pkg.isActive ? "Active" : "Inactive"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-end">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleView(pkg)} className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800" title="View">
                                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </button>
                                                            <button onClick={() => handleEdit(pkg)} className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800" title="Edit">
                                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </button>
                                                            <button onClick={() => handleDelete(pkg.id)} className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800" title="Delete">
                                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.25 4.5H3.75H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {modalMode && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={closeModal}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {modalMode === "view" ? "Package Details" : modalMode === "edit" ? "Edit Package" : "Create Package"}
                                </h2>
                                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                {modalMode === "view" && selectedPackage ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                                            <p className="text-gray-800 dark:text-white font-medium">{selectedPackage.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
                                            <p className="text-gray-600 dark:text-gray-300">{selectedPackage.description || "—"}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price</label>
                                                <p className="text-brand-600 font-bold">RM{Number(selectedPackage.price).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Original Price</label>
                                                <p className="text-gray-400 line-through">RM{Number(selectedPackage.originalPrice || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                                            <p><Badge color={selectedPackage.isActive ? "success" : "error"}>{selectedPackage.isActive ? "Active" : "Inactive"}</Badge></p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Items ({selectedPackage.items.length})</label>
                                            <div className="mt-1 space-y-1">
                                                {selectedPackage.items.map((item, idx) => (
                                                    <p key={idx} className="text-sm text-gray-600 dark:text-gray-300">
                                                        {item.quantity}x {item.product?.name || item.productId}
                                                    </p>
                                                ))}
                                                {selectedPackage.items.length === 0 && <p className="text-sm text-gray-400">No items</p>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Banner</label>
                                            <div className="space-y-3">
                                                <FileInput onChange={handleImageUpload} />
                                                {formData.image && (
                                                    <div className="relative h-40 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                        <img src={formData.image} alt="Preview" className="object-cover w-full h-full" />
                                                        <button
                                                            onClick={() => setFormData({ ...formData, image: undefined })}
                                                            className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full hover:bg-white shadow-sm"
                                                            title="Remove Image"
                                                        >
                                                            <TrashBinIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                            <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                            <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" rows={3} />
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-3">Package Items</h3>

                                            <div className="flex gap-2 mb-4">
                                                <div className="flex-1">
                                                    <Select
                                                        value={selectedProductId}
                                                        onChange={(val) => setSelectedProductId(val as string)}
                                                        options={products.map(p => ({ value: p.id, label: `${p.name} (RM${Number(p.basePrice).toFixed(2)})` }))}
                                                        placeholder="Select product to add..."
                                                    />
                                                </div>
                                                <Button onClick={handleAddItem} disabled={!selectedProductId} className="shrink-0">
                                                    Add Item
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {(formData.items || []).map((item, index) => (
                                                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="font-medium text-gray-800 dark:text-white block">{item.product?.name || "Unknown Product"}</span>
                                                                <span className="text-xs text-gray-500">Base: RM{item.product?.basePrice?.toFixed(2) || "0.00"}</span>
                                                            </div>
                                                            <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-600">
                                                                <TrashBinIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Qty</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Override Price</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.unitPrice || 0}
                                                                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Variant</label>
                                                                <input
                                                                    type="text"
                                                                    value={item.variantDescription || ""}
                                                                    onChange={(e) => handleItemChange(index, 'variantDescription', e.target.value)}
                                                                    placeholder="e.g. Size S"
                                                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(formData.items || []).length === 0 && (
                                                    <p className="text-sm text-gray-500 text-center py-4">No items added yet.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Price (Calc)</label>
                                                <input type="number" readOnly value={formData.originalPrice?.toFixed(2) || "0.00"} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Price (RM)</label>
                                                <input type="number" value={formData.price || 0} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-bold" />
                                                <p className="text-xs text-gray-500 mt-1">Sum of item override prices. Adjustable.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="isActive" checked={formData.isActive ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
                                            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                                <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                                {modalMode !== "view" && (
                                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <ActionConfirmationModal
                    isOpen={!!pendingDeleteId}
                    onClose={() => setPendingDeleteId(null)}
                    onConfirm={confirmDelete}
                    title="Delete Package"
                    description="Are you sure you want to delete this package? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </PlanGuard>
    );
}
