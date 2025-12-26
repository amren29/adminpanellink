import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT approve/reject wallet transaction
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action } = body; // 'approve' | 'reject'

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 });
        }

        // Get current transaction
        const transaction = await prisma.walletTransaction.findUnique({
            where: { id },
            include: { agent: true }
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        if (transaction.status !== 'pending') {
            return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });
        }

        const newStatus = action === 'approve' ? 'completed' : 'failed';
        const userId = (session.user as any).id;

        // Update transaction
        const updatedTransaction = await prisma.$transaction(async (tx) => {
            // 1. Update the transaction status
            const updated = await tx.walletTransaction.update({
                where: { id },
                data: {
                    status: newStatus,
                    approvedBy: action === 'approve' ? userId : null,
                }
            });

            // 2. If approved and has agent, update agent wallet balance
            if (action === 'approve' && transaction.agentId && transaction.type === 'credit') {
                await tx.agent.update({
                    where: { id: transaction.agentId },
                    data: {
                        walletBalance: {
                            increment: transaction.amount
                        }
                    }
                });
            }

            return updated;
        });

        return NextResponse.json({
            success: true,
            message: `Transaction ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            data: updatedTransaction
        });

    } catch (error: any) {
        console.error('Error processing wallet transaction:', error);
        return NextResponse.json(
            { error: 'Failed to process transaction' },
            { status: 500 }
        );
    }
}

// GET single wallet transaction details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const transaction = await prisma.walletTransaction.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        walletBalance: true
                    }
                },
                approver: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: transaction
        });

    } catch (error: any) {
        console.error('Error fetching wallet transaction:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transaction' },
            { status: 500 }
        );
    }
}
