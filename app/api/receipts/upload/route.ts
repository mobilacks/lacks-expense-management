// app/api/receipts/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadSource = formData.get('source') as string || 'file';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate receipt ID
    const receiptId = randomUUID();

    // Get file extension
    const fileExtension = file.name.split('.').pop() || 'jpg';

    // Create file path: receipts/{userId}/{receiptId}_original.{ext}
    const filePath = `${userId}/${receiptId}_original.${fileExtension}`;

    console.log('[Upload] Uploading file:', {
      userId,
      receiptId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath,
    });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('receipts')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload] Error uploading to Supabase:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    console.log('[Upload] ✅ File uploaded:', uploadData.path);

    // Get public URL for the image
    const { data: urlData } = supabase
      .storage
      .from('receipts')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Create receipt record in database
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        id: receiptId,
        user_id: userId,
        image_url: filePath, // Store the path, not full URL
        status: 'draft',
        upload_source: uploadSource,
      })
      .select()
      .single();

    if (receiptError) {
      console.error('[Upload] Error creating receipt record:', receiptError);
      
      // Clean up uploaded file
      await supabase.storage.from('receipts').remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to create receipt record', details: receiptError.message },
        { status: 500 }
      );
    }

    console.log('[Upload] ✅ Receipt record created:', receiptData);

    return NextResponse.json({
      success: true,
      receipt: {
        id: receiptId,
        imageUrl: imageUrl,
        imagePath: filePath,
        uploadedAt: receiptData.uploaded_at,
      },
    });

  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
