import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { name, email, password, phone } = body;

        // Validation
        if (!name || !email || !password || !phone) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Check if email already exists
        let existingUser;
        try {
            existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });
        } catch (dbError) {
            console.error("Database error checking user:", dbError);
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 500 }
            );
        }

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        let passwordHash;
        try {
            passwordHash = await bcrypt.hash(password, 10);
        } catch (hashError) {
            console.error("Bcrypt hashing error:", hashError);
            return NextResponse.json(
                { error: "Security processing failed" },
                { status: 500 }
            );
        }

        // Handle phone format safely
        const phoneStr = String(phone);
        const formattedPhone = phoneStr.startsWith("+60") ? phoneStr : `+60${phoneStr.replace(/^0+/, '')}`;

        // Create user (without organization for now)
        try {
            const user = await prisma.user.create({
                data: {
                    name,
                    email: email.toLowerCase(),
                    passwordHash,
                    phone: formattedPhone,
                    role: "admin", // First user is admin
                    isActive: true,
                },
            });

            return NextResponse.json({
                success: true,
                userId: user.id,
            });
        } catch (createError) {
            console.error("Prisma create user error:", createError);
            return NextResponse.json(
                { error: "Failed to create user record" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Registration Step 1 Unhandled Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
