import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { organizationId, teamSize, printTypes, currentSystem, role, heardFrom } = await request.json();

        // Validation
        if (!organizationId) {
            return NextResponse.json(
                { error: "Organization ID is required" },
                { status: 400 }
            );
        }

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        // Build metadata object
        const metadata = {
            teamSize: teamSize || null,
            printTypes: printTypes || [],
            currentSystem: currentSystem || null,
            role: role || null,
            heardFrom: heardFrom || null,
            profiledAt: new Date().toISOString(),
            // Hidden flags for sales targeting
            isEnterpriseLead: teamSize === "factory" || teamSize === "20+",
            needsImportHelp: currentSystem === "excel",
            needsAccountingExport: currentSystem === "accounting",
            isFromReferral: heardFrom === "friend",
        };

        // Update organization with metadata and mark onboarding complete
        await prisma.organization.update({
            where: { id: organizationId },
            data: {
                metadata,
                onboardingStep: 5,
                onboardingComplete: true,
            },
        });

        // Pre-configure features based on print types
        // (This could also update default product settings, etc.)

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Registration Step 3 Error:", error);
        return NextResponse.json(
            { error: "Failed to save preferences" },
            { status: 500 }
        );
    }
}
