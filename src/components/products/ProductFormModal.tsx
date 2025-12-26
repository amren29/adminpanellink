"use client";
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Product, SizeOption, standardSizes, apparelSizes, PricingEngine, PricingTier, ProductOptionGroup, ProductOptionItem } from "./productData";
import { useSettingsStore, formatCurrency } from "@/components/settings/settingsData";
import { CustomDropdown } from "@/components/ui/dropdown/CustomDropdown";

interface QuantityTier {
    variantId?: string | null;
    minQty: number;
    maxQty: number;
    pricePerUnit: number;
}

interface FixedQuantityOption {
    variantId?: string | null;
    qty: number;
    pricePerUnit: number;
}

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Omit<Product, "id" | "createdDate">) => Promise<void>;
    product?: Product | null;
    loading?: boolean;
}

const defaultQuantityTiers: QuantityTier[] = [
    { minQty: 1, maxQty: 99, pricePerUnit: 1.00 },
    { minQty: 100, maxQty: 499, pricePerUnit: 0.80 },
    { minQty: 500, maxQty: 999, pricePerUnit: 0.60 },
    { minQty: 1000, maxQty: 9999, pricePerUnit: 0.40 },
];

// Pricing engine options
const pricingEngineOptions: { value: PricingEngine; label: string; description: string }[] = [
    { value: "sqft", label: "SQFT Engine", description: "Area-based pricing (Banners, Stickers)" },
    // { value: "qty_tier", label: "QTY Tier Engine", description: "Tiered bulk pricing (Business Cards, Flyers)" }, // Hidden for now
    { value: "qty_fixed", label: "QTY Fixed Engine", description: "Unit price × quantity (Frames, Accessories)" },
    { value: "apparel_multiline", label: "Apparel Multi-Line", description: "Size + Sleeve + Collar + Add-ons (Jerseys)" },
];

