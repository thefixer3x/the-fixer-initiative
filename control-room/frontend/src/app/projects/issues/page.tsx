'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft, Plus, ExternalLink, Search, Filter } from 'lucide-react'
import { githubAPI, type GitHubIssue } from '@/lib/github-api'
import { toast } from 'sonner'

export default function GitHubIssuesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Array<{ name: string; full_name: string }>>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed'>('open')

  useEffect(() => {
    if (!user) return

    loadRepositories()
  }, [user])

  useEffect(() => {
    if (selectedRepo) {
      loadIssues()
    }
  }, [selectedRepo, filterState])

  const loadRepositories = async () => {
    try {
      const repos = await githubAPI.getRepositories()
      setRepositories(repos.map(r => ({ name: r.name, full_name: r.full_name })))
      if (repos.length > 0 && !selectedRepo) {
        setSelectedRepo(repos[0].name)
      }
    } catch (error) {
      console.error('Failed to load repositories:', error)
      toast.error('Failed to load repositories. Check GitHub token configuration.')
    }
  }

  const loadIssues = async () => {
    if (!selectedRepo) return

    setLoading(true)
    try {
      const issuesData = await githubAPI.getIssues(selectedRepo, filterState)
      setIssues(issuesData)
    } catch (error) {
      console.error('Failed to load issues:', error)
      toast.error('Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  const filteredIssues = issues.filter(issue => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        issue.title.toLowerCase().includes(query) ||
        issue.body?.toLowerCase().includes(query) ||
        issue.labels.some((label: any) =>
          (typeof label === 'string' ? label : label.name).toLowerCase().includes(query)
        )
      )
    }
    return true
  })

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
              GitHub Issues
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and link issues to billing services
            </p>
          </div>
          <button
            onClick={() => router.push('/projects/onboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {repositories.map((repo) => (
                  <option key={repo.name} value={repo.name}>
                    {repo.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value as any)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search issues..."
                  className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Issues ({filteredIssues.length})
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 text-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading issues...</p>
              </div>
            ) : filteredIssues.length > 0 ? (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-base font-medium text-gray-900">
                            #{issue.number}: {issue.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              issue.state === 'open'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {issue.state}
                          </span>
                        </div>

                        {issue.labels && issue.labels.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {issue.labels.map((label: any, idx) => {
                              const labelName = typeof label === 'string' ? label : label.name
                              const isBilling = labelName.includes('billing')
                              return (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    isBilling
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {labelName}
                                </span>
                              )
                            })}
                          </div>
                        )}

                        {issue.body && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {issue.body}
                          </p>
                        )}

                        <div className="mt-3 flex items-center text-xs text-gray-500">
                          <span>Updated {new Date(issue.updated_at).toLocaleDateString()}</span>
                          {issue.assignee && (
                            <span className="ml-4">Assigned to {issue.assignee}</span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex items-center space-x-2">
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                        <button
                          onClick={() => router.push(`/projects/issues/${issue.number}?repo=${selectedRepo}`)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Link Billing
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No issues found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

