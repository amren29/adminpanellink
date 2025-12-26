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

        // If ID is provided, fetch single quote
        if (id) {
            const quote = await db.quote.findFirst({
                where: { id },
                include: {
                    customer: true,
                    lineItems: true,
                }
            });

            if (!quote) {
                return NextResponse.json({ error: "Quote not found" }, { status: 404 });
            }

            const formattedQuote = {
                id: quote.id,
                quoteNumber: quote.quoteNumber,
                customerId: quote.customerId,
                customerName: quote.customer?.fullName || 'Unknown Customer',
                customerEmail: quote.customer?.email || '',
                lineItems: quote.lineItems.map(item => ({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.total),
                    productId: item.productId,
                })),
                subtotal: Number(quote.subtotal),
                taxRate: Number(quote.taxRate),
                taxAmount: Number(quote.taxAmount),
                total: Number(quote.total),
                status: quote.status,
                createdDate: quote.createdAt.toISOString().split('T')[0],
                validUntil: quote.validUntil ? quote.validUntil.toISOString().split('T')[0] : '',
                notes: quote.notes,
            };

            return NextResponse.json(formattedQuote);
        }

        // Otherwise fetch all quotes
        const quotes = await db.quote.findMany({
            where: search ? {
                OR: [
                    { quoteNumber: { contains: search, mode: 'insensitive' } },
                    { customer: { fullName: { contains: search, mode: 'insensitive' } } },
                ]
            } : {},
            include: {
                customer: true,
                lineItems: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform to frontend format
        const formattedQuotes = quotes.map(q => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            customerId: q.customerId,
            customerName: q.customer?.fullName || 'Unknown Customer',
            customerEmail: q.customer?.email || '',
            lineItems: q.lineItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productId: item.productId,
            })),
            subtotal: Number(q.subtotal),
            taxRate: Number(q.taxRate),
            taxAmount: Number(q.taxAmount),
            total: Number(q.total),
            status: q.status,
            createdDate: q.createdAt.toISOString().split('T')[0],
            validUntil: q.validUntil ? q.validUntil.toISOString().split('T')[0] : '',
            notes: q.notes,
        }));

        return NextResponse.json(formattedQuotes);
    } catch (error) {
        console.error("GET Quote Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch quotes" },
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

        // Ensure customerId is valid UUID or handle error
        if (!body.customerId) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }

        const newQuote = await db.quote.create({
            data: {
                quoteNumber: body.quoteNumber,
                customerId: body.customerId, // Assumes this is a valid UUID from customer selection
                validUntil: body.validUntil ? new Date(body.validUntil) : null,
                status: body.status || 'Draft',
                notes: body.notes,
                subtotal: body.subtotal,
                taxRate: body.taxRate,
                taxAmount: body.taxAmount,
                total: body.total,
                organizationId: session.user.organizationId,
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

        const formattedQuote = {
            id: newQuote.id,
            quoteNumber: newQuote.quoteNumber,
            customerId: newQuote.customerId,
            customerName: newQuote.customer?.fullName,
            customerEmail: newQuote.customer?.email,
            lineItems: newQuote.lineItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productId: item.productId,
            })),
            subtotal: Number(newQuote.subtotal),
            taxRate: Number(newQuote.taxRate),
            taxAmount: Number(newQuote.taxAmount),
            total: Number(newQuote.total),
            status: newQuote.status,
            createdDate: newQuote.createdAt.toISOString().split('T')[0],
            validUntil: newQuote.validUntil ? newQuote.validUntil.toISOString().split('T')[0] : '',
            notes: newQuote.notes,
        };

        return NextResponse.json(formattedQuote);
    } catch (error) {
        console.error("POST Quote Error:", error);
        return NextResponse.json(
            { error: "Failed to create quote" },
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
        const db = getSecurePrisma(session.user.organizationId);

        const body = await request.json();

        let updatedQuote;

        if (body.lineItems) {
            // Transaction: Delete existing line items and recreate
            updatedQuote = await db.$transaction(async (tx) => {
                await tx.lineItem.deleteMany({
                    where: { quoteId: body.id }
                });

                return await tx.quote.update({
                    where: { id: body.id },
                    data: {
                        customerId: body.customerId,
                        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
                        status: body.status,
                        notes: body.notes,
                        subtotal: body.subtotal,
                        taxRate: body.taxRate,
                        taxAmount: body.taxAmount,
                        total: body.total,
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
            });
        } else {
            // Simple Update (Status or other fields only)
            updatedQuote = await db.quote.update({
                where: { id: body.id },
                data: {
                    status: body.status,
                    notes: body.notes,
                    validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
                },
                include: {
                    customer: true,
                    lineItems: true
                }
            });
        }

        // Auto-Create Invoice if Accepted
        if (body.status === 'Accepted' && updatedQuote.status === 'Accepted') {
            try {
                await db.$transaction(async (tx) => {
                    // Check if invoice already exists
                    const existing = await tx.invoice.findFirst({
                        where: { quoteId: updatedQuote.id }
                    });

                    if (!existing) {
                        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

                        await tx.invoice.create({
                            data: {
                                invoiceNumber,
                                customerId: updatedQuote.customerId,
                                quoteId: updatedQuote.id,
                                status: 'Draft',
                                subtotal: updatedQuote.subtotal,
                                taxRate: updatedQuote.taxRate,
                                taxAmount: updatedQuote.taxAmount,
                                total: updatedQuote.total,
                                notes: `Converted from Quote ${updatedQuote.quoteNumber}. ${updatedQuote.notes || ''}`,
                                paymentTerms: updatedQuote.terms,
                                dueDate: updatedQuote.validUntil,
                                createdAt: new Date(),
                                organizationId: session.user.organizationId,
                                lineItems: {
                                    create: updatedQuote.lineItems.map(item => ({
                                        description: item.description,
                                        quantity: item.quantity,
                                        unitPrice: item.unitPrice,
                                        total: item.total,
                                        productId: item.productId
                                    }))
                                }
                            }
                        });
                        console.log(`[Auto-Create] Invoice ${invoiceNumber} created for Quote ${updatedQuote.quoteNumber}`);
                    }
                });
            } catch (err) {
                console.error("Failed to auto-create invoice for quote:", err);
            }
        }

        const formattedQuote = {
            id: updatedQuote.id,
            quoteNumber: updatedQuote.quoteNumber,
            customerId: updatedQuote.customerId,
            customerName: updatedQuote.customer?.fullName,
            customerEmail: updatedQuote.customer?.email,
            lineItems: updatedQuote.lineItems.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productId: item.productId,
            })),
            subtotal: Number(updatedQuote.subtotal),
            taxRate: Number(updatedQuote.taxRate),
            taxAmount: Number(updatedQuote.taxAmount),
            total: Number(updatedQuote.total),
            status: updatedQuote.status,
            createdDate: updatedQuote.createdAt.toISOString().split('T')[0],
            validUntil: updatedQuote.validUntil ? updatedQuote.validUntil.toISOString().split('T')[0] : '',
            notes: updatedQuote.notes,
        };

        return NextResponse.json(formattedQuote);
    } catch (error) {
        console.error("PUT Quote Error:", error);
        return NextResponse.json(
            { error: "Failed to update quote" },
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
                await db.quote.deleteMany({
                    where: { id: { in: body.ids } }
                });
                return NextResponse.json({ success: true, count: body.ids.length });
            }
        } catch (e) {
            // No JSON body, proceed to check query param
        }

        if (!id) {
            return NextResponse.json({ error: "Quote ID or IDs required" }, { status: 400 });
        }

        await db.quote.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Quote Error:", error);
        return NextResponse.json(
            { error: "Failed to delete quote" },
            { status: 500 }
        );
    }
}
