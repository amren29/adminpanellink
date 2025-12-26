# Cloudflare R2 Setup Guide

Follow these steps to configure Cloudflare R2 for your file uploads.

## 1. Create a Bucket
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **R2** in the sidebar.
3. Click **Create bucket**.
4. Name your bucket (e.g., `nextjsadmin-uploads`).
5. Click **Create bucket**.

## 2. Configure CORS (Critical for Uploads)
Your browser needs permission to upload directly to R2.

1. Go to your bucket's **Settings** tab.
2. Scroll down to **CORS Policy**.
3. Click **Add CORS Policy**.
4. Paste the following JSON:
   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://your-production-domain.com"
       ],
       "AllowedMethods": [
         "GET",
         "PUT",
         "HEAD"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "ExposeHeaders": [
         "ETag"
       ],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
5. Click **Save**.

## 3. Get API Credentials
1. Go back to the main **R2** page (not inside the bucket).
2. Click **Manage R2 API Tokens** on the right side.
3. Click **Create API token**.
4. Select **Admin Read & Write**.
5. Under "Specific bucket(s)", select your new bucket (e.g., `nextjsadmin-uploads`).
6. Click **Create API Token**.

## 4. Update `.env` File
Copy the values from Cloudflare into your `.env` file:

```env
# Cloudflare R2
R2_ACCOUNT_ID="your_account_id_from_main_r2_page"
R2_ACCESS_KEY_ID="your_access_key_id"
R2_SECRET_ACCESS_KEY="your_secret_access_key"
R2_BUCKET_NAME="nextjsadmin-uploads"
```

> **Note**: Your `R2_ACCOUNT_ID` is found on the main R2 page on the right sidebar.
