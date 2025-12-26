import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPresignedUploadUrl, generateFileKey, isR2Configured } from '@/lib/r2';

// Maximum file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Allowed file types
const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/svg+xml',
    // Documents
    'application/pdf',
    // Design files
    'application/postscript', // AI, EPS
    'application/illustrator',
    'image/vnd.adobe.photoshop', // PSD
    'application/x-photoshop',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    // Other
    'application/octet-stream', // Generic binary
];

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
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
        const { orderId, fileName, fileSize, mimeType, fileType } = body;

        // Validation
        if (!orderId || !fileName || !fileSize || !mimeType) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, fileName, fileSize, mimeType' },
                { status: 400 }
            );
        }

        // Validate file type
        const validFileType = fileType === 'proof' || fileType === 'print' || fileType === 'customer';
        if (!validFileType) {
            return NextResponse.json(
                { error: 'Invalid fileType. Must be: proof, print, or customer' },
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

        // Validate MIME type (less strict - allow most files for flexibility)
        const isAllowedType = ALLOWED_MIME_TYPES.includes(mimeType) ||
            mimeType.startsWith('image/') ||
            mimeType.startsWith('application/');

        if (!isAllowedType) {
            return NextResponse.json(
                { error: 'File type not allowed' },
                { status: 400 }
            );
        }

        // Generate file key
        const fileKey = generateFileKey(orderId, fileType, fileName);

        // Get presigned upload URL (1 hour expiration for large files)
        const uploadUrl = await getPresignedUploadUrl(fileKey, mimeType, 3600);

        return NextResponse.json({
            success: true,
            uploadUrl,
            fileKey,
            expiresIn: 3600, // 1 hour
        });

    } catch (error) {
        console.error('Presign upload error:', error);
        return NextResponse.json(
            { error: 'Failed to generate upload URL' },
            { status: 500 }
        );
    }
}