const ProductFormModal: React.FC<ProductFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    product,
    loading = false,
}) => {
    const { departments, pricingLogics } = useSettingsStore();
    const isEditMode = !!product;

    const [formData, setFormData] = useState({
        name: "",
        departmentId: departments[0]?.id || "",
        pricingEngine: "sqft" as PricingEngine,
        description: "",
        basePrice: 1,
        // SQFT Engine specific
        basePricePerSqft: 5,
        minimumPrice: 10,
        // QTY Fixed specific
        unitPrice: 50,
        bulkDiscount: 0,
        minQuantity: 1,
        maxQuantity: undefined as number | undefined,
        leadTimeDays: 3,
        isActive: true,
        trackStock: false,
        stock: 0,
        images: [] as string[],
        tags: [] as string[],
    });

    const [currentTag, setCurrentTag] = useState("");
    const [quantityTiers, setQuantityTiers] = useState<QuantityTier[]>(defaultQuantityTiers);
    const [fixedQuantities, setFixedQuantities] = useState<FixedQuantityOption[]>([
        { qty: 100, pricePerUnit: 1.00 },
        { qty: 200, pricePerUnit: 0.90 },
        { qty: 300, pricePerUnit: 0.80 },
        { qty: 400, pricePerUnit: 0.70 },
    ]);

    const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});

    // Sizes Configuration
    const [configuredSizes, setConfiguredSizes] = useState<SizeOption[]>([]);

    // Dynamic Option Groups State
    const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([]);

    // Volume Discount State (for Apparel)
    const [enableVolumeDiscount, setEnableVolumeDiscount] = useState(false);
    const [discountTiers, setDiscountTiers] = useState<{ minQty: number; discount: number }[]>([
        { minQty: 10, discount: 5 },
        { minQty: 50, discount: 10 },
        { minQty: 100, discount: 15 },
    ]);

    // Per-Size Pricing State
    const [activeTierVariantId, setActiveTierVariantId] = useState<string | null>(null); // null = Global

    const selectedDept = departments.find(d => d.id === formData.departmentId);

    // Derived states for UI logic
    const activeLogic = pricingLogics.find(pl => pl.engineCode === formData.pricingEngine);
    const isApparel = formData.pricingEngine === 'apparel_multiline';
    const isSquareFoot = formData.pricingEngine === 'sqft';

    // Initialize sizes when switching types or new product
    useEffect(() => {
        if (!product) {
            // New product defaults
            if (isApparel) {
                setConfiguredSizes(apparelSizes.map(s => ({ ...s, priceAddon: 0 })));
            } else if (isSquareFoot) {
                setConfiguredSizes(standardSizes.map(s => ({ ...s, priceAddon: 0 })));
            } else {
                setConfiguredSizes([]);
            }
        }
    }, [isApparel, isSquareFoot, product]);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                departmentId: product.departmentId || departments[0]?.id || "",
                pricingEngine: product.pricingEngine || "sqft",
                description: product.description,
                basePrice: product.basePrice,
                basePricePerSqft: product.basePricePerSqft ?? 5,
                minimumPrice: product.minimumPrice ?? 10,
                unitPrice: product.unitPrice ?? 50,
                bulkDiscount: product.bulkDiscount ?? 0,
                minQuantity: product.minQuantity,
                maxQuantity: product.maxQuantity,
                leadTimeDays: product.leadTimeDays,
                isActive: product.isActive,
                trackStock: product.trackStock || false,
                stock: product.stock || 0,
                images: product.images || [],
                tags: product.tags || [],
            });

            // Should properly load existing selected options if stored
            setSelectedItems((product as any).selectedOptions || {});

            if (product.pricingTiers && product.pricingTiers.length > 0) {
                setQuantityTiers(product.pricingTiers.map((t: any) => ({
                    minQty: t.minQty,
                    maxQty: t.maxQty || 9999,
                    pricePerUnit: t.price,
                    variantId: t.variantId // Load persisted variantId
                })));
            } else {
                setQuantityTiers(defaultQuantityTiers);
            }

            if (product.fixedQuantities && product.fixedQuantities.length > 0) {
                setFixedQuantities(product.fixedQuantities.map((fq: any) => ({
                    qty: fq.quantity,
                    pricePerUnit: Number(fq.price) / fq.quantity,
                    variantId: fq.variantId
                })));
            } else {
                setFixedQuantities([
                    { qty: 100, pricePerUnit: 1.00 },
                    { qty: 200, pricePerUnit: 0.90 },
                    { qty: 300, pricePerUnit: 0.80 },
                    { qty: 400, pricePerUnit: 0.70 },
                ]);
            }

            // Load Volume Discount Tiers (for Apparel)
            if (product.quantityTiers && product.quantityTiers.length > 0) {
                setEnableVolumeDiscount(true);
                setDiscountTiers(product.quantityTiers.map((t: any) => ({
                    minQty: t.minQty,
                    discount: t.discount || 0
                })));
            } else {
                setEnableVolumeDiscount(false);
            }

            if (product.availableSizes && product.availableSizes.length > 0) {
                setConfiguredSizes(product.availableSizes);
            } else {
                // Fallback for edit mode if sizes missing
                const defaultSet = product.pricingType === 'apparel' || product.pricingEngine === 'apparel_multiline' ? apparelSizes : standardSizes;
                setConfiguredSizes(defaultSet.map(s => ({ ...s, priceAddon: 0 })));
            }

            // NEW: Load Option Groups (Migration Logic)
            // If product has optionGroups, load them. Can also migrate existing materials/finishing if present.
            const groups: ProductOptionGroup[] = [];

            // 1. Load from official new structure (if API supports it yet)
            if (product.optionGroups && product.optionGroups.length > 0) {
                groups.push(...product.optionGroups);
            } else if ((product as any).options && (product as any).options.length > 0) {
                // 2. Parse from flat options list (Reconstruct groups)
                const customOptions = (product as any).options.filter((o: any) => o.optionType === 'custom' || o.optionType === 'material' || o.optionType === 'finishing');
                const grouped = customOptions.reduce((acc: any, curr: any) => {
                    // Determine Group Name
                    let gName = curr.groupName; // New field
                    if (!gName) {
                        // MIGRATION: Infer group from old optionType
                        if (curr.optionType === 'material') gName = 'Material';
                        else if (curr.optionType === 'finishing') gName = 'Finishing';
                        else gName = 'General';
                    }

                    if (!acc[gName]) {
                        acc[gName] = [];
                    }

                    // Parse value JSON
                    let parsedValue: any = { scope: 'unit', customQty: false };
                    try {
                        if (curr.value && curr.value.startsWith('{')) {
                            const parsed = JSON.parse(curr.value);
                            parsedValue = {
                                scope: parsed.scope || 'unit',
                                customQty: parsed.customQty || false
                            };
                        } else {
                            // Fallback raw string 'sqft'/'unit'
                            parsedValue = { scope: curr.value || 'unit', customQty: false };
                        }
                    } catch (e) { parsedValue = { scope: curr.value || 'unit', customQty: false }; }

                    acc[gName].push({
                        id: curr.id,
                        name: curr.name,
                        pricingMode: curr.pricingMode || (curr.optionType === 'material' ? 'x' : '+'),
                        priceValue: Number(curr.priceValue) || 0,
                        priceScope: parsedValue.scope,
                        hasCustomQuantity: parsedValue.customQty
                    });
                    return acc;
                }, {});

                Object.entries(grouped).forEach(([gName, items]: [string, any]) => {
                    groups.push({
                        id: `group-${Date.now()}-${Math.random()}`,
                        name: gName,
                        options: items
                    });
                });
            }

            setOptionGroups(groups);

        } else {
            setFormData({
                name: "",
                departmentId: departments[0]?.id || "",
                pricingEngine: "sqft",
                description: "",
                basePrice: 1,
                basePricePerSqft: 5,
                minimumPrice: 10,
                unitPrice: 50,
                bulkDiscount: 0,
                minQuantity: 1,
                maxQuantity: undefined,
                leadTimeDays: 3,
                isActive: true,
                trackStock: false,
                stock: 0,
                images: [],
                tags: [],
            });
            setSelectedItems({});
            setQuantityTiers(defaultQuantityTiers);
            setOptionGroups([]);

            // Collars/Sleeves handled by other useEffect for new products
        }
    }, [product, isOpen, departments]);

    const handleDepartmentChange = (deptId: string) => {
        setFormData(prev => ({ ...prev, departmentId: deptId }));
        setSelectedItems({});
    };

    const toggleItem = (categoryId: string, itemId: string) => {
        setSelectedItems(prev => {
            const current = prev[categoryId] || [];
            if (current.includes(itemId)) {
                return { ...prev, [categoryId]: current.filter(id => id !== itemId) };
            } else {
                return { ...prev, [categoryId]: [...current, itemId] };
            }
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
        }));
    };

    // --- Tags ---
    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(currentTag.trim())) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
            }
            setCurrentTag("");
        }
    };
    const removeTag = (tag: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    // --- Images ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleAddImage = () => {
        // Trigger hidden file input
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            alert('Image size must be less than 10MB');
            return;
        }

        setUploadingImage(true);

        try {
            // Step 1: Get presigned URL from API
            const presignRes = await fetch('/api/upload/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    productId: product?.id || null
                })
            });

            if (!presignRes.ok) {
                const error = await presignRes.json();
                throw new Error(error.error || 'Failed to get upload URL');
            }

            const { uploadUrl, publicUrl } = await presignRes.json();

            // Step 2: Upload file directly to R2
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadRes.ok) {
                throw new Error('Failed to upload image');
            }

            // Step 3: Add the public URL to formData
            setFormData(prev => ({ ...prev, images: [...prev.images, publicUrl] }));

        } catch (error: any) {
            console.error('Image upload error:', error);
            alert(error.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    // --- Tier Handlers (Per-Size) ---
    const addTier = () => {
        setQuantityTiers([...quantityTiers, {
            variantId: activeTierVariantId,
            minQty: 1,
            maxQty: 0,
            pricePerUnit: 0
        }]);
    };

    const updateTier = (filteredIndex: number, field: keyof QuantityTier, value: number) => {
        // We need to find the specific tier in the master list.
        // Strategy: Filter to find the item, modify it, then reconstruct master list.
        const currentVariantTiers = quantityTiers.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId));
        const otherTiers = quantityTiers.filter(t => !((t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)));

        const tierToUpdate = currentVariantTiers[filteredIndex];
        if (!tierToUpdate) return;

        const updatedTier = { ...tierToUpdate, [field]: value };

        // Update item in current set
        const newCurrentTiers = [...currentVariantTiers];
        newCurrentTiers[filteredIndex] = updatedTier;

        setQuantityTiers([...otherTiers, ...newCurrentTiers]);
    };

    const removeTier = (filteredIndex: number) => {
        const currentVariantTiers = quantityTiers.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId));
        const otherTiers = quantityTiers.filter(t => !((t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)));

        const newCurrentTiers = currentVariantTiers.filter((_, i) => i !== filteredIndex);
        setQuantityTiers([...otherTiers, ...newCurrentTiers]);
    };

    // Helper: Copy global tiers to current variant
    const copyGlobalTiers = () => {
        if (!activeTierVariantId) return;
        const globalTiers = quantityTiers.filter(t => !t.variantId);
        if (globalTiers.length === 0) return;

        // Remove existing tiers for this variant to prevent duplicates (Overwrite)
        const otherTiers = quantityTiers.filter(t => t.variantId !== activeTierVariantId);

        const newTiers = globalTiers.map(t => ({ ...t, variantId: activeTierVariantId }));
        setQuantityTiers([...otherTiers, ...newTiers]);
    };

    // --- Fixed QTY Handlers (Per-Size) ---
    const addFixedQty = () => {
        setFixedQuantities([...fixedQuantities, {
            variantId: activeTierVariantId,
            qty: 100,
            pricePerUnit: 0
        }]);
    };

    const updateFixedQty = (filteredIndex: number, field: keyof FixedQuantityOption, value: number) => {
        const currentVariantOpts = fixedQuantities.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId));
        const otherOpts = fixedQuantities.filter(t => !((t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)));

        const optToUpdate = currentVariantOpts[filteredIndex];
        if (!optToUpdate) return;

        const updatedOpt = { ...optToUpdate, [field]: value };

        const newCurrentOpts = [...currentVariantOpts];
        newCurrentOpts[filteredIndex] = updatedOpt;

        setFixedQuantities([...otherOpts, ...newCurrentOpts]);
    };

    const removeFixedQty = (filteredIndex: number) => {
        const currentVariantOpts = fixedQuantities.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId));
        const otherOpts = fixedQuantities.filter(t => !((t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)));

        const newCurrentOpts = currentVariantOpts.filter((_, i) => i !== filteredIndex);
        setFixedQuantities([...otherOpts, ...newCurrentOpts]);
    };

    const copyGlobalFixedQty = () => {
        if (!activeTierVariantId) return;
        const globalOpts = fixedQuantities.filter(t => !t.variantId);
        if (globalOpts.length === 0) return;

        // Remove existing options for this variant to prevent duplicates (Overwrite)
        const otherOpts = fixedQuantities.filter(t => t.variantId !== activeTierVariantId);

        const newOpts = globalOpts.map(t => ({ ...t, variantId: activeTierVariantId }));
        setFixedQuantities([...otherOpts, ...newOpts]);
    };

    // --- Sizes Handling (New Custom Logic) ---
    const [sizeInput, setSizeInput] = useState({
        name: "",
        width: 0,
        height: 0,
        unit: "in" as "in" | "ft" | "mm" | "cm" | "m",
        priceAddon: 0
    });
    const [enableSizeOptions, setEnableSizeOptions] = useState(false);

    // Sync enable state with engine type or existing sizes
    useEffect(() => {
        if (isApparel || isSquareFoot || ((product as any)?.availableSizes && (product as any)?.availableSizes.length > 0)) {
            setEnableSizeOptions(true);
        }
    }, [isApparel, isSquareFoot, product]);

    const handleAddSize = () => {
        if (!sizeInput.name) return;

        // Convert to inches for internal storage
        let w_inch = sizeInput.width;
        let h_inch = sizeInput.height;
        const u = sizeInput.unit;

        if (u === 'ft') { w_inch *= 12; h_inch *= 12; }
        else if (u === 'mm') { w_inch /= 25.4; h_inch /= 25.4; }
        else if (u === 'cm') { w_inch /= 2.54; h_inch /= 2.54; }
        else if (u === 'm') { w_inch *= 39.37; h_inch *= 39.37; }

        const newSize: SizeOption = {
            id: `custom-${Date.now()}`,
            name: sizeInput.name, // Keep original name e.g. "Banner (2x4ft)"
            widthInch: w_inch,
            heightInch: h_inch,
            multiplier: 1, // Default to 1
            priceAddon: sizeInput.priceAddon
        };

        setConfiguredSizes([...configuredSizes, newSize]);

        // Reset input, keep unit for convenience
        setSizeInput(prev => ({ ...prev, name: "", width: 0, height: 0, priceAddon: 0 }));
    };

    const removeSize = (id: string) => {
        setConfiguredSizes(configuredSizes.filter(s => s.id !== id));
    };

    // Quick Add Standard Sizes
    const addStandardSet = (type: 'standard' | 'apparel') => {
        const set = type === 'apparel' ? apparelSizes : standardSizes;
        // avoid duplicates based on ID
        const newSizes = set.filter(s => !configuredSizes.some(cs => cs.id === s.id)).map(s => ({ ...s, priceAddon: 0 }));
        setConfiguredSizes([...configuredSizes, ...newSizes]);
    };


    // ... (Keep existing handlers) ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productData: any = {
                ...formData,
                category: selectedDept?.name || "General",
                pricingType: formData.pricingEngine === "sqft" ? "sqft" : formData.pricingEngine === "apparel_multiline" ? "apparel" : "quantity",
                selectedOptions: selectedItems,

                // Map QTY Tier engine data to new structure (include variantId)
                pricingTiers: formData.pricingEngine === 'qty_tier' ? quantityTiers.map(t => ({
                    minQty: t.minQty,
                    maxQty: t.maxQty,
                    price: t.pricePerUnit, // Map pricePerUnit to price
                    variantId: t.variantId || null
                })) : [],

                // Map Fixed QTY data (include variantId)
                fixedQuantities: formData.pricingEngine === 'qty_fixed' ? fixedQuantities.map(t => ({
                    quantity: t.qty,
                    price: t.pricePerUnit * t.qty, // Total price for the fixed quantity
                    variantId: t.variantId || null
                })) : [],

                // Legacy mappings or Volume Discount Tiers for Apparel
                quantityTiers: (formData.pricingEngine === 'apparel_multiline' && enableVolumeDiscount)
                    ? discountTiers.map(t => ({
                        minQty: t.minQty,
                        maxQty: null,
                        discount: t.discount
                    }))
                    : [],

                // Save Configured Sizes if enabled
                availableSizes: enableSizeOptions ? configuredSizes : [],
                hasSizeOptions: enableSizeOptions && configuredSizes.length > 0,

                // dynamic Option Groups (Replacing productMaterials/Finishing)
                optionGroups: (formData.pricingEngine === 'sqft' || formData.pricingEngine === 'qty_fixed' || formData.pricingEngine === 'apparel_multiline') ? optionGroups : [],

                // Legacy cleanup
                productMaterials: [],
                productFinishing: [],
                availableMaterials: [],
                availableFinishing: [],
            };

            await onSave(productData);
        } catch (error) {
            console.error("Failed to create product:", error);
        }
    };

    const inputClasses = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
    const priceLabels: Record<string, string> = { flat: "", perSqft: "/sqft", multiplier: "×", perUnit: "/unit" };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{isEditMode ? "Edit Product" : "Add New Product"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{isEditMode ? "Update product details and pricing" : "Create a new product with pricing rules"}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={labelClasses}>Product Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Premium Sticker Labels" className={inputClasses} required /></div>
                        {/* Department Selector Removed as per user request */}
                        {/* <div className="md:col-span-1">
                            <label className={labelClasses}>Department *</label>
                            ...
                        </div> */}
                        {/* Pricing Engine Selector */}
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Pricing Engine *</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {pricingEngineOptions.map(engine => (
                                    <button
                                        key={engine.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, pricingEngine: engine.value }))}
                                        className={`p-3 rounded-lg border text-left transition-all ${formData.pricingEngine === engine.value
                                            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-2 ring-brand-500/20"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <span className="block text-sm font-medium text-gray-800 dark:text-white">{engine.label}</span>
                                        <span className="block text-xs text-gray-500 mt-0.5">{engine.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2"><label className={labelClasses}>Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Product description..." rows={2} className={`${inputClasses} h-auto`} /></div>

                        {/* Images */}
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Product Images</label>
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                            />
                            <div className="flex flex-wrap gap-3">
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">✕</button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddImage}
                                    disabled={uploadingImage}
                                    className={`w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${uploadingImage
                                            ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20 cursor-wait'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:text-brand-500 hover:border-brand-500'
                                        }`}
                                >
                                    {uploadingImage ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-[9px] text-brand-500 mt-1">Uploading</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl">+</span>
                                            <span className="text-[10px]">Add Image</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="md:col-span-2">
                            <label className={labelClasses}>SEO Tags</label>
                            <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus-within:ring-2 ring-brand-500/20">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                                        #{tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder={formData.tags.length === 0 ? "Type tag & press enter..." : ""}
                                    className="bg-transparent text-sm outline-none flex-grow min-w-[100px] text-gray-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Configuration */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Pricing Configuration
                        <span className="ml-2 text-xs text-brand-500 font-normal">
                            ({pricingEngineOptions.find(e => e.value === formData.pricingEngine)?.label})
                        </span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* SQFT Engine Fields */}
                        {formData.pricingEngine === "sqft" && (
                            <>
                                <div>
                                    <label className={labelClasses}>Base Price per Sqft (RM) *</label>
                                    <input type="number" name="basePricePerSqft" value={formData.basePricePerSqft} onChange={handleInputChange} min={0} step={0.01} className={inputClasses} required />
                                </div>
                                <div>
                                    <label className={labelClasses}>Minimum Price (RM)</label>
                                    <input type="number" name="minimumPrice" value={formData.minimumPrice} onChange={handleInputChange} min={0} step={0.01} className={inputClasses} placeholder="e.g. 10" />
                                </div>
                            </>
                        )}

                        {/* QTY Tier Engine - uses quantityTiers table below */}
                        {formData.pricingEngine === "qty_tier" && (
                            <div className="md:col-span-3">
                                <p className="text-sm text-gray-500">Configure tiered pricing in the Quantity Options section below.</p>
                            </div>
                        )}

                        {/* QTY Fixed Engine Fields */}
                        {formData.pricingEngine === "qty_fixed" && (
                            <>
                                <div>
                                    <label className={labelClasses}>Unit Price (RM) *</label>
                                    <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleInputChange} min={0} step={0.01} className={inputClasses} required />
                                </div>
                                <div>
                                    <label className={labelClasses}>Bulk Discount (%)</label>
                                    <input type="number" name="bulkDiscount" value={formData.bulkDiscount} onChange={handleInputChange} min={0} max={100} step={1} className={inputClasses} placeholder="0" />
                                </div>
                            </>
                        )}

                        {/* Apparel Multi-Line Engine */}
                        {formData.pricingEngine === "apparel_multiline" && (
                            <div>
                                <label className={labelClasses}>Base Shirt Price (RM) *</label>
                                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleInputChange} min={0} step={0.01} className={inputClasses} required />
                            </div>
                        )}

                        {/* Common Fields */}
                        <div><label className={labelClasses}>Lead Time (Days)</label><input type="number" name="leadTimeDays" value={formData.leadTimeDays} onChange={handleInputChange} min={1} className={inputClasses} /></div>
                        <div><label className={labelClasses}>Min Quantity</label><input type="number" name="minQuantity" value={formData.minQuantity} onChange={handleInputChange} min={1} className={inputClasses} /></div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer h-11">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                            </label>
                        </div>

                        {/* Inventory Management */}
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer h-11">
                                <input type="checkbox" name="trackStock" checked={formData.trackStock} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Track Stock</span>
                            </label>
                        </div>
                        {formData.trackStock && (
                            <div>
                                <label className={labelClasses}>Available Quantity</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} min={0} className={inputClasses} placeholder="0" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Size Configuration (Enhanced) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <div className="flex items-center gap-3">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white">Size Configuration</h4>
                            {(!isApparel && !isSquareFoot) && (
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                                    <input
                                        type="checkbox"
                                        checked={enableSizeOptions}
                                        onChange={(e) => setEnableSizeOptions(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-brand-500"
                                    />
                                    Enable Sizes
                                </label>
                            )}
                        </div>
                    </div>

                    {enableSizeOptions && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">

                            {/* Quick Add Presets */}
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => addStandardSet('standard')} className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-100">+ Add Standard (A4-A0)</button>
                                <button type="button" onClick={() => addStandardSet('apparel')} className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-100">+ Add Apparel (XS-5XL)</button>
                                <button type="button" onClick={() => {
                                    if (!configuredSizes.some(s => s.id === 'custom')) {
                                        setConfiguredSizes([...configuredSizes, { id: 'custom', name: 'Custom Size', widthInch: 0, heightInch: 0, multiplier: 1, priceAddon: 0 }]);
                                    }
                                }} className="text-xs px-2 py-1 bg-brand-50 text-brand-600 border border-brand-200 rounded hover:bg-brand-100">+ Add Custom Input</button>
                            </div>

                            {/* Add New Size Form */}
                            <div className="grid grid-cols-12 gap-2 items-end bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs">
                                <div className="col-span-4">
                                    <label className="text-xs text-gray-500 mb-1 block">Name / Label</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. My Custom Size"
                                        value={sizeInput.name}
                                        onChange={(e) => setSizeInput({ ...sizeInput, name: e.target.value })}
                                        className="w-full text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Width</label>
                                    <input
                                        type="number"
                                        value={sizeInput.width || ''}
                                        onChange={(e) => setSizeInput({ ...sizeInput, width: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Height</label>
                                    <input
                                        type="number"
                                        value={sizeInput.height || ''}
                                        onChange={(e) => setSizeInput({ ...sizeInput, height: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                                    <CustomDropdown
                                        options={[
                                            { value: 'in', label: 'inch' },
                                            { value: 'ft', label: 'feet' },
                                            { value: 'mm', label: 'mm' },
                                            { value: 'cm', label: 'cm' },
                                            { value: 'm', label: 'meter' },
                                        ]}
                                        value={sizeInput.unit}
                                        onChange={(val: any) => setSizeInput({ ...sizeInput, unit: val })}
                                        className="h-[34px]"
                                    />
                                </div>
                                <div className="col-span-2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handleAddSize}
                                        className="w-full h-[34px] bg-brand-500 text-white rounded text-sm font-medium hover:bg-brand-600 flex items-center justify-center gap-1"
                                    >
                                        <span>+ Add</span>
                                    </button>
                                </div>
                            </div>

                            {/* Active Sizes List */}
                            {configuredSizes.length > 0 && (
                                <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-3 py-2">Label</th>
                                                <th className="px-3 py-2">Dimensions (Inch)</th>
                                                {formData.pricingEngine === "sqft" && <th className="px-3 py-2">Base Price/sqft</th>}
                                                <th className="px-3 py-2">Multiplier</th>
                                                <th className="px-3 py-2">Add-on (RM)</th>
                                                <th className="px-3 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {configuredSizes.map((size, idx) => (
                                                <tr key={size.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-300">
                                                        {size.name}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-500">
                                                        {size.widthInch > 0 ? `${size.widthInch.toFixed(2)}" × ${size.heightInch.toFixed(2)}"` : '-'}
                                                    </td>
                                                    {formData.pricingEngine === "sqft" && (
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-gray-400">RM</span>
                                                                <input
                                                                    type="number"
                                                                    value={size.basePrice || ''}
                                                                    placeholder={String(formData.basePricePerSqft)}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || undefined;
                                                                        const newSizes = [...configuredSizes];
                                                                        newSizes[idx].basePrice = val;
                                                                        setConfiguredSizes(newSizes);
                                                                    }}
                                                                    step={0.01}
                                                                    className="w-16 text-xs px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-transparent"
                                                                />
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={size.multiplier || 1}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 1;
                                                                const newSizes = [...configuredSizes];
                                                                newSizes[idx].multiplier = val;
                                                                setConfiguredSizes(newSizes);
                                                            }}
                                                            step={0.1}
                                                            className="w-16 text-xs px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-gray-400">+</span>
                                                            <input
                                                                type="number"
                                                                value={size.priceAddon || ''}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    const newSizes = [...configuredSizes];
                                                                    newSizes[idx].priceAddon = val;
                                                                    setConfiguredSizes(newSizes);
                                                                }}
                                                                className="w-16 text-xs px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-transparent"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSize(size.id)}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {configuredSizes.length === 0 && (
                                <p className="text-center text-sm text-gray-400 italic py-2">No sizes configured. Add a size above.</p>
                            )}

                        </div>
                    )}
                </div>


                {/* Dynamic Option Groups (Generic System) */}
                {
                    (formData.pricingEngine === "sqft" || formData.pricingEngine === "qty_fixed" || formData.pricingEngine === "apparel_multiline") && (
                        <div className="space-y-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <h4 className="text-base font-medium text-gray-800 dark:text-white mb-4">Product Options</h4>

                                <div className="space-y-6">
                                    {optionGroups.map((group, gIdx) => (
                                        <div key={group.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-3">
                                                <h5 className="text-sm font-semibold text-gray-900 dark:text-white">{group.name}</h5>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newGroups = [...optionGroups];
                                                        newGroups.splice(gIdx, 1);
                                                        setOptionGroups(newGroups);
                                                    }}
                                                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                                                >
                                                    Remove Group
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {group.options.map((opt, oIdx) => (
                                                    <div key={opt.id} className="flex gap-2 items-start bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                                        <div className="flex-grow grid grid-cols-12 gap-2">
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Option Name"
                                                                    value={opt.name}
                                                                    onChange={(e) => {
                                                                        const newGroups = [...optionGroups];
                                                                        newGroups[gIdx].options[oIdx].name = e.target.value;
                                                                        setOptionGroups(newGroups);
                                                                    }}
                                                                    className={`${inputClasses} h-8 text-xs py-1 px-2`}
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <CustomDropdown
                                                                    value={opt.pricingMode}
                                                                    onChange={(val) => {
                                                                        const newGroups = [...optionGroups];
                                                                        newGroups[gIdx].options[oIdx].pricingMode = val as 'x' | '+';
                                                                        setOptionGroups(newGroups);
                                                                    }}
                                                                    options={[
                                                                        { value: '+', label: '+' },
                                                                        { value: 'x', label: '×' }
                                                                    ]}
                                                                    className="h-8 w-full"
                                                                    buttonClassName="h-8 text-xs py-1 px-2"
                                                                />
                                                            </div>
                                                            <div className="col-span-3 relative">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Price"
                                                                    value={opt.priceValue}
                                                                    onChange={(e) => {
                                                                        const newGroups = [...optionGroups];
                                                                        newGroups[gIdx].options[oIdx].priceValue = parseFloat(e.target.value) || 0;
                                                                        setOptionGroups(newGroups);
                                                                    }}
                                                                    className={`${inputClasses} h-8 text-xs py-1 px-2`}
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                {opt.pricingMode === '+' && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <CustomDropdown
                                                                            value={opt.priceScope || 'unit'}
                                                                            onChange={(val) => {
                                                                                const newGroups = [...optionGroups];
                                                                                newGroups[gIdx].options[oIdx].priceScope = val as 'sqft' | 'unit';
                                                                                setOptionGroups(newGroups);
                                                                            }}
                                                                            options={[
                                                                                { value: 'sqft', label: '/sqft' },
                                                                                { value: 'unit', label: '/unit' }
                                                                            ]}
                                                                            className="h-8 w-full"
                                                                            buttonClassName="h-8 text-xs py-1 px-2"
                                                                        />
                                                                        {opt.priceScope === 'unit' && (
                                                                            <label className="flex items-center gap-1.5 cursor-pointer ml-1">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={!!opt.hasCustomQuantity}
                                                                                    onChange={(e) => {
                                                                                        const newGroups = [...optionGroups];
                                                                                        newGroups[gIdx].options[oIdx].hasCustomQuantity = e.target.checked;
                                                                                        setOptionGroups(newGroups);
                                                                                    }}
                                                                                    className="w-3 h-3 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                                                                                />
                                                                                <span className="text-[10px] text-gray-500">Var. Qty?</span>
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newGroups = [...optionGroups];
                                                                newGroups[gIdx].options.splice(oIdx, 1);
                                                                setOptionGroups(newGroups);
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 p-1"
                                                        >✕</button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newGroups = [...optionGroups];
                                                        newGroups[gIdx].options.push({
                                                            id: `opt-${Date.now()}-${Math.random()}`,
                                                            name: "",
                                                            pricingMode: '+',
                                                            priceValue: 0,
                                                            priceScope: 'unit',
                                                            hasCustomQuantity: false
                                                        });
                                                        setOptionGroups(newGroups);
                                                    }}
                                                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mt-2"
                                                >
                                                    + Add Option to {group.name}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Group Input */}
                                <div className="mt-6 flex gap-2 items-center bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                    <input
                                        type="text"
                                        id="new-group-name"
                                        placeholder="New Group Name (e.g. Turnaround Time)"
                                        className={`${inputClasses} h-9 text-sm w-full md:w-64`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if (val) {
                                                    setOptionGroups([...optionGroups, {
                                                        id: `grp-${Date.now()}`,
                                                        name: val,
                                                        options: []
                                                    }]);
                                                    e.currentTarget.value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById('new-group-name') as HTMLInputElement;
                                            const val = el.value.trim();
                                            if (val) {
                                                setOptionGroups([...optionGroups, {
                                                    id: `grp-${Date.now()}`,
                                                    name: val,
                                                    options: []
                                                }]);
                                                el.value = "";
                                            }
                                        }}
                                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Add Group
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Create custom groups for options. Each group can have its own set of choices.
                                </p>
                            </div>
                        </div>
                    )
                }

                {/* Volume Discount Configuration (Apparel Only) */}
                {formData.pricingEngine === "apparel_multiline" && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-medium text-gray-800 dark:text-white">Volume Discounts</h4>
                                <p className="text-sm text-gray-500">Apply percentage discounts based on total quantity.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enableVolumeDiscount}
                                    onChange={(e) => setEnableVolumeDiscount(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                            </label>
                        </div>

                        {enableVolumeDiscount && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                                {discountTiers.map((tier, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Min Qty:</span>
                                        <input
                                            type="number"
                                            min={1}
                                            value={tier.minQty}
                                            onChange={(e) => {
                                                const newTiers = [...discountTiers];
                                                newTiers[idx].minQty = parseInt(e.target.value) || 1;
                                                setDiscountTiers(newTiers);
                                            }}
                                            className={`${inputClasses} w-24 h-9 text-sm`}
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">→</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={tier.discount}
                                            onChange={(e) => {
                                                const newTiers = [...discountTiers];
                                                newTiers[idx].discount = parseInt(e.target.value) || 0;
                                                setDiscountTiers(newTiers);
                                            }}
                                            className={`${inputClasses} w-20 h-9 text-sm`}
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">% OFF</span>
                                        {discountTiers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setDiscountTiers(discountTiers.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-600 p-1"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setDiscountTiers([...discountTiers, { minQty: discountTiers[discountTiers.length - 1]?.minQty + 50 || 50, discount: 0 }])}
                                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                                >
                                    + Add Tier
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {
                    formData.pricingEngine === "qty_tier" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-800 dark:text-white">Quantity Tiers</h4>
                                    <p className="text-xs text-gray-500">Define price ranges (e.g., 100-299 pcs = RM0.50/pc)</p>
                                </div>
                                <div className="flex gap-2">
                                    {(activeTierVariantId && quantityTiers.filter(t => t.variantId === activeTierVariantId).length === 0) && (
                                        <button type="button" onClick={copyGlobalTiers} className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded hover:bg-brand-100">Copy Global Tiers</button>
                                    )}
                                    <button type="button" onClick={addTier} className="text-xs text-brand-500 hover:text-brand-600 font-medium">+ Add Tier</button>
                                </div>
                            </div>

                            {/* Variant Tabs */}
                            {enableSizeOptions && configuredSizes.length > 0 && (
                                <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTierVariantId(null)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTierVariantId === null
                                            ? "bg-gray-100 dark:bg-gray-700 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
                                            : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        Global (Default)
                                    </button>
                                    {configuredSizes.map(size => (
                                        <button
                                            key={size.id}
                                            type="button"
                                            onClick={() => setActiveTierVariantId(size.id)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTierVariantId === size.id
                                                ? "bg-gray-100 dark:bg-gray-700 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
                                                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            {size.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                                {quantityTiers.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)).map((tier, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <input type="number" value={tier.minQty} onChange={(e) => updateTier(index, "minQty", parseInt(e.target.value) || 0)} className="w-20 h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-center" min={1} />
                                            <span className="text-gray-400">-</span>
                                            <input type="number" value={tier.maxQty} onChange={(e) => updateTier(index, "maxQty", parseInt(e.target.value) || 0)} className="w-20 h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-center" min={1} />
                                            <span className="text-xs text-gray-500">pcs</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">=</span>
                                            <span className="text-xs text-gray-500">RM</span>
                                            <input type="number" value={tier.pricePerUnit} onChange={(e) => updateTier(index, "pricePerUnit", parseFloat(e.target.value) || 0)} className="w-24 h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm" min={0} step={0.01} />
                                            <span className="text-xs text-gray-500">/pc</span>
                                        </div>
                                        <div className="flex items-center justify-center w-6">
                                            <button type="button" onClick={() => removeTier(index)} className="text-error-500 hover:text-error-600 text-xs text-center">✕</button>
                                        </div>
                                    </div>
                                ))}
                                {quantityTiers.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)).length === 0 && (
                                    <p className="text-sm text-gray-400 italic text-center py-2">No tiers defined for this {activeTierVariantId ? "size" : "global"} configuration.</p>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* QTY FIXED Engine - Fixed Quantity Options */}
                {
                    formData.pricingEngine === "qty_fixed" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-800 dark:text-white">Fixed Quantity Options</h4>
                                    <p className="text-xs text-gray-500">Define exact quantities with total prices (e.g., 100pcs = RM20)</p>
                                </div>
                                <div className="flex gap-2">
                                    {(activeTierVariantId && fixedQuantities.filter(t => t.variantId === activeTierVariantId).length === 0) && (
                                        <button type="button" onClick={copyGlobalFixedQty} className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded hover:bg-brand-100">Copy Global Options</button>
                                    )}
                                    <button type="button" onClick={addFixedQty} className="text-xs text-brand-500 hover:text-brand-600 font-medium">+ Add Option</button>
                                </div>
                            </div>

                            {/* Variant Tabs (Reuse existing state 'activeTierVariantId') */}
                            {enableSizeOptions && configuredSizes.length > 0 && (
                                <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTierVariantId(null)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTierVariantId === null
                                            ? "bg-gray-100 dark:bg-gray-700 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
                                            : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        Global (Default)
                                    </button>
                                    {configuredSizes.map(size => (
                                        <button
                                            key={size.id}
                                            type="button"
                                            onClick={() => setActiveTierVariantId(size.id)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTierVariantId === size.id
                                                ? "bg-gray-100 dark:bg-gray-700 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
                                                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            {size.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                                {fixedQuantities.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)).map((opt, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={opt.qty} onChange={(e) => updateFixedQty(index, "qty", parseInt(e.target.value) || 0)} className="w-24 h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-center" min={1} />
                                            <span className="text-xs text-gray-500">pcs</span>
                                        </div>
                                        <span className="text-gray-400">=</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">RM</span>
                                            <input type="number" value={opt.pricePerUnit} onChange={(e) => updateFixedQty(index, "pricePerUnit", parseFloat(e.target.value) || 0)} className="w-24 h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm" min={0} step={0.01} />
                                            <span className="text-xs text-gray-500">per piece</span>
                                        </div>
                                        <div className="flex items-center justify-center w-6">
                                            <button type="button" onClick={() => removeFixedQty(index)} className="text-error-500 hover:text-error-600 text-xs text-center">✕</button>
                                        </div>
                                    </div>
                                ))}
                                {fixedQuantities.filter(t => (t.variantId === activeTierVariantId) || (!t.variantId && !activeTierVariantId)).length === 0 && (
                                    <p className="text-sm text-gray-400 italic text-center py-2">No fixed options defined for this {activeTierVariantId ? "size" : "global"} configuration.</p>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose} type="button" disabled={loading}>Cancel</Button>
                    <Button variant="primary" type="submit" loading={loading}>{isEditMode ? "Save Changes" : "Create Product"}</Button>
                </div>
            </form>
        </Modal >
    );
};

export default ProductFormModal;
