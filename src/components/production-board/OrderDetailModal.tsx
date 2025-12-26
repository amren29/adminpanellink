"use client";
import React, { useRef, useState, useEffect } from "react";
import {
    ProductionOrder,
    ProductionStatus,
    FileAttachment,
    ArtworkProof,
    getStatusById,
    priorityColors,
    formatDateTime,
    formatDate,
} from "./productionData";
import { CloseIcon } from "@/icons";
import { CustomDropdown } from "../ui/dropdown/CustomDropdown";
import { useSettingsStore } from "../settings/settingsData";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import FileUploader from "../upload/FileUploader";
import { OrderComments } from "./OrderComments";

// Icons
const SortIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const TrashBinIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

interface OrderDetailModalProps {
    order: ProductionOrder;
    statuses: ProductionStatus[];
    onClose: () => void;
    onStatusChange: (orderId: string, newStatus: string, notes?: string) => void;
    onFileUpload?: (orderId: string, file: FileAttachment) => void;
    onAssigneeChange?: (orderId: string, assignee: string, assigneeName: string) => void;
    onProofUpdate?: (orderId: string, proof: ArtworkProof) => void;
    userRole?: string;
    onDelete?: (orderId: string) => void;
    onUpdate?: (updatedOrder: ProductionOrder) => void;
    onDuplicate?: (order: ProductionOrder) => void;
    allOrders?: ProductionOrder[];
    onSelectOrder?: (order: ProductionOrder) => void;
}

// Sample team members replaced by API fetch
// const teamMembers = [...]; // Removed

