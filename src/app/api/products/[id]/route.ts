import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET single product by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                department: true,
                pricingTiers: { orderBy: { minQty: 'asc' } },
                fixedQuantities: { orderBy: { quantity: 'asc' } },
                options: true,
            },
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(product)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        )
    }
}

// PUT update product
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        // Map frontend pricing engine values to database enum
        const pricingEngineMap: Record<string, string> = {
            'sqft': 'SQFT',
            'qty_tier': 'QTY_TIER',
            'qty_fixed': 'FIXED_QTY',
            'apparel_multiline': 'FIXED',
            'FIXED': 'FIXED',
            'SQFT': 'SQFT',
            'QTY_TIER': 'QTY_TIER',
            'FIXED_QTY': 'FIXED_QTY',
        }
        const pricingEngine = body.pricingEngine ? (pricingEngineMap[body.pricingEngine] || body.pricingEngine) : undefined

        // Clear existing size options before re-creating them
        if (body.availableSizes !== undefined) {
            await prisma.productOption.deleteMany({
                where: {
                    productId: id,
                    optionType: 'size'
                }
            })
        }

        // Clear existing pricing tiers and fixed quantities (to replace with new set)
        if (body.pricingTiers !== undefined) {
            await prisma.pricingTier.deleteMany({
                where: { productId: id }
            })
        }
        if (body.fixedQuantities !== undefined) {
            await prisma.fixedQuantity.deleteMany({
                where: { productId: id }
            })
        }

        // Clear existing options (Fix for duplicate options on update)
        if (body.hasSizeOptions || body.productMaterials || body.productFinishing || body.optionGroups) {
            await prisma.productOption.deleteMany({
                where: { productId: id }
            })
        }

        // DEBUG: Log incoming optionGroups
        console.log('[PUT Product] optionGroups received:', JSON.stringify(body.optionGroups, null, 2));

        // Update product with nested updates for pricing tiers and options
        const product = await prisma.product.update({
            where: { id },
            data: {
                name: body.name,
                slug: body.slug,
                category: body.category,
                departmentId: body.departmentId || null,
                description: body.description,
                pricingEngine: pricingEngine as any,
                basePrice: body.basePrice,
                basePricePerSqft: body.basePricePerSqft,
                minimumPrice: body.minimumPrice,
                blockSize: body.blockSize,
                minQuantity: body.minQuantity,
                maxQuantity: body.maxQuantity,
                leadTimeDays: body.leadTimeDays,
                isActive: body.isActive,
                trackStock: body.trackStock,
                stock: body.stock,
                images: body.images,
                tags: body.tags,
                selectedOptions: body.selectedOptions || null, // Admin-enabled options
                hasSizeOptions: body.hasSizeOptions,
                hasColorOptions: body.hasColorOptions,
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
                pricingTiers: body.pricingTiers ? {
                    create: body.pricingTiers.map((t: any) => ({
                        minQty: t.minQty,
                        maxQty: t.maxQty,
                        price: t.price,
                        variantId: t.variantId || null
                    }))
                } : undefined,
                fixedQuantities: body.fixedQuantities ? {
                    create: body.fixedQuantities.map((q: any) => ({
                        quantity: q.quantity,
                        price: q.price,
                        variantId: q.variantId || null
                    }))
                } : undefined,
            },
            include: {
                pricingTiers: true,
                fixedQuantities: true,
                options: true,
            },
        })

        return NextResponse.json(product)
    } catch (error: any) {
        console.error('Error updating product:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: `Failed to update product: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        )
    }
}

// DELETE product (hard delete)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Delete related data first (pricing tiers, fixed quantities, options)
        await prisma.pricingTier.deleteMany({ where: { productId: id } })
        await prisma.fixedQuantity.deleteMany({ where: { productId: id } })
        await prisma.productOption.deleteMany({ where: { productId: id } })

        // Then delete the product
        await prisma.product.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting product:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}
