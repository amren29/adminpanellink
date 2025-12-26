import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import prisma from "@/lib/prisma";
import { getSecurePrisma } from '@/lib/prisma-secure';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const db = getSecurePrisma(session.user.organizationId);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const search = searchParams.get('search') || '';

        // If ID is provided, fetch single invoice
        if (id) {
            const invoice = await db.invoice.findFirst({
                where: { id },
                include: {
                    customer: true,
                    lineItems: true
                }
            });

            if (!invoice) {
                return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
            }

            const formattedInvoice = {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerId: invoice.customerId,
                customerName: invoice.customer?.fullName || "Unknown",
                customerEmail: invoice.customer?.email || "",
                lineItems: invoice.lineItems.map(item => ({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.total),
                    productId: item.productId,
                })),
                subtotal: Number(invoice.subtotal),
                taxRate: Number(invoice.taxRate),
                taxAmount: Number(invoice.taxAmount),
                total: Number(invoice.total),
                status: invoice.status,
                dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : '',
                createdDate: invoice.createdAt.toISOString().split('T')[0],
                notes: invoice.notes,
                paymentMethod: invoice.paymentMethod,
            };

            return NextResponse.json(formattedInvoice);
        }

        // Otherwise fetch all invoices
        const invoices = await db.invoice.findMany({
            where: search ? {
                OR: [
                    { invoiceNumber: { contains: search, mode: 'insensitive' } },
                    { customer: { fullName: { contains: search, mode: 'insensitive' } } }
                ]
            } : {},
            include: {
                customer: true,
                lineItems: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform data for frontend
        const formattedInvoices = invoices.map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerId: invoice.customerId,
            customerName: invoice.customer?.fullName || "Unknown",
            customerEmail: invoice.customer?.email || "",
            lineItems: invoice.lineItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productId: item.productId,
            })),
            subtotal: Number(invoice.subtotal),
            taxRate: Number(invoice.taxRate),
            taxAmount: Number(invoice.taxAmount),
            total: Number(invoice.total),
            status: invoice.status,
            dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : '',
            createdDate: invoice.createdAt.toISOString().split('T')[0],
            notes: invoice.notes,
            paymentMethod: invoice.paymentMethod,
        }));

        return NextResponse.json(formattedInvoices);
    } catch (error) {
        console.error("GET Invoices Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch invoices" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const db = getSecurePrisma(session.user.organizationId);

        const body = await request.json();

        if (!body.customerId) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }

        const newInvoice = await db.invoice.create({
            data: {
                invoiceNumber: body.invoiceNumber,
                customerId: body.customerId,
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                status: body.status || 'Draft',
                notes: body.notes,
                subtotal: body.subtotal,
                taxRate: body.taxRate,
                taxAmount: body.taxAmount,
                total: body.total,
                paymentMethod: body.paymentMethod,
                organizationId: session.user.organizationId, // Add org ID!
                lineItems: {
                    create: body.lineItems.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total,
                        productId: item.productId || null,
                    }))
                }
            },
            include: {
                customer: true,
                lineItems: true
            }
        });

        const formattedInvoice = {
            id: newInvoice.id,
            invoiceNumber: newInvoice.invoiceNumber,
            customerId: newInvoice.customerId,
            customerName: newInvoice.customer?.fullName,
            customerEmail: newInvoice.customer?.email,
            lineItems: newInvoice.lineItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productId: item.productId,
            })),
            subtotal: Number(newInvoice.subtotal),
            taxRate: Number(newInvoice.taxRate),
            taxAmount: Number(newInvoice.taxAmount),
            total: Number(newInvoice.total),
            status: newInvoice.status,
            dueDate: newInvoice.dueDate ? newInvoice.dueDate.toISOString().split('T')[0] : '',
            createdDate: newInvoice.createdAt.toISOString().split('T')[0],
            notes: newInvoice.notes,
            paymentMethod: newInvoice.paymentMethod,
        };

        return NextResponse.json(formattedInvoice);
    } catch (error) {
        console.error("POST Invoice Error:", error);
        return NextResponse.json(
            { error: `Failed to create invoice: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const db = getSecurePrisma(session.user.organizationId);

        // Transaction for atomicity
        const updatedInvoice = await db.$transaction(async (tx) => {
            // Delete existing line items
            await tx.lineItem.deleteMany({
                where: { invoiceId: body.id }
            });

            // Update invoice and recreate line items
            const result = await tx.invoice.update({
                where: { id: body.id },
                data: {
                    customerId: body.customerId,
                    dueDate: body.dueDate ? new Date(body.dueDate) : null,
                    status: body.status,
                    notes: body.notes,
                    subtotal: body.subtotal,
                    taxRate: body.taxRate,
                    taxAmount: body.taxAmount,
                    total: body.total,
                    paymentMethod: body.paymentMethod,
                    lineItems: {
                        create: body.lineItems.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            total: item.total,
                            productId: item.productId || null,
                        }))
                    }
                },
                include: {
                    customer: true,
                    lineItems: true
                }
            });

            // Sync with Order if Paid
            if (body.status === 'Paid' && result.orderId) {
                try {
                    await tx.order.update({
                        where: { id: result.orderId },
                        data: {
                            paymentStatus: 'paid',
                            paidAmount: result.total || 0,
                            paymentMethod: result.paymentMethod?.substring(0, 20) // Truncate to fit Order schema
                        }
                    });
                    console.log(`[Invoice-Sync] Updated Order ${result.orderId} to Paid`);
                } catch (err: any) {
                    console.error(`[Invoice-Sync] Failed to update linked Order ${result.orderId}:`, err);
                    // If Order not found (P2025), maybe we should treat it as unlinked? 
                    // But for now, let's just log and NOT fail the invoice update, so the user can verify.
                    // Or ideally, we fail so data is consistent.
                    // Let's rethrow to see the error for now, as consistency > partial state.
                    throw err;
                }
            }
            // Auto-Create Order if Paid and No Order Linked (e.g. from Quote)
            else if (body.status === 'Paid' && !result.orderId) {
                console.log(`[Invoice-Sync] Auto-creating Order for Paid Invoice ${result.invoiceNumber}`);

                // Generate new Order Number
                // Use global 'prisma' to ensure uniqueness across ALL organizations
                const lastOrder = await prisma.order.findFirst({
                    orderBy: { createdAt: 'desc' },
                    select: { orderNumber: true } // Select specifically to be efficient
                });

                let nextNum = 1;
                if (lastOrder?.orderNumber) {
                    const match = lastOrder.orderNumber.match(/ORD-(\d+)/);
                    if (match) nextNum = parseInt(match[1]) + 1;
                }
                const orderNumber = `ORD-${nextNum.toString().padStart(6, '0')}`;

                const newOrder = await tx.order.create({
                    data: {
                        orderNumber,
                        customerId: result.customerId,
                        status: 'new_order',
                        paymentStatus: 'paid',
                        paidAmount: result.total || 0,
                        paymentMethod: result.paymentMethod?.substring(0, 20), // Truncate
                        totalAmount: result.total,
                        subtotal: result.subtotal,
                        taxAmount: result.taxAmount,
                        notes: `Auto-generated from Invoice ${result.invoiceNumber}. ${result.notes || ''}`,
                        items: {
                            create: result.lineItems.map(item => ({
                                name: item.description.substring(0, 200), // Truncate to fit OrderItem schema (200 chars)
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                totalPrice: item.total,
                                productId: item.productId // UUID or null is fine
                            }))
                        }
                    }
                });

                // Link Invoice to new Order
                await tx.invoice.update({
                    where: { id: result.id },
                    data: { orderId: newOrder.id }
                });

                console.log(`[Invoice-Sync] Created new Order ${orderNumber} for Invoice ${result.invoiceNumber}`);
            }

            return result;
        });

        const formattedInvoice = {
            id: updatedInvoice.id,
            invoiceNumber: updatedInvoice.invoiceNumber,
            customerId: updatedInvoice.customerId,
            customerName: updatedInvoice.customer?.fullName,
            customerEmail: updatedInvoice.customer?.email,
            lineItems: updatedInvoice.lineItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productId: item.productId,
            })),
            subtotal: Number(updatedInvoice.subtotal),
            taxRate: Number(updatedInvoice.taxRate),
            taxAmount: Number(updatedInvoice.taxAmount),
            total: Number(updatedInvoice.total),
            status: updatedInvoice.status,
            dueDate: updatedInvoice.dueDate ? updatedInvoice.dueDate.toISOString().split('T')[0] : '',
            createdDate: updatedInvoice.createdAt.toISOString().split('T')[0],
            notes: updatedInvoice.notes,
            paymentMethod: updatedInvoice.paymentMethod,
        };

        return NextResponse.json(formattedInvoice);
    } catch (error) {
        console.error("PUT Invoice Error:", error);
        return NextResponse.json(
            { error: "Failed to update invoice" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const db = getSecurePrisma(session.user.organizationId);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Check for bulk delete body first
        try {
            const body = await request.clone().json();
            if (body && body.ids && Array.isArray(body.ids)) {
                await db.invoice.deleteMany({
                    where: { id: { in: body.ids } }
                });
                return NextResponse.json({ success: true, count: body.ids.length });
            }
        } catch (e) {
            // No valid JSON body
        }

        if (!id) {
            return NextResponse.json({ error: "Invoice ID or IDs required" }, { status: 400 });
        }

        await db.invoice.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Invoice Error:", error);
        return NextResponse.json(
            { error: "Failed to delete invoice" },
            { status: 500 }
        );
    }
}
