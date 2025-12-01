import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch receipt details
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const receiptId = params.id;

    // Get receipt with expense data
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select(`
        *,
        expenses (*)
      `)
      .eq('id', receiptId)
      .single();

    if (receiptError) throw receiptError;

    // Check if user owns this receipt (or is admin/accounting)
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allow access if: user owns it OR user is admin/accounting
    if (receipt.user_id !== user.id && !['admin', 'accounting'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}

// PATCH - Update receipt/expense data
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const receiptId = params.id;
    const body = await request.json();

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get existing receipt and expense data
    const { data: existingReceipt } = await supabase
      .from('receipts')
      .select(`
        *,
        expenses (*)
      `)
      .eq('id', receiptId)
      .single();

    if (!existingReceipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Check ownership
    if (existingReceipt.user_id !== user.id && !['admin', 'accounting'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingExpense = existingReceipt.expenses?.[0];

    // Prepare changes object for audit log
    const changes: any = {
      before: {},
      after: {}
    };

    let hasChanges = false;

    // Update expense fields if they've changed
    if (existingExpense) {
      const expenseUpdates: any = {};

      if (body.vendor_name !== undefined && body.vendor_name !== existingExpense.vendor_name) {
        changes.before.vendor_name = existingExpense.vendor_name;
        changes.after.vendor_name = body.vendor_name;
        expenseUpdates.vendor_name = body.vendor_name;
        hasChanges = true;
      }

      if (body.amount !== undefined && body.amount !== existingExpense.amount) {
        changes.before.amount = existingExpense.amount;
        changes.after.amount = body.amount;
        expenseUpdates.amount = body.amount;
        hasChanges = true;
      }

      if (body.expense_date !== undefined && body.expense_date !== existingExpense.expense_date) {
        changes.before.expense_date = existingExpense.expense_date;
        changes.after.expense_date = body.expense_date;
        expenseUpdates.expense_date = body.expense_date;
        hasChanges = true;
      }

      if (body.currency !== undefined && body.currency !== existingExpense.currency) {
        changes.before.currency = existingExpense.currency;
        changes.after.currency = body.currency;
        expenseUpdates.currency = body.currency;
        hasChanges = true;
      }

      if (body.description !== undefined && body.description !== existingExpense.description) {
        changes.before.description = existingExpense.description;
        changes.after.description = body.description;
        expenseUpdates.description = body.description;
        hasChanges = true;
      }

      if (body.category_id !== undefined && body.category_id !== existingExpense.category_id) {
        changes.before.category_id = existingExpense.category_id;
        changes.after.category_id = body.category_id;
        expenseUpdates.category_id = body.category_id;
        hasChanges = true;
      }

      if (body.department_code_id !== undefined && body.department_code_id !== existingExpense.department_code_id) {
        changes.before.department_code_id = existingExpense.department_code_id;
        changes.after.department_code_id = body.department_code_id;
        expenseUpdates.department_code_id = body.department_code_id;
        hasChanges = true;
      }

      // If there are changes, mark as edited and update
      if (hasChanges) {
        expenseUpdates.is_edited = true;
        expenseUpdates.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('expenses')
          .update(expenseUpdates)
          .eq('id', existingExpense.id);

        if (updateError) throw updateError;

        // Create audit log entry
        await supabase.from('audit_log').insert({
          entity_type: 'expense',
          entity_id: existingExpense.id,
          action: 'edited',
          user_id: user.id,
          changes: changes,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Get updated data
    const { data: updatedReceipt } = await supabase
      .from('receipts')
      .select(`
        *,
        expenses (*)
      `)
      .eq('id', receiptId)
      .single();

    return NextResponse.json({
      success: true,
      receipt: updatedReceipt,
      changes_made: hasChanges
    });

  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to update receipt' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete receipt
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const receiptId = params.id;

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get receipt to check ownership
    const { data: receipt } = await supabase
      .from('receipts')
      .select('user_id, expense_report_id')
      .eq('id', receiptId)
      .single();

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Check ownership
    if (receipt.user_id !== user.id && !['admin', 'accounting'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can't delete if already in a submitted report
    if (receipt.expense_report_id) {
      return NextResponse.json(
        { error: 'Cannot delete receipt that is part of a submitted report' },
        { status: 400 }
      );
    }

    // Delete receipt (cascade will delete related expense)
    const { error: deleteError } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    );
  }
}
