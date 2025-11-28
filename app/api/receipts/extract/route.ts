// app/api/receipts/extract/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { extractReceiptData } from '@/lib/openai';

// Use service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
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

    const { receiptId, imageUrl } = await request.json();

    if (!receiptId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing receiptId or imageUrl' },
        { status: 400 }
      );
    }

    console.log('[Extract] Extracting data for receipt:', receiptId);

    // Call OpenAI Vision API
    const extractedData = await extractReceiptData(imageUrl);

    // Create expense record with extracted data
    const { data: expenseData, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        receipt_id: receiptId,
        vendor_name: extractedData.vendor,
        amount: extractedData.total,
        currency: extractedData.currency,
        expense_date: extractedData.date,
        extracted_data: extractedData,
        is_edited: false,
      })
      .select()
      .single();

    if (expenseError) {
      console.error('[Extract] Error creating expense record:', expenseError);
      return NextResponse.json(
        { error: 'Failed to save extracted data', details: expenseError.message },
        { status: 500 }
      );
    }

    console.log('[Extract] ✅ Expense record created:', expenseData);

    return NextResponse.json({
      success: true,
      extracted: extractedData,
      expense: expenseData,
    });

  } catch (error) {
    console.error('[Extract] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
