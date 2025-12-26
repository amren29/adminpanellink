// Production Status Types
export interface ProductionStatus {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    order: number;
    allowedRoles: ('admin' | 'designer' | 'production' | 'qc')[];
}

// Default Production Statuses
export const defaultStatuses: ProductionStatus[] = [
    { id: 'new-order', name: 'New Order', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', order: 1, allowedRoles: ['admin'] },
    { id: 'artwork-checking', name: 'Artwork Checking', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', order: 2, allowedRoles: ['admin'] },
    { id: 'designing', name: 'Designing', color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-900/20', order: 3, allowedRoles: ['designer'] },
    { id: 'refining', name: 'Refining', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20', order: 4, allowedRoles: ['designer'] },
    { id: 'waiting-feedback', name: 'Waiting Customer Feedback', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', order: 5, allowedRoles: ['admin'] },
    { id: 'ready-to-print', name: 'Ready to Print', color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20', order: 6, allowedRoles: ['production'] },
    { id: 'in-production', name: 'In Production', color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', order: 7, allowedRoles: ['production'] },
    { id: 'finishing', name: 'Finishing', color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-900/20', order: 8, allowedRoles: ['production'] },
    { id: 'completed', name: 'Completed / QC Passed', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', order: 9, allowedRoles: ['qc'] },
    { id: 'ready-to-ship', name: 'Ready to Ship', color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', order: 10, allowedRoles: ['admin', 'qc'] },
    { id: 'shipped', name: 'Shipped', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', order: 11, allowedRoles: ['admin'] },
    { id: 'collected', name: 'Collected', color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-800', order: 12, allowedRoles: ['qc'] },
];

// File Attachment
export interface FileAttachment {
    id: string;
    name: string;
    url: string;
    type: 'customer' | 'print' | 'proof';
    uploadedBy: string;
    uploadedAt: string;
}

// Activity Log Entry
export interface ActivityLog {
    id: string;
    action: string;
    fromStatus?: string;
    toStatus?: string;
    userId: string;
    userName: string;
    userRole: string;
    timestamp: string;
    notes?: string;
}

// Artwork Proof
export interface ArtworkProof {
    id: string;
    version: number; // v1, v2, v3, etc.
    description: string;
    imageUrl?: string;
    proofFileUrl?: string;
    proofFileName?: string;
    generatedLink?: string;
    approvalLink?: string;
    status: 'pending' | 'approved' | 'needs-revision';
    customerComment?: string;
    createdAt: string;
    updatedAt: string;
}

// Priority Type
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

// Order Item
export interface OrderItem {
    id: string;
    name: string; // Product Name
    quantity: number;
    specifications?: string;
    departmentId?: string; // For auto-splitting
    productName?: string; // For auto-splitting UI state
    // Extended fields for Product Configuration
    width?: number;
    height?: number;
    unitPrice?: number;
    totalPrice?: number;
    status?: string;
}

// Production Order
export interface ProductionOrder {
    id: string;
    orderNumber: string;
    departmentId: string; // New: Link to Department
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    // Removed flattened product/quantity
    items: OrderItem[]; // Multiple items
    status: string; // status id
    priority: Priority;
    dueDate?: string;
    assignedTo?: string;  // Legacy single assignee (kept for backwards compatibility)
    assignedToName?: string;
    // Multi-assignee support (up to 10)
    assignees?: Array<{
        userId: string;
        role: string;  // designer, production, qc
        user?: { id: string; name: string; avatarUrl?: string; workflowRole?: string };
    }>;
    proofLink?: string;
    proofData?: ArtworkProof;
    proofHistory?: ArtworkProof[];
    customerFiles: FileAttachment[];
    printFiles: FileAttachment[];
    history: ActivityLog[];
    totalAmount: number;
    paidAmount: number;
    // For linked tickets (split orders)
    groupId?: string;
    createdAt: string;
    updatedAt: string;
    notes?: string; // General order notes
    paymentMethod?: 'invoice' | 'online' | 'wallet';
    deliveryMethod?: 'pickup' | 'courier'; // New field
    customerId?: string; // Links to Customer or Agent ID
    commentsCount?: number;
}

// Priority Colors
export const priorityColors = {
    low: { text: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' },
    normal: { text: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    high: { text: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    urgent: { text: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

// Sample Orders
export const sampleOrders: ProductionOrder[] = [];

// Helper functions
export const getStatusById = (statusId: string): ProductionStatus | undefined => {
    return defaultStatuses.find(s => s.id === statusId);
};

export const getOrdersByStatus = (orders: ProductionOrder[], statusId: string): ProductionOrder[] => {
    return orders.filter(o => o.status === statusId);
};

export const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};
