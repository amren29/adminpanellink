import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/storefront/[slug]/product/[id]
// Public endpoint - fetches single product details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string; id: string }> }
) {
    try {
        const { slug, id } = await params

        // Find organization by slug
        const org = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true }
        })

        if (!org) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const product = await prisma.product.findFirst({
            where: {
                id,
                organizationId: org.id,
                isActive: true
            },
            include: {
                pricingTiers: { orderBy: { minQty: 'asc' } },
                fixedQuantities: { orderBy: { quantity: 'asc' } },
                options: true,
                department: { select: { name: true, color: true } },
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Transform decimals
        const formattedProduct = {
            ...product,
            basePrice: product.basePrice ? Number(product.basePrice) : null,
            basePricePerSqft: product.basePricePerSqft ? Number(product.basePricePerSqft) : null,
            minimumPrice: product.minimumPrice ? Number(product.minimumPrice) : null,
            pricingTiers: product.pricingTiers.map(t => ({
                ...t,
                price: Number(t.price)
            })),
            fixedQuantities: product.fixedQuantities.map(q => ({
                ...q,
                price: Number(q.price)
            })),
            options: product.options.map(o => ({
                ...o,
                priceAddon: Number(o.priceAddon),
                priceValue: o.priceValue ? Number(o.priceValue) : null
            })),
        }

        return NextResponse.json(formattedProduct)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        )
    }
}
