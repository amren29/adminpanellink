import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all packages
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (status === 'active') {
            where.isActive = true
        } else if (status === 'inactive') {
            where.isActive = false
        }

        const packages = await prisma.package.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, basePrice: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(packages)
    } catch (error) {
        console.error('Error fetching packages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch packages' },
            { status: 500 }
        )
    }
}

// POST create new package
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Generate slug from name
        const slug = body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        const pkg = await prisma.package.create({
            data: {
                name: body.name,
                slug,
                description: body.description,
                price: body.price || 0,
                originalPrice: body.originalPrice || null,
                imageUrl: body.image || null,
                campaignStart: body.campaignStart ? new Date(body.campaignStart) : null,
                campaignEnd: body.campaignEnd ? new Date(body.campaignEnd) : null,
                isActive: body.isActive ?? true,
                stockLimit: body.stockLimit || null,
                items: body.items && body.items.length > 0
                    ? {
                        create: body.items.map((item: any) => ({
                            productId: item.productId || null,
                            quantity: item.quantity || 1,
                            variantDescription: item.variantDescription || null,
                            unitPrice: item.unitPrice || null,
                        })),
                    }
                    : undefined,
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, basePrice: true }
                        }
                    }
                }
            },
        })

        return NextResponse.json(pkg, { status: 201 })
    } catch (error: any) {
        console.error('Error creating package:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A package with this name already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create package' },
            { status: 500 }
        )
    }
}

// PUT update package
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, items, ...data } = body

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        // Delete existing items first
        await prisma.packageItem.deleteMany({
            where: { packageId: id }
        })

        const pkg = await prisma.package.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                price: data.price || 0,
                originalPrice: data.originalPrice || null,
                imageUrl: data.image || null,
                campaignStart: data.campaignStart ? new Date(data.campaignStart) : null,
                campaignEnd: data.campaignEnd ? new Date(data.campaignEnd) : null,
                isActive: data.isActive,
                stockLimit: data.stockLimit || null,
                items: items && items.length > 0
                    ? {
                        create: items.map((item: any) => ({
                            productId: item.productId || null,
                            quantity: item.quantity || 1,
                            variantDescription: item.variantDescription || null,
                            unitPrice: item.unitPrice || null,
                        })),
                    }
                    : undefined,
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, basePrice: true }
                        }
                    }
                }
            },
        })

        return NextResponse.json(pkg)
    } catch (error: any) {
        console.error('Error updating package:', error)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 })
        }
        return NextResponse.json(
            { error: error.message || 'Failed to update package' },
            { status: 500 }
        )
    }
}

// DELETE package
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await prisma.package.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting package:', error)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 })
        }
        return NextResponse.json(
            { error: error.message || 'Failed to delete package' },
            { status: 500 }
        )
    }
}
