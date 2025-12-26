export interface Order {
    id: string;
    orderNumber: string;
    customerId?: string;
    customer?: { id: string; fullName: string; email: string };
    agentId?: string;
    agent?: { id: string; fullName: string };
    departmentId?: string;
    department?: { id: string; name: string };
    assignedTo?: string;
    assignee?: { id: string; name: string; avatarUrl?: string };
    status: OrderStatus;
    priority: OrderPriority;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingAmount: number;
    totalAmount: number;
    deliveryMethod: string;
    notes?: string;
    dueDate?: string;
    createdAt: string;
    items?: OrderItem[];
    // For list view counts
    _count?: {
        attachments: number;
        proofs: number;
    };
}

export interface OrderItem {
    id?: string;
    productId: string;
    name: string;
    quantity: number;
    width?: number;
    height?: number;
    specifications?: Record<string, any>;
    unitPrice: number;
    totalPrice: number;
}

export type OrderStatus = 'new_order' | 'processing' | 'design' | 'production' | 'completed' | 'cancelled' | 'on_hold';
export type OrderPriority = 'normal' | 'urgent';

export const orderStatusColors: Record<OrderStatus, { bg: string; text: string }> = {
    new_order: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    processing: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
    design: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
    production: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
    completed: { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400" },
    cancelled: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400" },
    on_hold: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
    }).format(amount);
};
