import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, getStripePriceId } from "@/lib/stripe";
import prisma from "@/lib/prisma";

// POST /api/billing/create-checkout - Create Stripe Checkout Session
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
        const userEmail = session.user.email;
        const body = await request.json();
        const { planSlug, billingCycle = 'monthly' } = body;

        // Get Stripe Price ID
        const priceId = getStripePriceId(planSlug, billingCycle);

        if (!priceId) {
            return NextResponse.json(
                { error: "Invalid plan or billing cycle" },
                { status: 400 }
            );
        }

        // Find the target plan in database
        const targetPlan = await prisma.plan.findUnique({
            where: { slug: planSlug }
        });

        if (!targetPlan) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 400 }
            );
        }

        // Get or create Stripe Customer
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            include: { subscription: true }
        });

        let customerId: string;

        // Check if org has existing Stripe customer (stored in subscription metadata or separate field)
        // For now, we'll create a new customer each time or you can store it
        const customer = await stripe.customers.create({
            email: userEmail || undefined,
            metadata: {
                orgId: orgId,
                orgName: org?.name || '',
            }
        });
        customerId = customer.id;

        // Create Checkout Session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                orgId: orgId,
                planSlug: planSlug,
                planId: targetPlan.id,
                billingCycle: billingCycle,
            },
            success_url: `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/billing?canceled=true`,
            allow_promotion_codes: true,
        });

        return NextResponse.json({
            url: checkoutSession.url,
            sessionId: checkoutSession.id,
        });

    } catch (error) {
        console.error("Create checkout error:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