export default function OrderDetailModal({
    order,
    statuses,
    onClose,
    onStatusChange,
    onFileUpload,
    onAssigneeChange,
    onProofUpdate,
    userRole = 'admin',
    onDelete,
    onUpdate,
    onDuplicate,
    allOrders = [],
    onSelectOrder
}: OrderDetailModalProps) {
    const { departments } = useSettingsStore();
    const [isEditing, setIsEditing] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ id: string, name: string, role: string }[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users?active=true&limit=100');
                if (res.ok) {
                    const data = await res.json();
                    setTeamMembers(data.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch team members", err);
            }
        };
        fetchUsers();
    }, []);

    const getDepartmentName = (deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        return dept ? dept.name : deptId;
    };

    const [editedOrder, setEditedOrder] = useState(order);
    const [displayProof, setDisplayProof] = useState<ArtworkProof | undefined>(order.proofData);

    // Reset edited order and display proof when modal opens/order changes
    React.useEffect(() => {
        setEditedOrder(order);
        setDisplayProof(order.proofData);
    }, [order]);

    const handleSaveChanges = () => {
        if (onUpdate) {
            onUpdate(editedOrder);
            setIsEditing(false);
        }
    };

    const linkedOrders = React.useMemo(() => {
        if (!order.groupId || !allOrders) return [];
        return allOrders.filter(o => o.groupId === order.groupId && o.id !== order.id);
    }, [order.groupId, allOrders, order.id]);

    const isAdmin = userRole === 'admin';
    const canEdit = isAdmin && isEditing;
    const customerFileInputRef = useRef<HTMLInputElement>(null);
    const printFileInputRef = useRef<HTMLInputElement>(null);
    const proofFileInputRef = useRef<HTMLInputElement>(null);
    const [showMoveModal, setShowMoveModal] = useState<'next' | 'prev' | null>(null);
    const [moveNotes, setMoveNotes] = useState('');
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    // Alert Modal State
    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant?: 'default' | 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        description: '',
        variant: 'default'
    });

    const showAlert = (title: string, description: string, variant: 'default' | 'danger' | 'warning' = 'default') => {
        setAlertModal({ isOpen: true, title, description, variant });
    };

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleConfirmDelete = () => {
        if (onDelete) {
            onDelete(order.id);
            setShowDeleteConfirm(false);
        }
    };

    // Proof states
    const [proofDescription, setProofDescription] = useState(order.proofData?.description || '');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploadedProof, setUploadedProof] = useState<any>(null);
    const [showProofSection, setShowProofSection] = useState(false);
    const [generatedLink, setGeneratedLink] = useState(order.proofData?.generatedLink || '');

    const currentStatus = getStatusById(order.status);
    const currentIndex = statuses.findIndex(s => s.id === order.status);
    const nextStatus = currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;
    const prevStatus = currentIndex > 0 ? statuses[currentIndex - 1] : null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'customer' | 'print') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const newFile: FileAttachment = {
                id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                url: URL.createObjectURL(file),
                type: fileType,
                uploadedBy: 'Current User',
                uploadedAt: new Date().toISOString(),
            };
            onFileUpload?.(order.id, newFile);
        });

        // Reset input
        e.target.value = '';
    };

    const handleMoveWithNotes = () => {
        const targetStatus = showMoveModal === 'next' ? nextStatus : prevStatus;
        if (targetStatus) {
            onStatusChange(order.id, targetStatus.id, moveNotes || undefined);
        }
        setShowMoveModal(null);
        setMoveNotes('');
    };

    const handleAssigneeSelect = (memberId: string, memberName: string) => {
        onAssigneeChange?.(order.id, memberId, memberName);
        setShowAssigneeDropdown(false);
    };

    // Toggle assignee (add or remove)
    const handleAssigneeToggle = async (userId: string, userName: string, role: string) => {
        const isCurrentlyAssigned = order.assignees?.some(a => a.userId === userId);

        try {
            const res = await fetch(`/api/orders/${order.id}/assignments`, {
                method: isCurrentlyAssigned ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role })
            });

            if (res.ok) {
                const data = await res.json();
                // Update the order's assignees in the UI
                if (onUpdate && data.assignments) {
                    onUpdate({
                        ...order,
                        assignees: data.assignments.map((a: any) => ({
                            userId: a.userId,
                            role: a.role,
                            user: a.user
                        }))
                    });
                }
            } else {
                showAlert('Error', 'Failed to update assignment', 'danger');
            }
        } catch (error) {
            console.error('Error toggling assignee:', error);
            showAlert('Error', 'Failed to update assignment', 'danger');
        }
    };

    const handleProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setProofFile(files[0]);
        }
    };

    const handleGenerateLink = async () => {
        if (!proofDescription.trim()) {
            showAlert('Missing Description', 'Please add a description for the proof.', 'warning');
            return;
        }

        try {
            // Save proof to database
            const response = await fetch('/api/proofs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    description: proofDescription,
                    proofFileUrl: uploadedProof?.url || (proofFile ? URL.createObjectURL(proofFile) : undefined),
                    proofFileName: uploadedProof?.name || proofFile?.name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                showAlert('Error', errorData.error || 'Failed to generate proof', 'danger');
                return;
            }

            const savedProof = await response.json();
            const link = savedProof.generatedLink || `${window.location.origin}/proof-review?id=${savedProof.approvalLink}`;
            setGeneratedLink(link);

            // Create local proof data for UI updates
            const proof: ArtworkProof = {
                id: savedProof.approvalLink,
                version: savedProof.version,
                description: proofDescription,
                proofFileUrl: savedProof.proofFileUrl,
                proofFileName: savedProof.proofFileName,
                generatedLink: link,
                status: 'pending',
                createdAt: savedProof.createdAt,
                updatedAt: savedProof.updatedAt,
            };

            onProofUpdate?.(order.id, proof);

            // Reset form
            setProofDescription('');
            setProofFile(null);
            setUploadedProof(null);
            setShowProofSection(false);

            // Copy link to clipboard
            navigator.clipboard.writeText(link);
            showAlert('Proof Generated', `Proof v${savedProof.version} generated and link copied to clipboard!`, 'default');
        } catch (error) {
            console.error('Error generating proof:', error);
            showAlert('Error', 'Failed to generate proof link', 'danger');
        }
    };

    const linkedOrdersSection = linkedOrders.length > 0 ? (
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Linked Orders (Same Group)
            </h3>
            <div className="space-y-2">
                {linkedOrders.map(lo => {
                    const loStatus = statuses.find(s => s.id === lo.status);
                    return (
                        <div
                            key={lo.id}
                            onClick={() => onSelectOrder?.(lo)}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-indigo-100 dark:border-indigo-900/50 cursor-pointer hover:border-indigo-300 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{lo.orderNumber}</span>
                                <span className="text-xs text-gray-500">- {lo.items.map(i => i.name).join(', ')}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${loStatus?.bgColor} ${loStatus?.color}`}>
                                {loStatus?.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    ) : null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {order.orderNumber}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${currentStatus?.bgColor} ${currentStatus?.color}`}>
                            {currentStatus?.name}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[order.priority].bg} ${priorityColors[order.priority].text}`}>
                            {order.priority.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && !isEditing && (
                            <>
                                <button
                                    onClick={() => onDuplicate?.(order)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                                    title="Create a new ticket with same customer details"
                                >
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicate
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-brand-200"
                                >
                                    Edit Order
                                </button>
                            </>
                        )}
                        {isAdmin && isEditing && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5">
                    {/* Left: Order Details */}
                    <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">

                        {/* Linked Orders Section */}
                        {linkedOrdersSection}

                        {/* Mixed Order Items List (Group View) */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    Order Items
                                    {linkedOrders.length > 0 && (
                                        <span className="text-[10px] font-normal px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full border border-brand-200">
                                            Jobsheet View (All Items)
                                        </span>
                                    )}
                                </h2>
                                {canEdit && isEditing && (
                                    <button
                                        onClick={() => setEditedOrder({
                                            ...editedOrder,
                                            items: [...editedOrder.items, { id: `new-${Date.now()}`, name: '', quantity: 1, specifications: '' }]
                                        })}
                                        className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                                    >
                                        <PlusIcon className="w-3 h-3" /> Add Item
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    // Prepare Mixed List
                                    const currentItems = isEditing ? editedOrder.items : order.items;
                                    const currentMeta = currentItems.map((item, idx) => ({
                                        ...item,
                                        _source: 'current',
                                        _originalIndex: idx,
                                        _order: order
                                    }));

                                    const linkedMeta = linkedOrders.flatMap(lo =>
                                        lo.items.map((item, idx) => ({
                                            ...item,
                                            _source: 'linked',
                                            _originalIndex: idx,
                                            _order: lo
                                        }))
                                    );

                                    // Sort by Order Number + Department
                                    const allItems = [...currentMeta, ...linkedMeta].sort((a, b) =>
                                        a._order.orderNumber.localeCompare(b._order.orderNumber)
                                    );

                                    return allItems.map((item, displayKey) => {
                                        const isCurrent = item._source === 'current';

                                        return (
                                            <div
                                                key={`${item._order.id}-${item._originalIndex}-${displayKey}`}
                                                className={`p-4 rounded-lg border transition-all ${isCurrent
                                                    ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 opacity-80 hover:opacity-100' // Distinct look for linked
                                                    }`}
                                            >
                                                {/* Badge for Ticket identification */}
                                                {linkedOrders.length > 0 && (
                                                    <div className="mb-3 flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/50 dashed">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isCurrent
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                                }`}>
                                                                {isCurrent ? 'Current Ticket' : 'Linked Ticket'}
                                                            </span>
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                {item._order.orderNumber} • {getDepartmentName(item._order.departmentId || '')}
                                                            </span>
                                                            {/* Show Status for Linked Tickets */}
                                                            {!isCurrent && (() => {
                                                                const st = statuses.find(s => s.id === item._order.status);
                                                                return st ? (
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${st.bgColor} ${st.color} ml-1`}>
                                                                        {st.name}
                                                                    </span>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                        {!isCurrent && (
                                                            <button
                                                                onClick={() => onSelectOrder?.(item._order)}
                                                                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 hover:text-brand-600 hover:border-brand-300 shadow-sm transition-colors"
                                                            >
                                                                Switch to Order ↗
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                    {/* Name & Quantity */}
                                                    <div className="md:col-span-8 space-y-2">
                                                        <div className="flex gap-2">
                                                            <div className="flex-grow">
                                                                <label className="text-xs text-gray-400 block mb-1">Product Name</label>
                                                                {canEdit && isCurrent && isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={item.name}
                                                                        onChange={(e) => {
                                                                            const newItems = [...editedOrder.items];
                                                                            newItems[item._originalIndex] = { ...item, name: e.target.value };
                                                                            setEditedOrder({ ...editedOrder, items: newItems });
                                                                        }}
                                                                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm"
                                                                    />
                                                                ) : (
                                                                    <p className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                                                                        {item.name}
                                                                        {item.productName && item.productName !== item.name && (
                                                                            <span className="text-[10px] text-gray-400 font-normal">({item.productName})</span>
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="w-20">
                                                                <label className="text-xs text-gray-400 block mb-1">Qty</label>
                                                                {canEdit && isCurrent && isEditing ? (
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={item.quantity}
                                                                        onChange={(e) => {
                                                                            const newItems = [...editedOrder.items];
                                                                            newItems[item._originalIndex] = { ...item, quantity: parseInt(e.target.value) || 0 };
                                                                            setEditedOrder({ ...editedOrder, items: newItems });
                                                                        }}
                                                                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm"
                                                                    />
                                                                ) : (
                                                                    <p className="font-medium text-gray-800 dark:text-white text-center bg-white dark:bg-gray-600 rounded px-2 py-0.5 border border-gray-200 dark:border-gray-500">
                                                                        {item.quantity}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Specifications */}
                                                    <div className="md:col-span-12">
                                                        <label className="text-xs text-gray-400 block mb-1">Specifications</label>
                                                        {canEdit && isCurrent && isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={item.specifications || ''}
                                                                onChange={(e) => {
                                                                    const newItems = [...editedOrder.items];
                                                                    newItems[item._originalIndex] = { ...item, specifications: e.target.value };
                                                                    setEditedOrder({ ...editedOrder, items: newItems });
                                                                }}
                                                                className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                                                {item.specifications || 'No specs provided'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {canEdit && isCurrent && isEditing && editedOrder.items.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            const newItems = editedOrder.items.filter((_, i) => i !== item._originalIndex);
                                                            setEditedOrder({ ...editedOrder, items: newItems });
                                                        }}
                                                        className="text-xs text-red-500 hover:underline mt-2 flex items-center gap-1"
                                                    >
                                                        <TrashBinIcon className="w-3 h-3" /> Remove Item
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Global Order Fields */}
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Due Date</label>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {canEdit ? (
                                            <input
                                                type="date"
                                                value={editedOrder.dueDate}
                                                onChange={(e) => setEditedOrder({ ...editedOrder, dueDate: e.target.value })}
                                                className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700"
                                            />
                                        ) : formatDate(order.dueDate)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Customer</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Name</label>
                                    <p className="text-gray-800 dark:text-white">{order.customerName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                                    <p className="text-gray-800 dark:text-white">{order.customerEmail}</p>
                                </div>
                                {order.customerPhone && (
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">Phone</label>
                                        <p className="text-gray-800 dark:text-white">{order.customerPhone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Delivery Details</h3>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Method</label>
                                <p className="text-gray-800 dark:text-white capitalize flex items-center gap-2">
                                    {order.deliveryMethod === 'pickup' ? 'Self Pickup' : order.deliveryMethod === 'courier' ? 'Courier Shipping' : order.deliveryMethod || 'Standard Delivery'}
                                    {order.deliveryMethod === 'courier' && <span className="text-lg">Courier</span>}
                                    {order.deliveryMethod === 'pickup' && <span className="text-lg">Pickup</span>}
                                </p>
                            </div>
                        </div>

                        {/* Assignee Section - Multi-assignee */}
                        <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-300">Assigned To</h3>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                        className="px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-white dark:bg-gray-800 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 flex items-center gap-1.5"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Team
                                    </button>

                                    {/* Multi-Assignee Dropdown */}
                                    {showAssigneeDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Assignees</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Click to add/remove</p>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto p-2">
                                                {teamMembers.map(member => {
                                                    const isAssigned = order.assignees?.some(a => a.userId === member.id);
                                                    return (
                                                        <button
                                                            key={member.id}
                                                            onClick={() => handleAssigneeToggle(member.id, member.name, member.role)}
                                                            className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-3 transition-all ${isAssigned
                                                                ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isAssigned
                                                                ? 'bg-brand-500 text-white'
                                                                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                                                }`}>
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-gray-800 dark:text-white font-medium block truncate">{member.name}</span>
                                                                <span className="text-xs text-gray-400 capitalize">{member.role || 'Staff'}</span>
                                                            </div>
                                                            {isAssigned && (
                                                                <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Assigned Users Display - Avatars in a row */}
                            {order.assignees && order.assignees.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {order.assignees.map((assignee) => {
                                        const user = assignee.user;
                                        const displayName = user?.name || 'Unknown';
                                        const initial = displayName.charAt(0).toUpperCase();

                                        return (
                                            <div
                                                key={assignee.userId}
                                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-brand-200 dark:border-brand-700 shadow-sm group"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                                                    {initial}
                                                </div>
                                                <span className="text-sm text-gray-800 dark:text-white font-medium">{displayName}</span>
                                                <button
                                                    onClick={() => handleAssigneeToggle(assignee.userId, displayName, assignee.role)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-500">No one assigned yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Click &quot;Add Team&quot; to assign</p>
                                </div>
                            )}
                        </div>

                        {/* Artwork Proof Section */}
                        {order.status === 'new-order' ? (
                            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 opacity-60">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Artwork Proof</h3>
                                    <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 rounded">
                                        Disabled
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Artwork proof will be available once the order moves to Artwork Checking or Designing.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Artwork Proof</h3>
                                        {displayProof?.version && (
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${displayProof.id === order.proofData?.id
                                                ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/50'
                                                : 'text-gray-600 bg-gray-200 dark:bg-gray-700'
                                                }`}>
                                                v{displayProof.version} {displayProof.id !== order.proofData?.id && '(Historical)'}
                                            </span>
                                        )}
                                        {(order.proofHistory?.length || 0) > 0 && (
                                            <span className="text-xs text-gray-500">
                                                ({order.proofHistory!.length} revision{order.proofHistory!.length > 1 ? 's' : ''})
                                            </span>
                                        )}
                                    </div>
                                    {/* Show Create Proof button - also when revision requested */}
                                    {(!showProofSection && !generatedLink) || displayProof?.status === 'needs-revision' ? (
                                        <button
                                            onClick={() => {
                                                setShowProofSection(true);
                                                setGeneratedLink(''); // Clear to show form
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50"
                                        >
                                            {displayProof?.status === 'needs-revision' ? '+ Upload Revision' : '+ Create Proof'}
                                        </button>
                                    ) : null}
                                </div>

                                {/* Show existing proof link */}
                                {generatedLink && !showProofSection && (
                                    <div className="space-y-3">
                                        {/* Approval Status Banner */}
                                        {/* Approval Status Banner using displayProof */}
                                        {!displayProof ? (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 border-dashed">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">No proof generated yet</p>
                                                    <p className="text-xs text-gray-400">Create a proof to send to customer</p>
                                                </div>
                                            </div>
                                        ) : displayProof.status === 'approved' ? (
                                            <div className="flex items-center gap-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-green-800 dark:text-green-300">PROOF APPROVED</p>
                                                    <p className="text-xs text-green-600 dark:text-green-400">Customer approved version {displayProof.version}</p>
                                                </div>
                                            </div>
                                        ) : displayProof.status === 'needs-revision' ? (
                                            <div className="flex items-center gap-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300">REVISION REQUESTED</p>
                                                    <p className="text-xs text-orange-600 dark:text-orange-400">Customer feedback received</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">AWAITING APPROVAL</p>
                                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Proof sent to customer for review</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Inline Image Preview */}
                                        {(displayProof?.imageUrl || displayProof?.proofFileUrl) && (
                                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={displayProof.imageUrl || displayProof.proofFileUrl}
                                                    alt={`Proof v${displayProof.version}`}
                                                    className="w-full h-auto max-h-64 object-contain mx-auto"
                                                    onError={(e) => {
                                                        // Fallback for non-image files or failed loads
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement?.classList.add('hidden');
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Proof Link */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={(displayProof?.id === order.proofData?.id && generatedLink) ? generatedLink : (displayProof?.approvalLink ? `${typeof window !== 'undefined' ? window.location.origin : ''}/proof-review?id=${displayProof.approvalLink}` : displayProof?.generatedLink || '')}
                                                className="flex-1 text-sm bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-700 rounded px-3 py-2 text-gray-700 dark:text-gray-300"
                                            />
                                            <button
                                                onClick={() => {
                                                    const link = (displayProof?.id === order.proofData?.id && generatedLink) ? generatedLink : (displayProof?.approvalLink ? `${window.location.origin}/proof-review?id=${displayProof.approvalLink}` : displayProof?.generatedLink || '');
                                                    navigator.clipboard.writeText(link);
                                                    showAlert('Copied!', 'Proof link copied to clipboard.', 'default');
                                                }}
                                                className="px-3 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded hover:bg-purple-50"
                                            >
                                                Copy
                                            </button>

                                            {displayProof?.proofFileUrl && (
                                                <a
                                                    href={displayProof.proofFileUrl.startsWith('http') || displayProof.proofFileUrl.startsWith('blob:')
                                                        ? displayProof.proofFileUrl
                                                        : `/api/upload/download?key=${encodeURIComponent(displayProof.proofFileUrl)}&filename=${encodeURIComponent(displayProof.proofFileName || 'proof')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                                                    title="Download Original File"
                                                >
                                                    <DownloadIcon className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Download</span>
                                                </a>
                                            )}

                                            <a
                                                href={(displayProof?.id === order.proofData?.id && generatedLink) ? generatedLink : (displayProof?.approvalLink ? `${typeof window !== 'undefined' ? window.location.origin : ''}/proof-review?id=${displayProof.approvalLink}` : displayProof?.generatedLink || '')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 text-sm font-medium text-white bg-purple-500 rounded hover:bg-purple-600"
                                            >
                                                Preview
                                            </a>
                                        </div>
                                        {(displayProof?.description || proofDescription) && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 italic">&quot;{displayProof?.id === order.proofData?.id ? proofDescription : displayProof?.description}&quot;</p>
                                        )}

                                        {/* Customer Comment if revision requested */}
                                        {displayProof?.status === 'needs-revision' && displayProof?.customerComment && (
                                            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                                                <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Customer Feedback:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 italic">&quot;{displayProof.customerComment}&quot;</p>
                                            </div>
                                        )}

                                        {/* Jobsheet Download Button - Only visible when proof is approved */}
                                        {displayProof?.status === 'approved' && displayProof.id === order.proofData?.id && (
                                            <div className="pt-2 border-t border-green-200 dark:border-green-800">
                                                <a
                                                    href={`/jobsheet?id=${order.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-md"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    Download Production Jobsheet
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Revision History */}
                                {(order.proofHistory?.length || 0) > 0 && !showProofSection && (
                                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById(`proof-history-${order.id}`);
                                                if (el) el.classList.toggle('hidden');
                                            }}
                                            className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            View Revision History ({order.proofHistory!.length})
                                        </button>
                                        <div id={`proof-history-${order.id}`} className="hidden mt-3 space-y-2">
                                            {order.proofHistory!.slice().reverse().map((oldProof, idx) => (
                                                <div
                                                    key={`${oldProof.id}-${idx}`}
                                                    className={`p-3 rounded-lg border cursor-pointer hover:border-purple-300 transition-colors ${displayProof?.id === oldProof.id
                                                        ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300'
                                                        : 'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600'
                                                        }`}
                                                    onClick={() => setDisplayProof(oldProof)}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                                            Version {oldProof.version}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {/* Jobsheet Download for Approved History Items */}
                                                            {oldProof.status === 'approved' && (
                                                                <a
                                                                    href={`/jobsheet?id=${order.id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                                                    title="Download Jobsheet"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                                    </svg>
                                                                </a>
                                                            )}
                                                            {(oldProof.proofFileUrl || oldProof.generatedLink) && (
                                                                <a
                                                                    href={oldProof.proofFileUrl || oldProof.generatedLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                                                                    title="Open Proof Link"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                    Open
                                                                </a>
                                                            )}
                                                            <span className={`px-2 py-0.5 text-xs rounded ${oldProof.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                oldProof.status === 'needs-revision' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {oldProof.status === 'needs-revision' ? 'Revision Requested' : oldProof.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{oldProof.description}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(oldProof.createdAt)}</p>
                                                    {oldProof.customerComment && (
                                                        <p className="text-xs text-orange-600 mt-1 italic">Feedback: &quot;{oldProof.customerComment}&quot;</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Show create proof form */}
                                {showProofSection && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Description / Notes for Customer
                                            </label>
                                            <textarea
                                                value={proofDescription}
                                                onChange={(e) => setProofDescription(e.target.value)}
                                                placeholder="Describe the proof details, paper type, colors, sizes, and any important notes for the customer to check..."
                                                rows={3}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Upload Proof File (PDF recommended)
                                            </label>

                                            {!proofFile && !uploadedProof ? (
                                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-1">
                                                    <FileUploader
                                                        orderId={order.id}
                                                        fileType="proof"
                                                        maxSizeMB={500}
                                                        accept=".pdf,.png,.jpg,.jpeg,.ai,.psd"
                                                        onUploadComplete={(file) => {
                                                            setUploadedProof(file);
                                                            // Also set as generic file attachment if needed
                                                            onFileUpload?.(order.id, file as any);
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                    <div className="w-10 h-10 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                            {uploadedProof?.name || proofFile?.name}
                                                        </p>
                                                        <p className="text-xs text-green-600 dark:text-green-400">
                                                            {uploadedProof ? 'Upload complete' : 'Ready to upload'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setProofFile(null);
                                                            setUploadedProof(null);
                                                        }}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <CloseIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setShowProofSection(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleGenerateLink}
                                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                Generate Proof Link
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Empty state */}
                                {!showProofSection && !generatedLink && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Create a proof with description and generate a link to send to the customer for approval.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Files Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Files</h3>
                            </div>

                            {/* File Uploader */}
                            <div className="mb-4">
                                <FileUploader
                                    orderId={order.id}
                                    fileType="customer"
                                    onUploadComplete={(file) => onFileUpload?.(order.id, file as any)}
                                />
                            </div>
                            <div className="space-y-2">
                                {(order.customerFiles || []).length === 0 && (order.printFiles || []).length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No files attached</p>
                                ) : (
                                    [...(order.customerFiles || []), ...(order.printFiles || [])].map((file, idx) => {
                                        // Determine download URL
                                        const downloadUrl = file.url.startsWith('http') || file.url.startsWith('blob:')
                                            ? file.url
                                            : `/api/upload/download?key=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(file.name)}`;

                                        return (
                                            <div key={file.id || idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-100 dark:border-gray-700 group">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <a
                                                        href={downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
                                                        title={file.name}
                                                    >
                                                        {file.name}
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{file.type}</span>
                                                    <a
                                                        href={downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                                                        title="Download File"
                                                    >
                                                        <DownloadIcon className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Order Comments Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <OrderComments orderId={order.id} />
                        </div>
                    </div>

                    {/* Right: History & Actions */}
                    <div className="space-y-6 order-1 lg:order-2">
                        {/* Status Change - Only show if not editing */}
                        {!isEditing && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Update Status</h3>
                                <div className="space-y-3">
                                    <CustomDropdown
                                        options={statuses.map(s => ({
                                            id: s.id,
                                            label: s.name,
                                            value: s.id,
                                            color: s.color,
                                            bgColor: s.bgColor
                                        }))}
                                        value={order.status}
                                        onChange={(newStatus) => onStatusChange(order.id, newStatus)}
                                        placeholder="Select Status"
                                    />

                                    {/* Quick Moves */}
                                    <div className="flex gap-2">
                                        {prevStatus && (
                                            <button
                                                onClick={() => setShowMoveModal('prev')}
                                                className="flex-1 py-1.5 px-3 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                            >
                                                ← {prevStatus.name}
                                            </button>
                                        )}
                                        {nextStatus && (
                                            <button
                                                onClick={() => setShowMoveModal('next')}
                                                className="flex-1 py-1.5 px-3 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
                                            >
                                                {nextStatus.name} →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent History */}
                        <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timeline</h3>
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
                                {(order.history || []).map((event, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-800"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-800 dark:text-gray-300">
                                                <span className="font-medium">{event.action}</span>
                                            </p>
                                            {event.notes && (
                                                <p className="text-xs text-gray-500 italic mt-0.5">&quot;{event.notes}&quot;</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400">{formatDateTime(event.timestamp)}</span>
                                                <span className="text-[10px] text-gray-400">•</span>
                                                <span className="text-[10px] text-gray-500 font-medium">{event.userName}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!order.history || order.history.length === 0) && (
                                    <p className="text-xs text-gray-400 italic">No history recorded yet</p>
                                )}
                            </div>
                        </div>

                        {/* Delete Order Button */}
                        {isAdmin && onDelete && (
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    Delete Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Move Status Modal */}
            {
                showMoveModal && (
                    <div className="fixed inset-0 bg-black/60 z-[100000] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Move to {showMoveModal === 'next' ? nextStatus?.name : prevStatus?.name}?
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                You can add a note about this status change.
                            </p>
                            <textarea
                                value={moveNotes}
                                onChange={(e) => setMoveNotes(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg mb-4 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="Optional notes..."
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => { setShowMoveModal(null); setMoveNotes(''); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMoveWithNotes}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
                                >
                                    Confirm Move
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Alert Modal */}
            <ActionConfirmationModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                description={alertModal.description}
                confirmText="OK"
                variant={alertModal.variant}
                showCancelButton={false}
            />

            {/* Delete Confirmation Modal */}
            <ActionConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Order"
                description="Are you sure you want to delete this order? This action cannot be undone."
                confirmText="Delete Order"
                cancelText="Cancel"
                variant="danger"
            />
        </div >
    );
}
