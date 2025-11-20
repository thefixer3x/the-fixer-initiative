import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Troubleshooting API for Supabase projects
// This allows performing common diagnostic actions without direct database access
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectRef = searchParams.get('ref');
    const action = searchParams.get('action'); // health-check, connection-test, restart-services, etc.

    if (!projectRef || !action) {
      return NextResponse.json(
        { error: 'Project ref and action parameters are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'health-check':
        return await performHealthCheck(projectRef);
      case 'connection-test':
        return await testConnection(projectRef);
      case 'restart-services':
        return await restartServices(projectRef);
      case 'validate-config':
        return await validateConfig(projectRef);
      case 'logs-review':
        return await reviewLogs(projectRef);
      default:
        return NextResponse.json(
          { error: `Unknown troubleshooting action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in troubleshooting API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Perform health check on a specific project
async function performHealthCheck(projectRef: string) {
  try {
    // For now, just check if project exists and is accessible
    // In a real implementation, this would connect to Supabase Management API
    const { data, error } = await supabaseAdmin
      .from('client_projects')
      .select('status, updated_at')
      .eq('project_ref', projectRef)
      .single();

    if (error) {
      console.error(`Health check error for project ${projectRef}:`, error);
      return NextResponse.json({
        project_ref: projectRef,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Check if the project is within a healthy time threshold
    const lastUpdated = new Date(data.updated_at);
    const now = new Date();
    const minutesDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

    let healthStatus = 'healthy';
    if (minutesDiff > 30) {
      healthStatus = 'degraded';
    }
    if (minutesDiff > 60) {
      healthStatus = 'unhealthy';
    }

    return NextResponse.json({
      project_ref: projectRef,
      status: healthStatus,
      last_updated: data.updated_at,
      minutes_since_update: Math.round(minutesDiff),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed health check for project ${projectRef}:`, error);
    return NextResponse.json({
      project_ref: projectRef,
      status: 'error',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Test database and service connections
async function testConnection(projectRef: string) {
  try {
    // This would connect to actual Supabase services in a production implementation
    // For now, we'll check if the project exists in our local records
    const { data: project, error: projectError } = await supabaseAdmin
      .from('client_projects')
      .select('project_ref, project_name, status, updated_at')
      .eq('project_ref', projectRef)
      .single();

    if (projectError) {
      console.error(`Connection test error for project ${projectRef}:`, projectError);
      return NextResponse.json({
        project_ref: projectRef,
        connection_tests: {
          database: { status: 'error', message: 'Project not found' },
          auth: { status: 'error', message: 'Project not found' },
          storage: { status: 'error', message: 'Project not found' },
          functions: { status: 'error', message: 'Project not found' }
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // In a real implementation, you would test actual connections
    // For now, return simulated results based on project status
    return NextResponse.json({
      project_ref: projectRef,
      project_name: project.project_name,
      connection_tests: {
        database: { 
          status: project.status === 'active' ? 'healthy' : 'unhealthy',
          response_time_ms: 45,
          last_checked: new Date().toISOString()
        },
        auth: { 
          status: project.status === 'active' ? 'healthy' : 'unhealthy', 
          response_time_ms: 23,
          last_checked: new Date().toISOString()
        },
        storage: { 
          status: project.status === 'active' ? 'healthy' : 'unhealthy',
          response_time_ms: 67,
          last_checked: new Date().toISOString()
        },
        functions: { 
          status: project.status === 'active' ? 'healthy' : 'unhealthy',
          response_time_ms: 34,
          last_checked: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed connection test for project ${projectRef}:`, error);
    return NextResponse.json({
      project_ref: projectRef,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Simulate service restart (in reality, this would connect to Supabase Management API)
async function restartServices(projectRef: string) {
  try {
    // Log the restart request
    await supabaseAdmin
      .from('management_audit')
      .insert([{
        user_id: 'current_user', // Would be extracted from authentication
        action: 'RESTART_SERVICES',
        resource_type: 'supabase_project',
        resource_id: projectRef,
        metadata: { services: ['auth', 'rest', 'realtime', 'storage', 'functions'] },
        created_at: new Date().toISOString(),
      }]);

    // Simulate the restart process
    return NextResponse.json({
      project_ref: projectRef,
      services_restarted: ['auth', 'rest', 'realtime', 'storage', 'functions'],
      status: 'restart_initiated',
      estimated_completion: '1-3 minutes',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to restart services for project ${projectRef}:`, error);
    return NextResponse.json({
      project_ref: projectRef,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Validate project configuration
async function validateConfig(projectRef: string) {
  try {
    const { data: project, error: projectError } = await supabaseAdmin
      .from('client_projects')
      .select('project_ref, config, created_at, updated_at')
      .eq('project_ref', projectRef)
      .single();

    if (projectError) {
      return NextResponse.json({
        project_ref: projectRef,
        validation_results: {
          overall: 'error',
          message: projectError.message
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Validate configuration settings
    const config = project.config || {};
    const validationResults = {
      overall: 'valid' as 'valid' | 'warning' | 'invalid',
      validations: [] as Array<{ check: string; status: string; message: string }>,
      config_compliance_score: 100
    };

    // Check for common issues
    if (!config.db_schema || config.db_schema === 'public') {
      validationResults.validations.push({
        check: 'database.schema',
        status: 'warning',
        message: 'Using default public schema, consider using a custom schema for security isolation'
      });
      validationResults.config_compliance_score -= 10;
    }

    if (!config.security || !config.security.jwt_expiry) {
      validationResults.validations.push({
        check: 'security.jwt.expiry',
        status: 'warning',
        message: 'JWT expiry not explicitly set, using default (likely not optimal for security)'
      });
      validationResults.config_compliance_score -= 5;
    }

    if (!config.rate_limits || !config.rate_limits.enabled) {
      validationResults.validations.push({
        check: 'rate_limiting',
        status: 'warning',
        message: 'Rate limiting not enabled - recommended for production deployments'
      });
      validationResults.config_compliance_score -= 15;
    }

    // Determine overall status
    const invalidIssues = validationResults.validations.filter(v => v.status === 'invalid').length;
    const warningIssues = validationResults.validations.filter(v => v.status === 'warning').length;

    if (invalidIssues > 0) {
      validationResults.overall = 'invalid';
    } else if (warningIssues > 0) {
      validationResults.overall = 'warning';
    }

    return NextResponse.json({
      project_ref: projectRef,
      validation_results: validationResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to validate config for project ${projectRef}:`, error);
    return NextResponse.json({
      project_ref: projectRef,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Review logs for troubleshooting (simulated)
async function reviewLogs(projectRef: string) {
  try {
    // In a real implementation, this would fetch logs from Supabase
    // For now, we'll return simulated log data
    return NextResponse.json({
      project_ref: projectRef,
      logs: [
        {
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
          level: 'info',
          service: 'auth',
          message: 'Successful authentication request',
          details: { user_id: 'user_abc123', ip: '192.168.1.100' }
        },
        {
          timestamp: new Date(Date.now() - 360000).toISOString(), // 6 mins ago
          level: 'info',
          service: 'rest',
          message: 'Successful API request',
          details: { endpoint: '/rest/v1/table', duration_ms: 120 }
        },
        {
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
          level: 'warn',
          service: 'database',
          message: 'Slow query detected',
          details: { query: 'SELECT * FROM large_table', duration_ms: 850 }
        }
      ],
      summary: {
        total_entries: 3,
        error_count: 0,
        warning_count: 1,
        info_count: 2,
        time_range: 'last_hour'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to review logs for project ${projectRef}:`, error);
    return NextResponse.json({
      project_ref: projectRef,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}