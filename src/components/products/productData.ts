// =====================
// PRODUCT TYPES & DATA
// =====================

export type ProductCategory =
    | "Banners"
    | "Business Cards"
    | "Flyers"
    | "Stickers"
    | "Signage"
    | "Posters"
    | "Packaging"
    | "Apparel"
    | "Solvent / Eco-Solvent"
    | "UV Flatbed"
    | "Digital Cutting & CNC"
    | "Fabrication / Metalworks"
    | "Offset Machine"
    | "Sublimation"
    | "DTF Shirt"
    | "Display"
    | "Print";

// Pricing Engine Types (from user spec)
export type PricingEngine = "sqft" | "qty_tier" | "qty_fixed" | "apparel_multiline";

// Pricing Tier for QTY_TIER engine (new structure)
export interface PricingTier {
    id: string;
    variantId?: string | null; // Optional: Link to specific SizeOption.id
    minQty: number;
    maxQty?: number;
    price: number; // Price for this tier
}

// QTY Fixed Engine Fields
export interface FixedQuantity {
    id: string;
    variantId?: string | null; // Optional: Link to specific SizeOption.id
    quantity: number;
    price: number;
}

export interface Product {
    id: string;
    name: string;
    slug?: string; // URL-friendly name (optional for backward compat)
    category: ProductCategory;
    departmentId: string; // Link to Department
    description: string;

    // Pricing Engine Selection (new - optional for backward compat)
    pricingEngine?: PricingEngine;

    // SQFT Engine Fields
    basePricePerSqft?: number;
    minimumPrice?: number;
    blockSize?: number; // Optional block sizing

    // QTY Tier Engine Fields (new structure)
    pricingTiers?: PricingTier[];

    // QTY Fixed Engine Fields
    unitPrice?: number;
    bulkDiscount?: number; // Percentage discount for bulk
    fixedQuantities?: FixedQuantity[];

    // Legacy fields (for compatibility)
    basePrice: number;
    pricingType: "fixed" | "sqft" | "quantity" | "apparel"; // Legacy - use pricingEngine
    availableSizes: SizeOption[];
    availableMaterials: MaterialOption[];
    availableFinishing: FinishingOption[];
    quantityTiers: LegacyQuantityTier[]; // Backward compat - use legacy type

    // Dynamic Option Groups (New Generic System)
    optionGroups?: ProductOptionGroup[];

    // Legacy / Specific Fields (to be phased out or migrated)
    productMaterials?: any[]; // Keeping as any to prevent instant break, but should be removed
    productFinishing?: any[]; // Keeping as any to prevent instant break, but should be removed

    // Common fields
    minQuantity: number;
    maxQuantity?: number;
    leadTimeDays: number;
    isActive: boolean;
    trackStock?: boolean;
    stock?: number;
    images: string[];
    tags: string[];
    availableColors?: ColorOption[];
    availableCollars?: CollarOption[];
    availableSleeves?: SleeveOption[];
    hasSizeOptions?: boolean;
    createdDate: string;
}

export interface ColorOption {
    id: string;
    name: string;
    hex: string;
    priceAddon?: number;
}

// =====================
// SIZE OPTIONS
// =====================

export interface SizeOption {
    id: string;
    name: string;
    widthInch: number;
    heightInch: number;
    multiplier: number;       // Price multiplier based on size (Used generically)
    priceAddon?: number;      // Specific add-on price (e.g., +RM5)
    basePrice?: number;       // NEW: Base price per sqft for this specific size
}

export const standardSizes: SizeOption[] = [
    { id: "a5", name: "A5 (5.8\" × 8.3\")", widthInch: 5.8, heightInch: 8.3, multiplier: 0.5 },
    { id: "a4", name: "A4 (8.3\" × 11.7\")", widthInch: 8.3, heightInch: 11.7, multiplier: 1.0 },
    { id: "a3", name: "A3 (11.7\" × 16.5\")", widthInch: 11.7, heightInch: 16.5, multiplier: 2.0 },
    { id: "a2", name: "A2 (16.5\" × 23.4\")", widthInch: 16.5, heightInch: 23.4, multiplier: 4.0 },
    { id: "a1", name: "A1 (23.4\" × 33.1\")", widthInch: 23.4, heightInch: 33.1, multiplier: 8.0 },
    { id: "a0", name: "A0 (33.1\" × 46.8\")", widthInch: 33.1, heightInch: 46.8, multiplier: 16.0 },
    { id: "custom", name: "Custom Size", widthInch: 0, heightInch: 0, multiplier: 1.0 },
];

