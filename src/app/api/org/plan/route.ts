import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Default Basic plan features (fallback if no subscription)
const DEFAULT_FEATURES = {
    products: true,
    orders: true,
    quotes: true,
    invoices: true,
    departments: true,
    staff: true,
    workflow: true,
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
    publicLogin: false,
    customerLogin: false,
    agentManualTopup: true,
    agentAutoTopup: false,
    whiteLabel: false,
    customDomain: false,
    apiAccess: false,
};

const DEFAULT_LIMITS = { maxUsers: 5, maxOrders: 100, maxProducts: 50, maxStorageMb: 1000 };

// GET /api/org/plan - Get current org's plan features from database
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !(session.user as any).organizationId) {
            // No session or no orgId -> Return Basic defaults
            return NextResponse.json({
                planName: "Basic",
                planSlug: "basic",
                features: DEFAULT_FEATURES,
                limits: DEFAULT_LIMITS,
            });
        }

        const orgId = (session.user as any).organizationId;

        // Fetch Organization with Subscription and Plan
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!org) {
            return NextResponse.json({
                planName: "Basic",
                planSlug: "basic",
                features: DEFAULT_FEATURES,
                limits: DEFAULT_LIMITS,
            });
        }

        // If org has an active subscription with a plan
        if (org.subscription && org.subscription.plan) {
            const subscription = org.subscription;
            const basePlan = subscription.plan;

            // Check if trial is still active
            const isTrialActive = subscription.status === 'trialing' &&
                subscription.trialEndsAt &&
                new Date(subscription.trialEndsAt) > new Date();

            // Pro features (available during trial)
            const proFeatures = {
                products: true,
                orders: true,
                quotes: true,
                invoices: true,
                departments: true,
                staff: true,
                workflow: true,
                profile: true,
                customers: true,
                agents: true,
                transactions: true,
                paymentGateway: true,
                promotions: true,
                packages: true,
                analytics: true,
                payments: true,
                shipments: true,
                pricingEngine: true,
                liveTracking: true,
                storefront: true,
                publicLogin: true,
                customerLogin: true,
                agentManualTopup: true,
                agentAutoTopup: true,
                whiteLabel: false,
                customDomain: false,
                apiAccess: false,
            };

            // If trial is active, return Pro features
            if (isTrialActive) {
                return NextResponse.json({
                    planName: "Pro (Trial)",
                    planSlug: "pro",
                    features: proFeatures,
                    limits: {
                        maxUsers: 10,
                        maxOrders: 500,
                        maxProducts: 200,
                        maxStorageMb: 5000,
                    },
                    subscription: {
                        status: subscription.status,
                        billingCycle: subscription.billingCycle,
                        currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
                        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
                        trialEndsAt: subscription.trialEndsAt?.toISOString(),
                        canceledAt: subscription.canceledAt?.toISOString(),
                    },
                    trial: {
                        isActive: true,
                        endsAt: subscription.trialEndsAt?.toISOString(),
                        daysRemaining: subscription.trialEndsAt
                            ? Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            : 0,
                    }
                });
            }

            // Trial expired or not trialing - return base plan features
            const features = (basePlan.features as Record<string, boolean>) || DEFAULT_FEATURES;

            return NextResponse.json({
                planName: basePlan.name,
                planSlug: basePlan.slug,
                features: features,
                limits: {
                    maxUsers: basePlan.maxUsers,
                    maxOrders: basePlan.maxOrders,
                    maxProducts: basePlan.maxProducts,
                    maxStorageMb: basePlan.maxStorageMb,
                },
                subscription: {
                    status: subscription.status === 'trialing' ? 'active' : subscription.status, // Trial expired = active on free
                    billingCycle: subscription.billingCycle,
                    currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
                    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
                    trialEndsAt: subscription.trialEndsAt?.toISOString(),
                    canceledAt: subscription.canceledAt?.toISOString(),
                },
                trial: {
                    isActive: false,
                    endsAt: subscription.trialEndsAt?.toISOString(),
                    daysRemaining: 0,
                }
            });
        }

        // No subscription - return Basic plan defaults
        return NextResponse.json({
            planName: "Basic",
            planSlug: "basic",
            features: DEFAULT_FEATURES,
            limits: DEFAULT_LIMITS,
        });

    } catch (error) {
        console.error("Error fetching plan:", error);
        return NextResponse.json({
            planName: "Basic",
            planSlug: "basic",
            features: DEFAULT_FEATURES,
            limits: DEFAULT_LIMITS,
        });
    }
}
