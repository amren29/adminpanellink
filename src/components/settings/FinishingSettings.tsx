"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import { useSettingsStore, ConfigurableFinishing, formatCurrency } from "./settingsData";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function FinishingSettings() {
    const { finishing, addFinishing, updateFinishing, deleteFinishing, departments } = useSettingsStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ConfigurableFinishing | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        priceAddon: 0,
        pricePerSqft: 0,
        isActive: true,
        departmentIds: [] as string[], // Add departmentIds field
    });
    const [pendingDelete, setPendingDelete] = useState<ConfigurableFinishing | null>(null);

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ name: "", description: "", priceAddon: 0, pricePerSqft: 0, isActive: true, departmentIds: [] });
        setIsModalOpen(true);
    };

    const openEdit = (item: ConfigurableFinishing) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description,
            priceAddon: item.priceAddon,
            pricePerSqft: item.pricePerSqft || 0,
            isActive: item.isActive,
            departmentIds: item.departmentIds || [],
        });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const data = {
            ...formData,
            pricePerSqft: formData.pricePerSqft > 0 ? formData.pricePerSqft : undefined,
            departmentIds: formData.departmentIds,
        };
        if (editingItem) {
            updateFinishing(editingItem.id, data);
        } else {
            addFinishing(data);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (item: ConfigurableFinishing) => {
        setPendingDelete(item);
    };

    const confirmDelete = () => {
        if (pendingDelete) {
            deleteFinishing(pendingDelete.id);
            setPendingDelete(null);
        }
    };

    const inputClasses = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Finishing Options</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure finishing add-ons</p>
                </div>
                <Button variant="primary" onClick={openCreate}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                        <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Add Finishing
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Add-on Price</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Per Sqft</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Departments</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {finishing.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="px-5 py-4">
                                    <div>
                                        <span className="font-medium text-gray-800 dark:text-white">{item.name}</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-end font-medium text-gray-800 dark:text-white">
                                    {formatCurrency(item.priceAddon)}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-end text-gray-600 dark:text-gray-400">
                                    {item.pricePerSqft ? formatCurrency(item.pricePerSqft) : "-"}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {item.departmentIds?.slice(0, 2).map(deptId => {
                                            const dept = departments.find(d => d.id === deptId);
                                            return dept ? (
                                                <span key={deptId} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    {dept.name.split('/')[0].trim()}
                                                </span>
                                            ) : null;
                                        })}
                                        {(item.departmentIds?.length || 0) > 2 && (
                                            <span className="text-xs text-gray-400">+{(item.departmentIds?.length || 0) - 2}</span>
                                        )}
                                        {!item.departmentIds?.length && (
                                            <span className="text-xs text-gray-400">All</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${item.isActive ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                        }`}>
                                        {item.isActive ? "Active" : "Inactive"}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(item)} className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(item)} className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.25 4.5H3.75H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg p-6 mx-4">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {editingItem ? "Edit Finishing" : "Add Finishing"}
                    </h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className={labelClasses}>Name *</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Gloss Lamination" className={inputClasses} />
                    </div>
                    <div>
                        <label className={labelClasses}>Description</label>
                        <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Short description" className={inputClasses} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Add-on Price (RM)</label>
                            <input type="number" value={formData.priceAddon} onChange={(e) => setFormData({ ...formData, priceAddon: parseFloat(e.target.value) || 0 })} min={0} step={0.01} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Price per sqft (optional)</label>
                            <input type="number" value={formData.pricePerSqft} onChange={(e) => setFormData({ ...formData, pricePerSqft: parseFloat(e.target.value) || 0 })} min={0} step={0.01} className={inputClasses} />
                        </div>
                    </div>
                    {/* Department Selection */}
                    <div>
                        <label className={labelClasses}>Departments</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select which departments can use this finishing</p>
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
                        <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>{editingItem ? "Save Changes" : "Add Finishing"}</Button>
                </div>
            </Modal>

            <ActionConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Finishing Option"
                description={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div >
    );
}
