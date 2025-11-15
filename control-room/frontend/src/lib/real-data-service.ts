// Real Data Service - Fetches live data from ecosystem APIs and databases
import { supabase } from './supabase'
import { ecosystemAPI } from './ecosystem-api'
import { MultiDatabaseAPI } from './neon-api'

export interface RealTimeMetrics {
  totalUsers: number
  activeApps: number
  totalApps: number
  totalRevenue: number
  totalTransactions: number
  healthPercentage: number
  avgResponseTime: number
  avgUptime: number
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastChecked: string
  uptime: number
  endpoint: string
}

export interface RealTimeActivity {
  id: string
  name: string
  type: string
  status: 'healthy' | 'degraded' | 'down'
  time: string
  responseTime: number
}

export interface TopApp {
  id: string
  name: string
  description: string
  health_status: 'healthy' | 'degraded' | 'down'
  metrics: {
    users: number
    revenue: number
  }
}

class RealDataService {
  private healthCheckEndpoints = [
    { name: 'Memory Service', url: 'https://api.lanonasis.com/health', id: 'vibe-memory' },
    { name: 'VortexCore', url: 'https://vortexcore.app/health', id: 'vortexcore' },
    { name: 'Seftec SaaS', url: 'https://saas.seftec.tech/health', id: 'seftec-saas' },
    { name: 'SeftecHub', url: 'https://seftechub.com/health', id: 'seftechub' },
    { name: 'LanOnasis', url: 'https://lanonasis.com/health', id: 'lanonasis' },
    { name: 'MaaS Platform', url: 'https://maas.onasis.io/health', id: 'maas' },
  ]

  // Health check with timeout
  private async checkHealth(endpoint: { name: string; url: string; id: string }): Promise<ServiceHealth> {
    const startTime = Date.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(endpoint.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        return {
          name: endpoint.name,
          status: data.status === 'healthy' || response.status === 200 ? 'healthy' : 'degraded',
          responseTime,
          lastChecked: new Date().toISOString(),
          uptime: data.uptime || 99.5,
          endpoint: endpoint.url,
        }
      } else {
        return {
          name: endpoint.name,
          status: 'degraded',
          responseTime,
          lastChecked: new Date().toISOString(),
          uptime: 95.0,
          endpoint: endpoint.url,
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        name: endpoint.name,
        status: 'down',
        responseTime,
        lastChecked: new Date().toISOString(),
        uptime: 0,
        endpoint: endpoint.url,
      }
    }
  }

  // Get real-time metrics from multiple sources
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      // Fetch from multiple sources in parallel
      const [
        dbMetrics,
        ecosystemMetrics,
        healthChecks,
      ] = await Promise.allSettled([
        this.getDatabaseMetrics(),
        ecosystemAPI.getAggregatedMetrics(),
        this.getAllHealthChecks(),
      ])

      // Extract data with fallbacks
      const dbData = dbMetrics.status === 'fulfilled' ? dbMetrics.value : null
      const ecosystemData = ecosystemMetrics.status === 'fulfilled' ? ecosystemMetrics.value : null
      const healthData = healthChecks.status === 'fulfilled' ? healthChecks.value : []

      // Calculate aggregated metrics
      const healthyServices = healthData.filter(h => h.status === 'healthy').length
      const totalServices = healthData.length || 1
      const avgResponseTime = healthData.length > 0
        ? Math.round(healthData.reduce((sum, h) => sum + h.responseTime, 0) / healthData.length)
        : 0
      const avgUptime = healthData.length > 0
        ? healthData.reduce((sum, h) => sum + h.uptime, 0) / healthData.length
        : 99.5

      return {
        totalUsers: ecosystemData?.totalClients || dbData?.totalProfiles || 0,
        activeApps: ecosystemData?.activeClients || dbData?.activeApps || 0,
        totalApps: ecosystemData?.ecosystemProjects?.length || dbData?.totalApps || 0,
        totalRevenue: ecosystemData?.totalRevenue || 0,
        totalTransactions: ecosystemData?.totalTransactions || 0,
        healthPercentage: Math.round((healthyServices / totalServices) * 100),
        avgResponseTime,
        avgUptime: Math.round(avgUptime * 10) / 10,
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error)
      // Return fallback metrics
      return {
        totalUsers: 0,
        activeApps: 0,
        totalApps: 0,
        totalRevenue: 0,
        totalTransactions: 0,
        healthPercentage: 0,
        avgResponseTime: 0,
        avgUptime: 0,
      }
    }
  }

  // Get database metrics from Supabase
  private async getDatabaseMetrics() {
    try {
      const metrics = await MultiDatabaseAPI.getDashboardMetrics()
      return {
        totalApps: metrics.totalApps || 0,
        activeApps: metrics.activeApps || 0,
        totalOrganizations: metrics.totalOrganizations || 0,
        activeOrganizations: metrics.activeOrganizations || 0,
        totalProfiles: metrics.totalProfiles || 0,
        totalAuthUsers: metrics.totalAuthUsers || 0,
      }
    } catch (error) {
      console.error('Error fetching database metrics:', error)
      return null
    }
  }

  // Get health status for all services
  async getAllHealthChecks(): Promise<ServiceHealth[]> {
    const checks = await Promise.all(
      this.healthCheckEndpoints.map(endpoint => this.checkHealth(endpoint))
    )
    return checks
  }

  // Get top performing apps with real data
  async getTopPerformingApps(limit: number = 5): Promise<TopApp[]> {
    try {
      const ecosystemData = await ecosystemAPI.getAggregatedMetrics()
      const projects = ecosystemData.ecosystemProjects || []

      return projects
        .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
        .slice(0, limit)
        .map(project => ({
          id: project.id,
          name: project.name,
          description: `${project.name} service`,
          health_status: project.healthStatus === 'healthy' ? 'healthy' : 
                        project.healthStatus === 'degraded' ? 'degraded' : 'down',
          metrics: {
            users: project.metrics.users || 0,
            revenue: project.metrics.revenue || 0,
          },
        }))
    } catch (error) {
      console.error('Error fetching top apps:', error)
      return []
    }
  }

  // Get recent activity from health checks
  async getRecentActivity(): Promise<RealTimeActivity[]> {
    try {
      const healthChecks = await this.getAllHealthChecks()
      return healthChecks
        .sort((a, b) => new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime())
        .slice(0, 5)
        .map(health => ({
          id: health.name.toLowerCase().replace(/\s+/g, '-'),
          name: health.name,
          type: 'health_check',
          status: health.status,
          time: health.lastChecked,
          responseTime: health.responseTime,
        }))
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  // Get transaction trends
  async getTransactionTrend(days: number = 7) {
    try {
      return await ecosystemAPI.getTransactionTrend(days)
    } catch (error) {
      console.error('Error fetching transaction trend:', error)
      return []
    }
  }

  // Get client usage data
  async getClientUsage() {
    try {
      return await ecosystemAPI.getClientUsage()
    } catch (error) {
      console.error('Error fetching client usage:', error)
      return []
    }
  }

  // Get service status for services page
  async getServiceStatus() {
    try {
      return await ecosystemAPI.getServiceStatus()
    } catch (error) {
      console.error('Error fetching service status:', error)
      return []
    }
  }
}

// Export singleton instance
export const realDataService = new RealDataService()

