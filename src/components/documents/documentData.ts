import { sampleCustomers, Customer } from "@/components/customers/customerData";

// Line Item interface - shared between quotes and invoices
export interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    productId?: string; // Optional: links to catalog product for editing
}

// Quote types
export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    lineItems: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    status: QuoteStatus;
    createdDate: string;
    validUntil: string;
    notes?: string;
}

// Invoice types
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    lineItems: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    status: InvoiceStatus;
    createdDate: string;
    dueDate: string;
    paidDate?: string;
    notes?: string;
}

// Status color mappings
export const quoteStatusColors: Record<QuoteStatus, { bg: string; text: string }> = {
    Draft: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-600 dark:text-gray-300",
    },
    Sent: {
        bg: "bg-blue-light-50 dark:bg-blue-light-500/15",
        text: "text-blue-light-600 dark:text-blue-light-400",
    },
    Accepted: {
        bg: "bg-success-50 dark:bg-success-500/15",
        text: "text-success-600 dark:text-success-400",
    },
    Rejected: {
        bg: "bg-error-50 dark:bg-error-500/15",
        text: "text-error-600 dark:text-error-400",
    },
};

export const invoiceStatusColors: Record<InvoiceStatus, { bg: string; text: string }> = {
    Draft: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-600 dark:text-gray-300",
    },
    Sent: {
        bg: "bg-blue-light-50 dark:bg-blue-light-500/15",
        text: "text-blue-light-600 dark:text-blue-light-400",
    },
    Paid: {
        bg: "bg-success-50 dark:bg-success-500/15",
        text: "text-success-600 dark:text-success-400",
    },
    Overdue: {
        bg: "bg-error-50 dark:bg-error-500/15",
        text: "text-error-600 dark:text-error-400",
    },
};

// Helper functions
export const generateQuoteNumber = (): string => {
    const prefix = "QT";
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${randomNum}`;
};

export const generateInvoiceNumber = (): string => {
    const prefix = "INV";
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${randomNum}`;
};

export const generateLineItemId = (): string => {
    return `li-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateLineItemTotal = (quantity: number, unitPrice: number): number => {
    return quantity * unitPrice;
};

export const calculateSubtotal = (lineItems: LineItem[]): number => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
};

export const calculateTaxAmount = (subtotal: number, taxRate: number): number => {
    return subtotal * (taxRate / 100);
};

export const calculateTotal = (subtotal: number, taxAmount: number): number => {
    return subtotal + taxAmount;
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
    }).format(amount);
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

// Empty templates
export const emptyLineItem: Omit<LineItem, "id"> = {
    description: "",
    quantity: 1,
    unitPrice: 0,
    total: 0,
};

// Sample data
export const sampleQuotes: Quote[] = [];

export const sampleInvoices: Invoice[] = [];

// Get customers for dropdown
export const getCustomersForSelect = (): { id: string; name: string; email: string }[] => {
    return sampleCustomers.map((c) => ({
        id: c.id,
        name: c.fullName,
        email: c.email,
    }));
};
