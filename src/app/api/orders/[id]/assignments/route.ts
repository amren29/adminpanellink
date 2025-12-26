import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Add assignee to order
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const body = await request.json();
        const { userId, role = 'production' } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        // Check if already assigned
        const existing = await prisma.orderAssignment.findFirst({
            where: { orderId, userId }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'User already assigned' },
                { status: 400 }
            );
        }

        // Create new assignment
        await prisma.orderAssignment.create({
            data: {
                orderId,
                userId,
                role
            }
        });

        // Fetch updated assignments
        const assignments = await prisma.orderAssignment.findMany({
            where: { orderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, workflowRole: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error('Error adding assignment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add assignment' },
            { status: 500 }
        );
    }
}

// DELETE - Remove assignee from order
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        // Delete assignment
        await prisma.orderAssignment.deleteMany({
            where: { orderId, userId }
        });

        // Fetch updated assignments
        const assignments = await prisma.orderAssignment.findMany({
            where: { orderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, workflowRole: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error('Error removing assignment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove assignment' },
            { status: 500 }
        );
    }
}

// GET - Get all assignments for an order
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;

        const assignments = await prisma.orderAssignment.findMany({
            where: { orderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, workflowRole: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch assignments' },
            { status: 500 }
        );
    }
}
