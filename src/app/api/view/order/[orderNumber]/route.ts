import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    try {
        const { orderNumber } = await params;

        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: {
                items: true,
                customer: {
                    select: { fullName: true }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Return only safe public data
        return NextResponse.json({
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customer?.fullName, // Maybe mask this? e.g. "Mohamed A."
            items: order.items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                status: i.itemStatus
            })),
            createdAt: order.createdAt,
            dueDate: order.dueDate,
            deliveryMethod: order.deliveryMethod,
            trackingNumber: order.trackingNumber
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
