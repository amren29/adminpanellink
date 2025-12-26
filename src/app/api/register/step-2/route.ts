import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
    try {
        const { userId, shopName, shopSlug, currency } = await request.json();

        // Validation
        if (!userId || !shopName || !shopSlug) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if slug is available
        const existingOrg = await prisma.organization.findUnique({
            where: { slug: shopSlug.toLowerCase() },
        });

        if (existingOrg) {
            return NextResponse.json(
                { error: "This shop link is already taken" },
                { status: 400 }
            );
        }

        // Create Stripe Customer
        let stripeCustomerId: string | null = null;
        try {
            if (process.env.STRIPE_SECRET_KEY) {
                const stripeCustomer = await stripe.customers.create({
                    email: user.email,
                    name: user.name || shopName,
                    metadata: {
                        shopName: shopName,
                        shopSlug: shopSlug.toLowerCase(),
                    },
                });
                stripeCustomerId = stripeCustomer.id;
            }
        } catch (stripeError) {
            console.error("Stripe customer creation failed:", stripeError);
            // Continue without Stripe - will work in demo mode
        }

        // Get the Free plan (or create it if doesn't exist)
        let freePlan = await prisma.plan.findFirst({
            where: { slug: "free", isActive: true },
        });

        // If no Free plan exists, create one
        if (!freePlan) {
            freePlan = await prisma.plan.create({
                data: {
                    name: "Free",
                    slug: "free",
                    description: "Free forever plan with basic features",
                    monthlyPrice: 0,
                    yearlyPrice: 0,
                    maxUsers: 2,
                    maxOrders: 50,
                    maxProducts: 20,
                    maxStorageMb: 500,
                    features: {
                        products: true,
                        orders: true,
                        quotes: true,
                        invoices: true,
                        departments: true,
                        staff: false,
                        workflow: false,
                        profile: true,
                        customers: true,
                        agents: false,
                        transactions: false,
                        paymentGateway: false,
                        promotions: false,
                        packages: false,
                        analytics: false,
                        payments: false,
                        shipments: false,
                        pricingEngine: false,
                        liveTracking: false,
                        storefront: false,
                    },
                    displayOrder: 0,
                    isActive: true,
                },
            });
        }

        // Calculate trial end date (14 days from now)
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        // Create organization with Free plan subscription + Pro trial
        const organization = await prisma.organization.create({
            data: {
                name: shopName,
                slug: shopSlug.toLowerCase(),
                storeName: shopName,
                currency: currency || "MYR",
                stripeCustomerId: stripeCustomerId,
                onboardingStep: 2,
                onboardingComplete: false,
                subscription: {
                    create: {
                        planId: freePlan.id,
                        status: "trialing", // Trialing = has access to Pro features
                        billingCycle: "monthly",
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: trialEndsAt,
                        trialEndsAt: trialEndsAt, // 14-day Pro trial
                    },
                },
            },
        });

        // Link user to organization
        await prisma.user.update({
            where: { id: userId },
            data: { organizationId: organization.id },
        });

        // Create default departments
        await prisma.department.createMany({
            data: [
                { organizationId: organization.id, name: "Design", color: "#8B5CF6", displayOrder: 1 },
                { organizationId: organization.id, name: "Production", color: "#3B82F6", displayOrder: 2 },
                { organizationId: organization.id, name: "Quality Control", color: "#10B981", displayOrder: 3 },
            ],
        });

        return NextResponse.json({
            success: true,
            organizationId: organization.id,
            stripeCustomerId: stripeCustomerId,
        });
    } catch (error) {
        console.error("Registration Step 2 Error:", error);
        return NextResponse.json(
            { error: "Failed to setup shop" },
            { status: 500 }
        );
    }
}
