'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DatabaseIcon, 
  CpuIcon, 
  HardDriveIcon, 
  ActivityIcon, 
  NetworkIcon,
  AlertCircleIcon, 
  CheckCircleIcon,
  RefreshCwIcon,
  ServerIcon
} from 'lucide-react';

interface SupabaseMetrics {
  success: boolean;
  timestamp: string;
  projectRef: string;
  metrics: {
    cpu: {
      user: number | null;
      system: number | null;
      idle: number | null;
    };
    memory: {
      total: number | null;
      used: number | null;
      usedPercent: number | null;
      totalGiB: number | null;
      usedGiB: number | null;
    };
    swap: {
      total: number | null;
      used: number | null;
      usedPercent: number | null;
      totalMiB: number | null;
      usedMiB: number | null;
    };
    disk: {
      total: number | null;
      used: number | null;
      usedPercent: number | null;
      totalGiB: number | null;
      usedGiB: number | null;
    };
    network: {
      receiveBytes: number;
      transmitBytes: number;
      receiveMiB: number;
      transmitMiB: number;
    };
    postgres: {
      connections: number | null;
      databaseSizeBytes: number | null;
      databaseSizeMiB: number | null;
    };
    health: 'healthy' | 'warning' | 'critical';
  };
  raw: {
    lineCount: number;
    metricCount: number;
  };
}

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  icon: React.ReactNode;
  unit?: string;
  showValue?: boolean;
}

function Gauge({ value, max = 100, label, icon, unit = '%', showValue = true }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const rotation = (percentage / 100) * 180 - 90;
  
  const getColor = (pct: number) => {
    if (pct >= 90) return '#ef4444'; // red
    if (pct >= 75) return '#f59e0b'; // amber
    if (pct >= 50) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="relative w-24 h-12 overflow-hidden">
        {/* Background arc */}
        <div 
          className="absolute w-24 h-24 rounded-full border-8 border-gray-200 dark:border-gray-700"
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            top: 0 
          }}
        />
        {/* Colored arc */}
        <div 
          className="absolute w-24 h-24 rounded-full border-8 transition-all duration-500"
          style={{ 
            borderColor: color,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            top: 0,
            transform: `rotate(${rotation - 90}deg)`,
            transformOrigin: 'center center',
          }}
        />
        {/* Needle */}
        <div 
          className="absolute w-1 h-10 bg-gray-800 dark:bg-white rounded-full transition-transform duration-500"
          style={{ 
            left: '50%',
            bottom: 0,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        />
        {/* Center dot */}
        <div className="absolute w-3 h-3 bg-gray-800 dark:bg-white rounded-full" style={{ left: 'calc(50% - 6px)', bottom: '-6px' }} />
      </div>
      
      {showValue && (
        <div className="mt-2 text-lg font-bold" style={{ color }}>
          {value.toFixed(1)}{unit}
        </div>
      )}
      
      <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subValue, 
  icon, 
  status 
}: { 
  title: string; 
  value: string; 
  subValue?: string; 
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'critical';
}) {
  const statusColors = {
    good: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`p-4 rounded-lg border ${status ? statusColors[status] : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && (
        <div className="text-xs text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  );
}

export default function SupabaseMetricsMonitor() {
  const [metrics, setMetrics] = useState<SupabaseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/supabase/metrics');
      const data = await response.json();

      if (data.success) {
        setMetrics(data);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Failed to fetch Supabase metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 60 seconds (Supabase recommends 1 minute intervals)
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const getHealthColor = (status: string): string => {
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
  };

  const getStatusFromPercent = (pct: number | null): 'good' | 'warning' | 'critical' | undefined => {
    if (pct === null) return undefined;
    if (pct >= 90) return 'critical';
    if (pct >= 75) return 'warning';
    return 'good';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-3">
          <RefreshCwIcon size={24} className="animate-spin text-blue-600" />
          <span>Loading Supabase metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-red-200 dark:border-red-900">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircleIcon size={24} />
          <span className="font-semibold">Failed to load Supabase metrics</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button 
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const { memory, swap, disk, network, postgres, health } = metrics.metrics;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DatabaseIcon size={24} className="text-green-600" />
          <div>
            <h2 className="text-xl font-bold">Supabase Infrastructure</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Project: {metrics.projectRef}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(health)}`}>
            {health.toUpperCase()}
          </span>
          <button 
            onClick={fetchMetrics}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh metrics"
          >
            <RefreshCwIcon size={18} />
          </button>
        </div>
      </div>

      {/* Gauges Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Gauge 
          value={memory.usedPercent ?? 0} 
          label="RAM Used" 
          icon={<ActivityIcon size={12} />}
        />
        <Gauge 
          value={swap.usedPercent ?? 0} 
          label="SWAP Used" 
          icon={<ServerIcon size={12} />}
        />
        <Gauge 
          value={disk.usedPercent ?? 0} 
          label="Disk Used" 
          icon={<HardDriveIcon size={12} />}
        />
        <Gauge 
          value={postgres.connections ?? 0} 
          max={100}
          label="DB Connections" 
          icon={<DatabaseIcon size={12} />}
          unit=""
        />
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Memory"
          value={`${memory.usedGiB ?? 0} GiB`}
          subValue={`of ${memory.totalGiB ?? 0} GiB (${memory.usedPercent?.toFixed(1) ?? 0}%)`}
          icon={<ActivityIcon size={16} />}
          status={getStatusFromPercent(memory.usedPercent)}
        />
        <MetricCard
          title="SWAP"
          value={`${swap.usedMiB ?? 0} MiB`}
          subValue={`of ${swap.totalMiB ?? 0} MiB`}
          icon={<ServerIcon size={16} />}
          status={getStatusFromPercent(swap.usedPercent)}
        />
        <MetricCard
          title="Disk"
          value={`${disk.usedGiB ?? 0} GiB`}
          subValue={`of ${disk.totalGiB ?? 0} GiB (${disk.usedPercent?.toFixed(1) ?? 0}%)`}
          icon={<HardDriveIcon size={16} />}
          status={getStatusFromPercent(disk.usedPercent)}
        />
        <MetricCard
          title="Database Size"
          value={`${postgres.databaseSizeMiB ?? 0} MiB`}
          subValue={postgres.connections !== null ? `${postgres.connections} connections` : undefined}
          icon={<DatabaseIcon size={16} />}
        />
      </div>

      {/* Network Stats */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <NetworkIcon size={16} />
          Network Traffic (Total)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Received</span>
            <span className="font-mono font-semibold text-blue-600">
              {formatBytes(network.receiveBytes)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Transmitted</span>
            <span className="font-mono font-semibold text-purple-600">
              {formatBytes(network.transmitBytes)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <span>
          {metrics.raw.metricCount} metrics collected
        </span>
        {lastUpdated && (
          <span>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
