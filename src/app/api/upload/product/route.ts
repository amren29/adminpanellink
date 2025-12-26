import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPresignedUploadUrl, isR2Configured } from '@/lib/r2';

// Maximum file size: 10MB for product images
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if R2 is configured
        if (!isR2Configured()) {
            return NextResponse.json(
                { error: 'File storage is not configured. Please set up Cloudflare R2 credentials.' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { fileName, fileSize, mimeType, productId } = body;

        // Validation
        if (!fileName || !fileSize || !mimeType) {
            return NextResponse.json(
                { error: 'Missing required fields: fileName, fileSize, mimeType' },
                { status: 400 }
            );
        }

        // Validate file size
        if (fileSize > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            return NextResponse.json(
                { error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' },
                { status: 400 }
            );
        }

        // Generate file key for product images
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const orgId = session.user.organizationId;

        // Use productId if editing, otherwise use 'new' folder
        const folder = productId || 'new';
        const fileKey = `products/${orgId}/${folder}/${timestamp}-${sanitizedName}`;

        // Get presigned upload URL (15 minutes expiration)
        const uploadUrl = await getPresignedUploadUrl(fileKey, mimeType, 900);

        // Generate public URL
        // Priority: R2_PUBLIC_URL > API proxy fallback
        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.R2_BUCKET_URL;
        const publicUrl = R2_PUBLIC_URL
            ? `${R2_PUBLIC_URL}/${fileKey}`
            : `/api/image/${fileKey}`; // Use API proxy for private buckets

        return NextResponse.json({
            success: true,
            uploadUrl,
            fileKey,
            publicUrl,
            expiresIn: 900, // 15 minutes
        });

    } catch (error) {
        console.error('Product image presign error:', error);
        return NextResponse.json(
            { error: 'Failed to generate upload URL' },
            { status: 500 }
        );
    }
}
