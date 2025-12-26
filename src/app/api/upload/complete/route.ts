import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getPresignedDownloadUrl, getPublicUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user exists in DB (to prevent FK constraint failures with stale sessions)
        const uploader = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
        });

        if (!uploader) {
            return NextResponse.json({ error: 'Session expired. Please sign out and sign in again.' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, fileKey, fileName, fileSize, mimeType, fileType } = body;

        // Validation
        if (!orderId || !fileKey || !fileName) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, fileKey, fileName' },
                { status: 400 }
            );
        }

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Map fileType string to FileType enum
        const fileTypeMap: Record<string, 'customer' | 'print' | 'proof'> = {
            'customer': 'customer',
            'print': 'print',
            'proof': 'proof'
        };

        // Create file attachment record
        const attachment = await prisma.fileAttachment.create({
            data: {
                orderId,
                name: fileName,
                url: fileKey, // Store R2 key, generate presigned URLs on demand
                fileSize: BigInt(fileSize || 0),
                mimeType: mimeType || 'application/octet-stream',
                fileType: fileTypeMap[fileType] || 'customer',
                uploadedBy: session.user.id,
            }
        });

        // Generate a download URL for immediate access
        let downloadUrl = '';
        try {
            downloadUrl = await getPresignedDownloadUrl(fileKey, 3600);
        } catch (e) {
            // If presigned URL fails, use public URL
            downloadUrl = getPublicUrl(fileKey);
        }

        return NextResponse.json({
            success: true,
            attachment: {
                id: attachment.id,
                name: attachment.name,
                url: downloadUrl,
                fileSize: Number(attachment.fileSize),
                mimeType: attachment.mimeType,
                fileType: attachment.fileType,
                uploadedAt: attachment.uploadedAt,
            }
        });

    } catch (error: any) {
        console.error('Complete upload error:', error);
        return NextResponse.json(
            {
                error: 'Failed to save file metadata',
                details: error.message || String(error),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
