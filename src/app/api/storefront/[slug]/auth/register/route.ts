import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// POST /api/storefront/[slug]/auth/register
// Register a new customer account
export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // Find organization
        const org = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true }
        })

        if (!org) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const body = await request.json()
        const { email, password, fullName, phone } = body

        if (!email || !password || !fullName) {
            return NextResponse.json(
                { error: 'Email, password, and full name are required' },
                { status: 400 }
            )
        }

        // Check if customer exists
        const existing = await prisma.shopCustomer.findUnique({
            where: {
                organizationId_email: {
                    organizationId: org.id,
                    email: email.toLowerCase()
                }
            }
        })

        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Create customer
        const customer = await prisma.shopCustomer.create({
            data: {
                organizationId: org.id,
                email: email.toLowerCase(),
                passwordHash,
                fullName,
                phone,
                isGuest: false,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                createdAt: true,
            }
        })

        return NextResponse.json({
            message: 'Account created successfully',
            customer
        }, { status: 201 })
    } catch (error) {
        console.error('Error registering customer:', error)
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        )
    }
}
