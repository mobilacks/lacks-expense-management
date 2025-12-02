import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadSource = (formData.get('uploadSource') as string) || 'file';
    const expenseReportId = formData.get('expense_report_id') as string | null; // NEW

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs are allowed.' },
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

    // NEW: If expense_report_id provided, validate it exists and user owns it
    if (expenseReportId) {
      const { data: report, error: reportError } = await supabase
        .from('expense_reports')
        .select('id, user_id, status')
        .eq('id', expenseReportId)
        .single();

      if (reportError || !report) {
        return NextResponse.json(
          { error: 'Expense report not found' },
          { status: 404 }
        );
      }

      if (report.user_id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      if (report.status !== 'draft') {
        return NextResponse.json(
          { error: 'Cannot add receipts to submitted report' },
          { status: 400 }
        );
      }
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
      expenseReportId, // NEW
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

    // Create receipt record in database (with expense_report_id if provided)
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        id: receiptId,
        user_id: userId,
        image_url: filePath, // Store the path, not full URL
        status: 'draft',
        upload_source: uploadSource,
        expense_report_id: expenseReportId, // NEW - Link to report
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
        expenseReportId: expenseReportId, // NEW
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