export const apparelSizes: SizeOption[] = [
    { id: "xs", name: "XS", widthInch: 16, heightInch: 24, multiplier: 1.0, priceAddon: 0 },
    { id: "s", name: "S", widthInch: 18, heightInch: 26, multiplier: 1.0, priceAddon: 0 },
    { id: "m", name: "M", widthInch: 20, heightInch: 28, multiplier: 1.0, priceAddon: 0 },
    { id: "l", name: "L", widthInch: 22, heightInch: 29, multiplier: 1.0, priceAddon: 0 },
    { id: "xl", name: "XL", widthInch: 24, heightInch: 30, multiplier: 1.0, priceAddon: 0 },
    { id: "2xl", name: "2XL", widthInch: 26, heightInch: 31, multiplier: 1.0, priceAddon: 2 },
    { id: "3xl", name: "3XL", widthInch: 28, heightInch: 32, multiplier: 1.0, priceAddon: 3 },
    { id: "4xl", name: "4XL", widthInch: 30, heightInch: 33, multiplier: 1.0, priceAddon: 5 },
    { id: "5xl", name: "5XL", widthInch: 32, heightInch: 34, multiplier: 1.0, priceAddon: 7 },
];

export interface CollarOption {
    id: string;
    name: string;
    priceAddon: number;
}

export const standardCollars: CollarOption[] = [
    { id: "round", name: "Round Neck", priceAddon: 0 },
    { id: "v-neck", name: "V-Neck", priceAddon: 0 },
    { id: "polo", name: "Polo / Collar", priceAddon: 5 },
    { id: "mandarin", name: "Mandarin", priceAddon: 3 },
];

export interface SleeveOption {
    id: string;
    name: string;
    priceAddon: number;
}

export const standardSleeves: SleeveOption[] = [
    { id: "short", name: "Short Sleeve", priceAddon: 0 },
    { id: "long", name: "Long Sleeve", priceAddon: 3 },
    { id: "sleeveless", name: "Sleeveless", priceAddon: 0 },
    { id: "raglan", name: "Raglan", priceAddon: 2 },
];

// =====================
// MATERIAL OPTIONS
// =====================

export interface MaterialOption {
    id: string;
    name: string;
    description: string;
    pricePerSqft: number;
    multiplier: number;
}

export const materials: MaterialOption[] = [
    { id: "art-paper-128", name: "Art Paper 128gsm", description: "Standard glossy paper", pricePerSqft: 0.50, multiplier: 1.0 },
    { id: "art-paper-260", name: "Art Paper 260gsm", description: "Premium thick glossy paper", pricePerSqft: 0.80, multiplier: 1.3 },
    { id: "art-card-310", name: "Art Card 310gsm", description: "Sturdy card stock", pricePerSqft: 1.20, multiplier: 1.6 },
    { id: "synthetic", name: "Synthetic Paper", description: "Waterproof, tear-resistant", pricePerSqft: 2.50, multiplier: 2.5 },
    { id: "vinyl-sticker", name: "Vinyl Sticker", description: "Self-adhesive vinyl", pricePerSqft: 3.00, multiplier: 3.0 },
    { id: "vinyl-banner", name: "Vinyl Banner (13oz)", description: "Outdoor banner material", pricePerSqft: 4.00, multiplier: 4.0 },
    { id: "mesh-banner", name: "Mesh Banner", description: "Perforated for wind", pricePerSqft: 5.00, multiplier: 5.0 },
    { id: "acrylic-3mm", name: "Acrylic 3mm", description: "Clear or white acrylic", pricePerSqft: 15.00, multiplier: 15.0 },
    { id: "acrylic-5mm", name: "Acrylic 5mm", description: "Thicker acrylic sheet", pricePerSqft: 22.00, multiplier: 22.0 },
    { id: "foam-board", name: "Foam Board 5mm", description: "Lightweight display board", pricePerSqft: 8.00, multiplier: 8.0 },
];

