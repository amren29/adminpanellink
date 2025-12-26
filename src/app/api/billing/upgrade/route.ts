import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Stripe Price IDs (from environment or hardcoded for now)
const PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
    basic: {
        monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || "price_1ShVi706SjysQrEA0asXPQ2M",
        yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || "price_1ShVjh06SjysQrEAIMQs4eh9",
    },
    pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_1ShViM06SjysQrEAiTwiNsOY",
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "price_1ShVj506SjysQrEAIrx0CXDQ",
    },
};

// POST /api/billing/upgrade - Upgrade organization's subscription
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !(session.user as any).organizationId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const orgId = (session.user as any).organizationId;
        const body = await request.json();
        const { planSlug, billingCycle = 'monthly' } = body;

        // Find the target plan
        const targetPlan = await prisma.plan.findUnique({
            where: { slug: planSlug }
        });

        if (!targetPlan) {
            return NextResponse.json(
                { error: "Invalid plan selected" },
                { status: 400 }
            );
        }

        // Get organization with Stripe customer ID
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            include: { subscription: true }
        });

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Check if Stripe is configured and plan has prices
        const priceId = PRICE_IDS[planSlug]?.[billingCycle as 'monthly' | 'yearly'];
        const useStripe = !!process.env.STRIPE_SECRET_KEY && !!org.stripeCustomerId && !!priceId;

        let stripeSubscriptionId: string | null = null;

        if (useStripe) {
            try {
                // Check for existing Stripe subscription
                if (org.subscription?.stripeSubscriptionId) {
                    // Update existing subscription
                    const stripeSubscription = await stripe.subscriptions.retrieve(org.subscription.stripeSubscriptionId);
                    await stripe.subscriptions.update(stripeSubscription.id, {
                        items: [{
                            id: stripeSubscription.items.data[0]?.id,
                            price: priceId,
                        }],
                        proration_behavior: 'create_prorations',
                    });
                    stripeSubscriptionId = stripeSubscription.id;
                } else {
                    // Create new Stripe subscription
                    const stripeSubscription = await stripe.subscriptions.create({
                        customer: org.stripeCustomerId!,
                        items: [{ price: priceId }],
                        payment_behavior: 'default_incomplete',
                        expand: ['latest_invoice.payment_intent'],
                    });
                    stripeSubscriptionId = stripeSubscription.id;
                }
            } catch (stripeError) {
                console.error("Stripe subscription error:", stripeError);
                // Continue with database-only update
            }
        }

        // Calculate billing period
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

        // Update database subscription
        let subscription;
        if (org.subscription) {
            subscription = await prisma.subscription.update({
                where: { organizationId: orgId },
                data: {
                    planId: targetPlan.id,
                    status: 'active',
                    billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    canceledAt: null,
                    stripeSubscriptionId: stripeSubscriptionId || org.subscription.stripeSubscriptionId,
                },
                include: { plan: true }
            });
        } else {
            subscription = await prisma.subscription.create({
                data: {
                    organizationId: orgId,
                    planId: targetPlan.id,
                    status: 'active',
                    billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    stripeSubscriptionId: stripeSubscriptionId,
                },
                include: { plan: true }
            });
        }

        // Create billing invoice
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
        const amount = billingCycle === 'yearly'
            ? (targetPlan.yearlyPrice?.toNumber() || targetPlan.monthlyPrice.toNumber() * 12)
            : targetPlan.monthlyPrice.toNumber();

        await prisma.billingInvoice.create({
            data: {
                subscriptionId: subscription.id,
                invoiceNumber,
                amount,
                tax: amount * 0.06,
                total: amount * 1.06,
                currency: 'MYR',
                status: 'paid',
                dueDate: now,
                paidAt: now,
                periodStart: now,
                periodEnd: periodEnd,
                paymentMethod: 'card',
            }
        });

        return NextResponse.json({
            success: true,
            message: `Successfully upgraded to ${targetPlan.name}!`,
            planName: subscription.plan.name,
            planSlug: subscription.plan.slug,
            features: subscription.plan.features,
            limits: {
                maxUsers: subscription.plan.maxUsers,
                maxOrders: subscription.plan.maxOrders,
                maxProducts: subscription.plan.maxProducts,
                maxStorageMb: subscription.plan.maxStorageMb,
            },
            subscription: {
                status: subscription.status,
                billingCycle: subscription.billingCycle,
                currentPeriodStart: subscription.currentPeriodStart.toISOString(),
                currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            },
            invoiceId: invoiceNumber,
            amount: amount,
            stripeSubscriptionId: stripeSubscriptionId,
        });

    } catch (error) {
        console.error("Upgrade error:", error);
        return NextResponse.json(
            { error: "Failed to process upgrade" },
            { status: 500 }
        );
    }
}
