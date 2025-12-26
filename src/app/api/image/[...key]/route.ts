import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl, isR2Configured } from '@/lib/r2';

/**
 * Serves images from R2 using presigned URLs
 * Usage: /api/image/[...key]
 * Example: /api/image/products/org123/product456/image.jpg
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;

        if (!isR2Configured()) {
            return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
        }

        const keyPath = key.join('/');

        if (!keyPath) {
            return NextResponse.json({ error: 'Key required' }, { status: 400 });
        }

        // Generate a short-lived presigned URL for the image
        const downloadUrl = await getPresignedDownloadUrl(keyPath, 3600); // 1 hour

        // Redirect to the presigned URL
        return NextResponse.redirect(downloadUrl);

    } catch (error) {
        console.error('Image serve error:', error);
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
    }
}
