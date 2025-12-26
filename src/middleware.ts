import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessRoute, UserRole } from "@/lib/permissions";

// Routes that don't require authentication
const publicRoutes = ["/signin", "/signup", "/api/auth", "/proof-review", "/jobsheet", "/view"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Allow static files and API routes
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/images") ||
        pathname.includes(".") ||
        pathname.startsWith("/api/")
    ) {
        return NextResponse.next();
    }

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
    });

    // If no token, redirect to signin
    if (!token) {
        const signInUrl = new URL("/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
    }

    // Check role-based access using permissions config
    const userRole = (token.role as UserRole) || "viewer";
    const customRoutes = (token.allowedRoutes as string[]) || [];

    if (!canAccessRoute(userRole, pathname, customRoutes)) {
        // Redirect to production board (the page staff can access) with error message
        const redirectUrl = new URL("/production-board", request.url);
        redirectUrl.searchParams.set("error", "access_denied");
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)",
    ],
};

