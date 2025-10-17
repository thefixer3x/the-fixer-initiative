'use client';

import React from 'react';
import { BarChartIcon, TriangleUpIcon, TriangleDownIcon } from '@radix-ui/react-icons';

export default function AnalyticsPage() {
    const metrics = [
        { name: 'Page Views', value: '24,567', change: '+12.5%', trend: 'up' },
        { name: 'Unique Visitors', value: '8,234', change: '+8.2%', trend: 'up' },
        { name: 'Bounce Rate', value: '32.1%', change: '-2.4%', trend: 'down' },
        { name: 'Session Duration', value: '4m 32s', change: '+15.3%', trend: 'up' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Detailed insights into your ecosystem performance
                </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.name} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 truncate">{metric.name}</dt>
                                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{metric.value}</dd>
                                </div>
                                <div className="flex items-center">
                                    {metric.trend === 'up' ? (
                                        <TriangleUpIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <TriangleDownIcon className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className={`ml-1 text-sm font-medium ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {metric.change}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Traffic Overview</h3>
                    </div>
                    <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                            <BarChartIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Traffic Analytics</h3>
                            <p className="mt-1 text-sm text-gray-500">Detailed traffic analysis coming soon</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">User Engagement</h3>
                    </div>
                    <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                            <BarChartIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Engagement Metrics</h3>
                            <p className="mt-1 text-sm text-gray-500">User engagement data visualization</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}