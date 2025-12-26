"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
    Product,
    SizeOption,
    MaterialOption,
    FinishingOption,
    calculatePrice,
    formatCurrency,
    PriceCalculation,
    standardSizes,
    calculateSqftEngine,
    calculateQtyTierEngine,
    calculateQtyFixedEngine,
    calculateApparelEngine,
    SqftEngineInput,
    QtyTierEngineInput,
    QtyFixedEngineInput,
    ApparelEngineInput,
    EnginePriceResult,
    PriceBreakdownItem,
    ProductOptionGroup,
    ProductOptionItem
} from "./productData";
import { useSettingsStore } from "../settings/settingsData";
import { TrashBinIcon as TrashIcon, PlusIcon } from "../../icons";
import CustomDropdown from "@/components/ui/dropdown/CustomDropdown";
import { useAgentContext } from "@/hooks/useAgentContext";

export interface VariantRow {
    id: string;
    size: SizeOption;
    // Map of Category ID -> Selected Item ID
    selectedOptions: Record<string, string>;
    quantity: number;
    isExpanded?: boolean;
}

export interface ProductConfiguration {
    selectedSize: SizeOption;
    selectedMaterial?: MaterialOption;
    selectedFinishing: FinishingOption[];
    quantity: number;
    customWidth?: number;
    customHeight?: number;
    selectedDeptOptions: Record<string, string>;
    variantRows?: VariantRow[]; // For apparel
}

