import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

// Check if R2 is configured
export const isR2Configured = () => {
    return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
};

// Create S3 client for Cloudflare R2
const getR2Client = () => {
    if (!isR2Configured()) {
        throw new Error('R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.');
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
};

/**
 * Generate a presigned URL for uploading a file to R2
 * @param key - The file key/path in R2
 * @param contentType - The MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default 1 hour for large files)
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
): Promise<string> {
    const client = getR2Client();

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file from R2
 * @param key - The file key/path in R2
 * @param expiresIn - URL expiration time in seconds (default 1 hour)
 */
export async function getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
    downloadFilename?: string
): Promise<string> {
    const client = getR2Client();

    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: downloadFilename
            ? `attachment; filename="${downloadFilename}"`
            : undefined,
    });

    return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from R2
 * @param key - The file key/path in R2
 */
export async function deleteFile(key: string): Promise<void> {
    const client = getR2Client();

    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    await client.send(command);
}

/**
 * Get the public URL for a file (if bucket has public access)
 * For private buckets, use getPresignedDownloadUrl instead
 */
export function getPublicUrl(key: string): string {
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
        return '';
    }
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Generate a unique file key with folder structure
 * @param orderId - Order ID for grouping files
 * @param fileType - Type of file (proof, print, customer)
 * @param originalName - Original file name
 */
export function generateFileKey(
    orderId: string,
    fileType: 'proof' | 'print' | 'customer',
    originalName: string
): string {
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `orders/${orderId}/${fileType}/${timestamp}-${sanitizedName}`;
}
