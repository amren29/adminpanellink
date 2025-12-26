import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPresignedDownloadUrl, getPublicUrl } from '@/lib/r2';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const key = searchParams.get('key');
        const filename = searchParams.get('filename') || 'file';

        if (!key) {
            return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
        }

        // Generate presigned URL with content-disposition
        try {
            const url = await getPresignedDownloadUrl(key, 3600, filename);
            return NextResponse.redirect(url);
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            // Fallback to public URL if configured, but likely fail for private bucket
            const publicUrl = getPublicUrl(key);
            if (publicUrl) {
                return NextResponse.redirect(publicUrl);
            }
            throw error;
        }

    } catch (error: any) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Failed to generate download link', details: error.message },
            { status: 500 }
        );
    }
}
