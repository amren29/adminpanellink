import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Patch BigInt serialization for JSON
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

// GET /api/orders/[id]/comments - Fetch comments for an order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const comments = await prisma.orderComment.findMany({
            where: { orderId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        workflowRole: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({ success: true, comments });

    } catch (error: any) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }
}

// POST /api/orders/[id]/comments - Add a new comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Create comment
        const comment = await prisma.orderComment.create({
            data: {
                orderId: id,
                userId: session.user.id,
                content: content.trim()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        workflowRole: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, comment });

    } catch (error: any) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }
}
