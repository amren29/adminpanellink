import { Product } from "../products/productData";

export interface PackageItem {
    productId: string;
    quantity: number;
    // Optional: Pre-define variant (e.g. Size S) or leave open for customer
    variantDescription?: string;
    unitPrice?: number; // Override price for this item in the package
}

export interface Package {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number; // Sum of components
    items: PackageItem[];
    image?: string;
    campaignStart?: string;
    campaignEnd?: string;
    isActive: boolean;
}

// Ensure you import products/productData.ts correctly in consumers
export const samplePackages: Package[] = [];
