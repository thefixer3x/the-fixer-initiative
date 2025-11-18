'use client';

import { useState, useEffect } from 'react';
import { DollarSignIcon, TrendingUpIcon, CreditCardIcon, ActivityIcon, AlertCircleIcon } from 'lucide-react';

interface PlatformBilling {
  revenue: number;
  transactions: number;
  error?: boolean;
  [key: string]: any;
}

interface BillingSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  platformCount: number;
  activePlatforms: number;
}

interface BillingData {
  success: boolean;
  timeRange: string;
  timestamp: string;
  summary: BillingSummary;
  platforms: Record<string, PlatformBilling>;
  currency: string;
}

export default function BillingAggregator() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchBillingData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchBillingData, 300000);
    return () => clearInterval(interval);
  }, [timeRange]);

  async function fetchBillingData() {
    try {
      const response = await fetch(`/api/billing/aggregate?range=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setBillingData(data);
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function getPlatformName(key: string): string {
    return key.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <ActivityIcon size={32} className="animate-pulse mx-auto mb-2" />
        <p>Loading billing data...</p>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="p-6 text-center text-red-600">
        <AlertCircleIcon size={32} className="mx-auto mb-2" />
        <p>Failed to load billing data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Aggregator</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cross-platform billing overview
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSignIcon size={24} />
            <span className="text-sm font-medium">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(billingData.summary.totalRevenue)}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <CreditCardIcon size={24} />
            <span className="text-sm font-medium">Transactions</span>
          </div>
          <div className="text-3xl font-bold">{billingData.summary.totalTransactions.toLocaleString()}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUpIcon size={24} />
            <span className="text-sm font-medium">Avg Transaction</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(billingData.summary.averageTransactionValue)}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <ActivityIcon size={24} />
            <span className="text-sm font-medium">Active Platforms</span>
          </div>
          <div className="text-3xl font-bold">
            {billingData.summary.activePlatforms}/{billingData.summary.platformCount}
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4">Platform Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(billingData.platforms).map(([key, platform]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-lg">{getPlatformName(key)}</h4>
                  {platform.error && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">
                      Offline
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {platform.transactions} transactions
                  {platform.mrr && ` • MRR: ${formatCurrency(platform.mrr)}`}
                  {platform.activeSubscriptions && ` • ${platform.activeSubscriptions} subscriptions`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(platform.revenue)}
                </div>
                {platform.error && (
                  <div className="text-xs text-gray-500 mt-1">Mock data (API offline)</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(billingData.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
