import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

// POST /api/billing/webhook - Handle Stripe webhooks
export async function POST(request: Request) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        return NextResponse.json(
            { error: "Missing stripe-signature header" },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error) {
        console.error("Webhook signature verification failed:", error);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(invoice);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCanceled(subscription);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Webhook handler error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const orgId = session.metadata?.orgId;
    const planSlug = session.metadata?.planSlug;
    const planId = session.metadata?.planId;
    const billingCycle = session.metadata?.billingCycle as 'monthly' | 'yearly';

    if (!orgId || !planId) {
        console.error("Missing metadata in checkout session");
        return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
        where: { organizationId: orgId }
    });

    if (existingSubscription) {
        await prisma.subscription.update({
            where: { organizationId: orgId },
            data: {
                planId: planId,
                status: 'active',
                billingCycle: billingCycle || 'monthly',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                canceledAt: null,
            }
        });
    } else {
        await prisma.subscription.create({
            data: {
                organizationId: orgId,
                planId: planId,
                status: 'active',
                billingCycle: billingCycle || 'monthly',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            }
        });
    }

    console.log(`✅ Subscription updated for org ${orgId} to plan ${planSlug}`);
}

// Handle paid invoice (renewals)
async function handleInvoicePaid(invoice: Stripe.Invoice) {
    // Get subscription ID from invoice (using type assertion as Stripe types are strict)
    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : invoiceAny.subscription?.id;

    if (!subscriptionId) return;

    // Get subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    const orgId = stripeSubscription.metadata?.orgId;
    if (!orgId) return;

    // Update period in database - access items for period info
    const item = stripeSubscription.items.data[0];
    if (!item) return;

    // Use subscription's billing period
    const periodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
    const periodStart = new Date((stripeSubscription as any).current_period_start * 1000);

    await prisma.subscription.update({
        where: { organizationId: orgId },
        data: {
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            status: 'active',
        }
    });

    console.log(`✅ Invoice paid for org ${orgId}`);
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    // Use type assertion for period fields
    const subAny = subscription as any;
    const periodEnd = new Date(subAny.current_period_end * 1000);
    const periodStart = new Date(subAny.current_period_start * 1000);

    await prisma.subscription.update({
        where: { organizationId: orgId },
        data: {
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            status: subscription.status === 'active' ? 'active' :
                subscription.status === 'past_due' ? 'past_due' :
                    subscription.status === 'canceled' ? 'canceled' : 'active',
        }
    });

    console.log(`✅ Subscription updated for org ${orgId}`);
}

// Handle subscription canceled
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    await prisma.subscription.update({
        where: { organizationId: orgId },
        data: {
            status: 'canceled',
            canceledAt: new Date(),
        }
    });

    console.log(`❌ Subscription canceled for org ${orgId}`);
}
