'use client';

import { useState, useEffect } from 'react';
import { DatabaseIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, PlayIcon, DownloadIcon } from 'lucide-react';

interface DatabaseConnection {
  id: string;
  name: string;
  provider: 'supabase' | 'neon' | 'postgresql' | 'mysql';
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: number;
  lastChecked?: string;
  tables?: number;
}

export default function DatabaseOperationsPanel() {
  const [databases, setDatabases] = useState<DatabaseConnection[]>([
    {
      id: 'supabase-main',
      name: 'Supabase Main',
      provider: 'supabase',
      status: 'connected',
      responseTime: 45,
      tables: 28
    },
    {
      id: 'neon-primary',
      name: 'Neon Primary',
      provider: 'neon',
      status: 'connected',
      responseTime: 38,
      tables: 15
    }
  ]);
  const [selectedDb, setSelectedDb] = useState<string>('supabase-main');

  function getStatusIcon(status: string) {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon size={20} className="text-green-600" />;
      case 'disconnected':
      case 'error':
        return <XCircleIcon size={20} className="text-red-600" />;
      default:
        return <RefreshCwIcon size={20} className="text-gray-400 animate-spin" />;
    }
  }

  function getProviderColor(provider: string): string {
    switch (provider) {
      case 'supabase':
        return 'bg-green-600';
      case 'neon':
        return 'bg-purple-600';
      case 'postgresql':
        return 'bg-blue-600';
      case 'mysql':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Operations</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Multi-database management & monitoring
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <RefreshCwIcon size={16} />
          Test All Connections
        </button>
      </div>

      {/* Database Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {databases.map((db) => (
          <div
            key={db.id}
            onClick={() => setSelectedDb(db.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedDb === db.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <DatabaseIcon size={24} className="text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-semibold">{db.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs text-white ${getProviderColor(db.provider)}`}>
                    {db.provider}
                  </span>
                </div>
              </div>
              {getStatusIcon(db.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {db.responseTime && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Response:</span>
                  <span className="ml-2 font-mono">{db.responseTime}ms</span>
                </div>
              )}
              {db.tables && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Tables:</span>
                  <span className="ml-2 font-mono">{db.tables}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Operations Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4">Database Operations</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Migrations */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <PlayIcon size={16} />
              Migrations
            </h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Run Pending Migrations
              </button>
              <button className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                View Migration History
              </button>
              <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                Create New Migration
              </button>
            </div>
          </div>

          {/* Backups */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DownloadIcon size={16} />
              Backups
            </h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                Create Backup
              </button>
              <button className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                View Backups
              </button>
              <button className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                Restore from Backup
              </button>
            </div>
          </div>

          {/* Health Checks */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircleIcon size={16} />
              Health Checks
            </h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                Test Connection
              </button>
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Check Table Integrity
              </button>
              <button className="w-full px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                Optimize Tables
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span>Migration 005_add_analytics_tables.sql completed</span>
            <span className="text-gray-600 dark:text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span>Backup created: supabase-main-20250116.dump</span>
            <span className="text-gray-600 dark:text-gray-400">1 hour ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Connection health check passed</span>
            <span className="text-gray-600 dark:text-gray-400">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
