export interface Promotion {
    id: string;
    code: string;
    description: string;
    type: 'percentage' | 'fixed';
    value: number; // e.g., 10 for 10% or 10.00
    minSpend?: number;
    maxDiscount?: number; // Only for percentage
    startDate?: string; // ISO date YYYY-MM-DD
    endDate?: string; // ISO date YYYY-MM-DD
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    appliesTo: 'all' | 'category' | 'department' | 'product';
    targetIds?: string[]; // IDs of selected categories/depts/products
}

export const samplePromotions: Promotion[] = [];
