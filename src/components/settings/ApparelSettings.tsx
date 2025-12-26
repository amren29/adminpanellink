"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import { useSettingsStore, PrintArea, formatCurrency, SleeveType, CollarType, PersonalizationAddon } from "./settingsData";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Select from "@/components/form/Select";

export default function ApparelSettings() {
    const {
        shirtBrands, printAreas, setupFee,
        addShirtBrand, updateShirtBrand, deleteShirtBrand,
        addPrintArea, updatePrintArea, deletePrintArea,
        sleeveTypes, addSleeveType, updateSleeveType, deleteSleeveType,
        collarTypes, addCollarType, updateCollarType, deleteCollarType,
        personalization, addPersonalization, updatePersonalization, deletePersonalization,
        setSetupFee
    } = useSettingsStore();

    const [activeTab, setActiveTab] = useState<"brands" | "areas" | "customization" | "general">("brands");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"brand" | "area" | "sleeve" | "collar" | "personalization">("brand");
    const [editingItem, setEditingItem] = useState<any>(null);
    const [pendingDelete, setPendingDelete] = useState<{ type: string; id: string; name: string } | null>(null);

    const [brandForm, setBrandForm] = useState({ name: "", description: "", isActive: true });
    const [areaForm, setAreaForm] = useState({
        name: "", description: "", widthInch: 4, heightInch: 4,
        basePrice: 10, darkColorAddon: 3, isActive: true
    });
    const [sleeveForm, setSleeveForm] = useState({ name: "", priceAddon: 0, isActive: true });
    const [collarForm, setCollarForm] = useState({ name: "", priceAddon: 0, isActive: true });
    const [personalizationForm, setPersonalizationForm] = useState({
        name: "", priceType: "flat" as "flat" | "perCharacter", price: 0, maxCharacters: undefined as number | undefined, isActive: true
    });
    const [tempSetupFee, setTempSetupFee] = useState(setupFee);

    const openCreateBrand = () => {
        setEditingItem(null);
        setBrandForm({ name: "", description: "", isActive: true });
        setModalType("brand");
        setIsModalOpen(true);
    };

    const openEditBrand = (brand: any) => {
        setEditingItem(brand);
        setBrandForm({ name: brand.name, description: brand.description, isActive: brand.isActive });
        setModalType("brand");
        setIsModalOpen(true);
    };

    const openCreateArea = () => {
        setEditingItem(null);
        setAreaForm({ name: "", description: "", widthInch: 4, heightInch: 4, basePrice: 10, darkColorAddon: 3, isActive: true });
        setModalType("area");
        setIsModalOpen(true);
    };

    const openEditArea = (area: PrintArea) => {
        setEditingItem(area);
        setAreaForm({
            name: area.name, description: area.description,
            widthInch: area.widthInch, heightInch: area.heightInch,
            basePrice: area.basePrice, darkColorAddon: area.darkColorAddon,
            isActive: area.isActive,
        });
        setModalType("area");
        setIsModalOpen(true);
    };

    const openAddSleeve = () => {
        setEditingItem(null);
        setSleeveForm({ name: "", priceAddon: 0, isActive: true });
        setModalType("sleeve");
        setIsModalOpen(true);
    };

    const openEditSleeve = (sleeve: SleeveType) => {
        setEditingItem(sleeve);
        setSleeveForm({ name: sleeve.name, priceAddon: sleeve.priceAddon, isActive: sleeve.isActive });
        setModalType("sleeve");
        setIsModalOpen(true);
    };

    const openAddCollar = () => {
        setEditingItem(null);
        setCollarForm({ name: "", priceAddon: 0, isActive: true });
        setModalType("collar");
        setIsModalOpen(true);
    };

    const openEditCollar = (collar: CollarType) => {
        setEditingItem(collar);
        setCollarForm({ name: collar.name, priceAddon: collar.priceAddon, isActive: collar.isActive });
        setModalType("collar");
        setIsModalOpen(true);
    };

    const openAddPersonalization = () => {
        setEditingItem(null);
        setPersonalizationForm({ name: "", priceType: "flat", price: 0, maxCharacters: undefined, isActive: true });
        setModalType("personalization");
        setIsModalOpen(true);
    };

    const openEditPersonalization = (item: PersonalizationAddon) => {
        setEditingItem(item);
        setPersonalizationForm({
            name: item.name, priceType: item.priceType, price: item.price,
            maxCharacters: item.maxCharacters, isActive: item.isActive
        });
        setModalType("personalization");
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (modalType === "brand") {
            if (editingItem) {
                updateShirtBrand(editingItem.id, brandForm);
            } else {
                addShirtBrand(brandForm);
            }
        } else if (modalType === "area") {
            if (editingItem) {
                updatePrintArea(editingItem.id, areaForm);
            } else {
                addPrintArea(areaForm);
            }
        } else if (modalType === "sleeve") {
            if (editingItem) {
                updateSleeveType(editingItem.id, sleeveForm);
            } else {
                addSleeveType(sleeveForm);
            }
        } else if (modalType === "collar") {
            if (editingItem) {
                updateCollarType(editingItem.id, collarForm);
            } else {
                addCollarType(collarForm);
            }
        } else if (modalType === "personalization") {
            if (editingItem) {
                updatePersonalization(editingItem.id, personalizationForm);
            } else {
                addPersonalization(personalizationForm);
            }
        }
        setIsModalOpen(false);
    };

    const inputClasses = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Apparel Settings</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure shirt brands, print areas, customization options for sublimation/DTF</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit mb-6">
                {[
                    { id: "brands", label: "Shirt Brands" },
                    { id: "areas", label: "Print Areas" },
                    { id: "customization", label: "Customization" },
                    { id: "general", label: "General" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                            ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Shirt Brands Tab */}
            {activeTab === "brands" && (
                <div>
                    <div className="flex justify-end mb-4">
                        <Button variant="primary" onClick={openCreateBrand}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                                <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Add Brand
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Brand Name</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {shirtBrands.map((brand) => (
                                    <TableRow key={brand.id}>
                                        <TableCell className="px-5 py-4">
                                            <div>
                                                <span className="font-medium text-gray-800 dark:text-white">{brand.name}</span>
                                                <span className="block text-xs text-gray-500 dark:text-gray-400">{brand.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${brand.isActive ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-600"}`}>
                                                {brand.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditBrand(brand)} className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg">
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </button>
                                                <button onClick={() => setPendingDelete({ type: 'brand', id: brand.id, name: brand.name })} className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg">
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.25 4.5H3.75H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Print Areas Tab */}
            {activeTab === "areas" && (
                <div>
                    <div className="flex justify-end mb-4">
                        <Button variant="primary" onClick={openCreateArea}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                                <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Add Print Area
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Print Area</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Size</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Base Price</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Dark Add-on</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {printAreas.map((area) => (
                                    <TableRow key={area.id}>
                                        <TableCell className="px-5 py-4">
                                            <div>
                                                <span className="font-medium text-gray-800 dark:text-white">{area.name}</span>
                                                <span className="block text-xs text-gray-500 dark:text-gray-400">{area.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                            {area.widthInch}&quot; × {area.heightInch}&quot;
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-end font-medium text-gray-800 dark:text-white">
                                            {formatCurrency(area.basePrice)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-end text-warning-500">
                                            +{formatCurrency(area.darkColorAddon)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditArea(area)} className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg">
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </button>
                                                <button onClick={() => setPendingDelete({ type: 'area', id: area.id, name: area.name })} className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg">
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.25 4.5H3.75H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Customization Tab - Sleeve, Collar, Personalization */}
            {activeTab === "customization" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sleeve Types */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white">Sleeve Types</h4>
                            <button onClick={openAddSleeve} className="text-xs text-brand-500 hover:text-brand-600">+ Add</button>
                        </div>
                        <div className="space-y-2">
                            {sleeveTypes.map((sleeve) => (
                                <div key={sleeve.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{sleeve.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                                            {sleeve.priceAddon > 0 ? `+${formatCurrency(sleeve.priceAddon)}` : "Base"}
                                        </span>
                                        <button onClick={() => openEditSleeve(sleeve)} className="text-xs text-gray-400 hover:text-brand-500">Edit</button>
                                        <button onClick={() => setPendingDelete({ type: 'sleeve', id: sleeve.id, name: sleeve.name })} className="text-xs text-gray-400 hover:text-error-500">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Collar Types */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white">Collar Types</h4>
                            <button onClick={openAddCollar} className="text-xs text-brand-500 hover:text-brand-600">+ Add</button>
                        </div>
                        <div className="space-y-2">
                            {collarTypes.map((collar) => (
                                <div key={collar.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{collar.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                                            {collar.priceAddon > 0 ? `+${formatCurrency(collar.priceAddon)}` : "Base"}
                                        </span>
                                        <button onClick={() => openEditCollar(collar)} className="text-xs text-gray-400 hover:text-brand-500">Edit</button>
                                        <button onClick={() => setPendingDelete({ type: 'collar', id: collar.id, name: collar.name })} className="text-xs text-gray-400 hover:text-error-500">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personalization */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white">Personalization Add-ons</h4>
                            <button onClick={openAddPersonalization} className="text-xs text-brand-500 hover:text-brand-600">+ Add</button>
                        </div>
                        <div className="space-y-2">
                            {personalization.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                                            {formatCurrency(item.price)}{item.priceType === "perCharacter" && "/char"}
                                        </span>
                                        <button onClick={() => openEditPersonalization(item)} className="text-xs text-gray-400 hover:text-brand-500">Edit</button>
                                        <button onClick={() => setPendingDelete({ type: 'personalization', id: item.id, name: item.name })} className="text-xs text-gray-400 hover:text-error-500">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* General Tab */}
            {activeTab === "general" && (
                <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-4">Apparel Pricing Settings</h3>
                    <div className="max-w-xs">
                        <label className={labelClasses}>Setup Fee (RM)</label>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                value={tempSetupFee}
                                onChange={(e) => setTempSetupFee(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.5}
                                className={inputClasses}
                            />
                            <Button variant="primary" onClick={() => setSetupFee(tempSetupFee)}>Save</Button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">One-time fee for custom artwork/setup</p>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg p-6 mx-4">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {editingItem ? "Edit" : "Add"} {
                            modalType === "brand" ? "Shirt Brand" :
                                modalType === "area" ? "Print Area" :
                                    modalType === "sleeve" ? "Sleeve Type" :
                                        modalType === "collar" ? "Collar Type" : "Personalization"
                        }
                    </h3>
                </div>

                {modalType === "brand" && (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Brand Name *</label>
                            <input type="text" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} placeholder="e.g. Gildan" className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Description</label>
                            <input type="text" value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} placeholder="Short description" className={inputClasses} />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={brandForm.isActive} onChange={(e) => setBrandForm({ ...brandForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                    </div>
                )}

                {modalType === "area" && (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Area Name *</label>
                            <input type="text" value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="e.g. Left Chest" className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Description</label>
                            <input type="text" value={areaForm.description} onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })} placeholder="Short description" className={inputClasses} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Width (inches)</label>
                                <input type="number" value={areaForm.widthInch} onChange={(e) => setAreaForm({ ...areaForm, widthInch: parseFloat(e.target.value) || 0 })} min={1} step={0.5} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Height (inches)</label>
                                <input type="number" value={areaForm.heightInch} onChange={(e) => setAreaForm({ ...areaForm, heightInch: parseFloat(e.target.value) || 0 })} min={1} step={0.5} className={inputClasses} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Base Price (RM)</label>
                                <input type="number" value={areaForm.basePrice} onChange={(e) => setAreaForm({ ...areaForm, basePrice: parseFloat(e.target.value) || 0 })} min={0} step={0.5} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Dark Shirt Add-on (RM)</label>
                                <input type="number" value={areaForm.darkColorAddon} onChange={(e) => setAreaForm({ ...areaForm, darkColorAddon: parseFloat(e.target.value) || 0 })} min={0} step={0.5} className={inputClasses} />
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={areaForm.isActive} onChange={(e) => setAreaForm({ ...areaForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                    </div>
                )}

                {(modalType === "sleeve" || modalType === "collar") && (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Name *</label>
                            <input type="text" value={modalType === "sleeve" ? sleeveForm.name : collarForm.name} onChange={(e) => modalType === "sleeve" ? setSleeveForm({ ...sleeveForm, name: e.target.value }) : setCollarForm({ ...collarForm, name: e.target.value })} placeholder={modalType === "sleeve" ? "e.g. Long Sleeve" : "e.g. Mandarin Collar"} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Price Add-on (RM)</label>
                            <input type="number" value={modalType === "sleeve" ? sleeveForm.priceAddon : collarForm.priceAddon} onChange={(e) => modalType === "sleeve" ? setSleeveForm({ ...sleeveForm, priceAddon: parseFloat(e.target.value) || 0 }) : setCollarForm({ ...collarForm, priceAddon: parseFloat(e.target.value) || 0 })} min={0} step={0.5} className={inputClasses} />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={modalType === "sleeve" ? sleeveForm.isActive : collarForm.isActive} onChange={(e) => modalType === "sleeve" ? setSleeveForm({ ...sleeveForm, isActive: e.target.checked }) : setCollarForm({ ...collarForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                    </div>
                )}

                {modalType === "personalization" && (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Name *</label>
                            <input type="text" value={personalizationForm.name} onChange={(e) => setPersonalizationForm({ ...personalizationForm, name: e.target.value })} placeholder="e.g. Name, Number" className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Price Type</label>
                            <Select
                                value={personalizationForm.priceType}
                                onChange={(value) => setPersonalizationForm({ ...personalizationForm, priceType: value as "flat" | "perCharacter" })}
                                options={[
                                    { value: "flat", label: "Flat Fee" },
                                    { value: "perCharacter", label: "Per Character" },
                                ]}
                                className={inputClasses.replace("h-11 ", "")}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Price (RM)</label>
                            <input type="number" value={personalizationForm.price} onChange={(e) => setPersonalizationForm({ ...personalizationForm, price: parseFloat(e.target.value) || 0 })} min={0} step={0.5} className={inputClasses} />
                        </div>
                        {personalizationForm.priceType === "perCharacter" && (
                            <div>
                                <label className={labelClasses}>Max Characters</label>
                                <input type="number" value={personalizationForm.maxCharacters || ""} onChange={(e) => setPersonalizationForm({ ...personalizationForm, maxCharacters: parseInt(e.target.value) || undefined })} min={1} className={inputClasses} />
                            </div>
                        )}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={personalizationForm.isActive} onChange={(e) => setPersonalizationForm({ ...personalizationForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>{editingItem ? "Save Changes" : "Add"}</Button>
                </div>
            </Modal>

            <ActionConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={() => {
                    if (pendingDelete) {
                        if (pendingDelete.type === 'brand') deleteShirtBrand(pendingDelete.id);
                        if (pendingDelete.type === 'area') deletePrintArea(pendingDelete.id);
                        if (pendingDelete.type === 'sleeve') deleteSleeveType(pendingDelete.id);
                        if (pendingDelete.type === 'collar') deleteCollarType(pendingDelete.id);
                        if (pendingDelete.type === 'personalization') deletePersonalization(pendingDelete.id);
                        setPendingDelete(null);
                    }
                }}
                title="Confirm Deletion"
                description={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