// =====================
// FINISHING OPTIONS
// =====================

export interface FinishingOption {
    id: string;
    name: string;
    description: string;
    priceAddon: number; // Flat add-on per unit
    pricePerSqft?: number; // Or per sqft
}

export const finishingOptions: FinishingOption[] = [
    { id: "none", name: "No Finishing", description: "Standard print only", priceAddon: 0 },
    { id: "gloss-lam", name: "Gloss Lamination", description: "Shiny protective layer", priceAddon: 0.30, pricePerSqft: 0.30 },
    { id: "matte-lam", name: "Matte Lamination", description: "Non-reflective finish", priceAddon: 0.35, pricePerSqft: 0.35 },
    { id: "die-cut", name: "Die Cut", description: "Custom shape cutting", priceAddon: 2.00 },
    { id: "round-corners", name: "Round Corners", description: "Rounded corner cutting", priceAddon: 0.50 },
    { id: "mounting-foam", name: "Foam Mounting", description: "Mount on foam board", priceAddon: 5.00, pricePerSqft: 5.00 },
    { id: "grommets", name: "Grommets", description: "Metal eyelets for hanging", priceAddon: 1.00 },
    { id: "pole-pocket", name: "Pole Pocket", description: "Sewn pocket for poles", priceAddon: 3.00 },
    { id: "hemming", name: "Hemming", description: "Reinforced edges", priceAddon: 2.00 },
];

// =====================
// PER-PRODUCT MATERIALS & FINISHING (New SQFT Pricing Model)
// =====================
// DYNAMIC OPTION GROUPS
// =====================
export interface ProductOptionItem {
    id: string;
    name: string;                // e.g. "Standard", "Urgent"
    pricingMode: 'x' | '+';      // 'x' = multiplier, '+' = addon
    priceValue: number;          // The value (multiplier or RM addon)
    priceScope?: 'sqft' | 'unit'; // Only for '+' mode: per sqft or per unit
    hasCustomQuantity?: boolean; // If true, user enters quantity
}

export interface ProductOptionGroup {
    id: string;
    name: string; // Group Name (e.g. "Material", "Turnaround Time")
    options: ProductOptionItem[];
}

// =====================
// QUANTITY TIERS (Legacy discount-based tiers)
// =====================

export interface LegacyQuantityTier {
    minQty: number;
    maxQty: number | null; // null = unlimited
    discount: number; // Percentage discount (0-100)
    label: string;
}

export const defaultQuantityTiers: LegacyQuantityTier[] = [
    { minQty: 1, maxQty: 50, discount: 0, label: "1-50 pcs" },
    { minQty: 51, maxQty: 100, discount: 5, label: "51-100 pcs (5% off)" },
    { minQty: 101, maxQty: 500, discount: 10, label: "101-500 pcs (10% off)" },
    { minQty: 501, maxQty: 1000, discount: 15, label: "501-1000 pcs (15% off)" },
    { minQty: 1001, maxQty: null, discount: 20, label: "1000+ pcs (20% off)" },
];

// =====================
// PRICING CALCULATOR
// =====================

export interface PriceCalculation {
    basePrice: number;
    sizeMultiplier: number;
    materialMultiplier: number;
    subtotal: number;
    finishingAddons: number;
    quantityDiscount: number;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    breakdown: PriceBreakdownItem[];
}

export interface PriceBreakdownItem {
    label: string;
    value: number;
    type: "add" | "multiply" | "discount" | "info";
}

