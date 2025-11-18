'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCwIcon, DownloadIcon, SearchIcon, XIcon } from 'lucide-react';

interface LogViewerProps {
  serviceName?: string;
}

export default function LogViewer({ serviceName: initialServiceName }: LogViewerProps) {
  const [serviceName, setServiceName] = useState(initialServiceName || 'memory-service');
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lineCount, setLineCount] = useState(100);
  const [filter, setFilter] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000); // Refresh every 3s
      return () => clearInterval(interval);
    }
  }, [serviceName, lineCount, autoRefresh]);

  async function fetchLogs() {
    setLoading(true);

    try {
      const response = await fetch(`/api/vps/logs?service=${serviceName}&lines=${lineCount}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);

        // Auto-scroll to bottom
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }

  function downloadLogs() {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serviceName}-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getFilteredLogs() {
    if (!filter) return logs;

    const lines = logs.split('\n');
    return lines.filter(line =>
      line.toLowerCase().includes(filter.toLowerCase())
    ).join('\n');
  }

  const services = ['memory-service', 'api-gateway', 'mcp-server', 'all'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <select
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            {services.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={lineCount}
            onChange={(e) => setLineCount(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value={50}>50 lines</option>
            <option value={100}>100 lines</option>
            <option value={500}>500 lines</option>
            <option value={1000}>1000 lines</option>
          </select>

          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 w-64"
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCwIcon size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={downloadLogs}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <DownloadIcon size={16} />
            Download
          </button>
        </div>
      </div>

      <div
        ref={logContainerRef}
        className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto"
      >
        <pre className="whitespace-pre-wrap break-words">
          {loading && logs === '' ? (
            <span className="text-gray-500">Loading logs...</span>
          ) : getFilteredLogs() || (
            <span className="text-gray-500">No logs found</span>
          )}
        </pre>
      </div>

      <div className="p-2 bg-gray-800 text-gray-400 text-xs flex items-center justify-between">
        <span>{serviceName}</span>
        <span>{getFilteredLogs().split('\n').filter(Boolean).length} lines{filter && ' (filtered)'}</span>
      </div>
    </div>
  );
}
