import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// POST /api/storefront/[slug]/auth/login
// Customer login
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
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Find customer
        const customer = await prisma.shopCustomer.findUnique({
            where: {
                organizationId_email: {
                    organizationId: org.id,
                    email: email.toLowerCase()
                }
            }
        })

        if (!customer || !customer.passwordHash) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, customer.passwordHash)

        if (!validPassword) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Update last login
        await prisma.shopCustomer.update({
            where: { id: customer.id },
            data: { lastLoginAt: new Date() }
        })

        // Return customer info (token generation would go here in production)
        return NextResponse.json({
            message: 'Login successful',
            customer: {
                id: customer.id,
                email: customer.email,
                fullName: customer.fullName,
                phone: customer.phone,
            }
        })
    } catch (error) {
        console.error('Error logging in customer:', error)
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        )
    }
}
