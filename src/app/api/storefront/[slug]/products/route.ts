import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/storefront/[slug]/products
// Public endpoint - fetches products for a specific organization
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        
        // Find organization by slug
        const org = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true, name: true }
        })
        
        if (!org) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }
        
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit
        
        const where: any = {
            organizationId: org.id,
            isActive: true
        }
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }
        
        if (category) {
            where.category = category
        }
        
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    category: true,
                    description: true,
                    images: true,
                    basePrice: true,
                    pricingEngine: true,
                    minQuantity: true,
                    leadTimeDays: true,
                    tags: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ])
        
        // Transform prices to numbers
        const formattedProducts = products.map(p => ({
            ...p,
            basePrice: p.basePrice ? Number(p.basePrice) : null,
        }))
        
        return NextResponse.json({
            data: formattedProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching storefront products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        )
    }
}
