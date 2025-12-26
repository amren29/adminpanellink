import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET single customer by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                addresses: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        })

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(customer)
    } catch (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        )
    }
}

// PUT update customer
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { fullName, email, phone, companyName, taxId, marketingOptIn } = body

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                fullName,
                email,
                phone,
                companyName,
                taxId,
                marketingOptIn,
            },
            include: { addresses: true },
        })

        return NextResponse.json(customer)
    } catch (error: any) {
        console.error('Error updating customer:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        )
    }
}

// DELETE customer
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.customer.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting customer:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        )
    }
}
