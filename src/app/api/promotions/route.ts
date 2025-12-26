import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all promotions
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''

        const where: any = {}

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (status === 'active') {
            where.isActive = true
        } else if (status === 'inactive') {
            where.isActive = false
        }

        const promotions = await prisma.promotion.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(promotions)
    } catch (error) {
        console.error('Error fetching promotions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch promotions' },
            { status: 500 }
        )
    }
}

// POST create new promotion
export async function POST(request: Request) {
    try {
        const body = await request.json()

        const promotion = await prisma.promotion.create({
            data: {
                code: body.code.toUpperCase(),
                description: body.description,
                type: body.type || 'percentage',
                value: body.value,
                minSpend: body.minSpend || null,
                maxDiscount: body.maxDiscount || null,
                startDate: body.startDate ? new Date(body.startDate) : null,
                endDate: body.endDate ? new Date(body.endDate) : null,
                usageLimit: body.usageLimit || null,
                usageLimitPerCustomer: body.usageLimitPerCustomer || 1,
                isActive: body.isActive ?? true,
                appliesTo: body.appliesTo || 'all',
                targetIds: body.targetIds || [],
                firstOrderOnly: body.firstOrderOnly || false,
            },
        })

        return NextResponse.json(promotion, { status: 201 })
    } catch (error: any) {
        console.error('Error creating promotion:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A promotion with this code already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create promotion' },
            { status: 500 }
        )
    }
}

// PUT update promotion
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, ...data } = body

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const promotion = await prisma.promotion.update({
            where: { id },
            data: {
                code: data.code?.toUpperCase(),
                description: data.description,
                type: data.type,
                value: data.value,
                minSpend: data.minSpend || null,
                maxDiscount: data.maxDiscount || null,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                usageLimit: data.usageLimit || null,
                usageLimitPerCustomer: data.usageLimitPerCustomer || 1,
                isActive: data.isActive,
                appliesTo: data.appliesTo,
                targetIds: data.targetIds || [],
                firstOrderOnly: data.firstOrderOnly || false,
            },
        })

        return NextResponse.json(promotion)
    } catch (error: any) {
        console.error('Error updating promotion:', error)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
        }
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A promotion with this code already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: error.message || 'Failed to update promotion' },
            { status: 500 }
        )
    }
}

// DELETE promotion
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await prisma.promotion.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting promotion:', error)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
        }
        return NextResponse.json(
            { error: error.message || 'Failed to delete promotion' },
            { status: 500 }
        )
    }
}
