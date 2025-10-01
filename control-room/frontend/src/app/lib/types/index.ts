export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
  migrationStatus: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  clientCode: string;
  organizationName: string;
  contactEmail: string;
  contactName: string;
  businessType: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  lastActive: string;
}

export interface Vendor {
  id: string;
  name: string;
  service: string;
  status: 'active' | 'inactive' | 'maintenance';
  apiKey: string;
  lastUsed: string;
  usageCount: number;
}

export interface BillingRecord {
  id: string;
  client: string;
  period: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  invoiceDate: string;
  dueDate: string;
  paidDate: string | null;
}

export interface AnalyticsData {
  apiCalls: {
    date: string;
    count: number;
  }[];
  topServices: {
    name: string;
    value: number;
    color: string;
  }[];
  clientDistribution: {
    tier: string;
    count: number;
    percentage: number;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  lastActive: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
}