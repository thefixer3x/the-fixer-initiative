'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Settings, CheckCircle, AlertCircle, Key } from 'lucide-react'
import { githubAPI } from '@/lib/github-api'
import { toast } from 'sonner'

export default function GitHubSettingsPage() {
  const { user } = useAuth()
  const [token, setToken] = useState('')
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('github_token')
      if (savedToken) {
        setToken(savedToken)
        testToken(savedToken)
      }
    }
  }, [])

  const testToken = async (tokenToTest: string) => {
    if (!tokenToTest) {
      setTokenValid(null)
      return
    }

    setTesting(true)
    try {
      // Test token by fetching user info
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenToTest}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setTokenValid(true)
        githubAPI.setToken(tokenToTest)
        toast.success(`Connected as ${userData.login}`)
      } else {
        setTokenValid(false)
        toast.error('Invalid GitHub token')
      }
    } catch (error) {
      setTokenValid(false)
      toast.error('Failed to validate token')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!token.trim()) {
      toast.error('Please enter a GitHub token')
      return
    }

    testToken(token)
  }

  const handleClear = () => {
    setToken('')
    setTokenValid(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('github_token')
    }
    toast.success('Token cleared')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              GitHub Integration Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure GitHub API access for project management
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2 text-gray-600" />
              GitHub Personal Access Token
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="githubToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  id="githubToken"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value)
                    setTokenValid(null)
                  }}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Create a token at{' '}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    GitHub Settings → Developer settings → Personal access tokens
                  </a>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Required scopes: repo, admin:org (for organization repos)
                </p>
              </div>

              {tokenValid !== null && (
                <div
                  className={`flex items-center p-3 rounded-md ${
                    tokenValid
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {tokenValid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">Token is valid and connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-sm text-red-800">Token is invalid or expired</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={testing || !token.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Test & Save
                    </>
                  )}
                </button>
                {token && (
                  <button
                    onClick={handleClear}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Features Enabled</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Create and manage GitHub repositories
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Create and link issues to projects
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Link billing services to issues
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Automate project onboarding workflows
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

