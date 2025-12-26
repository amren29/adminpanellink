import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getSecurePrisma } from '@/lib/prisma-secure'
import { authOptions } from '@/lib/auth'
import { checkUsageLimit } from '@/lib/access-control'


// GET all products
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const isSuperAdmin = (session?.user as any)?.isSuperAdmin
        const organizationId = (session?.user as any)?.organizationId

        if (!isSuperAdmin && !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const db = isSuperAdmin ? prisma : getSecurePrisma(organizationId)

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''
        const active = searchParams.get('active')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (category) {
            where.category = category
        }

        if (active !== null && active !== undefined) {
            where.isActive = active === 'true'
        }

        const [products, total] = await Promise.all([
            db.product.findMany({
                where,
                include: {
                    department: true,
                    pricingTiers: { orderBy: { minQty: 'asc' } },
                    fixedQuantities: { orderBy: { quantity: 'asc' } },
                    options: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.product.count({ where }),
        ])

        return NextResponse.json({
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        )
    }
}



// POST create new product
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check plan limits
        try {
            await checkUsageLimit(session.user.organizationId, 'products')
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 })
        }

        const db = getSecurePrisma(session.user.organizationId)

        const body = await request.json()

        // Generate slug from name if not provided
        const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

        // Map frontend pricing engine values to database enum
        const pricingEngineMap: Record<string, string> = {
            'sqft': 'SQFT',
            'qty_tier': 'QTY_TIER',
            'qty_fixed': 'FIXED_QTY',
            'apparel_multiline': 'FIXED', // Apparel uses fixed base + options
            'FIXED': 'FIXED',
            'SQFT': 'SQFT',
            'QTY_TIER': 'QTY_TIER',
            'FIXED_QTY': 'FIXED_QTY',
        }
        const pricingEngine = pricingEngineMap[body.pricingEngine] || 'FIXED'

        // Prepare pricing tiers data
        let pricingTiersData = undefined
        if (body.pricingTiers && body.pricingTiers.length > 0) {
            pricingTiersData = {
                create: body.pricingTiers.map((t: any) => ({
                    minQty: t.minQty,
                    maxQty: t.maxQty || null,
                    price: t.price,
                    variantId: t.variantId || null,
                }))
            }
        }

        // Prepare fixed quantities data
        let fixedQuantitiesData = undefined
        if (body.fixedQuantities && body.fixedQuantities.length > 0) {
            fixedQuantitiesData = {
                create: body.fixedQuantities.map((q: any) => ({
                    quantity: q.quantity,
                    price: q.price,
                    variantId: q.variantId || null,
                }))
            }
        }

        const product = await db.product.create({
            data: {
                organizationId: session.user.organizationId,
                name: body.name,
                slug,
                category: body.category || 'General',
                departmentId: body.departmentId || null,
                description: body.description || '',
                pricingEngine: pricingEngine as any,
                basePrice: body.basePrice || 0,
                basePricePerSqft: body.basePricePerSqft || 0,
                minimumPrice: body.minimumPrice || 0,
                blockSize: body.blockSize || null,
                minQuantity: body.minQuantity || 1,
                maxQuantity: body.maxQuantity || null,
                leadTimeDays: body.leadTimeDays || 3,
                images: body.images || [],
                tags: body.tags || [],
                selectedOptions: body.selectedOptions || null, // Admin-enabled options
                isActive: body.isActive !== false,
                trackStock: body.trackStock || false,
                stock: body.stock || 0,
                hasSizeOptions: body.hasSizeOptions || false,
                hasColorOptions: body.hasColorOptions || false,
                pricingTiers: pricingTiersData,
                fixedQuantities: fixedQuantitiesData,
                options: {
                    create: [
                        // Sizes
                        ...(body.availableSizes || []).map((s: any) => ({
                            optionType: 'size',
                            name: s.name,
                            value: JSON.stringify({
                                id: s.id,
                                w: s.widthInch || 0,
                                h: s.heightInch || 0,
                                m: s.multiplier || 1,
                                bp: s.basePrice || null
                            }),
                            priceAddon: s.priceAddon || 0,
                            isDefault: false
                        })),
                        // Dynamic Option Groups (Flattened)
                        ...(body.optionGroups || []).flatMap((group: any) =>
                            (group.options || []).map((opt: any) => ({
                                optionType: 'custom',
                                groupName: group.name,
                                name: opt.name,
                                pricingMode: opt.pricingMode || 'x',
                                priceValue: opt.priceValue || (opt.pricingMode === '+' ? 0 : 1),
                                value: JSON.stringify({
                                    scope: opt.priceScope || 'unit',
                                    customQty: opt.hasCustomQuantity || false
                                }),
                                isDefault: false
                            }))
                        )
                    ].filter(o => o.name)
                },
            },
            include: {
                pricingTiers: true,
                fixedQuantities: true,
                options: true,
            },
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error: any) {
        console.error('Error creating product:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A product with this slug already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: `Failed to create product: ${error.message}` },
            { status: 500 }
        )
    }
}

// DELETE bulk products
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

        // Transaction to delete products
        // Use db.$transaction for organization scoping
        await db.$transaction(async (tx) => {
            // Relies on Cascade Delete defined in Prisma Schema for related pricing/options
            await tx.product.deleteMany({
                where: { id: { in: ids } }
            });
        });



        return NextResponse.json({ success: true, count: ids.length });
    } catch (error: any) {
        console.error("Bulk Delete Error:", error);
        return NextResponse.json(
            { error: "Failed to delete products" },
            { status: 500 }
        );
    }
}
