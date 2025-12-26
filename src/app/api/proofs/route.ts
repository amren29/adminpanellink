import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST create a new proof for an order
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderId, description, proofFileUrl, proofFileName, imageUrl } = body

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
                { status: 400 }
            )
        }

        // Get the next version number for this order
        const latestProof = await prisma.artworkProof.findFirst({
            where: { orderId },
            orderBy: { version: 'desc' },
            select: { version: true },
        })

        const nextVersion = (latestProof?.version || 0) + 1

        // Generate unique approval link
        const approvalLink = `proof-${orderId}-v${nextVersion}-${Date.now()}`

        const proof = await prisma.artworkProof.create({
            data: {
                orderId,
                version: nextVersion,
                description: description || '',
                proofFileUrl,
                proofFileName,
                imageUrl,
                approvalLink,
                status: 'pending',
            },
        })

        return NextResponse.json({
            ...proof,
            generatedLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/proof-review?id=${approvalLink}`,
        }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating proof:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create proof' },
            { status: 500 }
        )
    }
}

// GET proofs for an order
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')
        const approvalLink = searchParams.get('approvalLink')

        if (approvalLink) {
            // Find specific proof by approval link
            const proof = await prisma.artworkProof.findUnique({
                where: { approvalLink },
                include: {
                    order: {
                        include: {
                            customer: true,
                            items: true,
                        },
                    },
                },
            })

            if (!proof) {
                return NextResponse.json(
                    { error: 'Proof not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json(proof)
        }

        if (orderId) {
            const proofs = await prisma.artworkProof.findMany({
                where: { orderId },
                orderBy: { version: 'desc' },
            })
            return NextResponse.json(proofs)
        }

        return NextResponse.json(
            { error: 'orderId or approvalLink is required' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Error fetching proofs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch proofs' },
            { status: 500 }
        )
    }
}

// PUT update proof status (for approval/revision)
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { approvalLink, status, customerComment } = body

        if (!approvalLink) {
            return NextResponse.json(
                { error: 'approvalLink is required' },
                { status: 400 }
            )
        }

        // 1. Get existing proof to find orderId
        const existingProof = await prisma.artworkProof.findUnique({
            where: { approvalLink },
            select: { id: true, orderId: true, version: true }
        })

        if (!existingProof) {
            return NextResponse.json({ error: 'Proof not found' }, { status: 404 })
        }

        const updateData: any = {}
        if (status) updateData.status = status
        if (customerComment !== undefined) updateData.customerComment = customerComment
        if (status === 'approved') updateData.approvedAt = new Date()

        // 2. Update Proof
        const proof = await prisma.artworkProof.update({
            where: { approvalLink },
            data: updateData,
        })

        // 3. Update Parent Order Status & Log Activity
        if (status === 'approved' || status === 'needs_revision') {
            const newOrderStatus = status === 'approved' ? 'artwork_ready' : 'design_revision'
            const actionText = status === 'approved' ? 'Customer approved proof' : 'Customer requested revision'

            await prisma.$transaction([
                // Update Order Status
                prisma.order.update({
                    where: { id: existingProof.orderId },
                    data: {
                        status: newOrderStatus,
                        updatedAt: new Date()
                    }
                }),
                // Add Activity Log
                prisma.activityLog.create({
                    data: {
                        orderId: existingProof.orderId,
                        action: actionText,
                        fromStatus: 'proof_sent', // Assuming it was sent
                        toStatus: newOrderStatus,
                        userId: null, // System/Customer action
                        userName: 'Customer',
                        userRole: 'customer',
                        notes: customerComment || (status === 'approved' ? `Proof v${existingProof.version} approved` : `Feedback: ${customerComment}`)
                    }
                })
            ])
            console.log(`[Proof-Sync] Updated Order ${existingProof.orderId} to ${newOrderStatus}`)
        }

        return NextResponse.json(proof)
    } catch (error: any) {
        console.error('Error updating proof:', error)
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Proof not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update proof' },
            { status: 500 }
        )
    }
}