export function calculatePrice(
    product: Product,
    sizeOption: SizeOption,
    materialOption: MaterialOption,
    selectedFinishing: FinishingOption[],
    quantity: number,
    customWidth?: number,
    customHeight?: number
): PriceCalculation {
    const breakdown: PriceBreakdownItem[] = [];

    // Base price
    let basePrice = product.basePrice;
    breakdown.push({ label: "Base Price", value: basePrice, type: "add" });

    // Size calculation
    // Size calculation
    let sizeMultiplier = sizeOption.multiplier;

    // FIX: For Sqft pricing, calculate actual sqft for standard sizes too
    if (product.pricingType === 'sqft') {
        if (sizeOption.id === 'custom' && customWidth && customHeight) {
            sizeMultiplier = (customWidth * customHeight) / 144;
        } else if (sizeOption.widthInch > 0 && sizeOption.heightInch > 0) {
            sizeMultiplier = (sizeOption.widthInch * sizeOption.heightInch) / 144;
        }
    } else {
        // For standard/quantity/apparel, use the defined multiplier (usually 1 or specific factor)
        if (sizeOption.id === 'custom' && customWidth && customHeight) {
            // Fallback for custom size in non-sqft mode? rare case.
            // maybe treat as 1 unit or keep 1.
            sizeMultiplier = 1;
        }
    }

    breakdown.push({ label: `Size (${sizeOption.name})`, value: sizeMultiplier, type: "multiply" });

    // Size Add-on (e.g. XL +RM2, or A3 +RM5)
    if (sizeOption.priceAddon && sizeOption.priceAddon > 0) {
        breakdown.push({ label: `Size Add-on (${sizeOption.name})`, value: sizeOption.priceAddon, type: "add" });
    }

    // Material calculation
    const materialMultiplier = materialOption.multiplier;
    breakdown.push({ label: `Material (${materialOption.name})`, value: materialMultiplier, type: "multiply" });

    // Subtotal before finishing
    let subtotal = basePrice * sizeMultiplier * materialMultiplier;

    // Finishing add-ons
    let finishingAddons = 0;
    selectedFinishing.forEach((finish) => {
        if (finish.pricePerSqft && sizeOption.id === "custom" && customWidth && customHeight) {
            const sqft = (customWidth * customHeight) / 144;
            finishingAddons += finish.pricePerSqft * sqft;
        } else {
            finishingAddons += finish.priceAddon;
        }
        if (finish.priceAddon > 0 || (finish.pricePerSqft && finish.pricePerSqft > 0)) {
            breakdown.push({ label: finish.name, value: finish.priceAddon, type: "add" });
        }
    });

    // Unit price before discount
    // Unit price before discount
    // Formula: (Base * SizeMult * MatMult) + Finishing + SizeAddon
    let unitPrice = subtotal + finishingAddons + (sizeOption.priceAddon || 0);

    // Quantity tier discount
    let discountPercent = 0;
    if (product.quantityTiers && product.quantityTiers.length > 0) {
        for (const tier of product.quantityTiers) {
            if (quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty)) {
                discountPercent = tier.discount;
                break;
            }
        }
    }
    const quantityDiscount = (unitPrice * discountPercent) / 100;
    if (discountPercent > 0) {
        breakdown.push({ label: `Volume Discount (${discountPercent}%)`, value: -quantityDiscount, type: "discount" });
    }

    // Final unit price
    unitPrice = unitPrice - quantityDiscount;

    // Total price
    const totalPrice = unitPrice * quantity;

    return {
        basePrice,
        sizeMultiplier,
        materialMultiplier,
        subtotal,
        finishingAddons,
        quantityDiscount,
        unitPrice,
        totalPrice,
        quantity,
        breakdown,
    };
}

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
    }).format(amount);
};

// =====================
// NEW PRICING ENGINE CALCULATORS
// =====================

// Common result interface for all engines
export interface EnginePriceResult {
    engine: PricingEngine;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    breakdown: PriceBreakdownItem[];
    materialCost: number;
    finishingCost: number;
}

// SQFT Engine: Calculate price based on area
export interface SqftEngineInput {
    widthInch: number;
    heightInch: number;
    basePricePerSqft: number;
    materialCostPerSqft: number;
    finishingCosts: { name: string; costPerSqft?: number; flatCost?: number; costPerUnit?: number }[];
    quantity: number;
    minimumPrice?: number;
}

