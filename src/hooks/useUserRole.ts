"use client";

import { useSession } from "next-auth/react";

export type UserRole = "admin" | "manager" | "staff" | "viewer";
export type WorkflowRole = "admin" | "designer" | "production" | "qc" | null;

interface UseUserRoleResult {
    role: UserRole;
    workflowRole: WorkflowRole;
    allowedRoutes: string[];
    isAdmin: boolean;
    isManager: boolean;
    isStaff: boolean;
    isViewer: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    canAccessSettings: boolean;
    userId: string | null;
    userName: string | null;
    loading: boolean;
}

export function useUserRole(): UseUserRoleResult {
    const { data: session, status } = useSession();

    const role = (session?.user?.role || "staff") as UserRole;
    const workflowRole = (session?.user?.workflowRole || null) as WorkflowRole;
    const allowedRoutes = session?.user?.allowedRoutes || [];
    const loading = status === "loading";

    const isAdmin = role === "admin";
    const isManager = role === "manager";
    const isStaff = role === "staff";
    const isViewer = role === "viewer";

    return {
        role,
        workflowRole,
        allowedRoutes,
        isAdmin,
        isManager,
        isStaff,
        isViewer,
        // Permissions
        canCreate: isAdmin || isManager || isStaff,
        canEdit: isAdmin || isManager || isStaff,
        canDelete: isAdmin,
        canManageUsers: isAdmin,
        canAccessSettings: isAdmin || isManager,
        // User info
        userId: session?.user?.id || null,
        userName: session?.user?.name || null,
        loading,
    };
}


