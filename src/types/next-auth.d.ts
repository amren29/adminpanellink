import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            role: "admin" | "manager" | "staff" | "viewer";
            department: string | null;
            avatarUrl: string | null;
            allowedRoutes: string[];
            workflowRole: "admin" | "designer" | "production" | "qc" | null;
            organizationId: string | null;
        };
    }

    interface User {
        id: string;
        name: string;
        email: string;
        role: "admin" | "manager" | "staff" | "viewer";
        department: string | null;
        avatarUrl: string | null;
        allowedRoutes: string[];
        workflowRole: "admin" | "designer" | "production" | "qc" | null;
        organizationId: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "admin" | "manager" | "staff" | "viewer";
        department: string | null;
        avatarUrl: string | null;
        allowedRoutes: string[];
        workflowRole: "admin" | "designer" | "production" | "qc" | null;
        organizationId: string | null;
    }
}


