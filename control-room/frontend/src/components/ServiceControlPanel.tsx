'use client';

import { useState, useEffect } from 'react';
import { PlayIcon, StopIcon, RefreshCwIcon, TrashIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

interface Service {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
  pid: number;
}

export default function ServiceControlPanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchServices();

    if (autoRefresh) {
      const interval = setInterval(fetchServices, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  async function fetchServices() {
    try {
      const response = await fetch('/api/vps/services');
      const data = await response.json();

      if (data.success) {
        setServices(data.services);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function executeAction(serviceName: string, action: 'restart' | 'stop' | 'start' | 'delete') {
    setActionLoading(`${serviceName}-${action}`);
    setError(null);

    try {
      const response = await fetch('/api/vps/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName, action })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh services after action
        await fetchServices();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  function formatMemory(bytes: number): string {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  }

  function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  if (loading) {
    return <div className="p-6 text-center">Loading services...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Control Panel</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage VPS services in real-time</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (5s)
          </label>
          <button
            onClick={fetchServices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCwIcon size={16} />
            Refresh Now
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertCircleIcon size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        {services.map((service) => (
          <div
            key={service.name}
            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{service.name}</h3>
                  {service.status === 'online' ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                      <CheckCircleIcon size={12} />
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">
                      <AlertCircleIcon size={12} />
                      {service.status}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">CPU:</span>
                    <span className="ml-2 font-mono">{service.cpu}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                    <span className="ml-2 font-mono">{formatMemory(service.memory)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                    <span className="ml-2 font-mono">{formatUptime(Date.now() - service.uptime)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Restarts:</span>
                    <span className="ml-2 font-mono">{service.restarts}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">PID:</span>
                    <span className="ml-2 font-mono">{service.pid}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => executeAction(service.name, 'restart')}
                  disabled={actionLoading === `${service.name}-restart`}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Restart service"
                >
                  <RefreshCwIcon size={16} className={actionLoading === `${service.name}-restart` ? 'animate-spin' : ''} />
                </button>

                {service.status === 'online' ? (
                  <button
                    onClick={() => executeAction(service.name, 'stop')}
                    disabled={actionLoading === `${service.name}-stop`}
                    className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Stop service"
                  >
                    <StopIcon size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => executeAction(service.name, 'start')}
                    disabled={actionLoading === `${service.name}-start`}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Start service"
                  >
                    <PlayIcon size={16} />
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${service.name}?`)) {
                      executeAction(service.name, 'delete');
                    }
                  }}
                  disabled={actionLoading === `${service.name}-delete`}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete service"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {services.length === 0 && !error && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            No services found
          </div>
        )}
      </div>
    </div>
  );
}
