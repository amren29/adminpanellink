
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT verify payment
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paymentId } = await params;
        const body = await request.json();
        const { status, verifiedBy, notes } = body; // status: 'verified' | 'rejected'

        if (!status || !['verified', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Transaction to update Payment + Order + Invoice
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Payment
            const payment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status,
                    verifiedBy: verifiedBy || null,
                    verifiedAt: new Date(),
                    notes: notes // Append or overwrite notes
                },
                include: {
                    order: true,
                }
            });

            if (status === 'verified') {
                // 2. Update Order (if linked)
                if (payment.orderId) {
                    const currentOrder = await tx.order.findUnique({ where: { id: payment.orderId } });
                    if (currentOrder) {
                        const newPaidAmount = Number(currentOrder.paidAmount) + Number(payment.amount);
                        const isFullyPaid = newPaidAmount >= Number(currentOrder.totalAmount || 0);

                        await tx.order.update({
                            where: { id: payment.orderId },
                            data: {
                                paidAmount: newPaidAmount,
                                paymentStatus: isFullyPaid ? 'paid' : 'partial',
                                paymentMethod: payment.paymentMethod.substring(0, 20) // Update method to verified one
                            }
                        });

                        // Log Activity
                        await tx.activityLog.create({
                            data: {
                                orderId: payment.orderId,
                                action: 'Payment Verified',
                                fromStatus: currentOrder.paymentStatus,
                                toStatus: isFullyPaid ? 'paid' : 'partial',
                                userId: verifiedBy || null,
                                userName: 'System', // Or fetch user name
                                userRole: 'admin',
                                notes: `Payment verified. Ref: ${payment.reference || 'N/A'}`
                            }
                        });
                    }
                }

                // 3. Update Invoice (if linked)
                if (payment.invoiceId) {
                    // Start by marking invoice as Paid if strictly 1-to-1 or just update paidAt
                    // Simple logic: if verified payment covers it, mark Paid.
                    await tx.invoice.update({
                        where: { id: payment.invoiceId },
                        data: {
                            status: 'Paid',
                            paidAt: new Date(),
                            paymentMethod: payment.paymentMethod,
                            paymentReference: payment.reference
                        }
                    });
                }
            }

            return payment;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}
