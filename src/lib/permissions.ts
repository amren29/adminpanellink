// Role-based permissions configuration
// Used by middleware for route protection and sidebar for menu visibility

export type UserRole = "admin" | "manager" | "staff" | "viewer";

export interface RoutePermission {
    path: string;
    allowedRoles: UserRole[];
    label: string; // For sidebar display
}

// Define which roles can access which routes
export const routePermissions: RoutePermission[] = [
    // Admin-only routes
    { path: "/users", allowedRoles: ["admin"], label: "Users" },
    { path: "/settings", allowedRoles: ["admin"], label: "Settings" },
    { path: "/workflow-settings", allowedRoles: ["admin"], label: "Workflow Settings" },

    // Admin & Manager routes
    { path: "/dashboard", allowedRoles: ["admin", "manager"], label: "Dashboard" },
    { path: "/customers", allowedRoles: ["admin", "manager"], label: "Customers" },
    { path: "/agents", allowedRoles: ["admin", "manager"], label: "Agents" },
    { path: "/products", allowedRoles: ["admin", "manager"], label: "Products" },
    { path: "/invoices", allowedRoles: ["admin", "manager"], label: "Invoices" },
    { path: "/quotes", allowedRoles: ["admin", "manager"], label: "Quotes" },
    { path: "/payments", allowedRoles: ["admin", "manager"], label: "Payments" },
    { path: "/promotions", allowedRoles: ["admin", "manager"], label: "Promotions" },
    { path: "/packages", allowedRoles: ["admin", "manager"], label: "Packages" },
    { path: "/reports", allowedRoles: ["admin", "manager"], label: "Reports" },
    { path: "/finance", allowedRoles: ["admin", "manager"], label: "Finance" },
    { path: "/shipments", allowedRoles: ["admin", "manager"], label: "Shipments" },

    // Staff can access these (production team)
    { path: "/production-board", allowedRoles: ["admin", "manager", "staff"], label: "Production Board" },
    { path: "/orders", allowedRoles: ["admin", "manager", "staff"], label: "Orders" },
    { path: "/profile", allowedRoles: ["admin", "manager", "staff", "viewer"], label: "Profile" },
];

// Helper function to check if a role can access a route
// If customRoutes is provided and not empty, it overrides role-based defaults
export function canAccessRoute(role: UserRole, pathname: string, customRoutes?: string[]): boolean {
    // Root path is accessible to all authenticated users
    if (pathname === "/" || pathname === "") {
        return true;
    }

    // If user has custom routes defined, use those instead of role-based
    if (customRoutes && customRoutes.length > 0) {
        return customRoutes.some(route => pathname.startsWith(route));
    }

    // Find matching permission
    const permission = routePermissions.find(p => pathname.startsWith(p.path));

    // If no specific permission defined, default to admin-only
    if (!permission) {
        return role === "admin";
    }

    return permission.allowedRoles.includes(role);
}

// Helper function to get accessible routes for a role (for sidebar filtering)
export function getAccessibleRoutes(role: UserRole): string[] {
    return routePermissions
        .filter(p => p.allowedRoles.includes(role))
        .map(p => p.path);
}

// Sidebar menu items with role requirements
export const sidebarPermissions: Record<string, UserRole[]> = {
    "Dashboard": ["admin", "manager"],
    "Production": ["admin", "manager", "staff"], // Production Board submenu
    "Orders": ["admin", "manager", "staff"],
    "Products": ["admin", "manager"],
    "Customers": ["admin", "manager"],
    "Agents": ["admin", "manager"],
    "Finance": ["admin", "manager"],
    "Invoices": ["admin", "manager"],
    "Quotes": ["admin", "manager"],
    "Payments": ["admin", "manager"],
    "Shipments": ["admin", "manager"],
    "Reports": ["admin", "manager"],
    "Packages": ["admin", "manager"],
    "Promotions": ["admin", "manager"],
    "Users": ["admin"],
    "Settings": ["admin"],
    "Workflow Settings": ["admin"],
};

// Check if a menu item should be visible for a role
export function canSeeMenuItem(role: UserRole, menuLabel: string): boolean {
    const allowedRoles = sidebarPermissions[menuLabel];
    if (!allowedRoles) {
        // If not defined, only show to admin
        return role === "admin";
    }
    return allowedRoles.includes(role);
}
