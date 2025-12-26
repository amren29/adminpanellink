// =====================
// SETTINGS DATA LAYER
// Dynamic Configurable Pricing Options
// =====================

import { create } from "zustand";

// =====================
// DEPARTMENT TYPES
// =====================

export type DepartmentId = string;

// Pricing Engine Enum (matching productData.ts)
export type PricingEngine = "sqft" | "qty_tier" | "qty_fixed" | "apparel_multiline";

// Pricing Logic - customizable calculation formulas
export interface PricingLogic {
    id: string;
    engineCode?: PricingEngine; // Maps to hardcoded engine logic
    name: string;
    description: string;
    formula: string;
    variables: string[];
    example: string;
    isActive: boolean;
    departmentIds: DepartmentId[]; // New: Logic defines which departments use it
}

// Generic Option Item (used in any category)
export interface OptionItem {
    id: string;
    name: string;
    description: string;
    price: number;
    priceType: "flat" | "perSqft" | "multiplier" | "perUnit";
    isActive: boolean;
}

// Option Category - CRUD-able tab
export interface OptionCategory {
    id: string;
    name: string;
    description: string;
    priceField: "flat" | "perSqft" | "multiplier" | "perUnit"; // Default price type for items
    isRequired: boolean;
    allowMultiple: boolean;
    isActive: boolean;
    items: OptionItem[];
}

export interface Department {
    id: string;
    name: string;
    description: string;
    pricingLogicId?: string; // RESTORED: Deprecated, but keeping optional to avoid breaking UI temporarily
    hasCustomSize: boolean;
    isActive: boolean;
    // Dynamic option categories (CRUD-able)
    optionCategories: OptionCategory[];
}

// =====================
// SUBLIMATION SPECIFIC
// =====================

export interface SleeveType {
    id: string;
    name: string;
    priceAddon: number;
    isActive: boolean;
}

export interface CollarType {
    id: string;
    name: string;
    priceAddon: number;
    isActive: boolean;
}

export interface PersonalizationAddon {
    id: string;
    name: string;
    priceType: "flat" | "perCharacter";
    price: number;
    maxCharacters?: number;
    isActive: boolean;
}

// =====================
// MATERIAL SETTINGS
// =====================

export interface ConfigurableMaterial {
    id: string;
    name: string;
    description: string;
    pricePerSqft: number;
    multiplier: number;
    category: "paper" | "vinyl" | "acrylic" | "fabric" | "other";
    departmentIds: DepartmentId[]; // Which departments can use this material
    isActive: boolean;
}

// =====================
// SIZE SETTINGS
// =====================

export interface ConfigurableSize {
    id: string;
    name: string;
    widthInch: number;
    heightInch: number;
    multiplier: number;
    isCustom: boolean;
    departmentIds: DepartmentId[]; // Which departments can use this size
    isActive: boolean;
}

// =====================
// FINISHING SETTINGS
// =====================

export interface ConfigurableFinishing {
    id: string;
    name: string;
    description: string;
    priceAddon: number;
    pricePerSqft?: number;
    departmentIds: DepartmentId[]; // Which departments can use this finishing
    isActive: boolean;
}

// =====================
// APPAREL SETTINGS
// =====================

export interface ShirtBrand {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export interface ShirtSize {
    id: string;
    name: string;
    sortOrder: number;
}

export interface ShirtVariant {
    id: string;
    brandId: string;
    size: string;
    color: "light" | "dark";
    cost: number; // Base shirt cost
}

export interface PrintArea {
    id: string;
    name: string;
    description: string;
    widthInch: number;
    heightInch: number;
    basePrice: number;
    darkColorAddon: number; // Extra cost for dark shirts
    isActive: boolean;
}

export interface PrintMethod {
    id: string;
    name: string;
    description: string;
    multiplier: number;
    supportsLightShirts: boolean;
    supportsDarkShirts: boolean;
    isActive: boolean;
}

// =====================
// SETTINGS STORE
// =====================

interface SettingsState {
    materials: ConfigurableMaterial[];
    sizes: ConfigurableSize[];
    finishing: ConfigurableFinishing[];
    shirtBrands: ShirtBrand[];
    shirtSizes: ShirtSize[];
    shirtVariants: ShirtVariant[];
    printAreas: PrintArea[];
    printMethods: PrintMethod[];
    departments: Department[];
    pricingLogics: PricingLogic[];
    sleeveTypes: SleeveType[];
    collarTypes: CollarType[];
    personalization: PersonalizationAddon[];
    setupFee: number;

    // Material actions
    addMaterial: (material: Omit<ConfigurableMaterial, "id">) => void;
    updateMaterial: (id: string, material: Partial<ConfigurableMaterial>) => void;
    deleteMaterial: (id: string) => void;

    // Size actions
    addSize: (size: Omit<ConfigurableSize, "id">) => void;
    updateSize: (id: string, size: Partial<ConfigurableSize>) => void;
    deleteSize: (id: string) => void;

