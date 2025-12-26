import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/storefront/[slug]/checkout
// Create order from cart
export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // Find organization
        const org = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true }
        })

        if (!org) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const body = await request.json()
        const {
            sessionId,
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            shippingStreet,
            shippingCity,
            shippingState,
            shippingZip,
            shippingCountry,
            paymentMethod,
            notes
        } = body

        if (!customerName || !customerEmail) {
            return NextResponse.json(
                { error: 'Customer name and email are required' },
                { status: 400 }
            )
        }

        // Get cart
        const cart = await prisma.shopCart.findFirst({
            where: {
                organizationId: org.id,
                OR: [
                    { sessionId: sessionId || undefined },
                    { customerId: customerId || undefined }
                ]
            }
        })

        if (!cart || (cart.items as any[]).length === 0) {
            return NextResponse.json(
                { error: 'Cart is empty' },
                { status: 400 }
            )
        }

        const items = cart.items as any[]
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const shippingAmount = 0 // Could calculate based on location
        const taxAmount = subtotal * 0.06 // 6% SST
        const totalAmount = subtotal + shippingAmount + taxAmount

        // Generate order number
        const orderCount = await prisma.shopOrder.count({
            where: { organizationId: org.id }
        })
        const orderNumber = `SO${String(orderCount + 1).padStart(6, '0')}`

        // Create order
        const order = await prisma.shopOrder.create({
            data: {
                organizationId: org.id,
                customerId,
                orderNumber,
                customerName,
                customerEmail,
                customerPhone,
                shippingStreet,
                shippingCity,
                shippingState,
                shippingZip,
                shippingCountry: shippingCountry || 'Malaysia',
                subtotal,
                shippingAmount,
                taxAmount,
                totalAmount,
                paymentMethod: paymentMethod || 'online',
                notes,
                items,
                status: 'pending',
                paymentStatus: 'pending'
            }
        })

        // Clear cart
        await prisma.shopCart.delete({ where: { id: cart.id } })

        // TODO: Also create order in main Order table for admin visibility

        return NextResponse.json({
            message: 'Order placed successfully',
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: Number(order.totalAmount),
                status: order.status
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Failed to place order' },
            { status: 500 }
        )
    }
}
