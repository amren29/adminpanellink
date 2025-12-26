import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getSecurePrisma } from '@/lib/prisma-secure'
import { authOptions } from '@/lib/auth'

// GET all agents
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
        const tier = searchParams.get('tier') || ''
        const status = searchParams.get('status') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { agentCode: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (tier) {
            where.agentTier = tier
        }

        if (status) {
            where.contractStatus = status
        }

        const [agents, total] = await Promise.all([
            db.agent.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.agent.count({ where }),
        ])

        const formattedAgents = agents.map(a => ({
            ...a,
            commissionRate: Number(a.commissionRate),
            walletBalance: Number(a.walletBalance),
            totalEarnings: Number(a.totalEarnings),
        }))

        return NextResponse.json({
            data: formattedAgents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching agents:', error)
        return NextResponse.json(
            { error: 'Failed to fetch agents' },
            { status: 500 }
        )
    }
}

// POST create new agent
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const db = getSecurePrisma(session.user.organizationId)

        const body = await request.json()

        // Generate unique agent code
        const lastAgent = await db.agent.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { agentCode: true },
        })

        let nextCode = 'AG001'
        if (lastAgent?.agentCode) {
            const num = parseInt(lastAgent.agentCode.replace('AG', '')) + 1
            nextCode = `AG${num.toString().padStart(3, '0')}`
        }

        const agent = await db.agent.create({
            data: {
                organizationId: session.user.organizationId,
                fullName: body.fullName,
                email: body.email,
                phone: body.phone,
                icNumber: body.icNumber,
                ssmNumber: body.ssmNumber,
                bankName: body.bankName,
                bankAccountNumber: body.bankAccountNumber,
                bankAccountHolder: body.bankAccountHolder,
                agentCode: nextCode,
                commissionRate: body.commissionRate || 5.00,
                agentTier: body.agentTier || 'Silver',
                contractStatus: body.contractStatus || 'Unsigned',
            },
        })

        return NextResponse.json(agent, { status: 201 })
    } catch (error: any) {
        console.error('Error creating agent:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'An agent with this email already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create agent' },
            { status: 500 }
        )
    }
}
