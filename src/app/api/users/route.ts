import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getSecurePrisma } from '@/lib/prisma-secure'
import { authOptions } from '@/lib/auth'

import { checkUsageLimit } from '@/lib/access-control'

// GET all users
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
        const role = searchParams.get('role') || ''
        const department = searchParams.get('department') || ''
        const active = searchParams.get('active')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (role) {
            where.role = role
        }

        if (department) {
            where.department = department
        }

        if (active !== null && active !== undefined) {
            where.isActive = active === 'true'
        }

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    department: true,
                    phone: true,
                    avatarUrl: true,
                    isActive: true,
                    lastLogin: true,
                    createdAt: true,
                    workflowRole: true,
                    allowedRoutes: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.user.count({ where }),
        ])

        return NextResponse.json({
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

// POST create new user
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check plan limits
        try {
            await checkUsageLimit(session.user.organizationId, 'users')
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 })
        }

        const body = await request.json()
        const bcrypt = await import('bcrypt')

        // Hash password
        const passwordHash = await bcrypt.hash(body.password, 10)

        const user = await prisma.user.create({
            data: {
                organizationId: session.user.organizationId, // Inject org ID!
                name: body.name,
                email: body.email,
                passwordHash,
                role: body.role || 'staff',
                department: body.department,
                phone: body.phone,
                avatarUrl: body.avatarUrl,
                workflowRole: body.workflowRole,
                allowedRoutes: body.allowedRoutes || [],
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
                workflowRole: true,
                allowedRoutes: true,
            },
        })

        return NextResponse.json(user, { status: 201 })
    } catch (error: any) {
        console.error('Error creating user:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}
