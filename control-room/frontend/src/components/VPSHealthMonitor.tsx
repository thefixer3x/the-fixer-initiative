'use client';

import { useState, useEffect } from 'react';
import { ServerIcon, CpuIcon, HardDriveIcon, ActivityIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

interface VPSHealth {
  vps: {
    host: string;
    uptime: string;
    disk: {
      total: string;
      used: string;
      available: string;
      percentage: number;
    } | null;
    memory: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    } | null;
    cpu: number | null;
  };
  services: {
    nginx: string;
    pm2: boolean;
    count: number;
    running: number;
  };
  overall: 'healthy' | 'warning' | 'critical';
}

export default function VPSHealthMonitor() {
  const [health, setHealth] = useState<VPSHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    try {
      const response = await fetch('/api/vps/health');
      const data = await response.json();

      if (data.success) {
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to fetch VPS health:', err);
    } finally {
      setLoading(false);
    }
  }

  function getHealthColor(status: string): string {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  }

  function getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <ActivityIcon size={32} className="animate-pulse mx-auto" />
        <p className="text-center mt-2">Loading VPS health...</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center text-red-600">
        <AlertCircleIcon size={32} className="mx-auto mb-2" />
        <p>Failed to load VPS health</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ServerIcon size={24} className="text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">VPS Health</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{health.vps.host}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(health.overall)}`}>
          {health.overall.toUpperCase()}
        </span>
      </div>

      {/* System Metrics */}
      <div className="space-y-4">
        {/* CPU Usage */}
        {health.vps.cpu !== null && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CpuIcon size={16} />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm font-mono">{health.vps.cpu}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(health.vps.cpu)}`}
                style={{ width: `${health.vps.cpu}%` }}
              />
            </div>
          </div>
        )}

        {/* Memory Usage */}
        {health.vps.memory && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ActivityIcon size={16} />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <span className="text-sm font-mono">
                {health.vps.memory.used}MB / {health.vps.memory.total}MB ({health.vps.memory.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(health.vps.memory.percentage)}`}
                style={{ width: `${health.vps.memory.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Disk Usage */}
        {health.vps.disk && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDriveIcon size={16} />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              <span className="text-sm font-mono">
                {health.vps.disk.used} / {health.vps.disk.total} ({health.vps.disk.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(health.vps.disk.percentage)}`}
                style={{ width: `${health.vps.disk.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Services Status */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Services</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Nginx</span>
            {health.services.nginx === 'running' ? (
              <CheckCircleIcon size={16} className="text-green-600" />
            ) : (
              <AlertCircleIcon size={16} className="text-red-600" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">PM2 Services</span>
            <span className="text-sm font-mono">
              {health.services.running}/{health.services.count}
            </span>
          </div>
        </div>
      </div>

      {/* Uptime */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          System Uptime: <span className="font-mono">{health.vps.uptime}</span>
        </span>
      </div>
    </div>
  );
}
