import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// This route connects to the Supabase Management API for project management
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    
    // Query your local database for Supabase projects
    let query = supabaseAdmin
      .from('client_projects')
      .select(`
        *,
        clients!inner(name, email)
      `)
      .eq('project_type', 'supabase') // Only Supabase projects
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching Supabase projects:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/supabase/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.project_ref || !body.project_name) {
      return NextResponse.json(
        { error: 'project_ref and project_name are required' }, 
        { status: 400 }
      );
    }

    // Insert the new Supabase project into your local database
    const { data, error } = await supabaseAdmin
      .from('client_projects')
      .insert([{
        client_id: body.client_id || null,
        project_ref: body.project_ref.toLowerCase().trim(),
        project_name: body.project_name,
        project_description: body.project_description || '',
        project_type: 'supabase', // Mark as Supabase project
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating Supabase project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optionally create billing configuration
    if (body.setup_billing && body.client_id) {
      const { error: billingError } = await supabaseAdmin
        .from('client_billing')
        .insert([{
          client_id: body.client_id,
          project_ref: body.project_ref,
          billing_tier: body.billing_tier || 'standard',
          monthly_budget: body.monthly_budget || null,
          budget_alert_threshold: body.budget_alert_threshold || 80.0,
          billing_start_date: new Date().toISOString(),
          billing_cycle: body.billing_cycle || 'monthly',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (billingError) {
        console.error('Error creating billing config:', billingError);
        // Don't fail the entire operation if billing setup fails
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in POST /api/supabase/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const projectRef = searchParams.get('ref');

    if (!projectRef) {
      return NextResponse.json({ error: 'Project ref parameter is required' }, { status: 400 });
    }

    // Update the Supabase project
    const { data, error } = await supabaseAdmin
      .from('client_projects')
      .update({
        project_name: body.project_name,
        project_description: body.project_description,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('project_ref', projectRef)
      .select()
      .single();

    if (error) {
      console.error('Error updating Supabase project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/supabase/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectRef = searchParams.get('ref');

    if (!projectRef) {
      return NextResponse.json({ error: 'Project ref parameter is required' }, { status: 400 });
    }

    // Remove associated billing config
    await supabaseAdmin
      .from('client_billing')
      .delete()
      .eq('project_ref', projectRef);

    // Remove the project
    const { error } = await supabaseAdmin
      .from('client_projects')
      .delete()
      .eq('project_ref', projectRef);

    if (error) {
      console.error('Error removing Supabase project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Supabase project removed successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/supabase/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}