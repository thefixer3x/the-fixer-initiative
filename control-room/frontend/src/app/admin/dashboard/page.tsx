'use client'

import React from 'react'
import { 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  AlertCircle,
  CreditCard,
  User,
  BookOpen,
  BarChart3,
  MoreHorizontal
} from 'lucide-react'
import {
  RevenueTrendChart,
  SystemPerformanceChart,
  ProjectDistributionChart,
  UserGrowthChart,
  TransactionStatsChart,
} from '@/components/charts/DashboardCharts'
import { useProjects, useClients, useVendors, useBillingRecords } from '../../hooks/useData';
import { formatCurrency } from '../../lib/utils/format';

export default function AdminDashboard() {
    const { projects, loading: projectsLoading } = useProjects();
    const { clients, loading: clientsLoading } = useClients();
    const { vendors, loading: vendorsLoading } = useVendors();
    const { billingRecords, loading: billingLoading } = useBillingRecords();

    // Calculate stats
    const totalRevenue = billingRecords
        .filter(record => record.status === 'paid')
        .reduce((sum, record) => sum + record.amount, 0);

    const activeClients = clients.filter(client => client.isActive).length;
    const activeProjects = projects.filter(project => project.status === 'active').length;

    const stats = [
        { name: 'Total Revenue', value: formatCurrency(totalRevenue), change: '+12.5%', icon: CreditCard },
        { name: 'Active Clients', value: activeClients.toString(), change: '+8.2%', icon: User },
        { name: 'Active Projects', value: activeProjects.toString(), change: '+3.1%', icon: BookOpen },
        { name: 'Connected Vendors', value: vendors.length.toString(), change: '+2.4%', icon: BarChart3 },
    ];

    // Recent activity (mock data for now)
    const recentActivity = [
        { id: 1, user: 'John Doe', action: 'Created new project', time: '2 min ago' },
        { id: 2, user: 'Jane Smith', action: 'Updated API settings', time: '15 min ago' },
        { id: 3, user: 'Robert Johnson', action: 'Generated new API key', time: '1 hour ago' },
        { id: 4, user: 'Emily Davis', action: 'Viewed analytics report', time: '3 hours ago' },
    ];

    // Top projects by revenue (mock data for now)
    const topProjects = [
        { id: 1, name: 'SEFTEC Hub', status: 'Active', revenue: '$12,450' },
        { id: 2, name: 'VortexCore', status: 'Active', revenue: '$8,720' },
        { id: 3, name: 'Agent Banks', status: 'Active', revenue: '$6,350' },
        { id: 4, name: 'SEFTEC Shop', status: 'Development', revenue: '$0' },
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Track your ecosystem performance and recent activity
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <stat.icon className="h-6 w-6 text-gray-400" />
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</dd>
                                    <dd className="mt-1 text-xs text-green-500">{stat.change}</dd>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent activity */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {recentActivity.map((activity) => (
                                <li key={activity.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                                                <p className="text-sm text-gray-500">{activity.action}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">{activity.time}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Top projects */}
                <div>
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Top Projects</h3>
                                <button className="text-gray-400 hover:text-gray-500">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {topProjects.map((project) => (
                                <li key={project.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                            <p className="text-sm text-gray-500">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {project.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">{project.revenue}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Revenue chart */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Revenue Trend</h3>
                    </div>
                    <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Revenue Chart</h3>
                            <p className="mt-1 text-sm text-gray-500">Visual representation of revenue data</p>
                        </div>
                    </div>
                </div>

                {/* Performance chart */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">System Performance</h3>
                    </div>
                    <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Performance Metrics</h3>
                            <p className="mt-1 text-sm text-gray-500">System performance indicators</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}