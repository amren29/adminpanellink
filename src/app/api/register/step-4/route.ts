import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const { organizationId, userId, emails } = await request.json();

        // Validation
        if (!organizationId || !userId) {
            return NextResponse.json(
                { error: "Organization ID and User ID are required" },
                { status: 400 }
            );
        }

        // Verify organization and user exist
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        // Create invites for each email
        const invites = [];
        if (emails && emails.length > 0) {
            for (const email of emails) {
                // Generate unique token
                const token = crypto.randomBytes(32).toString("hex");

                // Create invite
                const invite = await prisma.userInvite.create({
                    data: {
                        organizationId,
                        email: email.toLowerCase(),
                        invitedBy: userId,
                        role: "staff",
                        status: "pending",
                        token,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    },
                });

                invites.push(invite);

                // TODO: Send invite email
                // await sendInviteEmail(email, token, organization.name);
            }
        }

        // Mark onboarding as complete
        await prisma.organization.update({
            where: { id: organizationId },
            data: {
                onboardingStep: 5,
                onboardingComplete: true,
            },
        });

        return NextResponse.json({
            success: true,
            invitesSent: invites.length,
        });
    } catch (error) {
        console.error("Registration Step 4 Error:", error);
        return NextResponse.json(
            { error: "Failed to send invites" },
            { status: 500 }
        );
    }
}
