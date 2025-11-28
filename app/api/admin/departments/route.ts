import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - List all departments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: departments, error } = await query;

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error in GET /api/admin/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new department
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name' },
        { status: 400 }
      );
    }

    const codeRegex = /^[A-Z0-9]{1,10}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: 'Department code must be uppercase alphanumeric, max 10 characters' },
        { status: 400 }
      );
    }

    const { data: existingDept } = await supabase
      .from('departments')
      .select('code')
      .eq('code', code)
      .single();

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 409 }
      );
    }

    const { data: newDepartment, error } = await supabase
      .from('departments')
      .insert({
        code: code.toUpperCase(),
        name,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating department:', error);
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
    }

    return NextResponse.json({ department: newDepartment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
