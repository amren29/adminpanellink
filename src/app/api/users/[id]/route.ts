import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET single user
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const user = await prisma.user.findUnique({
            where: { id },
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
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        )
    }
}

// PUT update user
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const user = await prisma.user.update({
            where: { id },
            data: {
                name: body.name,
                email: body.email,
                role: body.role,
                department: body.department,
                phone: body.phone,
                avatarUrl: body.avatarUrl,
                isActive: body.isActive,
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
                lastLogin: true,
                createdAt: true,
                workflowRole: true,
                allowedRoutes: true,
            },
        })

        return NextResponse.json(user)
    } catch (error: any) {
        console.error('Error updating user:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}

// DELETE user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.user.delete({
            where: { id },
        })

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        )
    }
}
