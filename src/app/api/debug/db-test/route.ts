
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbUrl = process.env.DATABASE_URL;
        const directUrl = process.env.DIRECT_URL;

        // Mask secrets for display
        const maskUrl = (url?: string) => {
            if (!url) return "NOT_SET";
            try {
                // simple mask: display protocol and host, hide password
                return url.replace(/:([^:@]+)@/, ":****@");
            } catch {
                return "INVALID_FORMAT";
            }
        };

        const envCheck = {
            DATABASE_URL: maskUrl(dbUrl),
            DIRECT_URL: maskUrl(directUrl),
            NODE_ENV: process.env.NODE_ENV,
        };

        // Test Connection
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const duration = Date.now() - start;

        return NextResponse.json({
            status: "success",
            message: "Database connection successful",
            duration: `${duration}ms`,
            env: envCheck,
        });

    } catch (error: any) {
        console.error("DB Connection Test Failed:", error);
        return NextResponse.json({
            status: "error",
            message: error.message,
            code: error.code,
            env: {
                DATABASE_URL: process.env.DATABASE_URL ? "SET (Hidden)" : "MISSING",
                DIRECT_URL: process.env.DIRECT_URL ? "SET (Hidden)" : "MISSING",
            }
        }, { status: 500 });
    }
}
