'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Link2, CheckCircle } from 'lucide-react'
import { githubAPI, type GitHubIssue, type BillingServiceLink } from '@/lib/github-api'
import { toast } from 'sonner'

export default function LinkBillingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const issueNumber = parseInt(searchParams.get('number') || '0')
  const repo = searchParams.get('repo') || ''

  const [issue, setIssue] = useState<GitHubIssue | null>(null)
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [formData, setFormData] = useState<BillingServiceLink>({
    issueNumber,
    serviceId: '',
    serviceName: '',
    billingAmount: 0,
    billingCycle: 'monthly',
    clientId: '',
  })

  useEffect(() => {
    if (!user || !issueNumber || !repo) {
      router.push('/projects/issues')
      return
    }

    loadIssue()
  }, [user, issueNumber, repo])

  const loadIssue = async () => {
    if (!repo || !issueNumber) return

    setLoading(true)
    try {
      const issueData = await githubAPI.getIssue(repo, issueNumber)
      setIssue(issueData)
      setFormData(prev => ({ ...prev, issueNumber: issueData.number }))
    } catch (error) {
      console.error('Failed to load issue:', error)
      toast.error('Failed to load issue')
      router.push('/projects/issues')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repo || !issue) return

    setLinking(true)
    try {
      await githubAPI.linkIssueToBilling(repo, issue.number, formData)
      toast.success('Billing service linked successfully!')
      router.push('/projects/issues')
    } catch (error) {
      console.error('Failed to link billing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to link billing service')
    } finally {
      setLinking(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 text-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!issue) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/projects/issues')}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Issues
          </button>
        </div>

        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              Link Billing Service
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Connect billing information to GitHub issue #{issue.number}
            </p>
          </div>
        </div>

        {/* Issue Preview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Details</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">Title:</span>
              <p className="text-sm text-gray-900">{issue.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Repository:</span>
              <p className="text-sm text-gray-900">{repo}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span
                className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  issue.state === 'open'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {issue.state}
              </span>
            </div>
            <div>
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>

        {/* Billing Link Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Billing Service Information</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
                Service ID *
              </label>
              <input
                type="text"
                id="serviceId"
                required
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="svc_123456"
              />
            </div>

            <div>
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700">
                Service Name *
              </label>
              <input
                type="text"
                id="serviceName"
                required
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Memory Service"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                Client ID *
              </label>
              <input
                type="text"
                id="clientId"
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="client_org_123"
              />
            </div>

            <div>
              <label htmlFor="billingAmount" className="block text-sm font-medium text-gray-700">
                Billing Amount *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="billingAmount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.billingAmount}
                  onChange={(e) => setFormData({ ...formData, billingAmount: parseFloat(e.target.value) || 0 })}
                  className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700">
              Billing Cycle *
            </label>
            <select
              id="billingCycle"
              required
              value={formData.billingCycle}
              onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/projects/issues')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={linking}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {linking ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Link Billing Service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

