'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Database, Server, ArrowRight, CheckCircle, Activity } from 'lucide-react'

export default function DatabasesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Activity className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Activity className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      </DashboardLayout>
    )
  }

  const databases = [
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Original production database with authentication and core business logic',
      icon: Database,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      status: 'healthy',
      metrics: {
        tables: 15,
        users: 1247,
        responseTime: '120ms'
      },
      href: '/databases/supabase'
    },
    {
      id: 'neon',
      name: 'Neon',
      description: 'Enhanced multi-schema architecture with advanced monitoring and performance optimization',
      icon: Server,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      status: 'healthy',
      metrics: {
        schemas: 6,
        tables: 42,
        records: '3,891',
        responseTime: '85ms'
      },
      href: '/databases/neon'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              Database Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and monitor your multi-database architecture
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {databases.map((db) => {
            const Icon = db.icon
            return (
              <div
                key={db.id}
                onClick={() => router.push(db.href)}
                className={`relative cursor-pointer rounded-lg border-2 ${db.borderColor} ${db.bgColor} p-6 hover:shadow-lg transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 ${db.iconColor}`}>
                      <Icon className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-gray-900">{db.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          db.status === 'healthy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {db.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{db.description}</p>
                    </div>
                  </div>
                  <ArrowRight className={`h-5 w-5 ${db.iconColor} flex-shrink-0`} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                  {Object.entries(db.metrics).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">{value}</dd>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <span className={`text-sm font-medium ${db.iconColor}`}>
                    View Details →
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Database Architecture Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Supabase Database</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Primary authentication system</li>
                <li>• Core business logic storage</li>
                <li>• Real-time subscriptions</li>
                <li>• Edge functions support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Neon Database</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-schema architecture</li>
                <li>• Enhanced monitoring capabilities</li>
                <li>• Advanced performance optimization</li>
                <li>• Scalable PostgreSQL infrastructure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
