"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

// Role definitions
const roles = [
    { id: 'admin', name: 'Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'designer', name: 'Designer', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
    { id: 'production', name: 'Production', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'qc', name: 'QC', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
];

// Status definitions with default allowed roles
interface WorkflowStatus {
    id: string;
    name: string;
    color: string;
    order: number;
    allowedRoles: string[];
    description: string;
}

const defaultWorkflowStatuses: WorkflowStatus[] = [
    { id: 'new-order', name: 'New Order', color: 'bg-blue-500', order: 1, allowedRoles: ['admin'], description: 'Verify payment received' },
    { id: 'artwork-checking', name: 'Artwork Checking', color: 'bg-purple-500', order: 2, allowedRoles: ['admin'], description: 'Review customer files' },
    { id: 'designing', name: 'Designing', color: 'bg-pink-500', order: 3, allowedRoles: ['designer'], description: 'Create print-ready artwork with bleed' },
    { id: 'refining', name: 'Refining', color: 'bg-orange-500', order: 4, allowedRoles: ['designer'], description: 'Revise based on customer feedback' },
    { id: 'waiting-feedback', name: 'Waiting Customer Feedback', color: 'bg-yellow-500', order: 5, allowedRoles: ['admin'], description: 'Customer reviews proof' },
    { id: 'ready-to-print', name: 'Ready to Print', color: 'bg-cyan-500', order: 6, allowedRoles: ['production'], description: 'Download print files' },
    { id: 'in-production', name: 'In Production', color: 'bg-indigo-500', order: 7, allowedRoles: ['production'], description: 'Printing in progress' },
    { id: 'finishing', name: 'Finishing', color: 'bg-teal-500', order: 8, allowedRoles: ['production'], description: 'Post-print finishing' },
    { id: 'completed', name: 'Completed', color: 'bg-green-500', order: 9, allowedRoles: ['qc'], description: 'Quality check complete' },
    { id: 'collected', name: 'Collected', color: 'bg-gray-500', order: 10, allowedRoles: ['qc'], description: 'Customer picked up / delivered' },
];

export default function WorkflowSettingsPage() {
    const [statuses, setStatuses] = useState<WorkflowStatus[]>(defaultWorkflowStatuses);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load settings from API on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/workflow-settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setStatuses(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to load workflow settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const toggleRole = (statusId: string, roleId: string) => {
        setStatuses(statuses.map(status => {
            if (status.id === statusId) {
                const currentRoles = status.allowedRoles;
                if (currentRoles.includes(roleId)) {
                    // Don't allow removing all roles
                    if (currentRoles.length === 1) return status;
                    return { ...status, allowedRoles: currentRoles.filter(r => r !== roleId) };
                } else {
                    return { ...status, allowedRoles: [...currentRoles, roleId] };
                }
            }
            return status;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/workflow-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statuses })
            });

            if (res.ok) {
                toast.success('Workflow settings saved successfully!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving workflow settings:', error);
            toast.error('Failed to save workflow settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setStatuses(defaultWorkflowStatuses);
        toast.info('Settings reset to defaults. Click Save to apply.');
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Workflow Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure production workflow statuses and role permissions
                    </p>
                </div>
                <nav>
                    <ol className="flex items-center gap-2 text-sm">
                        <li><a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Home</a></li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li><a href="/settings" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Settings</a></li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li className="text-brand-500">Workflow</li>
                    </ol>
                </nav>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
                    Loading workflow settings...
                </div>
            )}

            {/* Role Legend */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Roles</h3>
                <div className="flex flex-wrap gap-3">
                    {roles.map(role => (
                        <div key={role.id} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${role.color}`}>
                            {role.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Workflow Statuses Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Production Statuses</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click on roles to toggle access for each status</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12">
                                    #
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Allowed Roles
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {statuses.map((status) => (
                                <tr key={status.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {status.order}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                                            <span className="text-sm font-medium text-gray-800 dark:text-white">
                                                {status.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {status.description}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {roles.map(role => {
                                                const isActive = status.allowedRoles.includes(role.id);
                                                return (
                                                    <button
                                                        key={role.id}
                                                        onClick={() => toggleRole(status.id, role.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                                                            ? role.color
                                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 opacity-50 hover:opacity-75'
                                                            }`}
                                                    >
                                                        {role.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                    <button
                        onClick={handleReset}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 shadow-theme-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">How Role Permissions Work</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li><strong>Admin</strong> - Can view all statuses, verify payments, manage proofs</li>
                    <li><strong>Designer</strong> - Access to designing and refining stages, upload artwork</li>
                    <li><strong>Production</strong> - Handle printing, finishing, and production stages</li>
                    <li><strong>QC</strong> - Quality control, mark orders as complete and collected</li>
                </ul>
            </div>
        </div>
    );
}