    // Finishing actions
    addFinishing: (finishing: Omit<ConfigurableFinishing, "id">) => void;
    updateFinishing: (id: string, finishing: Partial<ConfigurableFinishing>) => void;
    deleteFinishing: (id: string) => void;

    // Shirt brand actions
    addShirtBrand: (brand: Omit<ShirtBrand, "id">) => void;
    updateShirtBrand: (id: string, brand: Partial<ShirtBrand>) => void;
    deleteShirtBrand: (id: string) => void;

    // Shirt variant actions
    addShirtVariant: (variant: Omit<ShirtVariant, "id">) => void;
    updateShirtVariant: (id: string, variant: Partial<ShirtVariant>) => void;
    deleteShirtVariant: (id: string) => void;

    // Print area actions
    addPrintArea: (area: Omit<PrintArea, "id">) => void;
    updatePrintArea: (id: string, area: Partial<PrintArea>) => void;
    deletePrintArea: (id: string) => void;

    // Print method actions
    addPrintMethod: (method: Omit<PrintMethod, "id">) => void;
    updatePrintMethod: (id: string, method: Partial<PrintMethod>) => void;
    deletePrintMethod: (id: string) => void;

    // Sleeve type actions
    addSleeveType: (sleeve: Omit<SleeveType, "id">) => void;
    updateSleeveType: (id: string, sleeve: Partial<SleeveType>) => void;
    deleteSleeveType: (id: string) => void;

    // Collar type actions
    addCollarType: (collar: Omit<CollarType, "id">) => void;
    updateCollarType: (id: string, collar: Partial<CollarType>) => void;
    deleteCollarType: (id: string) => void;

    // Personalization actions
    addPersonalization: (item: Omit<PersonalizationAddon, "id">) => void;
    updatePersonalization: (id: string, item: Partial<PersonalizationAddon>) => void;
    deletePersonalization: (id: string) => void;

    // Department actions
    addDepartment: (dept: Omit<Department, "id">) => void;
    updateDepartment: (id: string, dept: Partial<Department>) => void;
    deleteDepartment: (id: string) => void;

    // Pricing Logic actions
    addPricingLogic: (logic: Omit<PricingLogic, "id">) => void;
    updatePricingLogic: (id: string, logic: Partial<PricingLogic>) => void;
    deletePricingLogic: (id: string) => void;

