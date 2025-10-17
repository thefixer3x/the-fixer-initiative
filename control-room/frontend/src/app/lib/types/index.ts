export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'development';
    clientId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    company: string;
    isActive: boolean;
    createdAt: string;
}

export interface Vendor {
    id: string;
    name: string;
    service: string;
    status: 'active' | 'inactive';
    contactEmail: string;
}

export interface BillingRecord {
    id: string;
    clientId: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    dueDate: string;
    description: string;
}