interface PriceCalculatorProps {
    product: Product;
    onPriceCalculated?: (calculation: PriceCalculation) => void;
    onConfigurationChange?: (config: ProductConfiguration) => void;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({
    product,
    onPriceCalculated,
    onConfigurationChange,
}) => {
    // Access department settings
    const { departments } = useSettingsStore();
    const department = departments.find(d => d.id === product.departmentId) ||
        departments.find(d => d.pricingLogicId === (product.pricingType === 'apparel' ? 'pl-apparel' : product.pricingType === 'quantity' ? 'pl-quantity' : 'pl-sqft'));

    const isApparel = product.pricingEngine === "apparel_multiline" ||
        product.pricingType === "apparel" ||
        product.departmentId === "apparel" ||
        product.departmentId === "sublimation" ||
        product.departmentId === "dtf-shirt" ||
        product.category === "Apparel" ||
        product.category === "DTF Shirt";

    // DEBUG
    console.log('[PriceCalculator] Product:', product.name, 'pricingEngine:', product.pricingEngine, 'isApparel:', isApparel, 'hasSizes:', product.availableSizes?.length, 'hasOptions:', product.optionGroups?.length);

    // --- State for Standard Mode ---
    const [selectedSize, setSelectedSize] = useState<SizeOption>(() => {
        if (product.availableSizes && product.availableSizes.length > 0) {
            return product.availableSizes[0];
        }
        return {
            id: 'standard',
            name: 'Standard',
            widthInch: 0,
            heightInch: 0,
            multiplier: 1.0,
            priceAddon: 0
        };
    });

    const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | undefined>(product.availableMaterials?.[0]);
    const [selectedFinishing, setSelectedFinishing] = useState<FinishingOption[]>([]);
    const [quantity, setQuantity] = useState(product.minQuantity);
    const [customWidth, setCustomWidth] = useState<number>(12);
    const [customHeight, setCustomHeight] = useState<number>(12);

    // For Generic/Quantity items (not apparel grid) that might have department options
    const [selectedDeptOptions, setSelectedDeptOptions] = useState<Record<string, string>>({});

    // --- State for Apparel Grid Mode ---
    const [variantRows, setVariantRows] = useState<VariantRow[]>([
        { id: "1", size: (product.availableSizes && product.availableSizes[0]) || standardSizes[0], selectedOptions: {}, quantity: product.minQuantity, isExpanded: true }
    ]);

    // Initialize default options
    useEffect(() => {
        if (department) {
            const defaults: Record<string, string> = {};
            department.optionCategories.forEach(cat => {
                if (cat.items.length > 0) {
                    defaults[cat.id] = cat.items[0].id;
                }
            });
            // Set for standard mode
            setSelectedDeptOptions(defaults);
            // Set for initial grid row
            setVariantRows(prev => prev.map(r => ({ ...r, selectedOptions: defaults })));
        }
    }, [department]);

    // --- State for Generic Option Groups ---
    const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductOptionItem>>({});
    const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});

    const [finishingQuantity, setFinishingQuantity] = useState<number>(1); // Legacy for single finishing state (can remove if fully migrated, but keeping for safety)

    // Update size if product changes
    useEffect(() => {
        if (product.availableSizes && product.availableSizes.length > 0) {
            setSelectedSize(product.availableSizes[0]);
        } else {
            setSelectedSize({
                id: 'standard',
                name: 'Standard',
                widthInch: 0,
                heightInch: 0,
                multiplier: 1.0,
                priceAddon: 0
            });
        }
        setQuantity(product.minQuantity);
        setSelectedFinishing([]);
        setFinishingQuantity(1); // Reset Qty
        // Reset material default if available
        if (product.availableMaterials && product.availableMaterials.length > 0) {
            setSelectedMaterial(product.availableMaterials[0]);
        }

        // Initialize Option Groups
        if (product.optionGroups && product.optionGroups.length > 0) {
            const defaults: Record<string, ProductOptionItem> = {};
            const qtys: Record<string, number> = {};
            product.optionGroups.forEach(group => {
                if (group.options.length > 0) {
                    defaults[group.name] = group.options[0]; // Select first option by default
                    qtys[group.options[0].id] = 1;
                }
            });
            setSelectedOptions(defaults);
            setOptionQuantities(qtys);
        } else {
            setSelectedOptions({});
            setOptionQuantities({});
        }
    }, [product]);

    // Reset quantity when finishing option changes
    useEffect(() => {
        setFinishingQuantity(1);
    }, [selectedFinishing]);

    // Calculate Price
    const engineCalculation = useMemo(() => {
        // Collect extra costs from selected Department Options
        const extraCosts: { name: string; costPerSqft?: number; flatCost?: number; costPerUnit?: number }[] = [];

        // Only include department options if product does NOT have dynamic optionGroups
        if (department && (!product.optionGroups || product.optionGroups.length === 0)) {
            Object.entries(selectedDeptOptions).forEach(([catId, itemId]) => {
                const cat = department.optionCategories.find(c => c.id === catId);
                const item = cat?.items.find(i => i.id === itemId);
                if (item && item.price > 0) {
                    // Check price type
                    if ((item as any).priceType === 'perSqft') {
                        extraCosts.push({ name: item.name, costPerSqft: item.price });
                    } else if ((item as any).priceType === 'perUnit') {
                        extraCosts.push({ name: item.name, costPerUnit: item.price });
                    } else {
                        // Default to flatCost (might be per-unit or global depending on engine)
                        extraCosts.push({ name: item.name, flatCost: item.price });
                    }
                }
            });
        }

        const combinedFinishing: { name: string; costPerSqft?: number; flatCost?: number; costPerUnit?: number }[] = [
            // Only include department extraCosts - dynamic options are handled separately below
            ...extraCosts
        ];

        // Branch based on engine
        // Branch based on engine
        if (product.pricingEngine === 'sqft') {
            // 1. Determine Base Price Per Sqft
            // Use Size-specific base price if available, otherwise global product base price
            let effectiveBasePrice = (selectedSize.basePrice !== undefined && selectedSize.basePrice !== null)
                ? selectedSize.basePrice
                : (product.basePricePerSqft || 0);

            // 2. Generic Option Groups Calculation
            let materialCostSqft = 0;

            // Handle Legacy Global Material (if available)
            if (selectedMaterial) {
                const mat = selectedMaterial;
                if (mat.multiplier) effectiveBasePrice *= mat.multiplier;
                if (mat.pricePerSqft) materialCostSqft += mat.pricePerSqft;
            }

            // Handle New Dynamic Options
            Object.keys(selectedOptions).forEach(groupName => {
                const opt = selectedOptions[groupName];
                const qty = (opt.hasCustomQuantity && optionQuantities[opt.id]) ? optionQuantities[opt.id] : 1;

                if (opt.pricingMode === 'x') {
                    effectiveBasePrice *= (opt.priceValue || 1);
                } else if (opt.pricingMode === '+') {
                    const price = (opt.priceValue || 0);
                    const totalCost = price * qty;

                    if (opt.priceScope === 'sqft') {
                        combinedFinishing.push({
                            name: `${groupName}: ${opt.name}`,
                            costPerSqft: totalCost
                        });
                    } else {
                        combinedFinishing.push({
                            name: `${groupName}: ${opt.name}`,
                            costPerUnit: totalCost
                        });
                    }
                }
            });

            return calculateSqftEngine({
                widthInch: selectedSize.id === 'custom' ? customWidth : selectedSize.widthInch,
                heightInch: selectedSize.id === 'custom' ? customHeight : selectedSize.heightInch,
                basePricePerSqft: effectiveBasePrice,
                materialCostPerSqft: materialCostSqft,
                // For Sqft engine, flatCost is added to unit price, so it acts as per-unit
                finishingCosts: combinedFinishing.map(c => ({
                    ...c,
                    flatCost: (c.flatCost || 0) + (c.costPerUnit || 0) // Merge perUnit into flatCost for this engine
                })),
                quantity,
                minimumPrice: product.minimumPrice
            });
        }

        if (product.pricingEngine === 'qty_tier') {
            const allTiers = product.pricingTiers || [];
            // Check for size-specific tiers
            const sizeSpecificTiers = allTiers.filter(t => t.variantId === selectedSize.id);
            const useSpecific = sizeSpecificTiers.length > 0;
            const effectiveTiers = useSpecific ? sizeSpecificTiers : allTiers.filter(t => !t.variantId);

            return calculateQtyTierEngine({
                quantity,
                pricingTiers: effectiveTiers,
                materialCostPerUnit: 0,
                finishingCosts: combinedFinishing,
                // If using specific tiers, we assume the price is already tailored for the size, so ignore multiplier/addon
                sizeMultiplier: useSpecific ? 1 : selectedSize.multiplier,
                sizePriceAddon: useSpecific ? 0 : selectedSize.priceAddon
            });
        }

        if (product.pricingEngine === 'qty_fixed') {
            const allFixed = product.fixedQuantities || [];
            // Check for size-specific options
            const sizeSpecificFixed = allFixed.filter(fq => fq.variantId === selectedSize.id);
            const useSpecific = sizeSpecificFixed.length > 0;
            const effectiveFixed = useSpecific ? sizeSpecificFixed : allFixed.filter(fq => !fq.variantId);

            // Get base unit price (database stores TOTAL price, divide by qty to get per-unit)
            const matchedFixed = effectiveFixed.find(q => q.quantity === quantity);
            let unitPrice = matchedFixed ? (matchedFixed.price / matchedFixed.quantity) : (product.unitPrice || 0);

            // DEBUG
            console.log('[QTY_FIXED DEBUG]', {
                productName: product.name,
                selectedQuantity: quantity,
                effectiveFixed,
                matchedFixed,
                unitPrice,
                selectedOptions,
                optionGroups: product.optionGroups
            });

            // Apply Dynamic Option Groups for qty_fixed
            Object.keys(selectedOptions).forEach(groupName => {
                const opt = selectedOptions[groupName];
                const qty = (opt.hasCustomQuantity && optionQuantities[opt.id]) ? optionQuantities[opt.id] : 1;

                console.log('[QTY_FIXED OPTION]', { groupName, opt, pricingMode: opt.pricingMode, priceValue: opt.priceValue, qty });

                if (opt.pricingMode === 'x') {
                    unitPrice *= (opt.priceValue || 1);
                } else if (opt.pricingMode === '+') {
                    const price = (opt.priceValue || 0);
                    const totalCost = price * qty;
                    combinedFinishing.push({
                        name: `${groupName}: ${opt.name}`,
                        costPerUnit: totalCost
                    });
                }
            });

            return calculateQtyFixedEngine({
                unitPrice,
                quantity,
                finishingCosts: combinedFinishing,
                sizeMultiplier: useSpecific ? 1 : selectedSize.multiplier,
                sizePriceAddon: useSpecific ? 0 : selectedSize.priceAddon,
                sizeName: selectedSize.name
            });
        }

        // Fallback / Legacy logic
        // Use generic structure to match EnginePriceResult
        const legacy = calculatePrice(
            product,
            selectedSize,
            selectedMaterial || { id: 'std', name: 'Standard', description: '', pricePerSqft: 0, multiplier: 1 } as MaterialOption,
            selectedFinishing,
            quantity,
            customWidth,
            customHeight
        );

        return {
            engine: "apparel_multiline", // or 'legacy'
            unitPrice: legacy.unitPrice,
            totalPrice: legacy.totalPrice,
            quantity: legacy.quantity,
            breakdown: legacy.breakdown,
            materialCost: (legacy.materialMultiplier * legacy.basePrice * legacy.sizeMultiplier) - legacy.basePrice, // Approx
            finishingCost: legacy.finishingAddons
        };

    }, [product, selectedSize, selectedMaterial, selectedFinishing, quantity, customWidth, customHeight, selectedDeptOptions, department, selectedOptions, optionQuantities]);


    const apparelCalculation = useMemo(() => {
        // 1. Total Quantity
        const totalQty = variantRows.reduce((acc, row) => acc + row.quantity, 0);

        // 2. Find Discount %
        let discountPercent = 0;
        if (product.quantityTiers && product.quantityTiers.length > 0) {
            for (const tier of product.quantityTiers) {
                if (totalQty >= tier.minQty && (tier.maxQty === null || totalQty <= tier.maxQty)) {
                    discountPercent = tier.discount;
                    break;
                }
            }
        }

        // 3. Calculate each row
        const rowsWithPrice = variantRows.map(row => {
            let rowBase = product.basePrice;

            // Add Size Multiplier (if applicable) or Size Add-on?
            // "Apparel" usually flat price per shirt, usually size XL+ has surcharge.
            // standardSizes use "multiplier". Let's assume size multiplier applies to base.
            // Add Size Multiplier (if applicable) OR Size Add-on
            // Legacy: Multiplier
            let sizeCost = rowBase * (row.size.multiplier - 1);

            // New: Price Add-on
            if (row.size.priceAddon) {
                sizeCost += row.size.priceAddon;
            }

            // Add Option Costs from Department (Legacy)
            let optionsCost = 0;
            if (department && (!product.optionGroups || product.optionGroups.length === 0)) {
                Object.entries(row.selectedOptions).forEach(([catId, itemId]) => {
                    const cat = department.optionCategories.find(c => c.id === catId);
                    const item = cat?.items.find(i => i.id === itemId);
                    if (item) optionsCost += item.price;
                });
            }

            // Add Option Costs from Product Option Groups (NEW)
            if (product.optionGroups && product.optionGroups.length > 0) {
                Object.entries(row.selectedOptions).forEach(([groupName, optionId]) => {
                    const group = product.optionGroups?.find(g => g.name === groupName);
                    const selectedOpt = group?.options.find(o => o.id === optionId);
                    if (selectedOpt) {
                        const priceMode = selectedOpt.pricingMode || '+';
                        const priceValue = selectedOpt.priceValue || 0;

                        if (priceMode === '+') {
                            optionsCost += priceValue;
                        } else if (priceMode === 'x') {
                            // Multiplier applies to base price
                            optionsCost += rowBase * (priceValue - 1);
                        }
                    }
                });
            }

            const unitPrice = rowBase + sizeCost + optionsCost;
            const discountAmount = unitPrice * (discountPercent / 100);
            const finalUnit = unitPrice - discountAmount;

            return {
                ...row,
                unitPriceNoDiscount: unitPrice,
                discountAmount,
                finalUnit,
                rowTotal: finalUnit * row.quantity
            };
        });

        const grandTotal = rowsWithPrice.reduce((acc, r) => acc + r.rowTotal, 0);

        return {
            totalQty, // Total quantity
            discountPercent,
            rows: rowsWithPrice,
            totalPrice: grandTotal,
            // Mock matching PriceCalculation interface partially
            basePrice: product.basePrice,
            sizeMultiplier: 1,
            materialMultiplier: 1,
            subtotal: grandTotal,
            finishingAddons: 0,
            quantityDiscount: 0,
            unitPrice: grandTotal / (totalQty || 1),
            quantity: totalQty,
            breakdown: []
        };
    }, [variantRows, product, department]);


    // --- Derived State: Filtered Quantity Options ---
    const availableQtyOptions = useMemo(() => {
        if (product.pricingEngine === 'qty_tier' && product.pricingTiers) {
            const allTiers = product.pricingTiers;
            const sizeSpecificTiers = allTiers.filter(t => t.variantId === selectedSize.id);
            // Use specific tiers if they exist, otherwise fallback to global (null variantId)
            const effectiveTiers = sizeSpecificTiers.length > 0
                ? sizeSpecificTiers
                : allTiers.filter(t => !t.variantId);

            return effectiveTiers
                .sort((a, b) => a.minQty - b.minQty)
                .map(tier => ({
                    value: tier.minQty.toString(),
                    label: `${tier.minQty}${tier.maxQty ? ` - ${tier.maxQty}` : '+'} pcs`
                }))
                .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
        }

        if (product.pricingEngine === 'qty_fixed' && product.fixedQuantities) {
            const allFixed = product.fixedQuantities;
            const sizeSpecificFixed = allFixed.filter(t => t.variantId === selectedSize.id);
            const effectiveFixed = sizeSpecificFixed.length > 0
                ? sizeSpecificFixed
                : allFixed.filter(t => !t.variantId);

            return effectiveFixed
                .sort((a, b) => a.quantity - b.quantity)
                .map(fq => ({
                    value: fq.quantity.toString(),
                    // Note: We display the base price here. The actual calculated price (with multipliers) 
                    // is shown in the summary. Alternatively, we could calculate the display price here.
                    label: `${fq.quantity} pcs` // simplified label to avoid confusion if multiplier applies
                    // label: `${fq.quantity} pcs - ${formatCurrency(fq.price)}` // Original label
                }))
                .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
        }

        return [];
    }, [product.pricingEngine, product.pricingTiers, product.fixedQuantities, selectedSize.id]);


    useEffect(() => {
        const config: ProductConfiguration = {
            selectedSize,
            selectedMaterial,
            selectedFinishing,
            quantity,
            customWidth,
            customHeight,
            selectedDeptOptions,
            variantRows: isApparel ? variantRows : undefined
        };

        if (onPriceCalculated) {
            // @ts-ignore - mismatch in apparel structure vs standard
            onPriceCalculated(isApparel ? apparelCalculation : engineCalculation);
        }

        if (onConfigurationChange) {
            onConfigurationChange(config);
        }
    }, [engineCalculation, apparelCalculation, onPriceCalculated, isApparel, onConfigurationChange, selectedSize, selectedMaterial, selectedFinishing, quantity, customWidth, customHeight, selectedDeptOptions, variantRows, selectedOptions, optionQuantities]);


    // --- Handlers for Apparel Grid ---
    const addRow = () => {
        const firstRow = variantRows[0];
        if (!firstRow) return;
        // Collapse all existing rows to focus on new one
        const collapsedRows = variantRows.map(r => ({ ...r, isExpanded: false }));
        setVariantRows([...collapsedRows, { ...firstRow, id: Math.random().toString(), quantity: 0, isExpanded: true, selectedOptions: {} }]);
    };

    const toggleRow = (id: string) => {
        setVariantRows(variantRows.map(r => r.id === id ? { ...r, isExpanded: !r.isExpanded } : r));
    };

    const removeRow = (id: string) => {
        if (variantRows.length <= 1) return;
        setVariantRows(variantRows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, updates: Partial<VariantRow>) => {
        setVariantRows(variantRows.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const updateRowOption = (rowId: string, catId: string, itemId: string) => {
        const row = variantRows.find(r => r.id === rowId);
        if (row) {
            updateRow(rowId, {
                selectedOptions: { ...row.selectedOptions, [catId]: itemId }
            });
        }
    };

    const getRowSummary = (row: VariantRow) => {
        const sizeName = row.size.name;
        // Count selected options
        const optCount = Object.keys(row.selectedOptions).length;
        return `${sizeName} • ${row.quantity} units ${optCount > 0 ? `• ${optCount} options` : ''}`;
    };


    const inputClasses =
        "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";


    // ==========================================
    // RENDER: APPAREL GRID
    // ==========================================
    if (isApparel) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Apparel Order Builder</h3>
                    <p className="text-sm text-gray-500">Add multiple variants with different sizes and options.</p>
                </div>

                <div className="p-4 space-y-4">
                    {variantRows.map((row, idx) => (
                        <div key={row.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {/* Header / Summary */}
                            <div
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleRow(row.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold">
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {getRowSummary(row)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Chevron */}
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        className={`text-gray-400 transition-transform ${row.isExpanded ? 'rotate-180' : ''}`}
                                    >
                                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {row.isExpanded && (
                                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                                    {/* Horizontal inline layout */}
                                    <div className="flex flex-wrap items-end gap-3">
                                        {/* Size */}
                                        <div className="flex-1 min-w-[100px] max-w-[140px]">
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Size</label>
                                            <CustomDropdown
                                                options={(product.availableSizes || []).map(s => ({
                                                    value: s.id,
                                                    label: s.name
                                                }))}
                                                value={row.size.id}
                                                onChange={(val: string) => {
                                                    const s = (product.availableSizes || []).find(az => az.id === val);
                                                    if (s) updateRow(row.id, { size: s });
                                                }}
                                                placeholder="Size"
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Dynamic Options from Product Option Groups (NEW) */}
                                        {product.optionGroups && product.optionGroups.map(group => (
                                            <div key={group.id} className="flex-1 min-w-[120px] max-w-[180px]">
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">{group.name}</label>
                                                <CustomDropdown
                                                    options={group.options.map(opt => ({
                                                        value: opt.id,
                                                        label: opt.name
                                                    }))}
                                                    value={row.selectedOptions[group.name] || group.options[0]?.id || ""}
                                                    onChange={(val: string) => updateRowOption(row.id, group.name, val)}
                                                    placeholder={group.name}
                                                    className="w-full"
                                                />
                                            </div>
                                        ))}

                                        {/* Legacy Dynamic Options from Department (ONLY if no optionGroups) */}
                                        {(!product.optionGroups || product.optionGroups.length === 0) && department?.optionCategories.map(cat => (
                                            <div key={cat.id} className="flex-1 min-w-[120px] max-w-[180px]">
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">{cat.name}</label>
                                                <CustomDropdown
                                                    options={cat.items.map(item => ({
                                                        value: item.id,
                                                        label: item.name
                                                    }))}
                                                    value={row.selectedOptions[cat.id] || ""}
                                                    onChange={(val: string) => updateRowOption(row.id, cat.id, val)}
                                                    placeholder={cat.name}
                                                    className="w-full"
                                                />
                                            </div>
                                        ))}

                                        {/* Quantity */}
                                        <div className="w-[70px] flex-shrink-0">
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className={`${inputClasses} text-center`}
                                                value={row.quantity}
                                                onChange={(e) => updateRow(row.id, { quantity: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>

                                        {/* Remove */}
                                        {variantRows.length > 1 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                                                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Remove variant"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={addRow}
                        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" /> Add Variant
                    </button>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Total Quantity</span>
                        <span className="font-bold text-gray-900 dark:text-white">{apparelCalculation.totalQty} units</span>
                    </div>

                    {apparelCalculation.discountPercent > 0 && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Volume Discount</span>
                            <span className="font-bold text-success-600">{apparelCalculation.discountPercent}% OFF</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-lg font-medium text-gray-800 dark:text-white">Total Price</span>
                        <span className="text-2xl font-bold text-brand-600">{formatCurrency(apparelCalculation.totalPrice)}</span>
                    </div>
                </div>

            </div>
        );
    }


    // ==========================================
    // RENDER: STANDARD CALCULATOR (Sqft / Generic Quantity)
    // ==========================================

    // --- Agent Pricing Logic ---
    const { agent, loading: agentLoading } = useAgentContext();

    // "Excard Model" Logic
    const isWholesaleUnlocked = useMemo(() => {
        // --- WHOLESALE DISCOUNT DISABLED ---
        // To re-enable, change `return false;` to the original logic below:
        // if (!agent || agent.role !== 'agent') return false;
        // if (agent.agentStatus === 'active') return true;
        // if (agent.walletBalance >= 100) return true;
        // return false;
        return false; // Always disabled
    }, [agent]);

    const showPriceBlur = agent?.role === 'agent' && !isWholesaleUnlocked;

    // Apply Discount if Wholesale is Unlocked
    const discountPercent = (isWholesaleUnlocked && agent?.pricingSettings?.discountPercent)
        ? agent.pricingSettings.discountPercent
        : 0;

    // Helper to apply discount
    const applyAgentDiscount = (price: number) => {
        return price * (1 - discountPercent / 100);
    };

    // ... (rest of the component logic)

    // We need to wrap the return render to inject the Blur/Alert
    // Since this component is huge, inserting logic into the existing JSX is complex via replace.
    // I will use a clever strategy: Intercept the `engineCalculation` result and wrap the DISPLAY logic.

    // BUT the prompt asks for "Banner: Top up RM 1,000 to unlock...".

    // Let's modify the return block.
    // I'll grab the `Price Summary` section (lines 608-635) and inject logic there.


    // --- Price Summary (Modified) ---
    // If showPriceBlur -> Show Standard Price (no discount) + Alert
    // If isWholesaleUnlocked -> Show Discounted Price (Green)

    const displayUnitPrice = isWholesaleUnlocked ? applyAgentDiscount(engineCalculation.unitPrice) : engineCalculation.unitPrice;
    const displayTotalPrice = isWholesaleUnlocked ? applyAgentDiscount(engineCalculation.totalPrice) : engineCalculation.totalPrice;


    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">

            {/* AGENT LOCKED OVERLAY / BANNER - Disabled for now */}
            {false && showPriceBlur && (
                <div className="bg-orange-50 border-b border-orange-100 p-3 flex items-start gap-3">
                    <div className="text-orange-500 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5Z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-orange-800">Agent Pricing Locked</p>
                        <p className="text-xs text-orange-700 mt-1">
                            Your wallet balance is low ({formatCurrency(agent?.walletBalance || 0)}). <br />
                            <a href="/dashboard/wallet" className="underline font-semibold hover:text-orange-900">Top up RM 100</a> to unlock wholesale rates (Save {agent?.pricingSettings?.discountPercent || 20}%).
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Price Calculator
                    {isWholesaleUnlocked && (
                        <span className="ml-2 text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full inline-block align-middle">
                            Wholeasle Active ({agent?.pricingSettings?.discountPercent}% OFF)
                        </span>
                    )}
                </h3>
            </div>

            {/* Scrollable Configuration Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Size Selection - Only show if sizes exist */}
                {(product.availableSizes && product.availableSizes.length > 0) && (
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className={labelClasses}>Size</label>
                            {selectedSize.id === 'custom' && (
                                <span className="text-xs text-blue-600 font-medium">Custom Dimensions</span>
                            )}
                        </div>
                        <CustomDropdown
                            options={(product.availableSizes || []).map((size) => ({
                                value: size.id,
                                label: size.name
                            }))}
                            value={selectedSize.id}
                            onChange={(val) => {
                                const size = product.availableSizes.find((s) => s.id === val);
                                if (size) setSelectedSize(size);
                            }}
                            placeholder="Select Size"
                            className="w-full"
                        />
                    </div>
                )}

                {/* Custom Size Inputs */}
                {selectedSize.id === "custom" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClasses}>Width (inch)</label>
                            <input
                                type="number"
                                value={customWidth}
                                onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 0)}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Height (inch)</label>
                            <input
                                type="number"
                                value={customHeight}
                                onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 0)}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                )}

                {/* Dynamic Options from Department */}
                {/* Dynamic Options from Department (LEGACY/NON-SQFT) */}
                {(!product.optionGroups || product.optionGroups.length === 0) && (!product.productMaterials || product.productMaterials.length === 0) && department?.optionCategories.map(cat => {
                    // Filter items by what the admin has enabled in `product.selectedOptions`
                    const enabledItemIds = (product as any).selectedOptions?.[cat.id] as string[] | undefined;
                    const availableItems = enabledItemIds && enabledItemIds.length > 0
                        ? cat.items.filter(item => enabledItemIds.includes(item.id))
                        : cat.items; // Fallback: show all if nothing is configured

                    if (availableItems.length === 0) return null;

                    return (
                        <div key={cat.id}>
                            <label className={labelClasses}>{cat.name}</label>
                            <CustomDropdown
                                options={availableItems.map(item => ({
                                    value: item.id,
                                    label: item.name
                                }))}
                                value={selectedDeptOptions[cat.id] || ""}
                                onChange={(val: string) => setSelectedDeptOptions({ ...selectedDeptOptions, [cat.id]: val })}
                                placeholder={`Select ${cat.name}`}
                                className="w-full"
                            />
                        </div>
                    );
                })}

                {/* Dynamic Option Groups Render */}
                {product.optionGroups && product.optionGroups.map(group => {
                    // Find currently selected option for this group
                    const selectedOpt = selectedOptions[group.name];
                    return (
                        <div key={group.id}>
                            <label className={labelClasses}>{group.name}</label>
                            <div className="flex gap-2">
                                <div className="flex-grow">
                                    <CustomDropdown
                                        options={group.options.map(opt => ({
                                            value: opt.id,
                                            label: opt.name
                                        }))}
                                        value={selectedOpt?.id || ""}
                                        onChange={(val: string) => {
                                            const opt = group.options.find(o => o.id === val);
                                            if (opt) {
                                                setSelectedOptions(prev => ({ ...prev, [group.name]: opt }));
                                                // Initialize quantity if needed
                                                setOptionQuantities(prev => ({ ...prev, [opt.id]: prev[opt.id] || 1 }));
                                            }
                                        }}
                                        placeholder={`Select ${group.name}`}
                                        className="w-full"
                                    />
                                </div>
                                {selectedOpt?.hasCustomQuantity && (
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            min="1"
                                            value={optionQuantities[selectedOpt.id] || 1}
                                            onChange={(e) => {
                                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                                setOptionQuantities(prev => ({ ...prev, [selectedOpt.id]: val }));
                                            }}
                                            placeholder="Qty"
                                            className={inputClasses}
                                            title="Custom Quantity"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Quantity */}
                <div>
                    <label className={labelClasses}>Quantity</label>
                    {(product.pricingEngine === 'qty_tier' && availableQtyOptions.length > 0) ? (
                        <CustomDropdown
                            options={availableQtyOptions}
                            value={quantity.toString()}
                            onChange={(val: string) => setQuantity(parseInt(val) || product.minQuantity)}
                            placeholder="Select Quantity"
                            className="w-full"
                        />
                    ) : (product.pricingEngine === 'qty_fixed' && availableQtyOptions.length > 0) ? (
                        <CustomDropdown
                            options={availableQtyOptions}
                            value={quantity.toString()}
                            onChange={(val: string) => setQuantity(parseInt(val) || product.minQuantity)}
                            placeholder="Select Quantity"
                            className="w-full"
                        />
                    ) : (
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(product.minQuantity, parseInt(e.target.value) || 0))}
                            min={product.minQuantity}
                            className={inputClasses}
                        />
                    )}
                </div>
            </div>

            {/* Price Summary */}
            <div className={`p-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl transition-colors ${isWholesaleUnlocked ? 'bg-success-50/50 dark:bg-success-900/10' : 'bg-gray-50 dark:bg-gray-900'}`}>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Unit Price</span>
                    <div className="text-right">
                        {isWholesaleUnlocked && (
                            <span className="text-xs text-gray-400 line-through mr-2">{formatCurrency(engineCalculation.unitPrice)}</span>
                        )}
                        <span className={`font-medium ${isWholesaleUnlocked ? 'text-success-700 dark:text-success-400' : 'text-gray-800 dark:text-white'}`}>
                            {formatCurrency(displayUnitPrice)}
                        </span>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
                    <div className="text-right">
                        {isWholesaleUnlocked && (
                            <span className="text-sm text-gray-400 line-through mr-2 block">{formatCurrency(engineCalculation.totalPrice)}</span>
                        )}
                        <span className={`text-2xl font-bold ${isWholesaleUnlocked ? 'text-success-600' : 'text-brand-500'}`}>
                            {formatCurrency(displayTotalPrice)}
                        </span>
                    </div>
                </div>
                {/* Breakdown */}
                {engineCalculation.breakdown.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Price Breakdown</p>
                        <ul className="space-y-1">
                            {engineCalculation.breakdown.map((item, idx) => (
                                <li key={idx} className={`flex justify-between text-xs ${item.type === 'info' ? 'text-gray-500 dark:text-gray-500 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                    <span>{item.label}</span>
                                    {item.type !== 'info' && (
                                        <span className={item.type === 'discount' ? 'text-success-600' : ''}>
                                            {item.type === 'multiply' ? `×${item.value.toFixed(2)}` : formatCurrency(item.value)}
                                        </span>
                                    )}
                                </li>
                            ))}
                            {isWholesaleUnlocked && (
                                <li className="flex justify-between text-xs text-success-600 font-medium">
                                    <span>Wholesale Discount ({discountPercent}%)</span>
                                    <span>- {formatCurrency(engineCalculation.totalPrice - displayTotalPrice)}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceCalculator;
