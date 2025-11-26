# Supabase Storage Setup - Manual Steps

Since we're skipping RLS, the storage bucket setup is straightforward.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Click **Storage** in left sidebar
3. Click **"New bucket"**
4. Configure:
   - **Name:** `receipts`
   - **Public bucket:** ❌ NO (keep it private)
   - **File size limit:** 10 MB (or adjust based on your needs)
   - **Allowed MIME types:** 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
     - `application/pdf` (if you want to support PDF receipts)
5. Click **Create bucket**

## Step 2: Bucket Policies

Since RLS is disabled, you have two options:

### Option A: Make bucket public (easier for development)
- Edit bucket settings
- Toggle "Public bucket" to ON
- Anyone with the URL can access files

### Option B: Keep bucket private (recommended for production)
- Keep "Public bucket" OFF
- Use signed URLs in your application code
- More secure, requires server-side URL generation

**Recommendation:** Start with **Option A (public)** for development, switch to **Option B (private)** before production.

## Step 3: Apply SQL Helpers

Run the migration file in SQL Editor:
```sql
-- Go to SQL Editor and run:
-- /supabase/migrations/003_storage_helpers.sql
```

This adds helper functions for generating consistent file paths.

## Folder Structure

Files will be organized as:
```
receipts/
  ├── {user_id}/
  │   ├── {receipt_id}_original.jpg
  │   ├── {receipt_id}_thumbnail.jpg
  │   └── ...
```

## File Naming Convention

- **Original:** `{receipt_id}_original.{ext}`
- **Thumbnail:** `{receipt_id}_thumbnail.jpg`

Example:
```
receipts/550e8400-e29b-41d4-a716-446655440000/abc123-def456_original.jpg
receipts/550e8400-e29b-41d4-a716-446655440000/abc123-def456_thumbnail.jpg
```

## Next Steps

After creating the bucket:
1. ✅ Get your Supabase project URL
2. ✅ Get your Supabase anon key (API Settings)
3. ✅ Ready to start Next.js project with file uploads

## Testing Upload

You can test the bucket by:
1. Go to Storage > receipts bucket
2. Click "Upload file"
3. Upload a test image
4. Verify you can see it in the bucket

---

**Status:** Ready for Next.js integration once bucket is created!
