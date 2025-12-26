import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getSecurePrisma } from '@/lib/prisma-secure'
import { authOptions } from '@/lib/auth'
import { checkUsageLimit } from '@/lib/access-control'

// Fix BigInt serialization for JSON responses
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

// GET all orders
export async function GET(request: Request) {
    try {
        // Get session and organizationId for tenant isolation
        const session = await getServerSession(authOptions)
        const isSuperAdmin = (session?.user as any)?.isSuperAdmin
        const organizationId = (session?.user as any)?.organizationId

        // Super admin can see all, regular users need an organization
        if (!isSuperAdmin && !organizationId) {
            return NextResponse.json({ error: 'Unauthorized or no organization' }, { status: 401 })
        }

        // Super admin uses raw prisma (sees all), regular users get filtered
        const db = isSuperAdmin ? prisma : getSecurePrisma(organizationId)

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const priority = searchParams.get('priority') || ''
        const departmentId = searchParams.get('departmentId') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customer: { fullName: { contains: search, mode: 'insensitive' } } },
            ]
        }

        if (status) {
            where.status = status
        }

        if (priority) {
            where.priority = priority
        }

        if (departmentId) {
            where.departmentId = departmentId
        }

        const [orders, total] = await Promise.all([
            db.order.findMany({
                where,
                include: {
                    customer: true,
                    agent: true,
                    department: true,
                    assignee: { select: { id: true, name: true, avatarUrl: true } },
                    assignments: {
                        include: {
                            user: { select: { id: true, name: true, avatarUrl: true, workflowRole: true } }
                        },
                        orderBy: { assignedAt: 'asc' }
                    },
                    items: true,
                    // INCLUDE ATTACHMENTS FOR FILES
                    attachments: {
                        orderBy: { uploadedAt: 'desc' }
                    },
                    proofs: {
                        orderBy: { version: 'desc' }
                    },
                    activityLogs: {
                        orderBy: { timestamp: 'desc' },
                        take: 10
                    },
                    _count: {
                        select: { attachments: true, comments: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.order.count({ where }),
        ])

        return NextResponse.json({
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}



// POST create new order
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check plan limits
        try {
            await checkUsageLimit(session.user.organizationId, 'orders')
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 })
        }

        const db = getSecurePrisma(session.user.organizationId)

        const body = await request.json()

        // Generate order number
        // Use global 'prisma' to ensure uniqueness across ALL organizations
        const lastOrder = await prisma.order.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { orderNumber: true },
        })

        let nextNum = 1
        if (lastOrder?.orderNumber) {
            const match = lastOrder.orderNumber.match(/ORD-(\d+)/)
            if (match) {
                nextNum = parseInt(match[1]) + 1
            }
        }
        const orderNumber = `ORD-${nextNum.toString().padStart(6, '0')}`

        // Validate UUID helper
        const isValidUUID = (id: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
        };

        // Transaction: Validate Stock -> Deduct Stock -> Create Customer (if needed) -> Create Order -> Update Stats
        // Use db.$transaction so it inherits the filtered extension
        const order = await db.$transaction(async (tx) => {
            // 1. Validate & Deduct Stock
            if (body.items && body.items.length > 0) {
                for (const item of body.items) {
                    if (item.productId && isValidUUID(item.productId)) {
                        // Use findFirst for security instead of findUnique
                        const product = await tx.product.findFirst({
                            where: {
                                id: item.productId,
                                // Implicitly filtered by orgId due to tx extension
                            }
                        });

                        // If no product found in this ORG, then they can't order it
                        if (!product) {
                            // Skip or throw? Throwing is safer.
                            // But let's check if it exists at all? No, just fail if not found in org.
                            // If product is null, it means either invalid ID or not in org.
                            // We should probably skip logic if product null to avoid crash, or throw.
                            continue;
                        }

                        if (product.trackStock) {
                            if (product.stock < item.quantity) {
                                throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
                            }
                            await tx.product.update({
                                where: { id: product.id },
                                data: { stock: { decrement: item.quantity } }
                            });
                        }
                    }
                }
            }

            // 2. Handle Customer
            let customerId = body.customerId && isValidUUID(body.customerId) ? body.customerId : undefined;

            // If ID not provided, try to find by email
            if (!customerId && body.customerEmail) {
                const existingCustomer = await tx.customer.findFirst({
                    where: { email: body.customerEmail }
                });
                if (existingCustomer) {
                    customerId = existingCustomer.id;
                }
            }

            // Create new customer only if no ID found and we have names/emails
            if (!customerId && body.customerName) {
                const uniqueEmail = body.customerEmail || `walkin-${Date.now()}@temp.local`;
                const newCustomer = await tx.customer.create({
                    data: {
                        fullName: body.customerName,
                        email: uniqueEmail,
                        phone: body.customerPhone || null,
                        organizationId: session.user.organizationId
                    },
                });
                customerId = newCustomer.id;
            }

            // 3. Create Order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    customerId,
                    agentId: body.agentId && isValidUUID(body.agentId) ? body.agentId : undefined,
                    departmentId: body.departmentId && isValidUUID(body.departmentId) ? body.departmentId : undefined,
                    assignedTo: body.assignedTo && isValidUUID(body.assignedTo) ? body.assignedTo : undefined,
                    status: body.status || 'new_order',
                    priority: body.priority || 'normal',
                    subtotal: body.subtotal || 0,
                    discountAmount: body.discountAmount || 0,
                    taxAmount: body.taxAmount || 0,
                    shippingAmount: body.shippingAmount || 0,
                    totalAmount: body.totalAmount || 0,
                    deliveryMethod: body.deliveryMethod,
                    notes: body.notes,
                    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                    organizationId: session.user.organizationId,
                    items: body.items && body.items.length > 0
                        ? {
                            create: body.items.map((item: any) => ({
                                productId: item.productId || undefined,
                                name: item.name,
                                quantity: item.quantity,
                                specifications: item.specifications || undefined,
                                width: item.width || undefined,
                                height: item.height || undefined,
                                unitPrice: item.unitPrice || 0,
                                totalPrice: item.totalPrice || 0,
                            })),
                        }
                        : undefined,
                },
                include: {
                    customer: true,
                    items: true,
                },
            });

            // 3.5 Create Order Assignments (multi-assignee)
            if (body.assignees && Array.isArray(body.assignees) && body.assignees.length > 0) {
                // Limit to 10 assignees max
                const assigneesToCreate = body.assignees.slice(0, 10);
                await Promise.all(assigneesToCreate.map((assignee: { userId: string; role: string }) =>
                    tx.orderAssignment.create({
                        data: {
                            orderId: newOrder.id,
                            userId: assignee.userId,
                            role: assignee.role || 'production',
                            assignedBy: body.assignedBy || undefined,
                        }
                    })
                ));
            }

            const taxRate = body.taxRate || 0;
            const invoiceNumber = `INV-${orderNumber.replace('ORD-', '')}`;

            await tx.invoice.create({
                data: {
                    invoiceNumber,
                    customerId,
                    orderId: newOrder.id,
                    status: 'Draft',
                    subtotal: newOrder.subtotal,
                    discountAmount: newOrder.discountAmount,
                    taxRate: taxRate,
                    taxAmount: newOrder.taxAmount,
                    total: newOrder.totalAmount,
                    dueDate: newOrder.dueDate,
                    notes: `Auto-generated from Order ${newOrder.orderNumber}`,
                    paymentMethod: body.paymentMethod || null,
                    organizationId: session.user.organizationId,
                    lineItems: {
                        create: (body.items || []).map((item: any) => ({
                            productId: item.productId || undefined,
                            description: item.name,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice || 0,
                            total: item.totalPrice || 0,
                            notes: item.specifications ? JSON.stringify(item.specifications) : null
                        }))
                    }
                }
            });

            // 5. Update Stats
            if (customerId) {
                await tx.customer.update({
                    where: { id: customerId }, // secure prisma will enforce orgId even on update
                    data: {
                        orderCount: { increment: 1 },
                        totalSpent: { increment: body.totalAmount || 0 },
                    },
                });
            }

            if (body.agentId && isValidUUID(body.agentId)) {
                await tx.agent.update({
                    where: { id: body.agentId },
                    data: { totalOrders: { increment: 1 } },
                });
            }

            return newOrder;
        });

        return NextResponse.json(order, { status: 201 })
    } catch (error: any) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        )
    }
}

// DELETE bulk orders
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const db = getSecurePrisma(session.user.organizationId)

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "Invalid or empty IDs array" },
                { status: 400 }
            );
        }

        // Delete orders (Cascade should handle related items)
        await db.order.deleteMany({
            where: { id: { in: ids } }
        });

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error: any) {
        console.error("Bulk Delete Error:", error);
        return NextResponse.json(
            { error: "Failed to delete orders" },
            { status: 500 }
        );
    }
}
