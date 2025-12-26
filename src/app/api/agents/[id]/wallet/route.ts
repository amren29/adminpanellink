import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET wallet transactions for agent
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const [transactions, total, agent] = await Promise.all([
            prisma.walletTransaction.findMany({
                where: { agentId: id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.walletTransaction.count({ where: { agentId: id } }),
            prisma.agent.findUnique({
                where: { id },
                select: { walletBalance: true, totalEarnings: true },
            }),
        ])

        return NextResponse.json({
            data: transactions,
            balance: agent?.walletBalance || 0,
            totalEarnings: agent?.totalEarnings || 0,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching wallet transactions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}

// POST create wallet transaction (credit/withdrawal request)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { type, amount, reference, description } = body

        // Get current balance
        const agent = await prisma.agent.findUnique({
            where: { id },
            select: { walletBalance: true },
        })

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        let newBalance = Number(agent.walletBalance)

        if (type === 'credit') {
            newBalance += amount
        } else if (type === 'debit' || type === 'withdrawal') {
            if (amount > Number(agent.walletBalance)) {
                return NextResponse.json(
                    { error: 'Insufficient balance' },
                    { status: 400 }
                )
            }
            newBalance -= amount
        }

        // Create transaction and update balance in a transaction
        const [transaction] = await prisma.$transaction([
            prisma.walletTransaction.create({
                data: {
                    agentId: id,
                    type,
                    amount,
                    balanceAfter: newBalance,
                    reference,
                    description,
                    status: type === 'withdrawal' ? 'pending' : 'completed',
                },
            }),
            prisma.agent.update({
                where: { id },
                data: {
                    walletBalance: newBalance,
                    totalEarnings:
                        type === 'credit'
                            ? { increment: amount }
                            : undefined,
                },
            }),
        ])

        return NextResponse.json(transaction, { status: 201 })
    } catch (error) {
        console.error('Error creating wallet transaction:', error)
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        )
    }
}
