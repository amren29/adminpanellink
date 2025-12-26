"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import { useSettingsStore, ConfigurableMaterial, formatCurrency } from "./settingsData";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Select from "@/components/form/Select";

export default function MaterialsSettings() {
    const { materials, addMaterial, updateMaterial, deleteMaterial, departments } = useSettingsStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<ConfigurableMaterial | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        pricePerSqft: 1,
        multiplier: 1,
        category: "paper" as ConfigurableMaterial["category"],
        isActive: true,
        departmentIds: [] as string[],
    });
    const [pendingDelete, setPendingDelete] = useState<ConfigurableMaterial | null>(null);

    const categories: ConfigurableMaterial["category"][] = ["paper", "vinyl", "acrylic", "fabric", "other"];

    const openCreate = () => {
        setEditingMaterial(null);
        setFormData({
            name: "",
            description: "",
            pricePerSqft: 1,
            multiplier: 1,
            category: "paper",
            isActive: true,
            departmentIds: [],
        });
        setIsModalOpen(true);
    };

    const openEdit = (material: ConfigurableMaterial) => {
        setEditingMaterial(material);
        setFormData({
            name: material.name,
            description: material.description,
            pricePerSqft: material.pricePerSqft,
            multiplier: material.multiplier,
            category: material.category,
            isActive: material.isActive,
            departmentIds: material.departmentIds || [],
        });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (editingMaterial) {
            updateMaterial(editingMaterial.id, formData);
        } else {
            addMaterial(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (material: ConfigurableMaterial) => {
        setPendingDelete(material);
    };

    const confirmDelete = () => {
        if (pendingDelete) {
            deleteMaterial(pendingDelete.id);
            setPendingDelete(null);
        }
    };

    const inputClasses =
        "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    const categoryColors: Record<string, string> = {
        paper: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
        vinyl: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
        acrylic: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
        fabric: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
        other: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Materials</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure available materials with pricing
                    </p>
                </div>
                <Button variant="primary" onClick={openCreate}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                        <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Add Material
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Category</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Departments</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Price/sqft</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Multiplier</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {materials.map((material) => (
                            <TableRow key={material.id}>
                                <TableCell className="px-5 py-4">
                                    <div>
                                        <span className="font-medium text-gray-800 dark:text-white">{material.name}</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">{material.description}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${categoryColors[material.category]}`}>
                                        {material.category}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {material.departmentIds?.slice(0, 2).map(deptId => {
                                            const dept = departments.find(d => d.id === deptId);
                                            return dept ? (
                                                <span key={deptId} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    {dept.name.split('/')[0].trim()}
                                                </span>
                                            ) : null;
                                        })}
                                        {(material.departmentIds?.length || 0) > 2 && (
                                            <span className="text-xs text-gray-400">+{(material.departmentIds?.length || 0) - 2}</span>
                                        )}
                                        {!material.departmentIds?.length && (
                                            <span className="text-xs text-gray-400">All</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-end font-medium text-gray-800 dark:text-white">
                                    {formatCurrency(material.pricePerSqft)}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-end text-gray-600 dark:text-gray-400">
                                    ×{material.multiplier.toFixed(1)}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${material.isActive
                                        ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                        }`}>
                                        {material.isActive ? "Active" : "Inactive"}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(material)} className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleDelete(material)} className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M2.25 4.5H3.75H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg p-6 mx-4">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {editingMaterial ? "Edit Material" : "Add Material"}
                    </h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className={labelClasses}>Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Art Paper 128gsm"
                            className={inputClasses}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Short description"
                            className={inputClasses}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Price per sqft (RM)</label>
                            <input
                                type="number"
                                value={formData.pricePerSqft}
                                onChange={(e) => setFormData({ ...formData, pricePerSqft: parseFloat(e.target.value) || 0 })}
                                min={0}
                                step={0.01}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Multiplier</label>
                            <input
                                type="number"
                                value={formData.multiplier}
                                onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1 })}
                                min={0.1}
                                step={0.1}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Category</label>
                        <Select
                            value={formData.category}
                            onChange={(value) => setFormData({ ...formData, category: value as any })}
                            options={categories.map((cat) => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))}
                            className={inputClasses.replace("h-11 ", "")}
                        />
                    </div>
                    {/* Department Selection */}
                    <div>
                        <label className={labelClasses}>Departments</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select which departments can use this material</p>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            {departments.filter(d => d.isActive).map((dept) => (
                                <label key={dept.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={formData.departmentIds.includes(dept.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({ ...formData, departmentIds: [...formData.departmentIds, dept.id] });
                                            } else {
                                                setFormData({ ...formData, departmentIds: formData.departmentIds.filter(id => id !== dept.id) });
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-brand-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{dept.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>
                        {editingMaterial ? "Save Changes" : "Add Material"}
                    </Button>
                </div>
            </Modal>

            <ActionConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Material"
                description={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
