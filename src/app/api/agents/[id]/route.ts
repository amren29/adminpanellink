import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET single agent by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const agent = await prisma.agent.findUnique({
            where: { id },
            include: {
                walletTransactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        })

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(agent)
    } catch (error) {
        console.error('Error fetching agent:', error)
        return NextResponse.json(
            { error: 'Failed to fetch agent' },
            { status: 500 }
        )
    }
}

// PUT update agent
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const agent = await prisma.agent.update({
            where: { id },
            data: {
                fullName: body.fullName,
                email: body.email,
                phone: body.phone,
                icNumber: body.icNumber,
                ssmNumber: body.ssmNumber,
                bankName: body.bankName,
                bankAccountNumber: body.bankAccountNumber,
                bankAccountHolder: body.bankAccountHolder,
                commissionRate: body.commissionRate,
                agentTier: body.agentTier,
                contractStatus: body.contractStatus,
                isActive: body.isActive,
            },
        })

        return NextResponse.json(agent)
    } catch (error: any) {
        console.error('Error updating agent:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update agent' },
            { status: 500 }
        )
    }
}

// DELETE agent (hard delete)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // First delete related wallet transactions
        await prisma.walletTransaction.deleteMany({
            where: { agentId: id },
        })

        // Then delete the agent
        await prisma.agent.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting agent:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }
        // Foreign key constraint error
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'Cannot delete agent with existing orders. Please reassign or delete orders first.' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to delete agent' },
            { status: 500 }
        )
    }
}
