// Mock API functions for admin dashboard
// In a real application, these would make HTTP requests to your backend

import { Project, Client, Vendor, BillingRecord } from '../types';

// Mock data
const mockProjects: Project[] = [
    {
        id: '1',
        name: 'SEFTEC Hub',
        description: 'Main platform for SEFTEC ecosystem',
        status: 'active',
        clientId: '1',
        createdAt: '2024-01-15',
        updatedAt: '2024-10-15'
    },
    {
        id: '2',
        name: 'VortexCore',
        description: 'Core infrastructure services',
        status: 'active',
        clientId: '2',
        createdAt: '2024-02-01',
        updatedAt: '2024-10-14'
    },
    {
        id: '3',
        name: 'Agent Banks',
        description: 'AI agent banking system',
        status: 'active',
        clientId: '3',
        createdAt: '2024-03-10',
        updatedAt: '2024-10-13'
    },
    {
        id: '4',
        name: 'SEFTEC Shop',
        description: 'E-commerce platform',
        status: 'development',
        clientId: '1',
        createdAt: '2024-09-01',
        updatedAt: '2024-10-12'
    }
];

const mockClients: Client[] = [
    {
        id: '1',
        name: 'SEFTEC Team',
        email: 'admin@seftec.com',
        company: 'SEFTEC',
        isActive: true,
        createdAt: '2024-01-01'
    },
    {
        id: '2',
        name: 'VortexCore Admin',
        email: 'admin@vortexcore.com',
        company: 'VortexCore',
        isActive: true,
        createdAt: '2024-01-15'
    },
    {
        id: '3',
        name: 'Agent Banks Team',
        email: 'team@agentbanks.com',
        company: 'Agent Banks',
        isActive: true,
        createdAt: '2024-02-01'
    }
];

const mockVendors: Vendor[] = [
    {
        id: '1',
        name: 'Supabase',
        service: 'Database & Auth',
        status: 'active',
        contactEmail: 'support@supabase.com'
    },
    {
        id: '2',
        name: 'Neon',
        service: 'Database',
        status: 'active',
        contactEmail: 'support@neon.tech'
    },
    {
        id: '3',
        name: 'Paystack',
        service: 'Payment Processing',
        status: 'active',
        contactEmail: 'support@paystack.com'
    },
    {
        id: '4',
        name: 'Vercel',
        service: 'Hosting & Deployment',
        status: 'active',
        contactEmail: 'support@vercel.com'
    }
];

const mockBillingRecords: BillingRecord[] = [
    {
        id: '1',
        clientId: '1',
        amount: 12450,
        status: 'paid',
        dueDate: '2024-10-01',
        description: 'SEFTEC Hub monthly subscription'
    },
    {
        id: '2',
        clientId: '2',
        amount: 8720,
        status: 'paid',
        dueDate: '2024-10-01',
        description: 'VortexCore infrastructure costs'
    },
    {
        id: '3',
        clientId: '3',
        amount: 6350,
        status: 'pending',
        dueDate: '2024-10-15',
        description: 'Agent Banks platform fees'
    },
    {
        id: '4',
        clientId: '1',
        amount: 2500,
        status: 'overdue',
        dueDate: '2024-09-15',
        description: 'Additional storage costs'
    }
];

// API functions
export async function getProjects(): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProjects;
}

export async function getClients(): Promise<Client[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockClients;
}

export async function getVendors(): Promise<Vendor[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockVendors;
}

export async function getBillingRecords(): Promise<BillingRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockBillingRecords;
}