// GitHub API Integration Service
// Handles GitHub operations for project management, issue tracking, and client onboarding

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  labels: string[]
  assignee?: string
  created_at: string
  updated_at: string
  html_url: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  html_url: string
  default_branch: string
  created_at: string
  updated_at: string
}

export interface ProjectOnboarding {
  projectName: string
  clientName: string
  description: string
  billingTier: 'free' | 'starter' | 'professional' | 'enterprise'
  repositoryName?: string
  createRepository: boolean
  initialIssues?: string[]
}

export interface BillingServiceLink {
  issueNumber: number
  serviceId: string
  serviceName: string
  billingAmount: number
  billingCycle: 'monthly' | 'yearly'
  clientId: string
}

class GitHubAPIService {
  private baseURL = 'https://api.github.com'
  private token: string | null = null
  private owner: string = 'thefixer3x' // Default organization/user

  constructor() {
    // Get token from environment or localStorage
    if (typeof window !== 'undefined') {
      this.token = process.env.NEXT_PUBLIC_GITHUB_TOKEN || 
                   localStorage.getItem('github_token') || 
                   null
    } else {
      this.token = process.env.GITHUB_TOKEN || null
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('GitHub API request failed:', error)
      throw error
    }
  }

  // Set GitHub token
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('github_token', token)
    }
  }

  // Get repositories
  async getRepositories(): Promise<GitHubRepository[]> {
    return this.request<GitHubRepository[]>(`/orgs/${this.owner}/repos?per_page=100&sort=updated`)
  }

  // Create a new repository
  async createRepository(name: string, description: string, privateRepo: boolean = true): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(`/orgs/${this.owner}/repos`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        private: privateRepo,
        auto_init: true,
        gitignore_template: 'Node',
      }),
    })
  }

  // Create an issue
  async createIssue(
    repo: string,
    title: string,
    body: string,
    labels: string[] = [],
    assignees: string[] = []
  ): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${this.owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        labels,
        assignees,
      }),
    })
  }

  // Get issues for a repository
  async getIssues(repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    return this.request<GitHubIssue[]>(`/repos/${this.owner}/${repo}/issues?state=${state}&per_page=100`)
  }

  // Link issue to billing service
  async linkIssueToBilling(
    repo: string,
    issueNumber: number,
    billingLink: BillingServiceLink
  ): Promise<GitHubIssue> {
    // Get existing issue
    const issue = await this.request<GitHubIssue>(`/repos/${this.owner}/${repo}/issues/${issueNumber}`)
    
    // Create billing link comment
    const billingComment = `
## 💳 Billing Service Linked

**Service:** ${billingLink.serviceName}
**Service ID:** \`${billingLink.serviceId}\`
**Client ID:** \`${billingLink.clientId}\`
**Amount:** $${billingLink.billingAmount}/${billingLink.billingCycle}
**Status:** Active

---
*Linked via Control Room Dashboard*
`

    // Add comment to issue
    await this.request(`/repos/${this.owner}/${repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body: billingComment,
      }),
    })

    // Update issue labels
    const labels = [...(issue.labels || []), 'billing', `tier-${billingLink.billingCycle}`]

    return this.request<GitHubIssue>(`/repos/${this.owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({
        labels: labels.map((l: any) => typeof l === 'string' ? l : l.name),
      }),
    })
  }

  // Onboard new project/client
  async onboardProject(onboarding: ProjectOnboarding): Promise<{
    repository?: GitHubRepository
    issues: GitHubIssue[]
  }> {
    const results: { repository?: GitHubRepository; issues: GitHubIssue[] } = {
      issues: [],
    }

    // Create repository if requested
    if (onboarding.createRepository) {
      const repoName = onboarding.repositoryName || 
                      onboarding.projectName.toLowerCase().replace(/\s+/g, '-')
      
      try {
        results.repository = await this.createRepository(
          repoName,
          `${onboarding.description}\n\nClient: ${onboarding.clientName}\nBilling Tier: ${onboarding.billingTier}`,
          true
        )
      } catch (error) {
        console.error('Failed to create repository:', error)
        throw new Error(`Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Create initial issues
    const repoName = results.repository?.name || onboarding.repositoryName || 'the-fixer-initiative'
    
    // Create onboarding issue
    const onboardingIssueBody = `
## 🚀 Project Onboarding: ${onboarding.projectName}

**Client:** ${onboarding.clientName}
**Billing Tier:** ${onboarding.billingTier}
**Description:** ${onboarding.description}

### Tasks
- [ ] Set up project infrastructure
- [ ] Configure billing service
- [ ] Create API keys
- [ ] Set up monitoring
- [ ] Initialize database schemas

### Billing Information
- **Tier:** ${onboarding.billingTier}
- **Status:** Pending activation

---
*Created via Control Room Dashboard*
`

    const onboardingIssue = await this.createIssue(
      repoName,
      `🚀 Onboard: ${onboarding.projectName}`,
      onboardingIssueBody,
      ['onboarding', 'new-project', `tier-${onboarding.billingTier}`]
    )
    results.issues.push(onboardingIssue)

    // Create additional issues if specified
    if (onboarding.initialIssues && onboarding.initialIssues.length > 0) {
      for (const issueTitle of onboarding.initialIssues) {
        try {
          const issue = await this.createIssue(
            repoName,
            issueTitle,
            `Initial task for ${onboarding.projectName}`,
            ['project-setup']
          )
          results.issues.push(issue)
        } catch (error) {
          console.error(`Failed to create issue "${issueTitle}":`, error)
        }
      }
    }

    return results
  }

  // Get issue by number
  async getIssue(repo: string, issueNumber: number): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${this.owner}/${repo}/issues/${issueNumber}`)
  }

  // Update issue
  async updateIssue(
    repo: string,
    issueNumber: number,
    updates: {
      title?: string
      body?: string
      state?: 'open' | 'closed'
      labels?: string[]
    }
  ): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${this.owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  // Search issues
  async searchIssues(query: string): Promise<{ items: GitHubIssue[] }> {
    return this.request<{ items: GitHubIssue[] }>(
      `/search/issues?q=${encodeURIComponent(query)}+repo:${this.owner}/*`
    )
  }
}

// Export singleton instance
export const githubAPI = new GitHubAPIService()

