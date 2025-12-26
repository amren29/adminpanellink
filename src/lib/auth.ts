import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                loginType: { label: "Login Type", type: "text" }, // 'user' | 'superadmin'
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const loginType = credentials.loginType || 'user';

                // SUPERADMIN LOGIN (explicit /superadmin route)
                if (loginType === 'superadmin') {
                    const admin = await prisma.platformAdmin.findUnique({
                        where: { email: credentials.email },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            passwordHash: true,
                            role: true,
                            avatarUrl: true,
                            isActive: true,
                        },
                    });

                    if (!admin) {
                        throw new Error("No admin found with this email");
                    }

                    if (!admin.isActive) {
                        throw new Error("This admin account has been deactivated");
                    }

                    const isValidPassword = await bcrypt.compare(
                        credentials.password,
                        admin.passwordHash
                    );

                    if (!isValidPassword) {
                        throw new Error("Invalid password");
                    }

                    // Update last login
                    await prisma.platformAdmin.update({
                        where: { id: admin.id },
                        data: { lastLoginAt: new Date() },
                    });

                    return {
                        id: admin.id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                        department: null,
                        avatarUrl: admin.avatarUrl,
                        allowedRoutes: [],
                        workflowRole: 'admin',
                        organizationId: null, // Super admin has access to ALL orgs
                        isSuperAdmin: true,
                    };
                }

                // REGULAR USER LOGIN (also check for super admin)
                // First, try to find in users table
                let user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        passwordHash: true,
                        role: true,
                        department: true,
                        avatarUrl: true,
                        isActive: true,
                        allowedRoutes: true,
                        workflowRole: true,
                        organizationId: true,
                    },
                });

                // If not found in users, check platform_admins (super admin can login anywhere)
                if (!user) {
                    const admin = await prisma.platformAdmin.findUnique({
                        where: { email: credentials.email },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            passwordHash: true,
                            role: true,
                            avatarUrl: true,
                            isActive: true,
                        },
                    });

                    if (admin) {
                        if (!admin.isActive) {
                            throw new Error("This admin account has been deactivated");
                        }

                        const isValidPassword = await bcrypt.compare(
                            credentials.password,
                            admin.passwordHash
                        );

                        if (!isValidPassword) {
                            throw new Error("Invalid password");
                        }

                        // Update last login
                        await prisma.platformAdmin.update({
                            where: { id: admin.id },
                            data: { lastLoginAt: new Date() },
                        });

                        // Return super admin with full access
                        return {
                            id: admin.id,
                            name: admin.name,
                            email: admin.email,
                            role: 'admin', // Treat as admin in the regular panel
                            department: 'Platform Admin',
                            avatarUrl: admin.avatarUrl,
                            allowedRoutes: [],
                            workflowRole: 'admin',
                            organizationId: null, // null = access to ALL organizations
                            isSuperAdmin: true,
                        };
                    }

                    throw new Error("No user found with this email");
                }

                if (!user.isActive) {
                    throw new Error("This account has been deactivated");
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isValidPassword) {
                    throw new Error("Invalid password");
                }

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                });

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    avatarUrl: user.avatarUrl,
                    allowedRoutes: user.allowedRoutes,
                    workflowRole: user.workflowRole as 'production' | 'admin' | 'designer' | 'qc' | null,
                    organizationId: user.organizationId,
                    isSuperAdmin: false,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.department = (user as any).department;
                token.avatarUrl = (user as any).avatarUrl;
                token.allowedRoutes = (user as any).allowedRoutes || [];
                token.workflowRole = (user as any).workflowRole || null;
                token.organizationId = (user as any).organizationId || null;
                token.isSuperAdmin = (user as any).isSuperAdmin || false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).department = token.department;
                (session.user as any).avatarUrl = token.avatarUrl;
                (session.user as any).allowedRoutes = token.allowedRoutes || [];
                (session.user as any).workflowRole = token.workflowRole || null;
                (session.user as any).organizationId = token.organizationId || null;
                (session.user as any).isSuperAdmin = token.isSuperAdmin || false;
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
        error: "/signin",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};
