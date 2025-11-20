'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Server, 
  Activity, 
  DollarSign, 
  Users, 
  Settings, 
  Terminal,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench
} from 'lucide-react';

interface SupabaseProject {
  id: string;
  project_ref: string;
  project_name: string;
  project_description: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  clients: {
    name: string;
    email: string;
  };
}

interface BillingConfig {
  id: string;
  project_ref: string;
  client_id: string;
  service_type: string;
  billing_tier: string;
  monthly_budget: number | null;
  budget_alert_threshold: number;
  billing_cycle: string;
  created_at: string;
  updated_at: string;
  clients: {
    name: string;
  };
}

interface TroubleshootingResult {
  project_ref: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  message?: string;
  details?: any;
  timestamp: string;
}

export default function SupabaseManagementDashboard() {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [billingConfigs, setBillingConfigs] = useState<BillingConfig[]>([]);
  const [troubleshootingResults, setTroubleshootingResults] = useState<Record<string, TroubleshootingResult>>({});
  const [loading, setLoading] = useState(true);
  const [troubleshootingLoading, setTroubleshootingLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch Supabase projects
      const projectsResponse = await fetch('/api/supabase/projects');
      if (projectsResponse.ok) {
        const projectData = await projectsResponse.json();
        setProjects(projectData);
      }

      // Fetch billing configurations
      const billingResponse = await fetch('/api/supabase/billing-config');
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        setBillingConfigs(billingData);
      }
    } catch (error) {
      console.error('Error loading Supabase management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async (projectRef: string) => {
    setTroubleshootingLoading(prev => ({ ...prev, [projectRef]: true }));
    
    try {
      const response = await fetch(`/api/supabase/troubleshoot?action=health-check&ref=${projectRef}`);
      const result = await response.json();
      
      setTroubleshootingResults(prev => ({
        ...prev,
        [projectRef]: result
      }));
    } catch (error) {
      console.error(`Error running health check for ${projectRef}:`, error);
      setTroubleshootingResults(prev => ({
        ...prev,
        [projectRef]: {
          project_ref: projectRef,
          status: 'error',
          message: 'Failed to run health check',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setTroubleshootingLoading(prev => ({ ...prev, [projectRef]: false }));
    }
  };

  const runConnectionTest = async (projectRef: string) => {
    setTroubleshootingLoading(prev => ({ ...prev, [projectRef]: true }));
    
    try {
      const response = await fetch(`/api/supabase/troubleshoot?action=connection-test&ref=${projectRef}`);
      const result = await response.json();
      
      setTroubleshootingResults(prev => ({
        ...prev,
        [projectRef]: result
      }));
    } catch (error) {
      console.error(`Error running connection test for ${projectRef}:`, error);
      setTroubleshootingResults(prev => ({
        ...prev,
        [projectRef]: {
          project_ref: projectRef,
          status: 'error',
          message: 'Failed to run connection test',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setTroubleshootingLoading(prev => ({ ...prev, [projectRef]: false }));
    }
  };

  const getProjectBillingConfig = (projectRef: string) => {
    return billingConfigs.find(bc => bc.project_ref === projectRef);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'healthy': case 'valid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'inactive': case 'degraded': case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'pending': case 'starting': case 'initializing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'error': case 'failed': case 'unhealthy': case 'invalid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
        <span className="ml-2">Loading Supabase management dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supabase Management Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your Supabase projects, billing, and troubleshooting
          </p>
        </div>
        <Button onClick={() => loadData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">
            <Database className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="billing">
            <DollarSign className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="troubleshooting">
            <Wrench className="h-4 w-4 mr-2" />
            Troubleshooting
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.project_name}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {project.project_ref}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {project.project_description || 'No description'}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Client: {project.clients?.name || 'Unassigned'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Updated: {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No Supabase projects</h3>
              <p className="mt-1 text-gray-500">Get started by adding a Supabase project to manage.</p>
            </div>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {billingConfigs.map((config) => {
              const project = projects.find(p => p.project_ref === config.project_ref);
              return (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{config.clients?.name || config.project_ref}</CardTitle>
                      <Badge variant="outline">{config.billing_tier}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {config.project_ref}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Billing Cycle:</span>
                        <span className="font-medium">{config.billing_cycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Monthly Budget:</span>
                        <span className="font-medium">
                          {config.monthly_budget ? `$${config.monthly_budget.toLocaleString()}` : 'Unlimited'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Alert Threshold:</span>
                        <span className="font-medium">{config.budget_alert_threshold}%</span>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {billingConfigs.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No billing configurations</h3>
              <p className="mt-1 text-gray-500">Set up billing configurations for your Supabase projects.</p>
            </div>
          )}
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshooting" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => {
              const billingConfig = getProjectBillingConfig(project.project_ref);
              const troubleshootResult = troubleshootingResults[project.project_ref];
              
              return (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.project_name}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runHealthCheck(project.project_ref)}
                          disabled={troubleshootingLoading[project.project_ref]}
                        >
                          {troubleshootingLoading[project.project_ref] ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Activity className="h-4 w-4 mr-2" />
                          )}
                          Health Check
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runConnectionTest(project.project_ref)}
                          disabled={troubleshootingLoading[project.project_ref]}
                        >
                          {troubleshootingLoading[project.project_ref] ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Server className="h-4 w-4 mr-2" />
                          )}
                          Connection Test
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {project.project_ref}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {troubleshootResult ? (
                      <div className={`p-4 rounded-lg ${
                        troubleshootResult.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20' :
                        troubleshootResult.status === 'degraded' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                        troubleshootResult.status === 'unhealthy' ? 'bg-red-50 dark:bg-red-900/20' :
                        troubleshootResult.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                        'bg-blue-50 dark:bg-blue-900/20'
                      }`}>
                        <div className="flex items-center">
                          {troubleshootResult.status === 'healthy' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                          {(troubleshootResult.status === 'degraded' || troubleshootResult.status === 'warning') && <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />}
                          {(troubleshootResult.status === 'unhealthy' || troubleshootResult.status === 'error') && <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />}
                          <span className="font-medium capitalize">{troubleshootResult.status}</span>
                        </div>
                        {troubleshootResult.message && (
                          <p className="mt-2 text-sm">{troubleshootResult.message}</p>
                        )}
                        {troubleshootResult.details && (
                          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                            <pre className="whitespace-pre-wrap break-words">
                              {JSON.stringify(troubleshootResult.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Last checked: {new Date(troubleshootResult.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>No troubleshooting results yet</span>
                      </div>
                    )}
                    
                    {billingConfig && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium mb-2">Billing Configuration</div>
                        <div className="flex justify-between text-sm">
                          <span>Tier:</span>
                          <span className="font-medium">{billingConfig.billing_tier}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Budget:</span>
                          <span className="font-medium">
                            {billingConfig.monthly_budget ? `$${billingConfig.monthly_budget.toLocaleString()}` : 'Unlimited'}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Configuration Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium">Security & Compliance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage security settings and compliance configurations
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium">Rate Limiting</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure API rate limits per project
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium">Environment Variables</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage project-specific environment variables
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium">Database Settings</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure PostgreSQL settings and extensions
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}