export function calculateSqftEngine(input: SqftEngineInput): EnginePriceResult {
    const { widthInch, heightInch, basePricePerSqft, materialCostPerSqft, finishingCosts, quantity, minimumPrice } = input;
    const breakdown: PriceBreakdownItem[] = [];

    // Calculate sqft (width × height in inches / 144)
    const sqft = (widthInch * heightInch) / 144;
    breakdown.push({ label: `Area: ${sqft.toFixed(2)} sqft`, value: sqft, type: "multiply" });

    // Base print cost
    const baseCost = sqft * basePricePerSqft;
    breakdown.push({ label: `Print (${formatCurrency(basePricePerSqft)}/sqft)`, value: baseCost, type: "add" });

    // Material cost (only show if > 0)
    const materialCost = sqft * materialCostPerSqft;
    if (materialCostPerSqft > 0) {
        breakdown.push({ label: `Material (${formatCurrency(materialCostPerSqft)}/sqft)`, value: materialCost, type: "add" });
    }

    // Finishing costs
    let finishingTotal = 0;
    finishingCosts.forEach(f => {
        if (f.costPerSqft) {
            const cost = sqft * f.costPerSqft;
            finishingTotal += cost;
            breakdown.push({ label: `${f.name} (${formatCurrency(f.costPerSqft)}/sqft)`, value: cost, type: "add" });
        } else if (f.costPerUnit) {
            // Per-unit costs are multiplied by quantity
            const cost = f.costPerUnit * quantity;
            finishingTotal += cost;
            breakdown.push({ label: `${f.name}`, value: cost, type: "add" });
        } else if (f.flatCost) {
            finishingTotal += f.flatCost;
            breakdown.push({ label: f.name, value: f.flatCost, type: "add" });
        }
    });

    let unitPrice = baseCost + materialCost + finishingTotal;

    // Apply minimum price if set
    if (minimumPrice && unitPrice < minimumPrice) {
        unitPrice = minimumPrice;
        breakdown.push({ label: "Minimum Price Applied", value: minimumPrice, type: "add" });
    }

    return {
        engine: "sqft",
        unitPrice,
        totalPrice: unitPrice * quantity,
        quantity,
        breakdown,
        materialCost,
        finishingCost: finishingTotal,
    };
}

// QTY Tier Engine: Look up price from tiered pricing table
export interface QtyTierEngineInput {
    quantity: number;
    pricingTiers: PricingTier[];
    materialCostPerUnit?: number;
    finishingCosts: { name: string; costPerUnit?: number; flatCost?: number }[];
    sizeMultiplier?: number;
    sizePriceAddon?: number;
}

export function calculateQtyTierEngine(input: QtyTierEngineInput): EnginePriceResult {
    const { quantity, pricingTiers, materialCostPerUnit = 0, finishingCosts, sizeMultiplier = 1, sizePriceAddon = 0 } = input;
    const breakdown: PriceBreakdownItem[] = [];

    // Find the tier for this quantity
    let tierBasePrice = 0;
    let tierLabel = "";

    // Sort tiers by minQty ascending
    const sortedTiers = [...pricingTiers].sort((a, b) => a.minQty - b.minQty);

    for (const tier of sortedTiers) {
        if (quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty)) {
            tierBasePrice = tier.price;
            tierLabel = `${tier.minQty}${tier.maxQty ? `-${tier.maxQty}` : '+'} pcs`;
            break;
        }
    }

    // If no tier found, use the highest tier
    if (tierBasePrice === 0 && sortedTiers.length > 0) {
        const lastTier = sortedTiers[sortedTiers.length - 1];
        tierBasePrice = lastTier.price;
        tierLabel = `${lastTier.minQty}+ pcs`;
    }

    // Apply Size Logic to Tier Price
    // Formula: (TierPrice * Multiplier) + Addon
    const tierPrice = (tierBasePrice * sizeMultiplier) + sizePriceAddon;

    breakdown.push({ label: `Tier Price (${tierLabel})`, value: tierPrice, type: "add" });

    // Show breakdown if size affects price
    if (sizeMultiplier !== 1) {
        breakdown.push({ label: `Size Multiplier (x${sizeMultiplier})`, value: tierBasePrice * (sizeMultiplier - 1), type: "add" }); // Implicit
    }
    if (sizePriceAddon > 0) {
        breakdown.push({ label: `Size Add-on`, value: sizePriceAddon, type: "add" });
    }

    // Material cost per unit
    const materialCost = materialCostPerUnit * quantity;
    if (materialCostPerUnit > 0) {
        breakdown.push({ label: `Material (${formatCurrency(materialCostPerUnit)}/unit)`, value: materialCost, type: "add" });
    }

    // Finishing costs
    let finishingTotal = 0;
    finishingCosts.forEach(f => {
        if (f.costPerUnit) {
            const cost = f.costPerUnit * quantity;
            finishingTotal += cost;
            breakdown.push({ label: `${f.name} (${formatCurrency(f.costPerUnit)}/unit)`, value: cost, type: "add" });
        } else if (f.flatCost) {
            finishingTotal += f.flatCost;
            breakdown.push({ label: f.name, value: f.flatCost, type: "add" });
        }
    });

    // Tier price is usually total price for the quantity
    const totalPrice = tierPrice + materialCost + finishingTotal;

    return {
        engine: "qty_tier",
        unitPrice: totalPrice / quantity,
        totalPrice,
        quantity,
        breakdown,
        materialCost,
        finishingCost: finishingTotal,
    };
}

