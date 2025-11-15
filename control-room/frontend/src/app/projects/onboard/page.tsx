'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Plus, CheckCircle, XCircle, Loader } from 'lucide-react'
import { githubAPI, type ProjectOnboarding } from '@/lib/github-api'
import { toast } from 'sonner'

export default function OnboardProjectPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectOnboarding>({
    projectName: '',
    clientName: '',
    description: '',
    billingTier: 'starter',
    repositoryName: '',
    createRepository: false,
    initialIssues: [],
  })
  const [newIssueTitle, setNewIssueTitle] = useState('')
  const [results, setResults] = useState<{
    repository?: { name: string; url: string }
    issues: Array<{ number: number; title: string; url: string }>
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to onboard projects')
      return
    }

    setLoading(true)
    try {
      const result = await githubAPI.onboardProject(formData)
      
      setResults({
        repository: result.repository ? {
          name: result.repository.name,
          url: result.repository.html_url,
        } : undefined,
        issues: result.issues.map(issue => ({
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
        })),
      })

      toast.success('Project onboarded successfully!')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to onboard project')
    } finally {
      setLoading(false)
    }
  }

  const addInitialIssue = () => {
    if (newIssueTitle.trim()) {
      setFormData({
        ...formData,
        initialIssues: [...(formData.initialIssues || []), newIssueTitle.trim()],
      })
      setNewIssueTitle('')
    }
  }

  const removeInitialIssue = (index: number) => {
    setFormData({
      ...formData,
      initialIssues: formData.initialIssues?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </button>
        </div>

        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              Onboard New Project/Client
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create GitHub repository and issues for new projects
            </p>
          </div>
        </div>

        {results ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-900">Project Onboarded Successfully!</h3>
            </div>
            
            {results.repository && (
              <div className="mb-4">
                <p className="text-sm font-medium text-green-800 mb-1">Repository Created:</p>
                <a
                  href={results.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:underline"
                >
                  {results.repository.name} →
                </a>
              </div>
            )}

            {results.issues.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">Issues Created:</p>
                <ul className="space-y-1">
                  {results.issues.map((issue) => (
                    <li key={issue.number}>
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 hover:underline"
                      >
                        #{issue.number}: {issue.title} →
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setResults(null)
                setFormData({
                  projectName: '',
                  clientName: '',
                  description: '',
                  billingTier: 'starter',
                  repositoryName: '',
                  createRepository: false,
                  initialIssues: [],
                })
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Onboard Another Project
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Project Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="My Awesome Project"
                  />
                </div>

                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Acme Corporation"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Project description and requirements..."
                />
              </div>
            </div>

            {/* Billing Tier */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Configuration</h3>
              <div>
                <label htmlFor="billingTier" className="block text-sm font-medium text-gray-700">
                  Billing Tier *
                </label>
                <select
                  id="billingTier"
                  required
                  value={formData.billingTier}
                  onChange={(e) => setFormData({ ...formData, billingTier: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Repository Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Repository Options</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createRepository"
                  checked={formData.createRepository}
                  onChange={(e) => setFormData({ ...formData, createRepository: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="createRepository" className="ml-2 block text-sm text-gray-900">
                  Create new GitHub repository
                </label>
              </div>

              {formData.createRepository && (
                <div className="mt-4">
                  <label htmlFor="repositoryName" className="block text-sm font-medium text-gray-700">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    id="repositoryName"
                    value={formData.repositoryName}
                    onChange={(e) => setFormData({ ...formData, repositoryName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="auto-generated if empty"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to auto-generate from project name
                  </p>
                </div>
              )}
            </div>

            {/* Initial Issues */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Issues</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInitialIssue())}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Issue title..."
                />
                <button
                  type="button"
                  onClick={addInitialIssue}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>

              {formData.initialIssues && formData.initialIssues.length > 0 && (
                <ul className="space-y-2">
                  {formData.initialIssues.map((issue, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-900">{issue}</span>
                      <button
                        type="button"
                        onClick={() => removeInitialIssue(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Onboarding...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Onboard Project
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}

