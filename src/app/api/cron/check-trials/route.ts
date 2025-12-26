import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cron/check-trials - Check for expired trials and update their status
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Find all expired trial subscriptions
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                status: "trialing",
                currentPeriodEnd: {
                    lt: now,
                },
            },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });

        if (expiredSubscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No expired trials found",
                processed: 0,
            });
        }

        // Update all expired subscriptions to "expired" status
        const updateResult = await prisma.subscription.updateMany({
            where: {
                id: {
                    in: expiredSubscriptions.map((s) => s.id),
                },
            },
            data: {
                status: "expired",
            },
        });

        // Log the expired organizations for reference
        const expiredOrgs = expiredSubscriptions.map((s) => ({
            organizationId: s.organization?.id,
            organizationName: s.organization?.name,
            slug: s.organization?.slug,
            expiredAt: s.currentPeriodEnd,
        }));

        console.log("Expired trials processed:", expiredOrgs);

        return NextResponse.json({
            success: true,
            message: `Processed ${updateResult.count} expired trials`,
            processed: updateResult.count,
            organizations: expiredOrgs,
        });
    } catch (error) {
        console.error("Error checking expired trials:", error);
        return NextResponse.json(
            { error: "Failed to check expired trials" },
            { status: 500 }
        );
    }
}