    // Setup fee
    setSetupFee: (fee: number) => void;
}

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default data
const defaultMaterials: ConfigurableMaterial[] = [
    { id: "mat-001", name: "Art Paper 128gsm", description: "Standard glossy paper", pricePerSqft: 0.50, multiplier: 1.0, category: "paper", departmentIds: ["offset", "paper"], isActive: true },
    { id: "mat-002", name: "Art Paper 260gsm", description: "Premium thick glossy paper", pricePerSqft: 0.80, multiplier: 1.3, category: "paper", departmentIds: ["offset", "paper"], isActive: true },
    { id: "mat-003", name: "Art Card 310gsm", description: "Sturdy card stock", pricePerSqft: 1.20, multiplier: 1.6, category: "paper", departmentIds: ["offset", "paper"], isActive: true },
    { id: "mat-004", name: "Synthetic Paper", description: "Waterproof, tear-resistant", pricePerSqft: 2.50, multiplier: 2.5, category: "paper", departmentIds: ["large-format", "signage"], isActive: true },
    { id: "mat-005", name: "Vinyl Sticker", description: "Self-adhesive vinyl", pricePerSqft: 3.00, multiplier: 3.0, category: "vinyl", departmentIds: ["large-format", "signage"], isActive: true },
    { id: "mat-006", name: "Vinyl Banner 13oz", description: "Outdoor banner material", pricePerSqft: 4.00, multiplier: 4.0, category: "vinyl", departmentIds: ["large-format"], isActive: true },
    { id: "mat-007", name: "Acrylic 3mm", description: "Clear or white acrylic", pricePerSqft: 15.00, multiplier: 15.0, category: "acrylic", departmentIds: ["signage"], isActive: true },
    { id: "mat-008", name: "Acrylic 5mm", description: "Thicker acrylic sheet", pricePerSqft: 22.00, multiplier: 22.0, category: "acrylic", departmentIds: ["signage"], isActive: true },
];

const defaultSizes: ConfigurableSize[] = [
    { id: "size-001", name: "A5 (5.8\" × 8.3\")", widthInch: 5.8, heightInch: 8.3, multiplier: 0.5, isCustom: false, departmentIds: ["offset", "paper"], isActive: true },
    { id: "size-002", name: "A4 (8.3\" × 11.7\")", widthInch: 8.3, heightInch: 11.7, multiplier: 1.0, isCustom: false, departmentIds: ["offset", "paper", "large-format"], isActive: true },
    { id: "size-003", name: "A3 (11.7\" × 16.5\")", widthInch: 11.7, heightInch: 16.5, multiplier: 2.0, isCustom: false, departmentIds: ["offset", "paper", "large-format", "signage"], isActive: true },
    { id: "size-004", name: "A2 (16.5\" × 23.4\")", widthInch: 16.5, heightInch: 23.4, multiplier: 4.0, isCustom: false, departmentIds: ["large-format", "signage"], isActive: true },
    { id: "size-005", name: "A1 (23.4\" × 33.1\")", widthInch: 23.4, heightInch: 33.1, multiplier: 8.0, isCustom: false, departmentIds: ["large-format", "signage"], isActive: true },
    { id: "size-006", name: "Custom Size", widthInch: 0, heightInch: 0, multiplier: 1.0, isCustom: true, departmentIds: ["large-format", "signage"], isActive: true },
];

const defaultFinishing: ConfigurableFinishing[] = [
    { id: "fin-001", name: "No Finishing", description: "Standard print only", priceAddon: 0, departmentIds: ["offset", "paper", "large-format", "signage"], isActive: true },
    { id: "fin-002", name: "Gloss Lamination", description: "Shiny protective layer", priceAddon: 0.30, pricePerSqft: 0.30, departmentIds: ["offset", "paper"], isActive: true },
    { id: "fin-003", name: "Matte Lamination", description: "Non-reflective finish", priceAddon: 0.35, pricePerSqft: 0.35, departmentIds: ["offset", "paper"], isActive: true },
    { id: "fin-004", name: "Die Cut", description: "Custom shape cutting", priceAddon: 2.00, departmentIds: ["offset", "paper", "large-format"], isActive: true },
    { id: "fin-005", name: "Round Corners", description: "Rounded corner cutting", priceAddon: 0.50, departmentIds: ["offset", "paper"], isActive: true },
    { id: "fin-006", name: "Grommets", description: "Metal eyelets for hanging", priceAddon: 1.00, departmentIds: ["large-format"], isActive: true },
    { id: "fin-007", name: "Pole Pocket", description: "Sewn pocket for poles", priceAddon: 3.00, departmentIds: ["large-format"], isActive: true },
];

const defaultShirtBrands: ShirtBrand[] = [
    { id: "brand-001", name: "Gildan", description: "Standard quality cotton", isActive: true },
    { id: "brand-002", name: "Fruit of the Loom", description: "Budget-friendly option", isActive: true },
    { id: "brand-003", name: "Local Brand", description: "Local supplier shirts", isActive: true },
];

const defaultShirtSizes: ShirtSize[] = [
    { id: "ss-001", name: "S", sortOrder: 1 },
    { id: "ss-002", name: "M", sortOrder: 2 },
    { id: "ss-003", name: "L", sortOrder: 3 },
    { id: "ss-004", name: "XL", sortOrder: 4 },
    { id: "ss-005", name: "2XL", sortOrder: 5 },
    { id: "ss-006", name: "3XL", sortOrder: 6 },
];

const defaultShirtVariants: ShirtVariant[] = [
    // Gildan Light
    { id: "sv-001", brandId: "brand-001", size: "S", color: "light", cost: 12.00 },
    { id: "sv-002", brandId: "brand-001", size: "M", color: "light", cost: 12.00 },
    { id: "sv-003", brandId: "brand-001", size: "L", color: "light", cost: 12.00 },
    { id: "sv-004", brandId: "brand-001", size: "XL", color: "light", cost: 14.00 },
    { id: "sv-005", brandId: "brand-001", size: "2XL", color: "light", cost: 16.00 },
    { id: "sv-006", brandId: "brand-001", size: "3XL", color: "light", cost: 18.00 },
    // Gildan Dark
    { id: "sv-007", brandId: "brand-001", size: "S", color: "dark", cost: 14.00 },
    { id: "sv-008", brandId: "brand-001", size: "M", color: "dark", cost: 14.00 },
    { id: "sv-009", brandId: "brand-001", size: "L", color: "dark", cost: 14.00 },
    { id: "sv-010", brandId: "brand-001", size: "XL", color: "dark", cost: 16.00 },
    { id: "sv-011", brandId: "brand-001", size: "2XL", color: "dark", cost: 18.00 },
    { id: "sv-012", brandId: "brand-001", size: "3XL", color: "dark", cost: 20.00 },
];

const defaultPrintAreas: PrintArea[] = [
    { id: "pa-001", name: "Left Chest", description: "4\" × 4\" chest print", widthInch: 4, heightInch: 4, basePrice: 8.00, darkColorAddon: 3.00, isActive: true },
    { id: "pa-002", name: "Half Front (A4)", description: "8.3\" × 11.7\" front print", widthInch: 8.3, heightInch: 11.7, basePrice: 15.00, darkColorAddon: 5.00, isActive: true },
    { id: "pa-003", name: "Full Front (A3)", description: "11.7\" × 16.5\" full front", widthInch: 11.7, heightInch: 16.5, basePrice: 22.00, darkColorAddon: 8.00, isActive: true },
    { id: "pa-004", name: "Back Print (A3)", description: "11.7\" × 16.5\" back print", widthInch: 11.7, heightInch: 16.5, basePrice: 22.00, darkColorAddon: 8.00, isActive: true },
    { id: "pa-005", name: "Sleeve Print", description: "Small sleeve print", widthInch: 3, heightInch: 4, basePrice: 6.00, darkColorAddon: 2.00, isActive: true },
];

const defaultPrintMethods: PrintMethod[] = [
    { id: "pm-001", name: "Sublimation", description: "Dye sublimation (polyester only)", multiplier: 1.0, supportsLightShirts: true, supportsDarkShirts: false, isActive: true },
    { id: "pm-002", name: "DTF (Light)", description: "Direct-to-Film for light fabrics", multiplier: 1.2, supportsLightShirts: true, supportsDarkShirts: false, isActive: true },
    { id: "pm-003", name: "DTF (Dark)", description: "Direct-to-Film with white underbase", multiplier: 1.5, supportsLightShirts: true, supportsDarkShirts: true, isActive: true },
];

// Default Pricing Logics - Updated to match user spec
const defaultPricingLogics: PricingLogic[] = [
    {
        id: "pl-sqft",
        engineCode: "sqft",
        name: "SQFT Engine (Area-Based)",
        description: "For Banners, Stickers, Signage - price based on square footage",
        formula: "(width × height in sqft) × basePricePerSqft + materialCost + finishingCost",
        variables: ["width", "height", "basePricePerSqft", "materialCostPerSqft", "finishingCost"],
        example: "(4ft × 6ft) × RM3.50 + material + finishing = RM89",
        isActive: true,
        departmentIds: ["solvent", "uv-flatbed", "digital-cutting"],
    },
    {
        id: "pl-qty-tier",
        engineCode: "qty_tier",
        name: "QTY Tier Engine (Bulk Pricing)",
        description: "For Business Cards, Flyers - tiered bulk pricing",
        formula: "Look up price from quantity tier table",
        variables: ["quantity", "pricingTiers[]"],
        example: "100pcs = RM30, 200pcs = RM45, 500pcs = RM60",
        isActive: true,
        departmentIds: ["offset"],
    },
    {
        id: "pl-qty-fixed",
        engineCode: "qty_fixed",
        name: "QTY Fixed Engine (Unit Pricing)",
        description: "For Tripod Bunting, Frames, Accessories - fixed unit price",
        formula: "unitPrice × quantity - bulkDiscount",
        variables: ["unitPrice", "quantity", "bulkDiscount"],
        example: "RM45 × 10 pcs - 5% bulk = RM427.50",
        isActive: true,
        departmentIds: ["fabrication"],
    },
    {
        id: "pl-apparel",
        engineCode: "apparel_multiline",
        name: "Apparel Multi-Line Engine (Sublimation)",
        description: "For Sublimation Jersey - multi-line with Size + Sleeve + Collar pricing",
        formula: "basePrice(size) + sleeveAddon + collarAddon + (addName × qty) + (addNumber × qty)",
        variables: ["size", "sleeve", "collar", "addName", "addNumber", "quantity"],
        example: "M+Short+Round+Name+Number × 10 = RM55 × 10 = RM550",
        isActive: true,
        departmentIds: ["sublimation", "dtf-shirt"],
    },
];

// Default Departments with optionCategories - Updated to match user spec
const defaultDepartments: Department[] = [
    // A. Solvent / Eco-Solvent
    {
        id: "solvent", name: "Solvent / Eco-Solvent", description: "Banners, Stickers, Large Format Prints", hasCustomSize: true, isActive: true,
        optionCategories: [
            {
                id: "sol-cat-1", name: "Materials", description: "Material selection (cost per sqft)", priceField: "perSqft", isRequired: true, allowMultiple: false, isActive: true,
                items: [
                    { id: "sol-mat-1", name: "Tarpaulin 300gsm", description: "Standard outdoor banner", price: 1.20, priceType: "perSqft", isActive: true },
                    { id: "sol-mat-2", name: "Tarpaulin 380gsm", description: "Heavy duty banner", price: 1.50, priceType: "perSqft", isActive: true },
                    { id: "sol-mat-3", name: "Synthetic Paper", description: "Waterproof paper", price: 1.10, priceType: "perSqft", isActive: true },
                    { id: "sol-mat-4", name: "White Sticker", description: "Adhesive vinyl", price: 1.30, priceType: "perSqft", isActive: true },
                    { id: "sol-mat-5", name: "Transparent Sticker", description: "Clear adhesive vinyl", price: 1.60, priceType: "perSqft", isActive: true },
                ],
            },
            {
                id: "sol-cat-2", name: "Finishing", description: "Finishing options", priceField: "flat", isRequired: false, allowMultiple: true, isActive: true,
                items: [
                    { id: "sol-fin-1", name: "Eyelets (Cincin)", description: "Metal grommets", price: 0.50, priceType: "perUnit", isActive: true },
                    { id: "sol-fin-2", name: "PVC Pipe", description: "Top/bottom pole sleeve", price: 5.00, priceType: "flat", isActive: true },
                    { id: "sol-fin-3", name: "Rope", description: "Hanging rope", price: 2.00, priceType: "flat", isActive: true },
                    { id: "sol-fin-4", name: "Gloss Lamination", description: "Shiny protective layer", price: 1.20, priceType: "perSqft", isActive: true },
                    { id: "sol-fin-5", name: "Matte Lamination", description: "Non-reflective layer", price: 1.20, priceType: "perSqft", isActive: true },
                ],
            },
        ],
    },
    // B. UV Flatbed
    {
        id: "uv-flatbed", name: "UV Flatbed", description: "Rigid substrate printing", hasCustomSize: true, isActive: true,
        optionCategories: [
            {
                id: "uv-cat-1", name: "Materials", description: "Material selection (cost per sqft)", priceField: "perSqft", isRequired: true, allowMultiple: false, isActive: true,
                items: [
                    { id: "uv-mat-1", name: "Acrylic 3mm", description: "Clear/colored acrylic", price: 8.00, priceType: "perSqft", isActive: true },
                    { id: "uv-mat-2", name: "Acrylic 5mm", description: "Thicker acrylic", price: 10.00, priceType: "perSqft", isActive: true },
                    { id: "uv-mat-3", name: "Foam Board", description: "Lightweight display", price: 6.00, priceType: "perSqft", isActive: true },
                    { id: "uv-mat-4", name: "PP Hollow Board", description: "Coroplast/Correx", price: 5.00, priceType: "perSqft", isActive: true },
                    { id: "uv-mat-5", name: "MDF", description: "Medium density fibreboard", price: 7.00, priceType: "perSqft", isActive: true },
                ],
            },
            {
                id: "uv-cat-2", name: "Finishing", description: "Finishing options", priceField: "perSqft", isRequired: false, allowMultiple: true, isActive: true,
                items: [
                    { id: "uv-fin-1", name: "White Ink Layer", description: "Opaque white base", price: 2.00, priceType: "perSqft", isActive: true },
                    { id: "uv-fin-2", name: "Spot UV", description: "Highlight coating", price: 3.00, priceType: "perSqft", isActive: true },
                    { id: "uv-fin-3", name: "Double-Sided Tape", description: "Mounting tape", price: 2.00, priceType: "perSqft", isActive: true },
                ],
            },
        ],
    },
    // C. Digital Cutting & CNC
    {
        id: "digital-cutting", name: "Digital Cutting & CNC", description: "Precision cutting and shaping", hasCustomSize: true, isActive: true,
        optionCategories: [
            {
                id: "dc-cat-1", name: "Finishing", description: "Cutting options", priceField: "flat", isRequired: true, allowMultiple: true, isActive: true,
                items: [
                    { id: "dc-fin-1", name: "Kiss Cut", description: "Sticker sheet cutting", price: 1.00, priceType: "perSqft", isActive: true },
                    { id: "dc-fin-2", name: "Die Cut Shape", description: "Custom shape cutting", price: 50.00, priceType: "flat", isActive: true },
                    { id: "dc-fin-3", name: "Acrylic Edge Polishing", description: "Smooth acrylic edges", price: 5.00, priceType: "perUnit", isActive: true },
                ],
            },
        ],
    },
    // D. Fabrication / Metalworks
    {
        id: "fabrication", name: "Fabrication / Metalworks", description: "Metal structures and frames", hasCustomSize: true, isActive: true,
        optionCategories: [
            {
                id: "fab-cat-1", name: "Materials", description: "Metal materials", priceField: "perUnit", isRequired: true, allowMultiple: false, isActive: true,
                items: [
                    { id: "fab-mat-1", name: "Hollow Iron 1×1", description: "1 inch square tube", price: 18.00, priceType: "perUnit", isActive: true },
                    { id: "fab-mat-2", name: "Hollow Iron 1×2", description: "1×2 inch tube", price: 22.00, priceType: "perUnit", isActive: true },
                    { id: "fab-mat-3", name: "Zincalume", description: "Galvanized steel", price: 10.00, priceType: "perSqft", isActive: true },
                    { id: "fab-mat-4", name: "Stainless Steel", description: "SS sheet/tube", price: 35.00, priceType: "perSqft", isActive: true },
                ],
            },
            {
                id: "fab-cat-2", name: "Finishing", description: "Metalwork finishing", priceField: "flat", isRequired: false, allowMultiple: true, isActive: true,
                items: [
                    { id: "fab-fin-1", name: "Spray Paint", description: "Full paint job", price: 150.00, priceType: "flat", isActive: true },
                    { id: "fab-fin-2", name: "Welding", description: "Per weld point", price: 10.00, priceType: "perUnit", isActive: true },
                    { id: "fab-fin-3", name: "Rivets", description: "Rivet fasteners", price: 1.00, priceType: "perUnit", isActive: true },
                ],
            },
        ],
    },
    // E. Offset Machine
    {
        id: "offset", name: "Offset Machine", description: "High volume printing - flyers, brochures", hasCustomSize: false, isActive: true,
        optionCategories: [
            {
                id: "off-cat-1", name: "Materials", description: "Paper stock (per sheet)", priceField: "perUnit", isRequired: true, allowMultiple: false, isActive: true,
                items: [
                    { id: "off-mat-1", name: "Art Card 260gsm", description: "Thick glossy card", price: 0.80, priceType: "perUnit", isActive: true },
                    { id: "off-mat-2", name: "Art Paper 157gsm", description: "Standard glossy", price: 0.50, priceType: "perUnit", isActive: true },
                    { id: "off-mat-3", name: "Simili Paper", description: "Uncoated paper", price: 0.60, priceType: "perUnit", isActive: true },
                ],
            },
            {
                id: "off-cat-2", name: "Finishing", description: "Print finishing", priceField: "flat", isRequired: false, allowMultiple: true, isActive: true,
                items: [
                    { id: "off-fin-1", name: "Book Binding", description: "Perfect bind", price: 3.00, priceType: "perUnit", isActive: true },
                    { id: "off-fin-2", name: "Saddle Stitch", description: "Staple binding", price: 0.50, priceType: "perUnit", isActive: true },
                    { id: "off-fin-3", name: "Creasing", description: "Fold line", price: 0.30, priceType: "perUnit", isActive: true },
                    { id: "off-fin-4", name: "Hot Stamping", description: "Foil emboss", price: 150.00, priceType: "flat", isActive: true },
                ],
            },
        ],
    },
    // F. Sublimation
    {
        id: "sublimation", name: "Sublimation", description: "Full print jerseys, apparel", hasCustomSize: false, isActive: true,
        optionCategories: [
            {
                id: "sub-cat-1", name: "Materials", description: "Fabric type (per unit)", priceField: "flat", isRequired: true, allowMultiple: false, isActive: true,
                items: [
                    { id: "sub-mat-1", name: "Microfiber Jersey", description: "Breathable sports fabric", price: 18.00, priceType: "flat", isActive: true },
                    { id: "sub-mat-2", name: "Polyester Canvas", description: "Heavy duty polyester", price: 20.00, priceType: "flat", isActive: true },
                    { id: "sub-mat-3", name: "Lanyard Tape", description: "Lanyard material", price: 3.00, priceType: "flat", isActive: true },
                ],
            },
            {
                id: "sub-cat-2", name: "Finishing", description: "Apparel finishing", priceField: "flat", isRequired: false, allowMultiple: true, isActive: true,
                items: [
                    { id: "sub-fin-1", name: "Sewing", description: "Custom sewing work", price: 5.00, priceType: "perUnit", isActive: true },
                    { id: "sub-fin-2", name: "Heat Press", description: "Included in sublimation", price: 0, priceType: "flat", isActive: true },
                ],
            },
            {
                id: "sub-cat-3", name: "Sleeve Type", description: "Sleeve length", priceField: "flat", isRequired: true, allowMultiple: false, isActive: true,
                items: [
                    { id: "sub-sleeve-1", name: "Short Sleeve", description: "Standard", price: 0, priceType: "flat", isActive: true },
                    { id: "sub-sleeve-2", name: "Long Sleeve", description: "Full length", price: 5, priceType: "flat", isActive: true },
                ],
            },
            {
                id: "sub-cat-4", name: "Collar Type", description: "Collar style", priceField: "flat", isRequired: true, allowMultiple: false, isActive: true,
                items: [
                    { id: "sub-collar-1", name: "Round Neck", description: "Standard", price: 0, priceType: "flat", isActive: true },
                    { id: "sub-collar-2", name: "Collar", description: "Polo collar", price: 3, priceType: "flat", isActive: true },
                    { id: "sub-collar-3", name: "Mandarin Collar", description: "Chinese style", price: 4, priceType: "flat", isActive: true },
                ],
            },
            {
                id: "sub-cat-5", name: "Personalization", description: "Name/Number add-ons", priceField: "flat", isRequired: false, allowMultiple: true, isActive: true,
                items: [
                    { id: "sub-pers-1", name: "Add Name", description: "Back name print", price: 5.00, priceType: "flat", isActive: true },
                    { id: "sub-pers-2", name: "Add Number", description: "Back number print", price: 5.00, priceType: "flat", isActive: true },
                ],
            },
        ],
    },
    // G. DTF Shirt
    {
        id: "dtf-shirt", name: "DTF Shirt", description: "Direct-to-Film printing on shirts", hasCustomSize: false, isActive: true,
        optionCategories: [
            {
                id: "dtf-cat-front", name: "Front", description: "Front print options", priceField: "flat", isRequired: false, allowMultiple: false, isActive: true,
                items: [
                    { id: "dtf-front-1", name: "Logo (Left Chest)", description: "Small logo", price: 5.00, priceType: "flat", isActive: true },
                    { id: "dtf-front-2", name: "A4 Size", description: "Standard front print", price: 15.00, priceType: "flat", isActive: true },
                    { id: "dtf-front-3", name: "A3 Size", description: "Large front print", price: 25.00, priceType: "flat", isActive: true },
                ],
            },
            {
                id: "dtf-cat-back", name: "Back", description: "Back print options", priceField: "flat", isRequired: false, allowMultiple: false, isActive: true,
                items: [
                    { id: "dtf-back-1", name: "Name/Number", description: "Small top text", price: 8.00, priceType: "flat", isActive: true },
                    { id: "dtf-back-2", name: "A4 Size", description: "Standard back print", price: 15.00, priceType: "flat", isActive: true },
                    { id: "dtf-back-3", name: "A3 Size", description: "Large back print", price: 25.00, priceType: "flat", isActive: true },
                ],
            },
            {
                id: "dtf-cat-side", name: "Side", description: "Side sleeve/body print", priceField: "flat", isRequired: false, allowMultiple: true, isActive: true,
                items: [
                    { id: "dtf-side-1", name: "Left Sleeve", description: "Logo on left sleeve", price: 5.00, priceType: "flat", isActive: true },
                    { id: "dtf-side-2", name: "Right Sleeve", description: "Logo on right sleeve", price: 5.00, priceType: "flat", isActive: true },
                ],
            },
            {
                id: "dtf-cat-chest", name: "Chest", description: "Center chest print", priceField: "flat", isRequired: false, allowMultiple: false, isActive: true,
                items: [
                    { id: "dtf-chest-1", name: "Center Logo", description: "Middle of chest", price: 8.00, priceType: "flat", isActive: true },
                ],
            },
        ],
    },
];

// Default Sleeve Types (for Sublimation)
const defaultSleeveTypes: SleeveType[] = [
    { id: "sleeve-001", name: "Short Sleeve", priceAddon: 0, isActive: true },
    { id: "sleeve-002", name: "Long Sleeve", priceAddon: 5.00, isActive: true },
];

// Default Collar Types (for Sublimation)
const defaultCollarTypes: CollarType[] = [
    { id: "collar-001", name: "Round Neck", priceAddon: 0, isActive: true },
    { id: "collar-002", name: "Collar", priceAddon: 3.00, isActive: true },
    { id: "collar-003", name: "Mandarin Collar", priceAddon: 4.00, isActive: true },
    { id: "collar-004", name: "Retro Collar", priceAddon: 5.00, isActive: true },
];

// Default Personalization Add-ons
const defaultPersonalization: PersonalizationAddon[] = [
    { id: "pers-001", name: "Name", priceType: "flat", price: 5.00, maxCharacters: 20, isActive: true },
    { id: "pers-002", name: "Number", priceType: "flat", price: 5.00, maxCharacters: 2, isActive: true },
    { id: "pers-003", name: "Logo", priceType: "flat", price: 10.00, isActive: true },
];

export const useSettingsStore = create<SettingsState>((set) => ({
    materials: defaultMaterials,
    sizes: defaultSizes,
    finishing: defaultFinishing,
    shirtBrands: defaultShirtBrands,
    shirtSizes: defaultShirtSizes,
    shirtVariants: defaultShirtVariants,
    printAreas: defaultPrintAreas,
    printMethods: defaultPrintMethods,
    departments: defaultDepartments,
    pricingLogics: defaultPricingLogics,
    sleeveTypes: defaultSleeveTypes,
    collarTypes: defaultCollarTypes,
    personalization: defaultPersonalization,
    setupFee: 5.00,

    // Material actions
    addMaterial: (material) => set((state) => ({
        materials: [...state.materials, { ...material, id: generateId() }]
    })),
    updateMaterial: (id, material) => set((state) => ({
        materials: state.materials.map((m) => m.id === id ? { ...m, ...material } : m)
    })),
    deleteMaterial: (id) => set((state) => ({
        materials: state.materials.filter((m) => m.id !== id)
    })),

    // Size actions
    addSize: (size) => set((state) => ({
        sizes: [...state.sizes, { ...size, id: generateId() }]
    })),
    updateSize: (id, size) => set((state) => ({
        sizes: state.sizes.map((s) => s.id === id ? { ...s, ...size } : s)
    })),
    deleteSize: (id) => set((state) => ({
        sizes: state.sizes.filter((s) => s.id !== id)
    })),

    // Finishing actions
    addFinishing: (finishing) => set((state) => ({
        finishing: [...state.finishing, { ...finishing, id: generateId() }]
    })),
    updateFinishing: (id, finishing) => set((state) => ({
        finishing: state.finishing.map((f) => f.id === id ? { ...f, ...finishing } : f)
    })),
    deleteFinishing: (id) => set((state) => ({
        finishing: state.finishing.filter((f) => f.id !== id)
    })),

    // Shirt brand actions
    addShirtBrand: (brand) => set((state) => ({
        shirtBrands: [...state.shirtBrands, { ...brand, id: generateId() }]
    })),
    updateShirtBrand: (id, brand) => set((state) => ({
        shirtBrands: state.shirtBrands.map((b) => b.id === id ? { ...b, ...brand } : b)
    })),
    deleteShirtBrand: (id) => set((state) => ({
        shirtBrands: state.shirtBrands.filter((b) => b.id !== id)
    })),

    // Shirt variant actions
    addShirtVariant: (variant) => set((state) => ({
        shirtVariants: [...state.shirtVariants, { ...variant, id: generateId() }]
    })),
    updateShirtVariant: (id, variant) => set((state) => ({
        shirtVariants: state.shirtVariants.map((v) => v.id === id ? { ...v, ...variant } : v)
    })),
    deleteShirtVariant: (id) => set((state) => ({
        shirtVariants: state.shirtVariants.filter((v) => v.id !== id)
    })),

    // Print area actions
    addPrintArea: (area) => set((state) => ({
        printAreas: [...state.printAreas, { ...area, id: generateId() }]
    })),
    updatePrintArea: (id, area) => set((state) => ({
        printAreas: state.printAreas.map((a) => a.id === id ? { ...a, ...area } : a)
    })),
    deletePrintArea: (id) => set((state) => ({
        printAreas: state.printAreas.filter((a) => a.id !== id)
    })),

    // Print method actions
    addPrintMethod: (method) => set((state) => ({
        printMethods: [...state.printMethods, { ...method, id: generateId() }]
    })),
    updatePrintMethod: (id, method) => set((state) => ({
        printMethods: state.printMethods.map((m) => m.id === id ? { ...m, ...method } : m)
    })),
    deletePrintMethod: (id) => set((state) => ({
        printMethods: state.printMethods.filter((m) => m.id !== id)
    })),

    // Sleeve type actions
    addSleeveType: (sleeve) => set((state) => ({
        sleeveTypes: [...state.sleeveTypes, { ...sleeve, id: generateId() }]
    })),
    updateSleeveType: (id, sleeve) => set((state) => ({
        sleeveTypes: state.sleeveTypes.map((s) => s.id === id ? { ...s, ...sleeve } : s)
    })),
    deleteSleeveType: (id) => set((state) => ({
        sleeveTypes: state.sleeveTypes.filter((s) => s.id !== id)
    })),

    // Collar type actions
    addCollarType: (collar) => set((state) => ({
        collarTypes: [...state.collarTypes, { ...collar, id: generateId() }]
    })),
    updateCollarType: (id, collar) => set((state) => ({
        collarTypes: state.collarTypes.map((c) => c.id === id ? { ...c, ...collar } : c)
    })),
    deleteCollarType: (id) => set((state) => ({
        collarTypes: state.collarTypes.filter((c) => c.id !== id)
    })),

    // Personalization actions
    addPersonalization: (item) => set((state) => ({
        personalization: [...state.personalization, { ...item, id: generateId() }]
    })),
    updatePersonalization: (id, item) => set((state) => ({
        personalization: state.personalization.map((p) => p.id === id ? { ...p, ...item } : p)
    })),
    deletePersonalization: (id) => set((state) => ({
        personalization: state.personalization.filter((p) => p.id !== id)
    })),

    // Department actions
    addDepartment: (dept) => set((state) => ({
        departments: [...state.departments, { ...dept, id: generateId() }]
    })),
    updateDepartment: (id, dept) => set((state) => ({
        departments: state.departments.map((d) => d.id === id ? { ...d, ...dept } : d)
    })),
    deleteDepartment: (id) => set((state) => ({
        departments: state.departments.filter((d) => d.id !== id)
    })),

    // Pricing Logic actions
    addPricingLogic: (logic) => set((state) => ({
        pricingLogics: [...state.pricingLogics, { ...logic, id: generateId() }]
    })),
    updatePricingLogic: (id, logic) => set((state) => ({
        pricingLogics: state.pricingLogics.map((l) => l.id === id ? { ...l, ...logic } : l)
    })),
    deletePricingLogic: (id) => set((state) => ({
        pricingLogics: state.pricingLogics.filter((l) => l.id !== id)
    })),

    // Setup fee
    setSetupFee: (fee) => set({ setupFee: fee }),
}));

// =====================
// APPAREL PRICE CALCULATOR
// =====================

export interface ApparelPriceCalculation {
    shirtCost: number;
    printCost: number;
    darkColorAddon: number;
    methodMultiplier: number;
    setupFee: number;
    subtotal: number;
    quantity: number;
    totalPrice: number;
}

export function calculateApparelPrice(
    shirtVariant: ShirtVariant,
    printAreas: PrintArea[],
    printMethod: PrintMethod,
    quantity: number,
    setupFee: number,
    applySetupFee: boolean = true
): ApparelPriceCalculation {
    const shirtCost = shirtVariant.cost;

    // Calculate print cost for all selected areas
    let printCost = 0;
    let darkColorAddon = 0;

    printAreas.forEach((area) => {
        printCost += area.basePrice;
        if (shirtVariant.color === "dark") {
            darkColorAddon += area.darkColorAddon;
        }
    });

    const methodMultiplier = printMethod.multiplier;
    const adjustedPrintCost = (printCost + darkColorAddon) * methodMultiplier;

    const unitPrice = shirtCost + adjustedPrintCost;
    const subtotal = unitPrice * quantity;
    const finalSetupFee = applySetupFee ? setupFee : 0;
    const totalPrice = subtotal + finalSetupFee;

    return {
        shirtCost,
        printCost,
        darkColorAddon,
        methodMultiplier,
        setupFee: finalSetupFee,
        subtotal,
        quantity,
        totalPrice,
    };
}

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
    }).format(amount);
};
