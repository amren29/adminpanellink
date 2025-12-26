import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { getSecurePrisma } from '@/lib/prisma-secure'
import { authOptions } from '@/lib/auth'

// GET all customers
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
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where = search
            ? {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { companyName: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {}

        const [customers, total] = await Promise.all([
            db.customer.findMany({
                where,
                include: { addresses: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.customer.count({ where }),
        ])

        // Transform for serialization (simpler object structure + Decimal handling)
        const formattedCustomers = customers.map(c => ({
            ...c,
            totalSpent: Number(c.totalSpent),
            // addresses are already JSON-safe objects usually, but good to keep as is
        }))

        return NextResponse.json({
            data: formattedCustomers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        )
    }
}

// POST create new customer
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const db = getSecurePrisma(session.user.organizationId)

        const body = await request.json()
        const { fullName, email, phone, companyName, taxId, marketingOptIn, addresses } = body

        const customer = await db.customer.create({
            data: {
                organizationId: session.user.organizationId,
                fullName,
                email,
                phone,
                companyName,
                taxId,
                marketingOptIn: marketingOptIn || false,
                addresses: addresses
                    ? {
                        create: addresses.map((addr: any) => ({
                            type: addr.type,
                            label: addr.label,
                            street: addr.street,
                            city: addr.city,
                            state: addr.state,
                            zip: addr.zip,
                            country: addr.country || 'Malaysia',
                            isDefault: addr.isDefault || false,
                        })),
                    }
                    : undefined,
            },
            include: { addresses: true },
        })

        return NextResponse.json(customer, { status: 201 })
    } catch (error: any) {
        console.error('Error creating customer:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A customer with this email already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        )
    }
}
