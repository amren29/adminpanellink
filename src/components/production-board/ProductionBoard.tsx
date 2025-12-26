"use client";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
    ProductionOrder,
    FileAttachment,
    ArtworkProof,
    defaultStatuses,
    sampleOrders,
    getOrdersByStatus,
    getStatusById,
    priorityColors,
    formatDate,
    Priority,
} from "./productionData";
import DatePicker from "../form/date-picker";
import OrderDetailModal from "./OrderDetailModal";
import NewOrderModal from "./NewOrderModal";
import { CustomDropdown } from "../ui/dropdown/CustomDropdown";
import { useDocumentStore } from "@/components/documents/documentStore";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlan } from "@/context/PlanContext";

// Define workflow status type for settings
interface WorkflowStatus {
    id: string;
    name: string;
    color: string;
    order: number;
    allowedRoles: string[];
    description: string;
}

// Get stored approvals from localStorage
const getStoredApprovals = (): Record<string, { status: string; comment?: string; timestamp: string }> => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem('proof_approvals');
    return stored ? JSON.parse(stored) : {};
};

// Highlight matching text in search results
const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;

    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-white px-0.5 rounded">
                {text.slice(index, index + query.length)}
            </mark>
            {text.slice(index + query.length)}
        </>
    );
};

export default function ProductionBoard() {
    // Get user role from session - now including workflowRole
    const { role, isAdmin, canDelete, userId, userName, workflowRole } = useUserRole();
    const { can } = usePlan();

    // Workflow settings state - determines which columns each workflow role can see
    const [workflowSettings, setWorkflowSettings] = useState<WorkflowStatus[]>([]);

    // Fetch workflow settings on mount
    useEffect(() => {
        const fetchWorkflowSettings = async () => {
            try {
                const res = await fetch('/api/workflow-settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setWorkflowSettings(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch workflow settings:', error);
            }
        };
        fetchWorkflowSettings();
    }, []);

    // Filter statuses based on user's workflow role
    const allowedStatuses = useMemo(() => {
        // Admin can see everything
        if (workflowRole === 'admin' || role === 'admin') {
            return defaultStatuses;
        }

        // If we have workflow settings, filter by allowed roles
        if (workflowSettings.length > 0 && workflowRole) {
            const allowedIds = workflowSettings
                .filter(s => s.allowedRoles.includes(workflowRole))
                .map(s => s.id);
            return defaultStatuses.filter(s => allowedIds.includes(s.id));
        }

        // Default fallback filtering based on workflow role
        const roleStatusMap: Record<string, string[]> = {
            'designer': ['designing', 'refining', 'waiting-feedback'],
            'production': ['ready-to-print', 'in-production', 'finishing'],
            'qc': ['completed', 'collected'],
        };

        if (workflowRole && roleStatusMap[workflowRole]) {
            return defaultStatuses.filter(s => roleStatusMap[workflowRole].includes(s.id));
        }

        // If no workflow role set, show all statuses
        return defaultStatuses;
    }, [workflowRole, role, workflowSettings]);

    // Board State
    const { orders, addOrder, updateOrder, deleteOrder, setOrders: setStoreOrders } = useDocumentStore();
    // const [orders, setOrders] = useState<ProductionOrder[]>(sampleOrders); // Replaced

    // Fetch orders from API on mount
    useEffect(() => {
        // Clear old localStorage zombie data - database is now source of truth
        if (typeof window !== 'undefined') {
            localStorage.removeItem('productionOrders');
        }

        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders');
                if (res.ok) {
                    const response = await res.json();
                    const ordersData = response.data || [];
                    // Transform API orders to ProductionOrder format
                    const transformedOrders: ProductionOrder[] = ordersData.map((order: any) => {
                        // Map database status to production board status
                        const statusMap: Record<string, string> = {
                            'new_order': 'new-order',
                            'pending_artwork': 'artwork-checking',
                            'designing': 'designing',
                            'proof_sent': 'waiting-feedback',
                            'design_revision': 'refining',
                            'artwork_ready': 'ready-to-print',
                            'in_production': 'in-production',
                            'qc_check': 'finishing',
                            'completed': 'completed',
                            'ready_to_ship': 'ready-to-ship',
                            'shipped': 'shipped',
                            'delivered': 'collected',
                            'collected': 'collected',
                        };
                        const mappedStatus = statusMap[order.status] || 'new-order';

                        return {
                            id: order.id.toString(),
                            orderNumber: order.orderNumber,
                            // Use customer name if available, otherwise agent name, otherwise Unknown
                            customerName: order.customer?.fullName || order.agent?.name || 'Unknown',
                            customerEmail: order.customer?.email || order.agent?.email || '',
                            customerPhone: order.customer?.phone || order.agent?.phone || '',
                            status: mappedStatus,
                            priority: order.priority || 'normal' as Priority,
                            dueDate: order.dueDate || order.deliveryDate || '',
                            createdAt: order.createdAt,
                            updatedAt: order.updatedAt,
                            departmentId: order.departmentId || 'dept-general',
                            assignedTo: order.assignedTo || '',
                            assignedToName: order.assignee?.name || '', // Include the assignee name!
                            items: (order.items || []).map((item: any) => ({
                                id: item.id.toString(),
                                name: item.name || item.productName || 'Unknown Product',
                                quantity: item.quantity,
                                specifications: item.specifications || '',
                                unitPrice: item.unitPrice || 0,
                                totalPrice: item.totalPrice || 0,
                            })),
                            customerFiles: (order.attachments || [])
                                .filter((f: any) => f.fileType === 'customer')
                                .map((f: any) => ({ ...f, type: 'customer' })),
                            printFiles: (order.attachments || [])
                                .filter((f: any) => f.fileType === 'print')
                                .map((f: any) => ({ ...f, type: 'print' })),
                            proofHistory: (order.proofs || []).map((p: any) => ({
                                ...p,
                                status: p.status === 'needs_revision' ? 'needs-revision' : p.status
                            })),
                            proofData: order.proofs?.[0] ? {
                                ...order.proofs[0],
                                status: order.proofs[0].status === 'needs_revision' ? 'needs-revision' : order.proofs[0].status
                            } : undefined, // Latest proof with normalized status
                            history: (order.activityLogs || []).map((log: any) => ({
                                id: log.id,
                                action: log.action,
                                fromStatus: log.fromStatus,
                                toStatus: log.toStatus,
                                userId: log.userId || 'system',
                                userName: log.userName || 'System',
                                userRole: log.userRole || 'system',
                                timestamp: log.timestamp || log.createdAt, // Fallback if timestamp is missing
                                notes: log.notes
                            })).reverse(), // Store internally as Ascending (Oldest -> Newest) so Append works correctly
                            notes: order.notes || '',
                            totalAmount: order.totalAmount,
                            paidAmount: 0,
                            deliveryMethod: order.deliveryMethod || 'pickup',
                            // Multi-assignee support
                            assignees: (order.assignments || []).map((assignment: any) => ({
                                userId: assignment.userId,
                                role: assignment.role,
                                user: assignment.user ? {
                                    id: assignment.user.id,
                                    name: assignment.user.name,
                                    avatarUrl: assignment.user.avatarUrl,
                                    workflowRole: assignment.user.workflowRole
                                } : undefined
                            })),
                            commentsCount: order._count?.comments || 0,
                        };
                    });
                    setStoreOrders(transformedOrders);
                }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            }
        };
        fetchOrders();
    }, [setStoreOrders]);

    // Fetch team members for assignee filter
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch('/api/users');
                const data = await res.json();
                if (data.success && data.data) {
                    setTeamMembers(data.data.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        role: u.workflowRole || u.role
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch team members:', error);
            }
        };
        fetchTeam();
    }, []);

    // Use ID for selection so that modal updates when store updates
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const selectedOrder = useMemo(() =>
        orders.find(o => o.id === selectedOrderId) || null
        , [orders, selectedOrderId]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [draggedOrder, setDraggedOrder] = useState<ProductionOrder | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

    // Filter Controls State
    const [activeTab, setActiveTab] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
    const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([]);

    // Multi-Select State - No toggle needed, just track selected orders
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const hasSelection = selectedOrders.size > 0;

    // Keyboard Navigation State
    const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);

    // Get flat list of visible orders for keyboard navigation
    const visibleOrders = useMemo(() => {
        const q = (searchQuery || '').toLowerCase();
        return orders.filter(order => {
            const matchesSearch = !q ||
                order.orderNumber.toLowerCase().includes(q) ||
                order.customerName.toLowerCase().includes(q) ||
                order.items.some(i => i.name.toLowerCase().includes(q));
            const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
            const matchesTab = activeTab === 'all' || order.status === activeTab;
            return matchesSearch && matchesPriority && matchesTab;
        });
    }, [orders, searchQuery, priorityFilter, activeTab]);

    // Keyboard Navigation Effect
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case 'Escape':
                    if (isModalOpen) {
                        setIsModalOpen(false);
                    } else if (hasSelection) {
                        setSelectedOrders(new Set());
                    } else if (focusedOrderId) {
                        setFocusedOrderId(null);
                    }
                    break;
                case 'Enter':
                    if (focusedOrderId && !isModalOpen) {
                        const order = orders.find(o => o.id === focusedOrderId);
                        if (order) {
                            handleOrderClick(order);
                        }
                    }
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    if (visibleOrders.length > 0) {
                        const currentIndex = focusedOrderId ? visibleOrders.findIndex(o => o.id === focusedOrderId) : -1;
                        const nextIndex = Math.min(currentIndex + 1, visibleOrders.length - 1);
                        setFocusedOrderId(visibleOrders[nextIndex].id);
                    }
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    if (visibleOrders.length > 0) {
                        const currentIndex = focusedOrderId ? visibleOrders.findIndex(o => o.id === focusedOrderId) : visibleOrders.length;
                        const prevIndex = Math.max(currentIndex - 1, 0);
                        setFocusedOrderId(visibleOrders[prevIndex].id);
                    }
                    break;
                case ' ':
                    if (focusedOrderId && !isModalOpen) {
                        e.preventDefault();
                        toggleOrderSelection(focusedOrderId);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedOrderId, visibleOrders, isModalOpen, hasSelection, orders]);

    // Multi-Select Handlers
    const toggleOrderSelection = (orderId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation(); // Prevent opening modal
        }
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const selectAllInColumn = (statusId: string) => {
        const ordersInColumn = orders.filter(o => o.status === statusId);
        setSelectedOrders(prev => {
            const newSet = new Set(prev);
            const allSelected = ordersInColumn.every(o => newSet.has(o.id));
            if (allSelected) {
                // Deselect all in column
                ordersInColumn.forEach(o => newSet.delete(o.id));
            } else {
                // Select all in column
                ordersInColumn.forEach(o => newSet.add(o.id));
            }
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedOrders(new Set());
    };

    const batchMoveOrders = async (targetStatusId: string) => {
        const ordersToUpdate = Array.from(selectedOrders).filter(orderId => {
            const order = orders.find(o => o.id === orderId);
            return order && order.status !== targetStatusId;
        });

        if (ordersToUpdate.length === 0) return;

        const toastId = toast.loading(`Moving ${ordersToUpdate.length} orders...`);
        let successCount = 0;
        let failCount = 0;

        for (const orderId of ordersToUpdate) {
            try {
                // Pass true to suppress individual toasts
                await handleStatusChange(orderId, targetStatusId, undefined, true);
                successCount++;
            } catch (error) {
                console.error(`Failed to move order ${orderId}`, error);
                failCount++;
            }
        }

        toast.dismiss(toastId);
        if (failCount > 0) {
            toast.warning(`Moved ${successCount} orders, failed to move ${failCount}`);
        } else {
            toast.success(`Successfully moved ${successCount} orders`);
        }
        clearSelection();
    };

    // Batch Assign State & Handler
    const [batchAssignDropdownOpen, setBatchAssignDropdownOpen] = useState(false);
    const [batchAssigning, setBatchAssigning] = useState(false);

    const batchAssignOrders = async (userId: string, userName: string) => {
        setBatchAssigning(true);
        try {
            for (const orderId of selectedOrders) {
                await handleAssigneeChange(orderId, userId, userName);
            }
            toast.success(`Assigned ${selectedOrders.size} order(s) to ${userName}`);
            clearSelection();
        } catch (error) {
            console.error('Batch assign error:', error);
            toast.error('Failed to assign some orders');
        } finally {
            setBatchAssigning(false);
            setBatchAssignDropdownOpen(false);
        }
    };

    // Create tabs - use filtered allowedStatuses based on user's workflow role
    const tabs = useMemo(() => [
        { id: "all", label: "All" },
        ...allowedStatuses.map(status => ({
            id: status.id,
            label: status.name,
            color: status.color,
        }))
    ], [allowedStatuses]);

    // Listen for proof approval changes and poll
    React.useEffect(() => {
        const checkApprovals = () => {
            const approvals = getStoredApprovals();

            let hasChanges = false;

            orders.forEach(order => {
                if (order.proofData?.generatedLink) {
                    try {
                        // Handle potential relative URLs
                        const link = order.proofData.generatedLink;
                        const urlObj = link.startsWith('http') ? new URL(link) : new URL(link, window.location.origin);
                        const proofId = urlObj.searchParams.get('id');

                        if (proofId && approvals[proofId]) {
                            const approval = approvals[proofId];
                            const currentStatus = order.proofData?.status;

                            if (currentStatus !== approval.status) {
                                hasChanges = true;
                                const now = new Date().toISOString();
                                const newStatus = approval.status === 'approved' ? 'ready-to-print' : 'refining';

                                const updatedOrder = {
                                    ...order,
                                    status: newStatus,
                                    proofData: {
                                        ...order.proofData!,
                                        status: approval.status as 'approved' | 'needs-revision' | 'pending',
                                        customerComment: approval.comment,
                                        updatedAt: approval.timestamp,
                                    },
                                    history: [...order.history, {
                                        id: `h-${Date.now()}`,
                                        action: approval.status === 'approved'
                                            ? 'Customer approved proof'
                                            : 'Customer requested revision',
                                        fromStatus: order.status,
                                        toStatus: newStatus,
                                        userId: 'customer',
                                        userName: order.customerName,
                                        userRole: 'customer',
                                        timestamp: now,
                                        notes: approval.comment || (approval.status === 'approved' ? 'Approved for printing' : undefined),
                                    }],
                                    updatedAt: now,
                                };

                                // Trigger Notification
                                fetch('/api/notifications/create', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        type: 'order',
                                        title: approval.status === 'approved' ? 'Proof Approved' : 'Proof Revision Requested',
                                        message: `Customer ${approval.status === 'approved' ? 'approved' : 'rejected'} proof for ${order.orderNumber}`,
                                        link: `/`
                                    })
                                });

                                updateOrder(order.id, updatedOrder);
                            }
                        }
                    } catch (e) {
                        console.error("Error checking proof status", e);
                    }
                }
            });
        };

        checkApprovals();
        const handleApprovalChange = () => checkApprovals();

        window.addEventListener('storage', handleApprovalChange);
        window.addEventListener('proofApprovalChanged', handleApprovalChange);
        // Poll regularly
        const interval = setInterval(checkApprovals, 2000);

        return () => {
            window.removeEventListener('storage', handleApprovalChange);
            window.removeEventListener('proofApprovalChanged', handleApprovalChange);
            clearInterval(interval);
        };
    }, [orders, updateOrder]); // Added orders dependency so closure has latest data

    // NOTE: Removed localStorage persistence - database is now the source of truth
    // Orders are fetched from API and status changes are persisted via API calls


    const [newOrderInitialData, setNewOrderInitialData] = useState<Partial<ProductionOrder> | undefined>(undefined);

    // CRUD Handlers
    // CRUD Handlers
    const handleCreateOrder = async (newOrderData: Omit<ProductionOrder, 'id' | 'proofHistory' | 'proofData'> | Omit<ProductionOrder, 'id' | 'proofHistory' | 'proofData'>[]) => {
        try {
            const newOrdersInputs = Array.isArray(newOrderData) ? newOrderData : [newOrderData];

            for (const data of newOrdersInputs) {
                // Persist to database via API
                const orderData = {
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    customerPhone: data.customerPhone,
                    customerId: (data as any).customerId,
                    agentId: (data as any).agentId,
                    departmentId: data.departmentId,
                    assignedTo: data.assignedTo,
                    status: data.status === 'new-order' ? 'new_order' : data.status,
                    priority: data.priority || 'normal',
                    subtotal: data.totalAmount || 0,
                    totalAmount: data.totalAmount || 0,
                    deliveryMethod: data.deliveryMethod || 'pickup',
                    notes: data.notes || '',
                    dueDate: data.dueDate || null,
                    items: (data.items || []).map((item: any) => ({
                        name: item.name,
                        quantity: item.quantity,
                        specifications: item.specifications || '',
                        width: item.width || null,
                        height: item.height || null,
                        unitPrice: item.unitPrice || 0,
                        totalPrice: item.totalPrice || 0,
                    })),
                };

                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                });

                if (res.ok) {
                    const savedOrder = await res.json();
                    // Add to local store with the real ID from database
                    const transformedOrder: ProductionOrder = {
                        ...data,
                        id: savedOrder.id,
                        orderNumber: savedOrder.orderNumber,
                        proofHistory: [],
                        paidAmount: 0,
                    };
                    addOrder(transformedOrder);
                    console.log('Order created successfully:', savedOrder.orderNumber);
                } else {
                    const errData = await res.json();
                    console.error('Failed to create order:', errData);
                    alert(`Failed to create order: ${errData.error || 'Unknown error'}`);
                }
            }

            setIsNewOrderModalOpen(false);
            setNewOrderInitialData(undefined);
        } catch (error) {
            console.error("Error creating order:", error);
            alert(`Error creating order: ${error}`);
        }
    };

    const handleDuplicateOrder = (order: ProductionOrder) => {
        setNewOrderInitialData({
            orderNumber: `${order.orderNumber}-COPY`, // Suggest a new order number
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            departmentId: order.departmentId,
            priority: order.priority,
            dueDate: order.dueDate,
            notes: order.notes,
        });
        setIsModalOpen(false); // Close detail modal
        setIsNewOrderModalOpen(true); // Open new order modal
    };

    const handleUpdateOrder = (updatedOrder: ProductionOrder) => {
        updateOrder(updatedOrder.id, updatedOrder);
        // setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        // No need to set selectedOrder manually as it updates via ID
    };

    const handleDeleteOrder = (orderId: string) => {
        deleteOrder(orderId);
        // setOrders(prev => prev.filter(o => o.id !== orderId));
        closeModal();
    };

    const handleOrderClick = (order: ProductionOrder) => {
        setSelectedOrderId(order.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrderId(null);
    };

    const handleStatusChange = async (orderId: string, newStatus: string, notes?: string, suppressToast = false) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            // Snapshot previous state for rollback
            const previousOrder = { ...order };

            const now = new Date().toISOString();
            const fromStatusName = getStatusById(order.status)?.name || order.status;
            const toStatusName = getStatusById(newStatus)?.name || newStatus;
            const newHistory = [...order.history, {
                id: `h-${Date.now()}`,
                action: 'Status changed',
                fromStatus: order.status,
                toStatus: newStatus,
                userId: 'user-1',
                userName: 'Current User',
                userRole: role,
                timestamp: now,
                notes: notes || `Moved from ${fromStatusName} to ${toStatusName}`,
            }];
            const updatedOrder = { ...order, status: newStatus, history: newHistory, updatedAt: now };

            // Optimistic Update
            updateOrder(orderId, updatedOrder);
            setIsModalOpen(false); // Close modal immediately

            // Persist to database - map frontend status to database enum
            const statusMap: Record<string, string> = {
                'new-order': 'new_order',
                'artwork-checking': 'pending_artwork',
                'designing': 'designing',
                'refining': 'design_revision',
                'waiting-feedback': 'proof_sent',
                'ready-to-print': 'artwork_ready',
                'in-production': 'in_production',
                'finishing': 'qc_check',
                'completed': 'completed',
                'ready-to-ship': 'ready_to_ship',
                'shipped': 'shipped',
                'collected': 'collected',
            };
            const apiStatus = statusMap[newStatus] || 'new_order';

            try {
                const response = await fetch(`/api/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: apiStatus }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Failed to persist status change:', response.status, errorData);
                    // Rollback
                    updateOrder(orderId, previousOrder);
                    toast.error('Failed to update order', {
                        description: errorData.error || 'Changes reverted'
                    });
                } else {
                    console.log('Status change persisted successfully:', orderId, '->', apiStatus);
                    if (!suppressToast) {
                        toast.success(`Moved to ${toStatusName}`, {
                            description: `Order ${order.orderNumber} updated successfully`
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to persist status change (network error):', error);
                // Rollback
                updateOrder(orderId, previousOrder);
                toast.error('Network error', {
                    description: 'Could not connect to server. Changes reverted.'
                });
            }
        }
    };

    const handleAssigneeChange = async (orderId: string, assignee: string, assigneeName: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            // Snapshot for rollback
            const previousOrder = { ...order };

            const now = new Date().toISOString();
            const newHistory = [...order.history, {
                id: `h-${Date.now()}`,
                action: `Assigned to ${assigneeName}`,
                userId: 'user-1',
                userName: 'Current User',
                userRole: role,
                timestamp: now,
            }];
            const updatedOrder = {
                ...order,
                assignedTo: assignee,
                assignedToName: assigneeName,
                history: newHistory,
                updatedAt: now
            };

            // Optimistic update
            updateOrder(orderId, updatedOrder);

            // Persist to database
            try {
                const response = await fetch(`/api/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignedTo: assignee }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Failed to persist assignee change:', response.status, errorData);
                    // Rollback
                    updateOrder(orderId, previousOrder);
                    toast.error('Failed to update assignee', { description: 'Changes reverted' });
                } else {
                    console.log('Assignee change persisted successfully');
                }
            } catch (error) {
                console.error('Failed to persist assignee change (network error):', error);
                // Rollback
                updateOrder(orderId, previousOrder);
                toast.error('Network error', { description: 'Changes reverted' });
            }
        }
    };

    const handleProofUpdate = (orderId: string, proof: ArtworkProof) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const now = new Date().toISOString();
            const previousProofHistory = order.proofHistory || [];
            const updatedProofHistory = order.proofData
                ? [...previousProofHistory, order.proofData]
                : previousProofHistory;

            const isRevision = proof.version > 1;
            const actionText = isRevision
                ? `Proof revision v${proof.version} uploaded`
                : 'Proof generated and sent to customer';

            const newHistory = [...order.history, {
                id: `h-${Date.now()}`,
                action: actionText,
                userId: 'user-1',
                userName: 'Current User',
                userRole: role,
                timestamp: now,
                notes: proof.description.substring(0, 100),
            }];

            const updatedOrder = {
                ...order,
                proofData: proof,
                proofHistory: updatedProofHistory,
                proofLink: proof.generatedLink,
                status: 'waiting-feedback',
                history: newHistory,
                updatedAt: now
            };
            updateOrder(orderId, updatedOrder);
        }
    };

    const handleFileUpload = (orderId: string, file: FileAttachment) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const now = new Date().toISOString();
            const updatedOrder = { ...order };

            if (file.type === 'customer') {
                updatedOrder.customerFiles = [...order.customerFiles, file];
            } else {
                updatedOrder.printFiles = [...order.printFiles, file];
            }

            updatedOrder.history = [...order.history, {
                id: `h-${Date.now()}`,
                action: `File uploaded: ${file.name}`,
                userId: 'user-1',
                userName: 'Current User',
                userRole: role,
                timestamp: now,
                notes: file.type === 'print' ? 'Print-ready file' : 'Customer file',
            }];
            updatedOrder.updatedAt = now;
            updateOrder(orderId, updatedOrder);
        }
    };

    // Drag and Drop
    const handleDragStart = (e: React.DragEvent, order: ProductionOrder) => {
        setDraggedOrder(order);
        e.dataTransfer.effectAllowed = 'move';
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedOrder(null);
        setDragOverStatus(null);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    };

    const handleDragOver = (e: React.DragEvent, statusId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverStatus(statusId);
    };

    const handleDragLeave = () => {
        setDragOverStatus(null);
    };

    const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
        e.preventDefault();
        setDragOverStatus(null);

        if (draggedOrder) {
            // Check if this is a batch drag (has selection with selected orders)
            if (hasSelection && selectedOrders.has(draggedOrder.id)) {
                // Batch move all selected orders
                selectedOrders.forEach(orderId => {
                    const order = orders.find(o => o.id === orderId);
                    if (order && order.status !== targetStatusId) {
                        handleStatusChange(orderId, targetStatusId);
                    }
                });
                clearSelection();
            } else if (draggedOrder.status !== targetStatusId) {
                // Single order drag
                handleStatusChange(draggedOrder.id, targetStatusId);
            }
        }
        setDraggedOrder(null);
    };

    // Priority Dropdown Options
    const priorityOptions = [
        { value: 'all', label: 'All Priorities' },
        { value: 'urgent', label: 'Urgent' },
        { value: 'high', label: 'High' },
        { value: 'normal', label: 'Normal' },
        { value: 'low', label: 'Low' }
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Tab Navigation & Actions */}
            <div className="flex flex-col gap-4 mb-2">
                {/* Status Tabs - Scrollable (Hidden Scrollbar) */}
                <div className="overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit min-w-full">
                        {tabs.map((tab) => {
                            const status = defaultStatuses.find(s => s.id === tab.id);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    {status && (
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.color.replace('text-', 'bg-')}`}></span>
                                    )}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Filter - Responsive */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="w-full sm:w-[160px] lg:w-[180px]">
                                <DatePicker
                                    id="date-start"
                                    placeholder="Start date"
                                    alignIcon="left"
                                    className="bg-white dark:bg-gray-800"
                                    onChange={(_, dateStr) => setDateRange(prev => ({ ...prev, start: dateStr }))}
                                    defaultDate={dateRange.start}
                                />
                            </div>
                            <span className="text-gray-500 text-sm hidden sm:inline">to</span>
                            <div className="w-full sm:w-[160px] lg:w-[180px]">
                                <DatePicker
                                    id="date-end"
                                    placeholder="End date"
                                    alignIcon="left"
                                    className="bg-white dark:bg-gray-800"
                                    onChange={(_, dateStr) => setDateRange(prev => ({ ...prev, end: dateStr }))}
                                    defaultDate={dateRange.end}
                                />
                            </div>
                        </div>

                        {/* Priority Filter - Responsive */}
                        <div className="w-full sm:w-36 lg:w-40">
                            <CustomDropdown
                                options={priorityOptions}
                                value={priorityFilter}
                                onChange={(val) => setPriorityFilter(val)}
                            />
                        </div>

                        {/* Assignee Filter - Responsive */}
                        <div className="w-full sm:w-40 lg:w-48">
                            <CustomDropdown
                                options={[
                                    { value: 'all', label: '👤 All Assignees' },
                                    { value: 'unassigned', label: '⚪ Unassigned' },
                                    ...teamMembers.map(m => ({
                                        value: m.id,
                                        label: `${m.name}`
                                    }))
                                ]}
                                value={assigneeFilter}
                                onChange={(val) => setAssigneeFilter(val)}
                            />
                        </div>

                        {role === 'admin' && (
                            <button
                                onClick={() => setIsNewOrderModalOpen(true)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-theme-xs whitespace-nowrap"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Add Order
                            </button>
                        )}
                    </div>
                </div>

                {/* Batch Action Bar - Shows when items selected via Shift+Click */}
                {hasSelection && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={clearSelection}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Move to:</span>
                            <div className="flex flex-wrap items-center gap-2">
                                {allowedStatuses.map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => batchMoveOrders(status.id)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${status.color} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700`}
                                    >
                                        {status.name}
                                    </button>
                                ))}
                            </div>

                            {/* Assign Team Button */}
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setBatchAssignDropdownOpen(!batchAssignDropdownOpen)}
                                    disabled={batchAssigning}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {batchAssigning ? 'Assigning...' : 'Assign Team'}
                                </button>

                                {batchAssignDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Select Team Member</p>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-2">
                                            {teamMembers.map(member => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => batchAssignOrders(member.id, member.name)}
                                                    className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-gray-800 dark:text-white">{member.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Horizontal Scrollable Kanban */}
            {/* Mobile: Use dynamic viewport height (dvh) minus header space approx 340px */}
            {/* Desktop: Use vh minus smaller header approx 220px */}
            <div className="overflow-x-auto pb-2 h-[calc(100dvh-340px)] sm:h-[calc(100vh-280px)]">
                <div className="flex gap-4 h-full px-1" style={{ minWidth: 'max-content' }}>
                    {allowedStatuses
                        .filter(status => activeTab === 'all' || status.id === activeTab)
                        .map((status) => {
                            // Filter orders based on search and priority
                            const filteredOrders = orders.filter(order => {
                                const q = (searchQuery || '').toLowerCase();
                                const matchesSearch = !q ||
                                    order.orderNumber.toLowerCase().includes(q) ||
                                    order.customerName.toLowerCase().includes(q) ||
                                    order.items.some(i => i.name.toLowerCase().includes(q));
                                const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;

                                // Assignee Filter Logic
                                const matchesAssignee = (() => {
                                    if (assigneeFilter === 'all') return true;
                                    if (assigneeFilter === 'unassigned') {
                                        return !order.assignees || order.assignees.length === 0;
                                    }
                                    return order.assignees?.some(a => a.userId === assigneeFilter);
                                })();

                                // Date Filter Logic
                                const matchesDate = (() => {
                                    if (!dateRange.start && !dateRange.end) return true;
                                    const created = new Date(order.createdAt).setHours(0, 0, 0, 0);
                                    const start = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : null;
                                    const end = dateRange.end ? new Date(dateRange.end).setHours(0, 0, 0, 0) : null;
                                    if (start && created < start) return false;
                                    if (end && created > end) return false;
                                    return true;
                                })();

                                return matchesSearch && matchesPriority && matchesAssignee && matchesDate;
                            });

                            const statusOrders = getOrdersByStatus(filteredOrders, status.id)
                                .sort((a, b) => {
                                    // Priority sorting: urgent > high > normal > low
                                    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
                                    const aWeight = priorityWeight[a.priority] || 2;
                                    const bWeight = priorityWeight[b.priority] || 2;
                                    if (bWeight !== aWeight) return bWeight - aWeight;
                                    // Secondary: due date (earlier first)
                                    if (a.dueDate && b.dueDate) {
                                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                                    }
                                    return 0;
                                });
                            const isDragOver = dragOverStatus === status.id;

                            return (
                                <div
                                    key={status.id}
                                    onDragOver={(e) => handleDragOver(e, status.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, status.id)}
                                    className={`flex-shrink-0 w-[85vw] sm:w-72 rounded-xl p-3 transition-colors flex flex-col h-full ${isDragOver
                                        ? 'bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-300 dark:ring-brand-600'
                                        : 'bg-gray-50 dark:bg-gray-800/50'
                                        }`}
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {/* Select All Checkbox - Shows when selection exists */}
                                            {selectedOrders.size > 0 && statusOrders.length > 0 && (
                                                <button
                                                    onClick={() => selectAllInColumn(status.id)}
                                                    className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${statusOrders.every(o => selectedOrders.has(o.id))
                                                        ? 'bg-brand-500 border-brand-500'
                                                        : statusOrders.some(o => selectedOrders.has(o.id))
                                                            ? 'bg-brand-200 border-brand-400'
                                                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                                                        }`}
                                                >
                                                    {statusOrders.every(o => selectedOrders.has(o.id)) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    {statusOrders.some(o => selectedOrders.has(o.id)) && !statusOrders.every(o => selectedOrders.has(o.id)) && (
                                                        <div className="w-2 h-0.5 bg-brand-500 rounded" />
                                                    )}
                                                </button>
                                            )}
                                            <span className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')}`}></span>
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {status.name}
                                            </h3>
                                        </div>
                                        <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-500 bg-white dark:bg-gray-700 dark:text-gray-400 rounded-full">
                                            {statusOrders.length}
                                        </span>
                                    </div>

                                    {/* Order Cards */}
                                    <div className="space-y-3 flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                        {statusOrders.length === 0 ? (
                                            <div className={`py-8 text-center text-sm border-2 border-dashed rounded-lg transition-colors ${isDragOver
                                                ? 'text-brand-500 border-brand-300 dark:border-brand-600'
                                                : 'text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                                                }`}>
                                                {isDragOver ? 'Drop here' : 'No orders'}
                                            </div>
                                        ) : (
                                            statusOrders.map((order) => {
                                                const isSelected = selectedOrders.has(order.id);
                                                const isFocused = focusedOrderId === order.id;
                                                return (
                                                    <div
                                                        key={order.id}
                                                        draggable={!hasSelection || isSelected}
                                                        onDragStart={(e) => {
                                                            if (hasSelection && isSelected) {
                                                                // Batch drag - store all selected IDs
                                                                e.dataTransfer.setData('text/plain', Array.from(selectedOrders).join(','));
                                                            }
                                                            handleDragStart(e, order);
                                                        }}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={(e) => {
                                                            // Shift+Click to select, normal click to open modal
                                                            if (e.shiftKey) {
                                                                toggleOrderSelection(order.id, e);
                                                            } else {
                                                                handleOrderClick(order);
                                                            }
                                                        }}
                                                        className={`bg-white dark:bg-gray-800 rounded-lg border p-3 transition-all ${isSelected
                                                            ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800 shadow-md'
                                                            : isFocused
                                                                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 shadow-md'
                                                                : 'border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600'
                                                            } cursor-grab active:cursor-grabbing ${draggedOrder?.id === order.id ? 'opacity-50' : ''}`}
                                                    >
                                                        {/* Order Header */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                {/* Selection Checkbox - Shows when items are selected */}
                                                                {(selectedOrders.size > 0 || isSelected) && (
                                                                    <button
                                                                        onClick={(e) => toggleOrderSelection(order.id, e)}
                                                                        className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center flex-shrink-0 ${isSelected
                                                                            ? 'bg-brand-500 border-brand-500'
                                                                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                                                                            }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                )}
                                                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                                    {highlightText(order.orderNumber, searchQuery)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {(order.commentsCount || 0) > 0 && (
                                                                    <div className="flex items-center gap-1 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium" title={`${order.commentsCount} comments`}>
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                        </svg>
                                                                        <span>{order.commentsCount}</span>
                                                                    </div>
                                                                )}
                                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[order.priority].bg} ${priorityColors[order.priority].text}`}>
                                                                    {order.priority}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Product */}
                                                        <div className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                                                            {order.items.length === 1 ? (
                                                                <p className="line-clamp-2">{highlightText(order.items[0].name, searchQuery)}</p>
                                                            ) : (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <p className="line-clamp-1">{highlightText(order.items[0].name, searchQuery)}</p>
                                                                    <p className="text-xs text-gray-500 italic">
                                                                        + {order.items.length - 1} more items
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Customer */}
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                            {highlightText(order.customerName, searchQuery)}
                                                        </p>

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                                            {/* Due Date Indicator */}
                                                            {(() => {
                                                                const getDueDateStatus = (dateStr?: string) => {
                                                                    if (!dateStr) return { color: "text-gray-500 dark:text-gray-400", label: "No Date" };
                                                                    const due = new Date(dateStr);
                                                                    const now = new Date();
                                                                    now.setHours(0, 0, 0, 0);
                                                                    due.setHours(0, 0, 0, 0);

                                                                    const diffTime = due.getTime() - now.getTime();
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                    if (diffDays < 0) return { color: "text-red-600 dark:text-red-400 font-semibold", label: "Overdue" };
                                                                    if (diffDays === 0) return { color: "text-red-600 dark:text-red-400 font-semibold", label: "Today" };
                                                                    if (diffDays === 1) return { color: "text-orange-500 dark:text-orange-400 font-medium", label: "Tomorrow" };
                                                                    if (diffDays <= 3) return { color: "text-orange-500 dark:text-orange-400 font-medium", label: "Soon" };
                                                                    return { color: "text-gray-500 dark:text-gray-400", label: "Future" };
                                                                };

                                                                const status = getDueDateStatus(order.dueDate);

                                                                return (
                                                                    <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                        <span>{formatDate(order.dueDate)}</span>
                                                                        {(status.label === 'Overdue' || status.label === 'Today') && (
                                                                            <span className="ml-1 text-[10px] uppercase tracking-wider hidden sm:inline">!</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Assignee */}
                                                            <div className="flex items-center gap-1.5" title={
                                                                order.assignees?.length ?
                                                                    `Assigned to ${order.assignees.map(a => a.user?.name || 'Unknown').join(', ')}` :
                                                                    order.assignedToName ? `Assigned to ${order.assignedToName}` : "Unassigned"
                                                            }>
                                                                {order.assignees?.length ? (
                                                                    <>
                                                                        {/* Stacked avatars for multiple assignees */}
                                                                        <div className="flex -space-x-2">
                                                                            {order.assignees.slice(0, 3).map((assignee, idx) => (
                                                                                <div
                                                                                    key={assignee.userId}
                                                                                    className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-gray-800"
                                                                                    style={{ zIndex: 3 - idx }}
                                                                                >
                                                                                    {(assignee.user?.name || 'U').charAt(0).toUpperCase()}
                                                                                </div>
                                                                            ))}
                                                                            {order.assignees.length > 3 && (
                                                                                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[8px] font-bold text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                                                                                    +{order.assignees.length - 3}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[60px] truncate">
                                                                            {order.assignees.length === 1
                                                                                ? (order.assignees[0].user?.name?.split(' ')[0] || 'Assigned')
                                                                                : `${order.assignees.length} people`
                                                                            }
                                                                        </span>
                                                                    </>
                                                                ) : order.assignedToName ? (
                                                                    <>
                                                                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                                            {order.assignedToName.charAt(0)}
                                                                        </div>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[80px] truncate">
                                                                            {order.assignedToName.split(' ')[0]}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Footer Actions */}
                                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                                                            <div className="flex -space-x-2 overflow-hidden">
                                                                {(order.assignees || []).map((assignment: any, i: number) => (
                                                                    <div key={i} className="relative inline-block border-2 border-white dark:border-[#1E1E2D] rounded-full">
                                                                        {assignment.user?.avatarUrl ? (
                                                                            <img
                                                                                src={assignment.user.avatarUrl}
                                                                                alt={assignment.user.name}
                                                                                className="h-6 w-6 rounded-full object-cover"
                                                                                title={`${assignment.user.name} (${assignment.role})`}
                                                                            />
                                                                        ) : (
                                                                            <div
                                                                                className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-[10px] font-medium text-brand-600 dark:text-brand-400"
                                                                                title={`${assignment.user?.name} (${assignment.role})`}
                                                                            >
                                                                                {assignment.user?.name?.charAt(0) || '?'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(!order.assignees || order.assignees.length === 0) && (
                                                                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                {can('liveTracking') && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const link = `${window.location.origin}/view/order/${order.orderNumber}`;
                                                                            navigator.clipboard.writeText(link);
                                                                            toast.success('Tracking link copied!');
                                                                        }}
                                                                        className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                                        title="Copy Tracking Link"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}

                                        {/* Add New Order Button (In Column) */}
                                        {role === 'admin' && (
                                            <button
                                                onClick={() => {
                                                    // Optional: Pre-select status? 
                                                    // For now just open modal
                                                    setIsNewOrderModalOpen(true);
                                                }}
                                                className="w-full mt-2 py-2 px-3 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 rounded-lg transition-all flex items-center justify-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                New Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Order Detail Modal */}
            {isModalOpen && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    statuses={defaultStatuses}
                    onClose={closeModal}
                    onStatusChange={handleStatusChange}
                    onFileUpload={handleFileUpload}
                    onAssigneeChange={handleAssigneeChange}
                    onProofUpdate={handleProofUpdate}
                    allOrders={orders}
                    onSelectOrder={(order) => setSelectedOrderId(order.id)}
                    userRole={role}
                    onDelete={handleDeleteOrder}
                    onUpdate={handleUpdateOrder}
                    onDuplicate={handleDuplicateOrder}
                />
            )}

            {/* NewOrderModal */}
            {isNewOrderModalOpen && (
                <NewOrderModal
                    isOpen={isNewOrderModalOpen}
                    onClose={() => {
                        setIsNewOrderModalOpen(false);
                        setNewOrderInitialData(undefined);
                    }}
                    onCreate={handleCreateOrder}
                    statuses={defaultStatuses}
                    initialData={newOrderInitialData}
                />
            )}
        </div>
    );
}
