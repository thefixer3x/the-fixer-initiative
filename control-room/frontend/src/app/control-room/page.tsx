import ServiceControlPanel from '@/components/ServiceControlPanel';
import LogViewer from '@/components/LogViewer';
import LiveEcosystemStatus from '@/components/LiveEcosystemStatus';
import BillingAggregator from '@/components/BillingAggregator';
import VPSHealthMonitor from '@/components/VPSHealthMonitor';
import DatabaseOperationsPanel from '@/components/DatabaseOperationsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ControlRoomPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            The Fixer Initiative - Control Room
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time ecosystem management & orchestration
          </p>
        </div>

        {/* Main Control Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="databases">Databases</TabsTrigger>
            <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VPS Health */}
              <VPSHealthMonitor />

              {/* Quick Stats Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                    🔄 Restart All Services
                  </button>
                  <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                    ✅ Run Health Checks
                  </button>
                  <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                    📊 Generate Report
                  </button>
                  <button className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2">
                    🚀 Deploy Updates
                  </button>
                </div>
              </div>
            </div>

            {/* Ecosystem Status */}
            <LiveEcosystemStatus />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <ServiceControlPanel />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-[800px]">
              <LogViewer />
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <BillingAggregator />
          </TabsContent>

          {/* Databases Tab */}
          <TabsContent value="databases">
            <DatabaseOperationsPanel />
          </TabsContent>

          {/* Troubleshoot Tab */}
          <TabsContent value="troubleshoot">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-4">Troubleshooting Command Center</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Common Issues */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Common Issues</h3>
                    <div className="space-y-2">
                      <button className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">
                        <div className="font-semibold text-red-800 dark:text-red-300">502 Bad Gateway</div>
                        <div className="text-sm text-red-600 dark:text-red-400">Click to diagnose & fix</div>
                      </button>

                      <button className="w-full text-left px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
                        <div className="font-semibold text-yellow-800 dark:text-yellow-300">High Memory Usage</div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">Click to investigate</div>
                      </button>

                      <button className="w-full text-left px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        <div className="font-semibold text-blue-800 dark:text-blue-300">Service Crashed</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Auto-restart & check logs</div>
                      </button>

                      <button className="w-full text-left px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30">
                        <div className="font-semibold text-purple-800 dark:text-purple-300">Database Connection Error</div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">Test connections</div>
                      </button>
                    </div>
                  </div>

                  {/* Quick Fixes */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Quick Fixes</h3>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-left">
                        🔄 Restart Nginx
                      </button>
                      <button className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-left">
                        🧹 Clear PM2 Logs
                      </button>
                      <button className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-left">
                        💾 Free Disk Space
                      </button>
                      <button className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-left">
                        🔍 Check SSL Certificates
                      </button>
                      <button className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-left">
                        🌐 Test All API Endpoints
                      </button>
                      <button className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-left">
                        📈 View Performance Metrics
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Diagnostics */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Run Diagnostics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Network Test
                  </button>
                  <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    SSH Connectivity
                  </button>
                  <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    API Health
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
