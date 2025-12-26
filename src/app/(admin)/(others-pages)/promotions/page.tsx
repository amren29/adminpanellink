"use client";
import React, { useState, useEffect, useCallback } from "react";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import PlanGuard from "@/components/common/PlanGuard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { CloseIcon } from "@/icons/index";
import Select from "@/components/form/Select";
import { useSettingsStore } from "@/components/settings/settingsData";
import { sampleProducts, categoryColors } from "@/components/products/productData";
import { CompactDropdown } from "@/components/ui/dropdown/CustomDropdown";
import Spinner from "@/components/ui/spinner/Spinner";
import { toast } from "sonner";

type ModalMode = "view" | "edit" | "create" | null;

interface Promotion {
    id: string;
    code: string;
    description?: string;
    type: "percentage" | "fixed" | "free_shipping";
    value: number;
    minSpend?: number;
    maxDiscount?: number;
    startDate?: string;
    endDate?: string;
    usageLimit?: number;
    usageLimitPerCustomer?: number;
    usedCount: number;
    isActive: boolean;
    appliesTo?: "all" | "category" | "department" | "product" | "customer";
    targetIds?: string[];
    firstOrderOnly?: boolean;
    createdAt?: string;
}

export default function PromotionsPage() {
    const { departments } = useSettingsStore();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [formData, setFormData] = useState<Partial<Promotion>>({});
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [isSaving, setIsSaving] = useState(false);


    // Fetch promotions
    const fetchPromotions = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (statusFilter !== "all") params.append("status", statusFilter);

            const res = await fetch(`/api/promotions?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch promotions");
            const data = await res.json();
            setPromotions(data);
        } catch (error) {
            console.error("Fetch error", error);
            toast.error("Failed to load promotions");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchPromotions, 300);
        return () => clearTimeout(timer);
    }, [fetchPromotions]);

    const handleView = (promo: Promotion) => {
        setSelectedPromotion(promo);
        setModalMode("view");
    };

    const handleEdit = (promo: Promotion) => {
        setSelectedPromotion(promo);
        setFormData({
            ...promo,
            startDate: promo.startDate ? new Date(promo.startDate).toISOString().split("T")[0] : "",
            endDate: promo.endDate ? new Date(promo.endDate).toISOString().split("T")[0] : "",
        });
        setModalMode("edit");
    };

    const handleCreate = () => {
        setSelectedPromotion(null);
        setFormData({
            code: "",
            type: "percentage",
            value: 0,
            isActive: true,
            usedCount: 0,
            appliesTo: "all",
            startDate: "",
            endDate: "",
            targetIds: []
        });
        setModalMode("create");
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            const res = await fetch(`/api/promotions?id=${pendingDeleteId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Promotion deleted successfully");
            fetchPromotions();
        } catch (error) {
            toast.error("Failed to delete promotion");
        } finally {
            setPendingDeleteId(null);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            if (!formData.code?.trim()) {
                toast.error("Please enter a promotion code");
                return;
            }

            let res;
            if (modalMode === "edit" && selectedPromotion) {
                res = await fetch("/api/promotions", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedPromotion.id, ...formData }),
                });
            } else {
                res = await fetch("/api/promotions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
            }

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save promotion");
            }

            toast.success(modalMode === "edit" ? "Promotion updated" : "Promotion created");
            closeModal();
            fetchPromotions();
        } catch (error: any) {
            toast.error(error.message || "Failed to save promotion");
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedPromotion(null);
        setFormData({});
    };

    const formatValue = (promo: Promotion) => {
        if (promo.type === "percentage") return `${promo.value}% `;
        if (promo.type === "fixed") return `RM${promo.value} `;
        return "Free Shipping";
    };

    return (
        <PlanGuard feature="promotions">
            <div>
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Promotions</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage discount codes and offers</p>
                    </div>
                    <nav>
                        <ol className="flex items-center gap-2 text-sm">
                            <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                            <li className="text-gray-400 dark:text-gray-500">/</li>
                            <li className="text-brand-500">Promotions</li>
                        </ol>
                    </nav>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative max-w-xs">
                            <input
                                type="text"
                                placeholder="Search promotions..."
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
                        Create Promotion
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
                            <div className="min-w-[800px]">
                                <Table>
                                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                        <TableRow>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Code</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Type</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Value</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Usage</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Actions</TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                        {promotions.length === 0 ? (
                                            <TableRow>
                                                <TableCell className="px-5 py-12 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                                                    No promotions found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            promotions.map((promo) => (
                                                <TableRow key={promo.id}>
                                                    <TableCell className="font-medium">{promo.code}</TableCell>
                                                    <TableCell className="capitalize">{promo.type.replace("_", " ")}</TableCell>
                                                    <TableCell>
                                                        {formatValue(promo)}
                                                        {promo.minSpend ? <span className="text-xs text-gray-400 block">Min Spend: RM{Number(promo.minSpend).toFixed(2)}</span> : null}
                                                    </TableCell>
                                                    <TableCell>{promo.usedCount} / {promo.usageLimit || "∞"}</TableCell>
                                                    <TableCell>
                                                        <Badge color={promo.isActive ? "success" : "error"}>{promo.isActive ? "Active" : "Inactive"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-end">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleView(promo)} className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800" title="View">
                                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </button>
                                                            <button onClick={() => handleEdit(promo)} className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800" title="Edit">
                                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </button>
                                                            <button onClick={() => handleDelete(promo.id)} className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800" title="Delete">
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
                                    {modalMode === "view" ? "Promotion Details" : modalMode === "edit" ? "Edit Promotion" : "Create Promotion"}
                                </h2>
                                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                {modalMode === "view" && selectedPromotion ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Code</label>
                                            <p className="text-gray-800 dark:text-white font-medium text-lg">{selectedPromotion.code}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
                                                <p className="text-gray-600 dark:text-gray-300 capitalize">{selectedPromotion.type.replace("_", " ")}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Value</label>
                                                <p className="text-brand-600 font-bold">{formatValue(selectedPromotion)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Min Spend</label>
                                                <p className="text-gray-600 dark:text-gray-300">{selectedPromotion.minSpend ? `RM${Number(selectedPromotion.minSpend).toFixed(2)} ` : "—"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Usage</label>
                                                <p className="text-gray-600 dark:text-gray-300">{selectedPromotion.usedCount} / {selectedPromotion.usageLimit || "∞"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                                            <p><Badge color={selectedPromotion.isActive ? "success" : "error"}>{selectedPromotion.isActive ? "Active" : "Inactive"}</Badge></p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                                            <input type="text" value={formData.code || ""} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 uppercase" placeholder="WELCOME10" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                                <Select
                                                    value={formData.type || "percentage"}
                                                    onChange={(value) => setFormData({ ...formData, type: value as "percentage" | "fixed" | "free_shipping" })}
                                                    options={[
                                                        { value: "percentage", label: "Percentage" },
                                                        { value: "fixed", label: "Fixed Amount" },
                                                        { value: "free_shipping", label: "Free Shipping" },
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                                                <input type="number" value={formData.value || 0} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Spend (RM)</label>
                                                <input type="number" value={formData.minSpend || ""} onChange={(e) => setFormData({ ...formData, minSpend: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Optional" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usage Limit</label>
                                                <input type="number" value={formData.usageLimit || ""} onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || undefined })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Unlimited" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                                <input type="date" value={formData.startDate || ""} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                                <input type="date" value={formData.endDate || ""} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Applies To</label>
                                            <Select
                                                value={formData.appliesTo || "all"}
                                                onChange={(value) => setFormData({ ...formData, appliesTo: value as any, targetIds: [] })}
                                                options={[
                                                    { value: "all", label: "All Orders" },
                                                    { value: "category", label: "Specific Category" },
                                                    { value: "department", label: "Specific Department" },
                                                    { value: "product", label: "Specific Product" },
                                                ]}
                                            />
                                        </div>
                                        {formData.appliesTo === "category" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Category</label>
                                                <Select
                                                    value={formData.targetIds?.[0] || ""}
                                                    onChange={(value) => setFormData({ ...formData, targetIds: [value] })}
                                                    options={Object.keys(categoryColors).map(cat => ({ value: cat, label: cat }))}
                                                    placeholder="Select Category"
                                                />
                                            </div>
                                        )}
                                        {formData.appliesTo === "department" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Department</label>
                                                <Select
                                                    value={formData.targetIds?.[0] || ""}
                                                    onChange={(value) => setFormData({ ...formData, targetIds: [value] })}
                                                    options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
                                                    placeholder="Select Department"
                                                />
                                            </div>
                                        )}
                                        {formData.appliesTo === "product" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Product</label>
                                                <Select
                                                    value={formData.targetIds?.[0] || ""}
                                                    onChange={(value) => setFormData({ ...formData, targetIds: [value] })}
                                                    options={sampleProducts.map(prod => ({ value: prod.id, label: prod.name }))}
                                                    placeholder="Select Product"
                                                />
                                            </div>
                                        )}
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
                    title="Delete Promotion"
                    description="Are you sure you want to delete this promotion? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </PlanGuard>
    );
}
