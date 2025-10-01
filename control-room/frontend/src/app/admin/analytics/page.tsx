'use client';

import React, { useState } from 'react';
import { 
  BarChartIcon, 
  PieChartIcon, 
  DotsHorizontalIcon,
  DownloadIcon,
  CalendarIcon
} from '@radix-ui/react-icons';

const analyticsData = {
  apiCalls: [
    { date: '2024-06-01', count: 12500 },
    { date: '2024-06-02', count: 18750 },
    { date: '2024-06-03', count: 15200 },
    { date: '2024-06-04', count: 21000 },
    { date: '2024-06-05', count: 19800 },
    { date: '2024-06-06', count: 24500 },
    { date: '2024-06-07', count: 22300 },
  ],
  topServices: [
    { name: 'Payment Processing', value: 45, color: 'bg-blue-500' },
    { name: 'AI Services', value: 30, color: 'bg-green-500' },
    { name: 'Data Storage', value: 15, color: 'bg-yellow-500' },
    { name: 'Communications', value: 10, color: 'bg-red-500' },
  ],
  clientDistribution: [
    { tier: 'Enterprise', count: 12, percentage: 24 },
    { tier: 'Professional', count: 28, percentage: 56 },
    { tier: 'Starter', count: 10, percentage: 20 },
  ],
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('api-calls');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor platform usage, performance, and client metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CalendarIcon className="-ml-1 mr-2 h-5 w-5" />
            Custom Range
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DownloadIcon className="-ml-1 mr-2 h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      {/* Metric selector */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setSelectedMetric('api-calls')}
          className={`pb-4 px-1 text-sm font-medium ${
            selectedMetric === 'api-calls'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          API Calls
        </button>
        <button
          onClick={() => setSelectedMetric('services')}
          className={`pb-4 px-1 text-sm font-medium ${
            selectedMetric === 'services'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Service Usage
        </button>
        <button
          onClick={() => setSelectedMetric('clients')}
          className={`pb-4 px-1 text-sm font-medium ${
            selectedMetric === 'clients'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Client Distribution
        </button>
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Calls Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">API Calls Trend</h3>
              <button className="text-gray-400 hover:text-gray-500">
                <DotsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <BarChartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">API Calls Chart</h3>
              <p className="mt-1 text-sm text-gray-500">Daily API call volume over time</p>
            </div>
          </div>
        </div>

        {/* Service Usage Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Service Usage</h3>
              <button className="text-gray-400 hover:text-gray-500">
                <DotsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <PieChartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Service Usage Chart</h3>
              <p className="mt-1 text-sm text-gray-500">Distribution of service usage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Services */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Top Services</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="space-y-4">
              {analyticsData.topServices.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <dt className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${service.color} mr-2`}></div>
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">{service.value}%</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Client Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Client Distribution</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="space-y-4">
              {analyticsData.clientDistribution.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-900">{tier.tier}</dt>
                  <dd className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{tier.count} ({tier.percentage}%)</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${tier.percentage}%` }}
                      ></div>
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Performance Metrics</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-900">Avg. Response Time</dt>
                <dd className="text-sm font-medium text-gray-900">125ms</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-900">Uptime</dt>
                <dd className="text-sm font-medium text-green-600">99.98%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-900">Error Rate</dt>
                <dd className="text-sm font-medium text-red-600">0.02%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-900">Active Users</dt>
                <dd className="text-sm font-medium text-gray-900">1,248</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Custom Report Builder</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create custom analytics reports
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="report-name" className="block text-sm font-medium text-gray-700">
                Report Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="report-name"
                  id="report-name"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Monthly API Usage Report"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <div className="mt-1">
                <select
                  id="report-type"
                  name="report-type"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option>Usage Summary</option>
                  <option>Financial Report</option>
                  <option>Performance Metrics</option>
                  <option>Custom</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                Frequency
              </label>
              <div className="mt-1">
                <select
                  id="frequency"
                  name="frequency"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}