// QTY Fixed Engine: Simple unit price × quantity
export interface QtyFixedEngineInput {
    unitPrice: number;
    quantity: number;
    bulkDiscountPercent?: number;
    materialCostPerUnit?: number;
    finishingCosts: { name: string; costPerUnit?: number; flatCost?: number }[];
    sizeMultiplier?: number;
    sizePriceAddon?: number;
    sizeName?: string;  // For breakdown label
}

export function calculateQtyFixedEngine(input: QtyFixedEngineInput): EnginePriceResult {
    const { unitPrice: baseUnitPrice, quantity, bulkDiscountPercent = 0, materialCostPerUnit = 0, finishingCosts, sizeMultiplier = 1, sizePriceAddon = 0, sizeName } = input;
    const breakdown: PriceBreakdownItem[] = [];

    // Quantity
    breakdown.push({ label: `Quantity: ${quantity} pcs`, value: 0, type: "info" });

    // Size (if applicable)
    if (sizeName) {
        breakdown.push({ label: `Size: ${sizeName}`, value: 0, type: "info" });
    }

    // Apply Size Logic
    const adjustedUnitPrice = (baseUnitPrice * sizeMultiplier) + sizePriceAddon;

    // Base Price
    breakdown.push({ label: `Base Price (${formatCurrency(baseUnitPrice)}/pc)`, value: baseUnitPrice, type: "add" });

    // Size addon if any
    if (sizePriceAddon > 0) {
        breakdown.push({ label: `Size Addon`, value: sizePriceAddon, type: "add" });
    }

    // Material cost per unit (not used for qty_fixed typically, but kept for compatibility)
    if (materialCostPerUnit > 0) {
        breakdown.push({ label: `Material (${formatCurrency(materialCostPerUnit)}/pc)`, value: materialCostPerUnit, type: "add" });
    }

    // Finishing/Option costs per unit
    let finishingPerUnit = 0;
    let finishingFlat = 0;
    finishingCosts.forEach(f => {
        if (f.costPerUnit) {
            finishingPerUnit += f.costPerUnit;
            breakdown.push({ label: `${f.name}`, value: f.costPerUnit, type: "add" });
        } else if (f.flatCost) {
            finishingFlat += f.flatCost;
            breakdown.push({ label: f.name, value: f.flatCost, type: "add" });
        }
    });

    const unitPriceWithAddons = adjustedUnitPrice + materialCostPerUnit + finishingPerUnit;
    let subtotal = (unitPriceWithAddons * quantity) + finishingFlat;

    // Apply bulk discount
    let discountAmount = 0;
    if (bulkDiscountPercent > 0) {
        discountAmount = subtotal * (bulkDiscountPercent / 100);
        breakdown.push({ label: `Bulk Discount (${bulkDiscountPercent}%)`, value: -discountAmount, type: "discount" });
    }

    const totalPrice = subtotal - discountAmount;

    return {
        engine: "qty_fixed",
        unitPrice: unitPriceWithAddons,
        totalPrice,
        quantity,
        breakdown,
        materialCost: materialCostPerUnit * quantity,
        finishingCost: (finishingPerUnit * quantity) + finishingFlat,
    };
}

// Apparel Multi-Line Engine: Row-based pricing with Size + Sleeve + Collar + Add-ons
export interface ApparelLineItem {
    id: string;
    size: string;
    sizePriceAddon: number;
    sleeve: string;
    sleevePriceAddon: number;
    collar: string;
    collarPriceAddon: number;
    addName: boolean;
    namePricePerUnit: number;
    addNumber: boolean;
    numberPricePerUnit: number;
    quantity: number;
    materialCost: number; // Base jersey/fabric cost
}

