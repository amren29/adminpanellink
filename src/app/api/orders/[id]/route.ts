import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Fix BigInt serialization for JSON responses
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

// GET single order by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: { include: { addresses: true } },
                agent: true,
                department: true,
                assignee: true,
                promotion: true,
                items: { include: { product: true } },
                attachments: { orderBy: { uploadedAt: 'desc' } },
                proofs: { orderBy: { version: 'desc' } },
                activityLogs: { orderBy: { timestamp: 'desc' }, take: 20 },
                assignments: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true, workflowRole: true } }
                    },
                    orderBy: { assignedAt: 'asc' }
                },
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        )
    }
}

// PUT Update Order
// Fix: Force cache invalidation v3
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        // Get current order to track changes
        const currentOrder = await prisma.order.findUnique({
            where: { id },
            select: { status: true, assignedTo: true },
        })

        // Build update data only with fields that are actually provided
        const updateData: any = {};

        if (body.customerId !== undefined) updateData.customerId = body.customerId;
        if (body.agentId !== undefined) updateData.agentId = body.agentId;
        if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;
        if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
        if (body.discountAmount !== undefined) updateData.discountAmount = body.discountAmount;
        if (body.taxAmount !== undefined) updateData.taxAmount = body.taxAmount;
        if (body.shippingAmount !== undefined) updateData.shippingAmount = body.shippingAmount;
        if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
        if (body.paidAmount !== undefined) updateData.paidAmount = body.paidAmount;
        if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
        if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
        if (body.deliveryMethod !== undefined) updateData.deliveryMethod = body.deliveryMethod;
        if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber;
        if (body.courier !== undefined) updateData.courier = body.courier;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes;
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        if (body.shippedAt !== undefined) updateData.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null;
        if (body.deliveredAt !== undefined) updateData.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null;

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id },
                data: updateData,
                include: {
                    customer: true,
                    assignee: true, // Return assignee to confirm update
                    items: true,
                },
            });

            // Log status change
            if (body.status && currentOrder?.status !== body.status) {
                await tx.activityLog.create({
                    data: {
                        orderId: id,
                        action: 'Status Changed',
                        fromStatus: currentOrder?.status as string,
                        toStatus: body.status,
                        userId: body.userId || null,
                        userName: body.userName || 'System',
                        userRole: body.userRole || 'system',
                    },
                });
            }

            // Log assignee change
            if (body.assignedTo !== undefined && currentOrder?.assignedTo !== body.assignedTo) {
                await tx.activityLog.create({
                    data: {
                        orderId: id,
                        action: 'Assignee Changed',
                        userId: body.userId || null,
                        userName: body.userName || 'System',
                        userRole: body.userRole || 'system',
                        notes: `Assigned to user ID: ${body.assignedTo || 'Unassigned'}`
                    },
                });
            }

            // Log explicit history entry if provided (from frontend generic logger)
            if (body.historyEntry) {
                await tx.activityLog.create({
                    data: {
                        orderId: id,
                        action: body.historyEntry.action || 'Update',
                        userId: body.userId || null,
                        userName: body.userName || 'System',
                        userRole: body.userRole || 'system',
                        notes: body.historyEntry.notes
                    },
                });
            }

            // Handle assignment updates (multi-assignee)
            if (body.assignees !== undefined && Array.isArray(body.assignees)) {
                // Delete all existing assignments for this order
                await tx.orderAssignment.deleteMany({
                    where: { orderId: id }
                });

                // Create new assignments (max 10)
                const assigneesToCreate = body.assignees.slice(0, 10);
                if (assigneesToCreate.length > 0) {
                    await Promise.all(assigneesToCreate.map((assignee: { userId: string; role: string }) =>
                        tx.orderAssignment.create({
                            data: {
                                orderId: id,
                                userId: assignee.userId,
                                role: assignee.role || 'production',
                                assignedBy: body.userId || undefined,
                            }
                        })
                    ));

                    // Log assignment change
                    await tx.activityLog.create({
                        data: {
                            orderId: id,
                            action: 'Assignments Updated',
                            userId: body.userId || null,
                            userName: body.userName || 'System',
                            userRole: body.userRole || 'system',
                            notes: `Updated to ${assigneesToCreate.length} assignee(s)`
                        },
                    });
                }
            }

            // ------------------------------------------------------------------
            // SYNC INVOICE STATUS
            // ------------------------------------------------------------------
            if (body.paymentStatus === 'paid') {
                await tx.invoice.updateMany({
                    where: { orderId: id },
                    data: {
                        status: 'Paid',
                        paidAt: new Date(),
                        paymentMethod: body.paymentMethod || undefined
                    }
                });
            }

            // ------------------------------------------------------------------
            // EMAIL NOTIFICATIONS
            // ------------------------------------------------------------------
            try {
                // 1. Status Change Notification (To Customer)
                if (body.status && currentOrder?.status !== body.status && order.customer?.email) {
                    await import('@/lib/notifications').then(mod =>
                        mod.sendOrderStatusEmail(order, order.customer!, body.status)
                    );
                }

                // 2. Assignment Notification (To Staff)
                // Single Assignee
                if (body.assignedTo !== undefined && currentOrder?.assignedTo !== body.assignedTo && order.assignee?.email) {
                    await import('@/lib/notifications').then(mod =>
                        mod.sendAssignmentEmail(order, order.assignee!, 'Lead')
                    );
                }

                // Multi Assignee
                if (body.assignees !== undefined && Array.isArray(body.assignees) && body.assignees.length > 0) {
                    // We need to fetch the users to get their emails. The transaction doesn't return the new assignment user details easily
                    // So we fetch the newly created assignments with user details
                    const newAssignments = await tx.orderAssignment.findMany({
                        where: { orderId: id },
                        include: { user: true }
                    });

                    // Send email to each new assignee
                    const notifyPromises = newAssignments.map(assignment =>
                        import('@/lib/notifications').then(mod =>
                            mod.sendAssignmentEmail(order, assignment.user, assignment.role)
                        )
                    );
                    // Fire and forget (don't await strictly to slow down response, but good to catch errors)
                    Promise.all(notifyPromises).catch(e => console.error('Error sending assignment emails', e));
                }

            } catch (emailError) {
                console.error("Failed to send email notifications:", emailError);
                // Don't fail the request just because email failed
            }

            return order;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error updating order:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        )
    }
}

// DELETE order
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.order.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting order:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to delete order' },
            { status: 500 }
        )
    }
}
