import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const projectRef = searchParams.get('project_ref');
    
    let query = supabaseAdmin
      .from('client_billing')
      .select(`
        *,
        clients!inner(name, email),
        client_projects!inner(project_name, project_ref)
      `)
      .eq('service_type', 'supabase'); // Only Supabase billing configs

    if (clientId) query = query.eq('client_id', clientId);
    if (projectRef) query = query.eq('project_ref', projectRef);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching Supabase billing config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/supabase/billing-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.client_id || !body.project_ref) {
      return NextResponse.json(
        { error: 'client_id and project_ref are required' }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('client_billing')
      .insert([{
        client_id: body.client_id,
        project_ref: body.project_ref,
        service_type: 'supabase', // Mark as Supabase service
        billing_tier: body.billing_tier || 'standard',
        rate_limit_config: body.rate_limit_config || {},
        monthly_budget: body.monthly_budget || null,
        budget_alert_threshold: body.budget_alert_threshold || 80.0,
        billing_start_date: new Date().toISOString(),
        billing_cycle: body.billing_cycle || 'monthly',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating Supabase billing config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in POST /api/supabase/billing-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const projectRef = searchParams.get('ref');

    if (!projectRef) {
      return NextResponse.json({ error: 'Project ref is required' }, { status: 400 });
    }

    // Get old values for audit log
    const { data: oldConfig } = await supabaseAdmin
      .from('client_billing')
      .select('*')
      .eq('project_ref', projectRef)
      .eq('service_type', 'supabase')
      .single();

    const { data, error } = await supabaseAdmin
      .from('client_billing')
      .update({
        rate_limit_config: body.rate_limit_config,
        monthly_budget: body.monthly_budget,
        budget_alert_threshold: body.budget_alert_threshold,
        billing_cycle: body.billing_cycle,
        updated_at: new Date().toISOString(),
      })
      .eq('project_ref', projectRef)
      .eq('service_type', 'supabase') // Ensure only Supabase configs are updated
      .select()
      .single();

    if (error) {
      console.error('Error updating Supabase billing config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the update for audit purposes
    if (oldConfig) {
      await supabaseAdmin
        .from('management_audit')
        .insert([{
          user_id: body.user_id || 'system', // Would come from auth
          action: 'UPDATE_SUPABASE_BILLING_CONFIG',
          resource_type: 'client_billing',
          resource_id: data.id,
          old_values: oldConfig,
          new_values: data,
          created_at: new Date().toISOString(),
        }]);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/supabase/billing-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectRef = searchParams.get('ref');

    if (!projectRef) {
      return NextResponse.json({ error: 'Project ref is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('client_billing')
      .delete()
      .eq('project_ref', projectRef)
      .eq('service_type', 'supabase'); // Only delete Supabase configs

    if (error) {
      console.error('Error removing Supabase billing config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Supabase billing configuration removed successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/supabase/billing-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}