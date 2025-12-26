"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useSettingsStore, Department, PricingLogic, OptionCategory, OptionItem, formatCurrency } from "./settingsData";
import { CustomDropdown } from "@/components/ui/dropdown/CustomDropdown";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Select from "@/components/form/Select";

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function DepartmentsSettings() {
    const {
        departments, addDepartment, updateDepartment, deleteDepartment,
        pricingLogics, addPricingLogic, updatePricingLogic, deletePricingLogic
    } = useSettingsStore();

    const [mainTab, setMainTab] = useState<"departments" | "pricingLogics">("departments");
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<OptionCategory | null>(null);

    // Modals
    const [deptModalOpen, setDeptModalOpen] = useState(false);
    const [editDept, setEditDept] = useState<Department | null>(null);
    const [logicModalOpen, setLogicModalOpen] = useState(false);
    const [editLogic, setEditLogic] = useState<PricingLogic | null>(null);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<OptionCategory | null>(null);
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<OptionItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<{ type: string; id: string; name?: string; parentId?: string; grandParentId?: string } | null>(null);

    // Forms
    const [deptForm, setDeptForm] = useState({ name: "", description: "", hasCustomSize: false, isActive: true });
    const [logicForm, setLogicForm] = useState({ name: "", description: "", formula: "", variables: [] as string[], example: "", isActive: true, departmentIds: [] as string[] });
    const [categoryForm, setCategoryForm] = useState({ name: "", description: "", priceField: "flat" as OptionCategory["priceField"], isRequired: false, allowMultiple: false, isActive: true });
    const [itemForm, setItemForm] = useState({ name: "", description: "", price: 0, priceType: "flat" as OptionItem["priceType"], isActive: true });

    const inputClasses = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
    const priceFieldLabels = { flat: "Flat Price", perSqft: "Per Sq.Ft", multiplier: "Multiplier", perUnit: "Per Unit" };


    // Department CRUD
    const openAddDept = () => { setEditDept(null); setDeptForm({ name: "", description: "", hasCustomSize: false, isActive: true }); setDeptModalOpen(true); };
    const openEditDept = (dept: Department) => { setEditDept(dept); setDeptForm({ name: dept.name, description: dept.description, hasCustomSize: dept.hasCustomSize, isActive: dept.isActive }); setDeptModalOpen(true); };
    const handleSaveDept = () => { if (editDept) { updateDepartment(editDept.id, deptForm); } else { addDepartment({ ...deptForm, optionCategories: [] }); } setDeptModalOpen(false); };

    // Pricing Logic CRUD
    const openAddLogic = () => { setEditLogic(null); setLogicForm({ name: "", description: "", formula: "", variables: [], example: "", isActive: true, departmentIds: [] }); setLogicModalOpen(true); };
    const openEditLogic = (logic: PricingLogic) => { setEditLogic(logic); setLogicForm({ name: logic.name, description: logic.description, formula: logic.formula, variables: logic.variables, example: logic.example, isActive: logic.isActive, departmentIds: logic.departmentIds || [] }); setLogicModalOpen(true); };
    const handleSaveLogic = () => { if (editLogic) { updatePricingLogic(editLogic.id, logicForm); } else { addPricingLogic(logicForm); } setLogicModalOpen(false); };

    // Category CRUD
    const openAddCategory = () => { setEditCategory(null); setCategoryForm({ name: "", description: "", priceField: "flat", isRequired: false, allowMultiple: false, isActive: true }); setCategoryModalOpen(true); };
    const openEditCategory = (cat: OptionCategory) => { setEditCategory(cat); setCategoryForm({ name: cat.name, description: cat.description, priceField: cat.priceField, isRequired: cat.isRequired, allowMultiple: cat.allowMultiple, isActive: cat.isActive }); setCategoryModalOpen(true); };
    const handleSaveCategory = () => {
        if (!selectedDept) return;
        const dept = { ...selectedDept };
        if (editCategory) {
            dept.optionCategories = dept.optionCategories.map(c => c.id === editCategory.id ? { ...c, ...categoryForm } : c);
        } else {
            dept.optionCategories = [...dept.optionCategories, { id: generateId(), ...categoryForm, items: [] }];
        }
        updateDepartment(dept.id, dept);
        setSelectedDept(dept);
        setCategoryModalOpen(false);
    };
    const deleteCategory = (catId: string) => {
        if (!selectedDept) return;
        setPendingDelete({ type: 'category', id: catId, name: 'Category', parentId: selectedDept.id });
    };

    const confirmDeleteCategory = (catId: string, deptId: string) => {
        // Re-find the latest department state as it might have changed
        const currentDept = departments.find(d => d.id === deptId);
        if (!currentDept) return; // Should not happen

        const updatedDept = { ...currentDept, optionCategories: currentDept.optionCategories.filter(c => c.id !== catId) };
        updateDepartment(updatedDept.id, updatedDept);

        // Update selection if we are viewing the deleted one (though UI likely prevents this)
        if (selectedDept && selectedDept.id === deptId) {
            setSelectedDept(updatedDept);
            setSelectedCategory(null);
        }
    };

    // Item CRUD
    const openAddItem = () => { setEditItem(null); setItemForm({ name: "", description: "", price: 0, priceType: selectedCategory?.priceField || "flat", isActive: true }); setItemModalOpen(true); };
    const openEditItem = (item: OptionItem) => { setEditItem(item); setItemForm({ name: item.name, description: item.description, price: item.price, priceType: item.priceType, isActive: item.isActive }); setItemModalOpen(true); };
    const handleSaveItem = () => {
        if (!selectedDept || !selectedCategory) return;
        const dept = { ...selectedDept };
        const catIndex = dept.optionCategories.findIndex(c => c.id === selectedCategory.id);
        if (catIndex === -1) return;
        const cat = { ...dept.optionCategories[catIndex] };
        if (editItem) {
            cat.items = cat.items.map(i => i.id === editItem.id ? { ...i, ...itemForm } : i);
        } else {
            cat.items = [...cat.items, { id: generateId(), ...itemForm }];
        }
        dept.optionCategories[catIndex] = cat;
        updateDepartment(dept.id, dept);
        setSelectedDept(dept);
        setSelectedCategory(cat);
        setItemModalOpen(false);
    };
    const deleteItem = (itemId: string) => {
        if (!selectedDept || !selectedCategory) return;
        setPendingDelete({ type: 'item', id: itemId, name: 'Item', parentId: selectedCategory.id, grandParentId: selectedDept.id });
    };

    const confirmDeleteItem = (itemId: string, catId: string, deptId: string) => {
        const currentDept = departments.find(d => d.id === deptId);
        if (!currentDept) return;

        const catIndex = currentDept.optionCategories.findIndex(c => c.id === catId);
        if (catIndex === -1) return;

        const cat = { ...currentDept.optionCategories[catIndex], items: currentDept.optionCategories[catIndex].items.filter(i => i.id !== itemId) };
        const updatedDept = { ...currentDept };
        updatedDept.optionCategories[catIndex] = cat;

        updateDepartment(updatedDept.id, updatedDept);

        if (selectedDept && selectedDept.id === deptId) {
            setSelectedDept(updatedDept);
            if (selectedCategory && selectedCategory.id === catId) {
                setSelectedCategory(cat);
            }
        }
    };

    // Sync with store
    React.useEffect(() => {
        if (selectedDept) {
            const updated = departments.find(d => d.id === selectedDept.id);
            if (updated) {
                setSelectedDept(updated);
                if (selectedCategory) {
                    const updatedCat = updated.optionCategories.find(c => c.id === selectedCategory.id);
                    if (updatedCat) setSelectedCategory(updatedCat);
                }
            }
        }
    }, [departments]);

    return (
        <div className="space-y-6">
            {/* Main Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                <button onClick={() => { setMainTab("departments"); setSelectedDept(null); setSelectedCategory(null); }} className={`px-4 py-2 text-sm font-medium rounded-md ${mainTab === "departments" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-white" : "text-gray-500"}`}>Departments</button>
                <button onClick={() => { setMainTab("pricingLogics"); setSelectedDept(null); setSelectedCategory(null); }} className={`px-4 py-2 text-sm font-medium rounded-md ${mainTab === "pricingLogics" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-white" : "text-gray-500"}`}>Pricing Logic</button>
            </div>

            {/* Pricing Logics Tab */}
            {mainTab === "pricingLogics" && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div><h3 className="text-sm font-medium text-gray-800 dark:text-white">Pricing Logic</h3><p className="text-xs text-gray-500">Define calculation formulas</p></div>
                        <Button variant="primary" size="sm" onClick={openAddLogic}>+ Add Pricing Logic</Button>
                    </div>
                    <div className="grid gap-4">
                        {pricingLogics.map((logic) => (
                            <div key={logic.id} className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div><h4 className="font-medium text-gray-800 dark:text-white">{logic.name}</h4><p className="text-xs text-gray-500">{logic.description}</p></div>
                                    <span className={`px-2 py-1 text-xs rounded-md ${logic.isActive ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-500"}`}>{logic.isActive ? "Active" : "Inactive"}</span>
                                </div>
                                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1"><strong>Formula:</strong> {logic.formula}</p>
                                    <p className="text-xs text-gray-500"><strong>Example:</strong> {logic.example}</p>
                                </div>
                                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <button onClick={() => openEditLogic(logic)} className="text-xs text-brand-500">Edit</button>
                                    <button onClick={() => setPendingDelete({ type: 'logic', id: logic.id, name: logic.name })} className="text-xs text-error-500">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Departments List */}
            {mainTab === "departments" && !selectedDept && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div><h3 className="text-sm font-medium text-gray-800 dark:text-white">Departments</h3><p className="text-xs text-gray-500">Click a department to configure</p></div>
                        <Button variant="primary" size="sm" onClick={openAddDept}>+ Add Department</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map((dept) => (
                            <div key={dept.id} onClick={() => setSelectedDept(dept)} className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-5 cursor-pointer hover:border-brand-300 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div><h4 className="font-medium text-gray-800 dark:text-white">{dept.name}</h4><p className="text-xs text-gray-500">{dept.description}</p></div>
                                    <span className={`px-2 py-1 text-xs rounded-md ${dept.isActive ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-500"}`}>{dept.isActive ? "Active" : "Inactive"}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{dept.optionCategories.length} Categories</span>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button onClick={(e) => { e.stopPropagation(); openEditDept(dept); }} className="text-xs text-brand-500">Edit Info</button>
                                    <button onClick={(e) => { e.stopPropagation(); setPendingDelete({ type: 'department', id: dept.id, name: dept.name }); }} className="text-xs text-error-500">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Department Detail - Categories List */}
            {mainTab === "departments" && selectedDept && !selectedCategory && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedDept(null)} className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <div><h3 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedDept.name}</h3><p className="text-sm text-gray-500">{selectedDept.description}</p></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div><h4 className="text-sm font-medium text-gray-800 dark:text-white">Option Categories</h4><p className="text-xs text-gray-500">Add/edit/delete categories like Materials, Finishing, etc.</p></div>
                        <Button variant="primary" size="sm" onClick={openAddCategory}>+ Add Category</Button>
                    </div>
                    <div className="grid gap-4">
                        {selectedDept.optionCategories.map((cat) => (
                            <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4 cursor-pointer hover:border-brand-300 transition-all">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-800 dark:text-white">{cat.name}</h4>
                                        <p className="text-xs text-gray-500">{cat.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">{priceFieldLabels[cat.priceField]}</span>
                                            {cat.isRequired && <span className="px-2 py-0.5 text-xs bg-warning-50 text-warning-600 rounded">Required</span>}
                                            {cat.allowMultiple && <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">Multi-select</span>}
                                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">{cat.items.length} items</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => openEditCategory(cat)} className="text-xs text-brand-500">Edit</button>
                                        <button onClick={() => setPendingDelete({ type: 'category', id: cat.id, name: cat.name, parentId: selectedDept.id })} className="text-xs text-error-500">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {selectedDept.optionCategories.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No categories yet. Add one to get started!</p>}
                    </div>
                </div>
            )}

            {/* Category Detail - Items List */}
            {mainTab === "departments" && selectedDept && selectedCategory && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <div>
                            <p className="text-xs text-gray-500">{selectedDept.name} →</p>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedCategory.name}</h3>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div><h4 className="text-sm font-medium text-gray-800 dark:text-white">Items</h4><p className="text-xs text-gray-500">{selectedCategory.description}</p></div>
                        <Button variant="primary" size="sm" onClick={openAddItem}>+ Add Item</Button>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                        <Table>
                            <TableHeader><TableRow>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500">Item</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-end text-sm font-medium text-gray-500">Price</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500">Actions</TableCell>
                            </TableRow></TableHeader>
                            <TableBody>
                                {selectedCategory.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="px-5 py-4"><span className="font-medium text-gray-800 dark:text-white">{item.name}</span><span className="block text-xs text-gray-500">{item.description}</span></TableCell>
                                        <TableCell className="px-5 py-4 text-end font-medium">
                                            {item.priceType === "multiplier" ? `×${item.price.toFixed(1)}` : formatCurrency(item.price)}
                                            <span className="text-xs text-gray-400 ml-1">({priceFieldLabels[item.priceType]})</span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <button onClick={() => openEditItem(item)} className="text-xs text-brand-500 mr-2">Edit</button>
                                            <button onClick={() => deleteItem(item.id)} className="text-xs text-error-500">Delete</button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            <Modal isOpen={deptModalOpen} onClose={() => setDeptModalOpen(false)} className="max-w-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{editDept ? "Edit Department" : "Add Department"}</h3>
                <div className="space-y-4">
                    <div><label className={labelClasses}>Name *</label><input type="text" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Description</label><input type="text" value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} className={inputClasses} /></div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={deptForm.hasCustomSize} onChange={(e) => setDeptForm({ ...deptForm, hasCustomSize: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Custom Size</span></label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={deptForm.isActive} onChange={(e) => setDeptForm({ ...deptForm, isActive: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Active</span></label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6"><Button variant="outline" onClick={() => setDeptModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveDept}>{editDept ? "Save" : "Add"}</Button></div>
            </Modal>

            {/* Pricing Logic Modal */}
            <Modal isOpen={logicModalOpen} onClose={() => setLogicModalOpen(false)} className="max-w-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{editLogic ? "Edit Pricing Logic" : "Add Pricing Logic"}</h3>
                <div className="space-y-4">
                    <div><label className={labelClasses}>Name *</label><input type="text" value={logicForm.name} onChange={(e) => setLogicForm({ ...logicForm, name: e.target.value })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Description</label><input type="text" value={logicForm.description} onChange={(e) => setLogicForm({ ...logicForm, description: e.target.value })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Formula *</label><input type="text" value={logicForm.formula} onChange={(e) => setLogicForm({ ...logicForm, formula: e.target.value })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Variables (comma-separated)</label><input type="text" value={logicForm.variables.join(", ")} onChange={(e) => setLogicForm({ ...logicForm, variables: e.target.value.split(",").map(v => v.trim()).filter(v => v) })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Example</label><input type="text" value={logicForm.example} onChange={(e) => setLogicForm({ ...logicForm, example: e.target.value })} className={inputClasses} /></div>
                    <div>
                        <label className={labelClasses}>Applies to Departments</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                            {departments.map(d => (
                                <label key={d.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={logicForm.departmentIds.includes(d.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setLogicForm({ ...logicForm, departmentIds: [...logicForm.departmentIds, d.id] });
                                            } else {
                                                setLogicForm({ ...logicForm, departmentIds: logicForm.departmentIds.filter(id => id !== d.id) });
                                            }
                                        }}
                                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                    />
                                    {d.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6"><Button variant="outline" onClick={() => setLogicModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveLogic}>{editLogic ? "Save" : "Add"}</Button></div>
            </Modal>

            {/* Category Modal */}
            <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} className="max-w-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{editCategory ? "Edit Category" : "Add Category"}</h3>
                <div className="space-y-4">
                    <div><label className={labelClasses}>Name *</label><input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className={inputClasses} placeholder="e.g. Materials, Finishing, Thickness" /></div>
                    <div><label className={labelClasses}>Description</label><input type="text" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Price Type</label>
                        <CustomDropdown
                            options={[
                                { value: "flat", label: "Flat Price" },
                                { value: "perSqft", label: "Per Sq.Ft" },
                                { value: "multiplier", label: "Multiplier" },
                                { value: "perUnit", label: "Per Unit" }
                            ]}
                            value={categoryForm.priceField}
                            onChange={(val) => setCategoryForm({ ...categoryForm, priceField: val as any })}
                        />
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={categoryForm.isRequired} onChange={(e) => setCategoryForm({ ...categoryForm, isRequired: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Required</span></label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={categoryForm.allowMultiple} onChange={(e) => setCategoryForm({ ...categoryForm, allowMultiple: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Allow Multiple</span></label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Active</span></label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6"><Button variant="outline" onClick={() => setCategoryModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveCategory}>{editCategory ? "Save" : "Add"}</Button></div>
            </Modal>

            {/* Item Modal */}
            <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} className="max-w-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{editItem ? "Edit Item" : "Add Item"}</h3>
                <div className="space-y-4">
                    <div><label className={labelClasses}>Name *</label><input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Description</label><input type="text" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Price</label><input type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })} className={inputClasses} step="0.01" /></div>
                    <div><label className={labelClasses}>Price Type</label>
                        <Select
                            value={itemForm.priceType}
                            onChange={(value) => setItemForm({ ...itemForm, priceType: value as any })}
                            options={[
                                { value: "flat", label: "Flat Price" },
                                { value: "perSqft", label: "Per Sq.Ft" },
                                { value: "multiplier", label: "Multiplier" },
                                { value: "perUnit", label: "Per Unit" },
                            ]}
                            className={inputClasses.replace("h-11 ", "")}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6"><Button variant="outline" onClick={() => setItemModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveItem}>{editItem ? "Save" : "Add"}</Button></div>
            </Modal>

            <ActionConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={() => {
                    if (pendingDelete) {
                        if (pendingDelete.type === 'department') deleteDepartment(pendingDelete.id);
                        if (pendingDelete.type === 'logic') deletePricingLogic(pendingDelete.id);
                        if (pendingDelete.type === 'category' && pendingDelete.parentId) confirmDeleteCategory(pendingDelete.id, pendingDelete.parentId);
                        if (pendingDelete.type === 'item' && pendingDelete.parentId && pendingDelete.grandParentId) confirmDeleteItem(pendingDelete.id, pendingDelete.parentId, pendingDelete.grandParentId);
                        setPendingDelete(null);
                    }
                }}
                title="Confirm Deletion"
                description={`Are you sure you want to delete ${pendingDelete?.name ? `"${pendingDelete.name}"` : 'this item'}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