export interface ApparelEngineInput {
    lineItems: ApparelLineItem[];
}

export interface ApparelEngineResult extends EnginePriceResult {
    lineItems: (ApparelLineItem & { lineTotal: number; unitPriceWithAddons: number })[];
}

export function calculateApparelEngine(input: ApparelEngineInput): ApparelEngineResult {
    const { lineItems } = input;
    const breakdown: PriceBreakdownItem[] = [];

    let grandTotal = 0;
    let totalQuantity = 0;
    let totalMaterialCost = 0;
    let totalFinishingCost = 0;

    const processedLines = lineItems.map(line => {
        // Unit price = material + size addon + sleeve addon + collar addon
        const baseUnit = line.materialCost + line.sizePriceAddon + line.sleevePriceAddon + line.collarPriceAddon;

        // Personalization add-ons (per unit)
        let personalizationPerUnit = 0;
        if (line.addName) personalizationPerUnit += line.namePricePerUnit;
        if (line.addNumber) personalizationPerUnit += line.numberPricePerUnit;

        const unitPriceWithAddons = baseUnit + personalizationPerUnit;
        const lineTotal = unitPriceWithAddons * line.quantity;

        grandTotal += lineTotal;
        totalQuantity += line.quantity;
        totalMaterialCost += line.materialCost * line.quantity;
        totalFinishingCost += personalizationPerUnit * line.quantity;

        return {
            ...line,
            unitPriceWithAddons,
            lineTotal,
        };
    });

    // Build breakdown summary
    breakdown.push({ label: `Total Lines: ${lineItems.length}`, value: lineItems.length, type: "add" });
    breakdown.push({ label: `Total Quantity`, value: totalQuantity, type: "add" });

    return {
        engine: "apparel_multiline",
        unitPrice: totalQuantity > 0 ? grandTotal / totalQuantity : 0,
        totalPrice: grandTotal,
        quantity: totalQuantity,
        breakdown,
        materialCost: totalMaterialCost,
        finishingCost: totalFinishingCost,
        lineItems: processedLines,
    };
}

// =====================
// SAMPLE PRODUCTS
// =====================

// =====================
// SAMPLE PRODUCTS
// =====================

export const sampleProducts: Product[] = [];

