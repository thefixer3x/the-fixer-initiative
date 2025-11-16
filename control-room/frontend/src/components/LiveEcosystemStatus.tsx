'use client';

import { useState, useEffect } from 'react';
import { ActivityIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, ZapIcon } from 'lucide-react';

interface ServiceStatus {
  name: string;
  url: string;
  type: string;
  status: string;
  responseTime: number | null;
  lastChecked: string;
  healthy: boolean;
  error?: string;
}

interface EcosystemStatus {
  overall: {
    status: string;
    healthy: number;
    total: number;
    uptime: number;
  };
  services: ServiceStatus[];
}

export default function LiveEcosystemStatus() {
  const [status, setStatus] = useState<EcosystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const response = await fetch('/api/ecosystem/status');
      const data = await response.json();

      if (data.success) {
        setStatus(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch ecosystem status:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'online':
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'offline':
      case 'critical':
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  }

  function getStatusIcon(healthy: boolean) {
    return healthy ? (
      <CheckCircleIcon size={20} className="text-green-600" />
    ) : (
      <AlertCircleIcon size={20} className="text-red-600" />
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <ActivityIcon size={32} className="animate-pulse mx-auto mb-2" />
        <p>Loading ecosystem status...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6 text-center text-red-600">
        <AlertCircleIcon size={32} className="mx-auto mb-2" />
        <p>Failed to load ecosystem status</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Ecosystem Status</h2>
            <p className="text-blue-100 text-sm">Real-time monitoring across all platforms</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(status.overall.status)}`}>
            {status.overall.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-3xl font-bold">{status.overall.healthy}/{status.overall.total}</div>
            <div className="text-sm text-blue-100">Services Online</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-3xl font-bold">{status.overall.uptime}%</div>
            <div className="text-sm text-blue-100">Overall Uptime</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-3xl font-bold flex items-center justify-center gap-2">
              <ClockIcon size={24} />
              {new Date(lastUpdate).toLocaleTimeString()}
            </div>
            <div className="text-sm text-blue-100">Last Updated</div>
          </div>
        </div>
      </div>

      {/* Individual Services */}
      <div className="grid gap-4">
        {status.services.map((service) => (
          <div
            key={service.name}
            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(service.healthy)}
                <div>
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {service.url}
                    </a>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {service.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {service.responseTime !== null && (
                  <div className="flex items-center gap-1 text-sm">
                    <ZapIcon size={14} className="text-yellow-500" />
                    <span className="font-mono">{service.responseTime}ms</span>
                  </div>
                )}

                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>
            </div>

            {service.error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
                {service.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
