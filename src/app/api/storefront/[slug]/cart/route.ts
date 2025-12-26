import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/storefront/[slug]/cart?sessionId=xxx
// Get cart items
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')
        const customerId = searchParams.get('customerId')

        if (!sessionId && !customerId) {
            return NextResponse.json({ items: [], total: 0 })
        }

        // Find organization
        const org = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true }
        })

        if (!org) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        // Find cart
        const cart = await prisma.shopCart.findFirst({
            where: {
                organizationId: org.id,
                OR: [
                    { sessionId: sessionId || undefined },
                    { customerId: customerId || undefined }
                ]
            }
        })

        if (!cart) {
            return NextResponse.json({ items: [], total: 0 })
        }

        const items = cart.items as any[]
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        return NextResponse.json({ items, total })
    } catch (error) {
        console.error('Error fetching cart:', error)
        return NextResponse.json(
            { error: 'Failed to fetch cart' },
            { status: 500 }
        )
    }
}

// POST /api/storefront/[slug]/cart
// Add item to cart
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
        const { sessionId, customerId, productId, name, price, quantity, options } = body

        if (!sessionId && !customerId) {
            return NextResponse.json(
                { error: 'Session ID or Customer ID required' },
                { status: 400 }
            )
        }

        // Find or create cart
        let cart = await prisma.shopCart.findFirst({
            where: {
                organizationId: org.id,
                OR: [
                    { sessionId: sessionId || undefined },
                    { customerId: customerId || undefined }
                ]
            }
        })

        const newItem = {
            id: crypto.randomUUID(),
            productId,
            name,
            price,
            quantity,
            options: options || {},
            addedAt: new Date().toISOString()
        }

        if (cart) {
            // Add to existing cart
            const items = cart.items as any[]
            items.push(newItem)

            await prisma.shopCart.update({
                where: { id: cart.id },
                data: { items }
            })
        } else {
            // Create new cart
            cart = await prisma.shopCart.create({
                data: {
                    organizationId: org.id,
                    sessionId,
                    customerId,
                    items: [newItem],
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            })
        }

        return NextResponse.json({ message: 'Item added to cart', item: newItem })
    } catch (error) {
        console.error('Error adding to cart:', error)
        return NextResponse.json(
            { error: 'Failed to add to cart' },
            { status: 500 }
        )
    }
}

// DELETE /api/storefront/[slug]/cart
// Remove item from cart
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')
        const itemId = searchParams.get('itemId')

        if (!sessionId || !itemId) {
            return NextResponse.json(
                { error: 'Session ID and Item ID required' },
                { status: 400 }
            )
        }

        // Find organization
        const org = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true }
        })

        if (!org) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const cart = await prisma.shopCart.findFirst({
            where: {
                organizationId: org.id,
                sessionId
            }
        })

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
        }

        const items = (cart.items as any[]).filter(item => item.id !== itemId)

        await prisma.shopCart.update({
            where: { id: cart.id },
            data: { items }
        })

        return NextResponse.json({ message: 'Item removed from cart' })
    } catch (error) {
        console.error('Error removing from cart:', error)
        return NextResponse.json(
            { error: 'Failed to remove from cart' },
            { status: 500 }
        )
    }
}