export const categoryColors: Record<ProductCategory, { bg: string; text: string }> = {
    Banners: { bg: "bg-blue-light-50 dark:bg-blue-light-500/15", text: "text-blue-light-600 dark:text-blue-light-400" },
    "Business Cards": { bg: "bg-success-50 dark:bg-success-500/15", text: "text-success-600 dark:text-success-400" },
    Flyers: { bg: "bg-warning-50 dark:bg-warning-500/15", text: "text-warning-600 dark:text-orange-400" },
    Stickers: { bg: "bg-error-50 dark:bg-error-500/15", text: "text-error-600 dark:text-error-400" },
    Signage: { bg: "bg-brand-50 dark:bg-brand-500/15", text: "text-brand-600 dark:text-brand-400" },
    Posters: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300" },
    Packaging: { bg: "bg-pink-50 dark:bg-pink-500/15", text: "text-pink-600 dark:text-pink-400" },
    Apparel: { bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-600 dark:text-orange-400" },
    "Solvent / Eco-Solvent": { bg: "bg-blue-light-50 dark:bg-blue-light-500/15", text: "text-blue-light-600 dark:text-blue-light-400" },
    "UV Flatbed": { bg: "bg-purple-50 dark:bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
    "Digital Cutting & CNC": { bg: "bg-teal-50 dark:bg-teal-500/15", text: "text-teal-600 dark:text-teal-400" },
    "Fabrication / Metalworks": { bg: "bg-gray-200 dark:bg-gray-600", text: "text-gray-800 dark:text-gray-200" },
    "Offset Machine": { bg: "bg-cyan-50 dark:bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400" },
    "Sublimation": { bg: "bg-indigo-50 dark:bg-indigo-500/15", text: "text-indigo-600 dark:text-indigo-400" },
    "DTF Shirt": { bg: "bg-orange-100 dark:bg-orange-600/20", text: "text-orange-700 dark:text-orange-300" },
    "Display": { bg: "bg-indigo-50 dark:bg-indigo-500/15", text: "text-indigo-600 dark:text-indigo-400" },
    "Print": { bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
};

// =====================
// UTILITY: Transform API Product to Frontend Format
// =====================
export function transformApiProduct(p: any): Product {
    // Map DB pricing engine to frontend
    const engineMap: Record<string, PricingEngine> = {
        "SQFT": "sqft",
        "QTY_TIER": "qty_tier",
        "FIXED_QTY": "qty_fixed",
        "FIXED": "apparel_multiline",
        "sqft": "sqft",
        "qty_tier": "qty_tier",
        "qty_fixed": "qty_fixed",
        "fixed": "apparel_multiline",
        "apparel_multiline": "apparel_multiline"
    };
    const mappedEngine = engineMap[p.pricingEngine] || "sqft";

    // Transform sizes from options
    const availableSizes: SizeOption[] = p.options
        ? p.options.filter((o: any) => o.optionType?.toLowerCase() === 'size').map((o: any) => {
            let sizeId = o.value;
            let width = 0;
            let height = 0;
            let multiplier = 1;

            try {
                if (o.value && o.value.trim().startsWith('{')) {
                    const parsed = JSON.parse(o.value);
                    sizeId = parsed.id;
                    width = parsed.w || 0;
                    height = parsed.h || 0;
                    multiplier = parsed.m || 1;
                }
            } catch (e) {
                sizeId = o.value;
            }

            const found = [...standardSizes, ...apparelSizes].find(s => s.id === sizeId);
            if (found && width === 0 && height === 0) {
                width = found.widthInch;
                height = found.heightInch;
            }
            if (multiplier === 1 && found) {
                multiplier = found.multiplier;
            }

            return {
                id: sizeId,
                name: o.name,
                widthInch: width,
                heightInch: height,
                priceAddon: Number(o.priceAddon) || 0,
                isDefault: o.isDefault,
                multiplier: multiplier
            };
        })
        : [];

    // Transform option groups
    const optionGroups: ProductOptionGroup[] = (() => {
        const groups: Record<string, any> = {};
        (p.options || []).forEach((o: any) => {
            if (o.optionType?.toLowerCase() === 'size') return;

            let gName = o.groupName;
            if (!gName) {
                if (o.optionType === 'material') gName = 'Materials';
                else if (o.optionType === 'finishing') gName = 'Finishing';
                else gName = 'General';
            }

            if (!groups[gName]) {
                groups[gName] = { id: `grp-${gName}-${p.id}`, name: gName, options: [] };
            }

            let scope = 'unit';
            let customQty = false;
            try {
                if (o.value && o.value.startsWith('{')) {
                    const parsed = JSON.parse(o.value);
                    scope = parsed.scope || parsed.priceScope || 'unit';
                    customQty = parsed.customQty || parsed.hasCustomQuantity || false;
                } else {
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
    })();

    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        departmentId: p.departmentId,
        description: p.description || "",
        pricingEngine: mappedEngine,
        basePrice: Number(p.basePrice) || 0,
        basePricePerSqft: Number(p.basePricePerSqft) || 0,
        minimumPrice: Number(p.minimumPrice) || 0,
        unitPrice: Number(p.unitPrice) || 0,
        bulkDiscount: Number(p.bulkDiscount) || 0,
        minQuantity: p.minQuantity,
        maxQuantity: p.maxQuantity,
        leadTimeDays: p.leadTimeDays,
        isActive: p.isActive,
        images: p.images,
        tags: p.tags,
        createdDate: p.createdAt,
        hasSizeOptions: p.hasSizeOptions,
        availableSizes,
        pricingTiers: p.pricingTiers?.map((t: any) => ({
            id: t.id,
            minQty: t.minQty,
            maxQty: t.maxQty,
            price: Number(t.price),
            variantId: t.variantId || null
        })) || [],
        fixedQuantities: p.fixedQuantities?.map((fq: any) => ({
            id: fq.id,
            quantity: fq.quantity,
            price: Number(fq.price),
            variantId: fq.variantId || null
        })) || [],
        quantityTiers: p.quantityTiers || [],
        optionGroups,
        productMaterials: [],
        productFinishing: [],
        pricingType: "sqft", // Default legacy value
        availableMaterials: [],
        availableFinishing: [],
    };
}
