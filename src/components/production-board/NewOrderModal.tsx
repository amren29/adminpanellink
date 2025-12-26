"use client";
import React, { useState } from "react";
import {
    ProductionOrder,
    Priority,
    ProductionStatus,
    OrderItem
} from "./productionData";
import { useSettingsStore } from "../settings/settingsData";
import { sampleProducts, Product } from "../products/productData";
import ProductSelectorModal from "./ProductSelectorModal";
import ProductConfigurationModal from "./ProductConfigurationModal";
import { CloseIcon, TrashBinIcon, PlusIcon } from "@/icons";
import { CustomDropdown } from "../ui/dropdown/CustomDropdown";
import Button from "@/components/ui/button/Button";
import { formatCurrency } from "@/components/products/productData";
import { useAgentContext } from "@/hooks/useAgentContext";
import Select from "../form/Select";
import { sampleAgents, Agent } from "../agents/agentData";

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (order: Omit<ProductionOrder, 'id' | 'proofHistory' | 'proofData'> | Omit<ProductionOrder, 'id' | 'proofHistory' | 'proofData'>[]) => void;
    statuses: ProductionStatus[];
    initialData?: Partial<ProductionOrder>;
}

import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";



export default function NewOrderModal({
    isOpen,
    onClose,
    onCreate,
    statuses,
    initialData
}: NewOrderModalProps) {
    const { departments } = useSettingsStore();

    // ... existing state
    const { agent } = useAgentContext();
    const [customerType, setCustomerType] = useState<'public' | 'agent'>('public');
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'invoice' | 'online' | 'wallet'>('invoice');
    const [assignees, setAssignees] = useState<Array<{ userId: string; role: string }>>([]);
    const [users, setUsers] = useState<{ id: string; name: string; workflowRole: string | null }[]>([]);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    // Fetch users for assignment (with workflowRole)
    React.useEffect(() => {
        if (isOpen) {
            fetch('/api/users?limit=100')
                .then(res => res.json())
                .then(data => {
                    const usersData = (data.data || []).map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        workflowRole: u.workflowRole || null
                    }));
                    setUsers(usersData);
                })
                .catch(console.error);
        }
    }, [isOpen]);

    const [formData, setFormData] = useState({
        orderNumber: initialData?.orderNumber || '',

        customerName: initialData?.customerName || '',
        departmentId: initialData?.departmentId || '',
        priority: initialData?.priority || 'normal' as Priority,
        status: 'new-order',
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        email: initialData?.customerEmail || '',
        notes: initialData?.notes || ''
    });

    // Items with support for product linking
    const [items, setItems] = useState<OrderItem[]>([{
        id: '1',
        name: '',
        quantity: 1,
        status: 'pending',
        departmentId: ''
    }]);

    // Selector State
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedProductForConfig, setSelectedProductForConfig] = useState<Product | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingSplitData, setPendingSplitData] = useState<{
        itemsByDept: Record<string, typeof items>;
        distinctDepts: string[];
        groupId: string;
    } | null>(null);

    // ... (useEffect reset logic)
    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                orderNumber: initialData?.orderNumber || '',
                customerName: initialData?.customerName || '',
                departmentId: initialData?.departmentId || '',
                priority: initialData?.priority || 'normal' as Priority,
                status: 'new-order',
                dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
                email: initialData?.customerEmail || '',
                notes: initialData?.notes || ''
            });

            if (initialData?.items && initialData.items.length > 0) {
                setItems(initialData.items);
            } else {
                setItems([{ id: '1', name: '', quantity: 1, status: 'pending', departmentId: '' }]);
            }
            setErrors({});
            setPendingSplitData(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    // ... (validate function)
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.orderNumber) newErrors.orderNumber = "Order Number is required";
        if (!formData.customerName) newErrors.customerName = "Customer Name is required";
        if (!formData.departmentId && items.every(i => !i.departmentId)) {
            newErrors.departmentId = "Department is required (or select products with departments)";
        }

        const validItems = items.filter(i => i.name.trim() !== '');
        if (validItems.length === 0) {
            newErrors.items = "At least one item with a name is required";
        }

        items.forEach((item, idx) => {
            if (!item.name) newErrors[`item-${idx}`] = "Product name required";
            if (item.quantity <= 0) newErrors[`qty-${idx}`] = "Invalid quantity";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ... (handlers for Product Selector)
    const handleAddProductClick = () => {
        setIsSelectorOpen(true);
    };

    const handleProductSelect = (product: Product) => {
        setIsSelectorOpen(false);
        setSelectedProductForConfig(product);
        setIsConfigOpen(true);
    };

    const handleConfigConfirm = (newItems: OrderItem[]) => {
        setItems(prevItems => {
            let updatedItems = [...prevItems];
            if (updatedItems.length === 1 && !updatedItems[0].name) {
                updatedItems = [];
            }
            return [...updatedItems, ...newItems];
        });

        setIsConfigOpen(false);
        setSelectedProductForConfig(null);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const processSplitOrder = () => {
        if (!pendingSplitData) return;

        const { itemsByDept, distinctDepts, groupId } = pendingSplitData;
        const ordersToCreate: Omit<ProductionOrder, 'id' | 'proofHistory' | 'proofData'>[] = [];

        distinctDepts.forEach((deptId, idx) => {
            const suffix = String.fromCharCode(65 + idx); // A, B, C...
            const deptItems = itemsByDept[deptId];
            const deptOrderNumber = `${formData.orderNumber}-${suffix}`;

            const splitTotal = deptItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

            ordersToCreate.push({
                ...formData,
                customerEmail: formData.email,
                orderNumber: deptOrderNumber,
                departmentId: deptId,
                items: deptItems,
                customerFiles: [],
                printFiles: [],
                history: [{
                    id: Math.random().toString(),
                    action: 'Order created (Split)',
                    userId: 'system',
                    userName: 'System',
                    userRole: 'system',
                    timestamp: new Date().toISOString(),
                    notes: `Split from main order, Group ID: ${groupId}`
                }],
                totalAmount: splitTotal,
                paidAmount: 0,
                groupId: groupId,
                assignees: assignees, // Multi-assignees
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        });

        ordersToCreate.forEach(async (o) => {
            await fetch('/api/notifications/create', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'order',
                    title: 'New Split Order',
                    message: `Order #${o.orderNumber} placed for ${o.customerName} (${o.departmentId})`,
                    link: `/`,
                    resourceId: o.orderNumber
                })
            });
        });

        onCreate(ordersToCreate);
        setIsConfirmModalOpen(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        const itemsByDept: Record<string, typeof items> = {};
        const defaultDept = formData.departmentId;

        items.filter(i => i.name).forEach(item => {
            const dept = item.departmentId || defaultDept;
            if (!dept) return;
            if (!itemsByDept[dept]) itemsByDept[dept] = [];
            itemsByDept[dept].push(item);
        });

        const distinctDepts = Object.keys(itemsByDept);

        if (distinctDepts.length > 1) {
            // Setup split data and show modal
            setPendingSplitData({
                itemsByDept,
                distinctDepts,
                groupId: `GRP-${Date.now()}`
            });
            setIsConfirmModalOpen(true);
        } else {
            // Single Order Logic
            const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

            // Trigger Notification
            await fetch('/api/notifications/create', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'order',
                    title: 'New Order Received',
                    message: `Order #${formData.orderNumber} placed for ${formData.customerName}`,
                    link: `/`,
                    resourceId: formData.orderNumber
                })
            });

            onCreate({
                ...formData,
                customerEmail: formData.email,
                items: items.filter(i => i.name),
                customerFiles: [],
                printFiles: [],
                history: [{
                    id: Math.random().toString(),
                    action: 'Order created',
                    userId: 'curr-user', // Mock
                    userName: 'Current User',
                    userRole: 'admin',
                    timestamp: new Date().toISOString()
                }],
                totalAmount: totalAmount,
                paidAmount: 0,
                paymentMethod: paymentMethod, // Pass payment method
                customerId: selectedAgent?.id, // Tagging the agent ID
                assignees: assignees, // Multi-assignees
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            onClose();
        }
    };

    // Handler for Agent Selection
    const handleAgentSelect = (agentId: string) => {
        const agent = sampleAgents.find(a => a.id === agentId);
        if (agent) {
            setSelectedAgent(agent);
            setFormData(prev => ({
                ...prev,
                customerName: agent.fullName,
                email: agent.email
            }));
            // Reset payment method if wallet balance insufficient (handled in render but good to reset state)
            if (agent.walletBalance <= 0) {
                setPaymentMethod('invoice');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create New Order</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <CloseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Number</label>
                            <input
                                type="text"
                                value={formData.orderNumber}
                                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 ${errors.orderNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                placeholder="ORD-2024-XXX"
                            />
                            {errors.orderNumber && <p className="text-xs text-red-500">{errors.orderNumber}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Department</label>
                            <CustomDropdown
                                value={formData.departmentId}
                                onChange={(val) => setFormData({ ...formData, departmentId: val as string })}
                                options={departments.map(d => ({ value: d.id, label: d.name }))}
                                placeholder="Select Department"
                            />
                            {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId}</p>}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>

                            {/* Customer Type Toggle */}
                            <div className="flex items-center gap-4 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="customerType"
                                        checked={customerType === 'public'}
                                        onChange={() => setCustomerType('public')}
                                        className="text-brand-500 focus:ring-brand-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Public / New</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="customerType"
                                        checked={customerType === 'agent'}
                                        onChange={() => setCustomerType('agent')}
                                        className="text-brand-500 focus:ring-brand-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Agent</span>
                                </label>
                            </div>

                            {customerType === 'public' ? (
                                <input
                                    type="text"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 ${errors.customerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                    placeholder="Client / Company Name"
                                />
                            ) : (
                                <Select
                                    value={selectedAgent?.id || ''}
                                    onChange={handleAgentSelect}
                                    options={sampleAgents.map(a => ({ value: a.id, label: `${a.fullName} (${a.agentCode})` }))}
                                    placeholder="Select Agent"
                                    className="w-full"
                                />
                            )}
                            {errors.customerName && <p className="text-xs text-red-500">{errors.customerName}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email (Optional)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="customer@example.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                            <CustomDropdown
                                value={formData.priority}
                                onChange={(val) => setFormData({ ...formData, priority: val as Priority })}
                                options={[
                                    { value: 'normal', label: 'Normal' },
                                    { value: 'high', label: 'High' },
                                    { value: 'urgent', label: 'Urgent' },
                                    { value: 'low', label: 'Low' },
                                ]}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Team (max 10)</label>

                            {/* Assigned Users Display - Avatar Chips */}
                            <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800 min-h-[80px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                                        {assignees.length} assigned {assignees.length >= 10 && <span className="text-orange-500">(max)</span>}
                                    </span>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                            disabled={assignees.length >= 10}
                                            className="px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-white dark:bg-gray-800 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Team
                                        </button>

                                        {/* Dropdown */}
                                        {showAssigneeDropdown && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Select Team Members</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Click to add/remove</p>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto p-2">
                                                    {['admin', 'designer', 'production', 'qc', null].map(roleGroup => {
                                                        const roleLabel = roleGroup === 'admin' ? '👑 Admin' :
                                                            roleGroup === 'designer' ? '🎨 Designers' :
                                                                roleGroup === 'production' ? '🏭 Production' :
                                                                    roleGroup === 'qc' ? '✅ QC Team' : '👤 Other Staff';
                                                        const usersInRole = users.filter(u => (u.workflowRole || null) === roleGroup);
                                                        if (usersInRole.length === 0) return null;

                                                        return (
                                                            <div key={roleGroup || 'other'} className="mb-2">
                                                                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                                                                    {roleLabel}
                                                                </div>
                                                                {usersInRole.map(user => {
                                                                    const isSelected = assignees.some(a => a.userId === user.id);
                                                                    return (
                                                                        <button
                                                                            key={user.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (isSelected) {
                                                                                    setAssignees(assignees.filter(a => a.userId !== user.id));
                                                                                } else if (assignees.length < 10) {
                                                                                    setAssignees([...assignees, { userId: user.id, role: user.workflowRole || 'production' }]);
                                                                                }
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-3 transition-all ${isSelected
                                                                                ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700'
                                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                                                }`}
                                                                        >
                                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${isSelected
                                                                                ? 'bg-brand-500 text-white'
                                                                                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                                                                }`}>
                                                                                {user.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <span className="flex-1 text-gray-800 dark:text-white">{user.name}</span>
                                                                            {isSelected && (
                                                                                <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                </svg>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Avatar Chips */}
                                {assignees.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {assignees.map((assignee) => {
                                            const user = users.find(u => u.id === assignee.userId);
                                            const displayName = user?.name || 'Unknown';
                                            const initial = displayName.charAt(0).toUpperCase();

                                            return (
                                                <div
                                                    key={assignee.userId}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-brand-200 dark:border-brand-700 shadow-sm group"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold">
                                                        {initial}
                                                    </div>
                                                    <span className="text-sm text-gray-800 dark:text-white font-medium">{displayName}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssignees(assignees.filter(a => a.userId !== assignee.userId))}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Remove assignee"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-3">
                                        <p className="text-sm text-gray-400">No one assigned yet</p>
                                        <p className="text-xs text-gray-300 dark:text-gray-500">Click "Add Team" to assign</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Items Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <h3 className="text-sm font-medium text-gray-800 dark:text-white">Order Items</h3>
                            {errors.items && <span className="text-xs text-red-500">{errors.items}</span>}
                        </div>

                        <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            {items.filter(i => i.name).length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-2">No items added yet.</p>
                            )}

                            {items.map((item, idx) => {
                                if (!item.name) return null;

                                const itemDept = item.departmentId ? departments.find(d => d.id === item.departmentId)?.name : 'Default';

                                return (
                                    <div key={idx} className="flex flex-col gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                                                {item.specifications && (
                                                    <p className="text-xs text-gray-500">{item.specifications}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-medium text-gray-900 dark:text-white">Qty: {item.quantity}</span>
                                                {(item as any).totalPrice && (
                                                    <span className="block text-xs text-gray-500">{formatCurrency((item as any).totalPrice)}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            {item.departmentId && (
                                                <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded font-medium">
                                                    {itemDept}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashBinIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleAddProductClick}
                                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg border border-dashed border-brand-200 dark:border-brand-800 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" /> Add Product from Catalog
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">General Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500"
                            placeholder="Delivery instructions, general remarks..."
                        />
                    </div>

                    {/* Payment Method - Only for Agents */}
                    {agent && agent.role === 'agent' && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            {/* ... (Existing payment UI logic) ... */}
                            {/* I will keep the original payment block here, simplified for diff brevity but assume it matches previous complete file */}
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Payment Method</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className={`border rounded-lg p-3 cursor-pointer transition-all ${paymentMethod === 'invoice' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                                    <input type="radio" name="payment" value="invoice" className="hidden" checked={paymentMethod === 'invoice'} onChange={() => setPaymentMethod('invoice')} />
                                    <div className="font-medium text-sm text-gray-900 dark:text-white">Invoice Later</div>
                                    <div className="text-xs text-gray-500">Pay upon receipt</div>
                                </label>

                                {/* Option 2: Online Payment */}
                                <label className={`
                                border rounded-lg p-3 cursor-pointer transition-all
                                ${paymentMethod === 'online'
                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                            `}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="online"
                                        className="hidden"
                                        checked={paymentMethod === 'online'}
                                        onChange={() => setPaymentMethod('online')}
                                    />
                                    <div className="font-medium text-sm text-gray-900 dark:text-white">FPX / Card</div>
                                    <div className="text-xs text-gray-500">Instant transfer</div>
                                </label>

                                {/* Option 3: Agent Wallet */}
                                {customerType === 'agent' && selectedAgent && (
                                    <label className={`
                                    border rounded-lg p-3 cursor-pointer transition-all relative overflow-hidden
                                    ${paymentMethod === 'wallet'
                                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                                    ${selectedAgent.walletBalance < (items.reduce((s, i) => s + (i.totalPrice || 0), 0)) ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}
                                `}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="wallet"
                                            className="hidden"
                                            disabled={selectedAgent.walletBalance < (items.reduce((s, i) => s + (i.totalPrice || 0), 0))}
                                            checked={paymentMethod === 'wallet'}
                                            onChange={() => setPaymentMethod('wallet')}
                                        />
                                        <div className="flex justify-between items-center">
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">Agent Wallet</div>
                                            <div className="text-xs font-bold text-brand-600">{formatCurrency(selectedAgent.walletBalance)}</div>
                                        </div>
                                        <div className="text-xs text-gray-500">Prepaid Credit</div>

                                        {/* Insufficient Balance Warning */}
                                        {selectedAgent.walletBalance < (items.reduce((s, i) => s + (i.totalPrice || 0), 0)) && (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-xs font-bold text-red-500">
                                                Insufficient Credit
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>
                            {/* Wallet Trap Message */}
                            {paymentMethod !== 'wallet' && customerType === 'agent' && selectedAgent && selectedAgent.walletBalance < (items.reduce((s, i) => s + (i.totalPrice || 0), 0)) && (
                                <p className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                    Tip: Top up your wallet to RM{formatCurrency(items.reduce((s, i) => s + (i.totalPrice || 0), 0))} to check out faster.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                        <Button variant="primary" type="submit">Create Order</Button>
                    </div>
                </form>
            </div>

            <ProductSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleProductSelect}
            />

            <ProductConfigurationModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                product={selectedProductForConfig}
                onConfirm={handleConfigConfirm}
            />

            <ActionConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={processSplitOrder}
                title="Split Order Confrimation"
                description={`This order involves ${pendingSplitData?.distinctDepts.length} different departments. The system will split this into ${pendingSplitData?.distinctDepts.length} separate linked orders. Do you want to proceed?`}
                confirmText="Proceed & Split"
                icon={
                    <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                }
            />
        </div>
    );
}
