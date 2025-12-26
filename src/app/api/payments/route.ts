
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all payments (with filters)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // pending, verified, rejected
        const customerId = searchParams.get('customerId');
        const orderId = searchParams.get('orderId');

        const where: any = {};
        if (status && status !== 'all') where.status = status;
        if (customerId) where.customerId = customerId;
        if (orderId) where.orderId = orderId;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                customer: { select: { fullName: true, email: true } },
                order: { select: { orderNumber: true, totalAmount: true } },
                invoice: { select: { invoiceNumber: true } },
                verifier: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(payments);
    } catch (error: any) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

// POST create new payment (from Storefront or Admin)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        let {
            amount,
            paymentMethod,
            reference,
            proofImage,
            orderId,
            invoiceId,
            customerId,
            notes,
            status = 'pending'
        } = body;

        // Basic validation
        if (!amount || !paymentMethod) {
            return NextResponse.json(
                { error: 'Amount and Payment Method are required' },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Resolve Relations (Invoice -> Order/Customer)
            if (invoiceId && !orderId) {
                const invoice = await tx.invoice.findUnique({
                    where: { id: invoiceId },
                    select: { orderId: true, customerId: true }
                });
                if (invoice) {
                    if (invoice.orderId) orderId = invoice.orderId;
                    if (!customerId && invoice.customerId) customerId = invoice.customerId;
                }
            }

            // 2. Create Payment
            const payment = await tx.payment.create({
                data: {
                    amount,
                    paymentMethod,
                    reference,
                    proofImage,
                    orderId: orderId || null,
                    invoiceId: invoiceId || null,
                    customerId: customerId || null,
                    notes,
                    status,
                    verifiedAt: status === 'verified' ? new Date() : null,
                    verifiedBy: status === 'verified' && body.verifiedBy ? body.verifiedBy : null
                },
                include: {
                    order: true,
                    invoice: true
                }
            });

            // 3. Sync if Verified
            if (status === 'verified') {
                // Update Order
                if (orderId) {
                    const currentOrder = await tx.order.findUnique({ where: { id: orderId } });
                    if (currentOrder) {
                        const newPaidAmount = Number(currentOrder.paidAmount) + Number(amount);
                        const isFullyPaid = newPaidAmount >= Number(currentOrder.totalAmount || 0);

                        await tx.order.update({
                            where: { id: orderId },
                            data: {
                                paidAmount: newPaidAmount,
                                paymentStatus: isFullyPaid ? 'paid' : 'partial',
                                paymentMethod: paymentMethod.substring(0, 20)
                            }
                        });

                        // Log
                        await tx.activityLog.create({
                            data: {
                                orderId: orderId,
                                action: 'Payment Manual Entry',
                                fromStatus: currentOrder.paymentStatus,
                                toStatus: isFullyPaid ? 'paid' : 'partial',
                                userId: null, // Admin
                                userName: 'Admin',
                                userRole: 'admin',
                                notes: `Manual Payment Verified. Ref: ${reference || 'N/A'}`
                            }
                        });
                    }
                }

                // Update Invoice
                if (invoiceId) {
                    await tx.invoice.update({
                        where: { id: invoiceId },
                        data: {
                            status: 'Paid',
                            paidAt: new Date(),
                            paymentMethod: paymentMethod,
                            paymentReference: reference
                        }
                    });
                }
            }
            return payment;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Error creating payment:', error);
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
}
