import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getSecurePrisma } from '@/lib/prisma-secure'
import { authOptions } from '@/lib/auth'

// GET all departments
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const db = getSecurePrisma(session.user.organizationId)

        const departments = await db.department.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
                manager: { select: { id: true, name: true, avatarUrl: true } },
                _count: {
                    select: { products: true, orders: true },
                },
            },
        })

        return NextResponse.json(departments)
    } catch (error) {
        console.error('Error fetching departments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch departments' },
            { status: 500 }
        )
    }
}

// POST create new department
export async function POST(request: Request) {
    try {
        const body = await request.json()

        const department = await prisma.department.create({
            data: {
                name: body.name,
                description: body.description,
                color: body.color,
                managerId: body.managerId,
                displayOrder: body.displayOrder || 0,
            },
        })

        return NextResponse.json(department, { status: 201 })
    } catch (error: any) {
        console.error('Error creating department:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A department with this name already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create department' },
            { status: 500 }
        )
    }
}
