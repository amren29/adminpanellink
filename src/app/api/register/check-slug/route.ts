import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get("slug");

        if (!slug || slug.length < 3) {
            return NextResponse.json({
                available: false,
                error: "Slug must be at least 3 characters",
            });
        }

        // Reserved slugs
        const reservedSlugs = [
            "admin", "api", "app", "auth", "dashboard", "help", "login",
            "register", "signin", "signup", "superadmin", "support", "www",
            "linkprint", "linkprintshop", "demo", "test", "staging",
        ];

        if (reservedSlugs.includes(slug.toLowerCase())) {
            return NextResponse.json({
                available: false,
                error: "This name is reserved",
            });
        }

        // Check if slug exists
        const existing = await prisma.organization.findUnique({
            where: { slug: slug.toLowerCase() },
        });

        return NextResponse.json({
            available: !existing,
        });
    } catch (error) {
        console.error("Check slug error:", error);
        return NextResponse.json(
            { available: false, error: "Failed to check availability" },
            { status: 500 }
        );
    }
}
