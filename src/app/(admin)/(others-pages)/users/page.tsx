"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { User, roleLabels, roleColors, departments, formatDate } from "@/components/users/userData";
import { PlusIcon, CloseIcon } from "@/icons/index";
import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";
import Select from "@/components/form/Select";
import { toast } from "sonner";
import Pagination from "@/components/ui/pagination/Pagination";
import Spinner from "@/components/ui/spinner/Spinner";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { routePermissions, getAccessibleRoutes, UserRole } from "@/lib/permissions";

type ModalMode = "view" | "edit" | "create" | null;

const ITEMS_PER_PAGE = 20;

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                search: searchQuery,
            });

            if (roleFilter !== 'all') {
                params.append('role', roleFilter);
            }

            const res = await fetch(`/api/users?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch users');

            const result = await res.json();
            setUsers(result.data);
            setTotalItems(result.pagination.total);
        } catch (error) {
            console.error("Failed to load users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, roleFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleView = (user: User) => {
        setSelectedUser(user);
        setModalMode("view");
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData(user);
        setModalMode("edit");
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setFormData({ name: "", email: "", role: "staff", isActive: true, createdAt: new Date().toISOString() });
        setModalMode("create");
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        try {
            const res = await fetch(`/api/users/${pendingDeleteId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete user');
        } finally {
            setPendingDeleteId(null);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const method = modalMode === "edit" ? 'PUT' : 'POST';
            const url = modalMode === "edit" && selectedUser
                ? `/api/users/${selectedUser.id}`
                : '/api/users';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save user');
            }

            toast.success(modalMode === "edit" ? 'User updated successfully' : 'User created successfully');
            closeModal();
            fetchUsers();
        } catch (error: any) {
            console.error("Save error", error);
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedUser(null);
        setFormData({});
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">User Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage in-house team members and roles</p>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" /> Add User
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative max-w-md flex-1">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                    className="h-11 px-4 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center p-12">
                    <Spinner size="md" />
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell isHeader>User</TableCell>
                                <TableCell isHeader>Role</TableCell>
                                <TableCell isHeader>Department</TableCell>
                                <TableCell isHeader>Last Login</TableCell>
                                <TableCell isHeader>Status</TableCell>
                                <TableCell isHeader className="text-end">Actions</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <EmptyState title="No users found" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-semibold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge color={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-300">
                                            {user.department || "—"}
                                        </TableCell>
                                        <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                                            {formatDate(user.lastLogin)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge color={user.isActive ? "success" : "error"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleView(user)}
                                                    className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                                                    title="View"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                                                    title="Edit"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                                                    title="Delete"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M2.25 4.5H3.75H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* Modal */}
            {modalMode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                {modalMode === "view" ? "User Details" : modalMode === "edit" ? "Edit User" : "Add User"}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isSaving}>
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {modalMode === "view" && selectedUser ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-2xl font-semibold">
                                            {selectedUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xl font-semibold text-gray-800 dark:text-white">{selectedUser.name}</p>
                                            <p className="text-gray-500">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
                                            <p><Badge color={roleColors[selectedUser.role]}>{roleLabels[selectedUser.role]}</Badge></p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Department</label>
                                            <p className="text-gray-700 dark:text-gray-300">{selectedUser.department || "—"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                                            <p className="text-gray-700 dark:text-gray-300">{selectedUser.phone || "—"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                                            <p><Badge color={selectedUser.isActive ? "success" : "error"}>{selectedUser.isActive ? "Active" : "Inactive"}</Badge></p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Login</label>
                                            <p className="text-gray-700 dark:text-gray-300">{formatDate(selectedUser.lastLogin)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</label>
                                            <p className="text-gray-700 dark:text-gray-300">{formatDate(selectedUser.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                                            <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="John Doe" required />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                            <input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="john@company.com" required />
                                        </div>
                                        {modalMode === "create" && (
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                                                <input type="password" value={(formData as any).password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value } as any)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="••••••••" required />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                            <Select
                                                value={formData.role || "staff"}
                                                onChange={(value) => setFormData({ ...formData, role: value as User['role'] })}
                                                options={[
                                                    { value: "admin", label: "Administrator" },
                                                    { value: "manager", label: "Manager" },
                                                    { value: "staff", label: "Staff" },
                                                    { value: "viewer", label: "Viewer" },
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                            <Select
                                                value={formData.department || ""}
                                                onChange={(value) => setFormData({ ...formData, department: value || undefined })}
                                                placeholder="Select Department"
                                                options={departments.map(dept => ({ value: dept, label: dept }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workflow Role</label>
                                            <Select
                                                value={(formData as any).workflowRole || ""}
                                                onChange={(value) => setFormData({ ...formData, workflowRole: value || undefined } as any)}
                                                placeholder="Select Workflow Role"
                                                options={[
                                                    { value: "admin", label: "Admin (Full Access)" },
                                                    { value: "designer", label: "Designer" },
                                                    { value: "production", label: "Production" },
                                                    { value: "qc", label: "QC (Quality Control)" },
                                                ]}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Controls which production statuses this user can work on</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                            <input type="tel" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value || undefined })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="+60 12-345 6789" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="isActive" checked={formData.isActive ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
                                        <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                                    </div>

                                    {/* Feature Access Permissions */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Feature Access</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            Select which features this user can access. Leave empty to use role-based defaults.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                            {routePermissions.map((perm) => {
                                                const allowedRoutes = (formData as any).allowedRoutes || [];
                                                const isChecked = allowedRoutes.includes(perm.path);
                                                return (
                                                    <div key={perm.path} className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`perm-${perm.path}`}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const current = (formData as any).allowedRoutes || [];
                                                                if (e.target.checked) {
                                                                    setFormData({ ...formData, allowedRoutes: [...current, perm.path] } as any);
                                                                } else {
                                                                    setFormData({ ...formData, allowedRoutes: current.filter((r: string) => r !== perm.path) } as any);
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                                        />
                                                        <label htmlFor={`perm-${perm.path}`} className="text-xs text-gray-700 dark:text-gray-300">
                                                            {perm.label}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const role = (formData.role || 'staff') as UserRole;
                                                    setFormData({ ...formData, allowedRoutes: getAccessibleRoutes(role) } as any);
                                                }}
                                                className="text-xs px-2 py-1 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded"
                                            >
                                                Use Role Defaults
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, allowedRoutes: routePermissions.map(p => p.path) } as any)}
                                                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, allowedRoutes: [] } as any)}
                                                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" disabled={isSaving}>Cancel</button>
                            {modalMode !== "view" && (
                                <Button onClick={handleSave} loading={isSaving}>Save</Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ActionConfirmationModal
                isOpen={!!pendingDeleteId}
                onClose={() => setPendingDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
