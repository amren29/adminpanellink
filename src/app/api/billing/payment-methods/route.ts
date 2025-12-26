import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// GET /api/billing/payment-methods - List customer's payment methods
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const org = await prisma.organization.findUnique({
            where: { id: (session.user as any).organizationId },
            select: { stripeCustomerId: true }
        });

        if (!org?.stripeCustomerId) {
            return NextResponse.json({ paymentMethods: [] });
        }

        const paymentMethods = await stripe.paymentMethods.list({
            customer: org.stripeCustomerId,
            type: "card",
        });

        // Get default payment method
        const customer = await stripe.customers.retrieve(org.stripeCustomerId) as Stripe.Customer;
        const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

        return NextResponse.json({
            paymentMethods: paymentMethods.data.map(pm => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year,
                isDefault: pm.id === defaultPaymentMethodId,
            })),
        });
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
    }
}

// POST /api/billing/payment-methods - Create SetupIntent for adding new card
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const org = await prisma.organization.findUnique({
            where: { id: (session.user as any).organizationId },
            select: { stripeCustomerId: true, name: true }
        });

        let stripeCustomerId = org?.stripeCustomerId;

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
            const user = await prisma.user.findUnique({
                where: { id: (session.user as any).id },
                select: { email: true, name: true }
            });

            const customer = await stripe.customers.create({
                email: user?.email || undefined,
                name: user?.name || org?.name || undefined,
            });

            stripeCustomerId = customer.id;

            // Save to organization
            await prisma.organization.update({
                where: { id: (session.user as any).organizationId },
                data: { stripeCustomerId }
            });
        }

        // Create SetupIntent
        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method_types: ["card"],
        });

        return NextResponse.json({
            clientSecret: setupIntent.client_secret,
            customerId: stripeCustomerId,
        });
    } catch (error) {
        console.error("Error creating setup intent:", error);
        return NextResponse.json({ error: "Failed to create setup intent" }, { status: 500 });
    }
}

// DELETE /api/billing/payment-methods - Detach payment method
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { paymentMethodId } = await request.json();

        if (!paymentMethodId) {
            return NextResponse.json({ error: "Payment method ID required" }, { status: 400 });
        }

        await stripe.paymentMethods.detach(paymentMethodId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error detaching payment method:", error);
        return NextResponse.json({ error: "Failed to remove payment method" }, { status: 500 });
    }
}

// PATCH /api/billing/payment-methods - Set default payment method
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { paymentMethodId } = await request.json();

        const org = await prisma.organization.findUnique({
            where: { id: (session.user as any).organizationId },
            select: { stripeCustomerId: true }
        });

        if (!org?.stripeCustomerId) {
            return NextResponse.json({ error: "No billing account found" }, { status: 400 });
        }

        // Update customer's default payment method
        await stripe.customers.update(org.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error setting default payment method:", error);
        return NextResponse.json({ error: "Failed to set default" }, { status: 500 });
    }
}
