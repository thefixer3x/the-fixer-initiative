// Mock data for demonstration purposes
// In a real implementation, this would connect to your Supabase instance

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

// Mock data
const mockProjects: Project[] = [
  {
    id: 'vortexcore',
    name: 'Vortexcore.app',
    description: 'Main aggregation platform',
    status: 'active',
    migrationStatus: 'completed',
    createdAt: '2024-01-15',
    updatedAt: '2024-06-20',
  },
  {
    id: 'seftec',
    name: 'SEFTEC Store',
    description: 'E-commerce platform',
    status: 'active',
    migrationStatus: 'completed',
    createdAt: '2024-02-10',
    updatedAt: '2024-06-18',
  },
  {
    id: 'saas',
    name: 'SaaS Platform',
    description: 'Software as a Service platform',
    status: 'maintenance',
    migrationStatus: 'in_progress',
    createdAt: '2024-03-05',
    updatedAt: '2024-06-22',
  },
  {
    id: 'apple',
    name: 'Apple Store Lekki',
    description: 'Retail store management',
    status: 'active',
    migrationStatus: 'pending',
    createdAt: '2024-04-12',
    updatedAt: '2024-06-15',
  },
];

const mockClients: Client[] = [
  {
    id: '1',
    clientCode: 'CLIENT_001',
    organizationName: 'Tech Innovations Ltd',
    contactEmail: 'admin@techinnovations.com',
    contactName: 'John Smith',
    businessType: 'startup',
    subscriptionTier: 'professional',
    isActive: true,
    createdAt: '2024-01-15',
    lastActive: '2024-06-20',
  },
  {
    id: '2',
    clientCode: 'CLIENT_002',
    organizationName: 'Global Solutions Inc',
    contactEmail: 'info@globalsolutions.com',
    contactName: 'Sarah Johnson',
    businessType: 'enterprise',
    subscriptionTier: 'enterprise',
    isActive: true,
    createdAt: '2024-02-10',
    lastActive: '2024-06-18',
  },
  {
    id: '3',
    clientCode: 'CLIENT_003',
    organizationName: 'Creative Designs Co',
    contactEmail: 'hello@creativedesigns.co',
    contactName: 'Michael Brown',
    businessType: 'freelancer',
    subscriptionTier: 'starter',
    isActive: false,
    createdAt: '2024-03-05',
    lastActive: '2024-05-22',
  },
];

const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'OpenAI',
    service: 'AI/LLM Services',
    status: 'active',
    apiKey: 'sk-****-****-****-****',
    lastUsed: '2024-06-20',
    usageCount: 12500,
  },
  {
    id: '2',
    name: 'Anthropic',
    service: 'Claude API Access',
    status: 'active',
    apiKey: 'sk-****-****-****-****',
    lastUsed: '2024-06-18',
    usageCount: 8750,
  },
  {
    id: '3',
    name: 'ElevenLabs',
    service: 'Voice Services',
    status: 'active',
    apiKey: 'sk-****-****-****-****',
    lastUsed: '2024-06-22',
    usageCount: 3200,
  },
  {
    id: '4',
    name: 'Stripe',
    service: 'Payment Processing',
    status: 'maintenance',
    apiKey: 'sk-****-****-****-****',
    lastUsed: '2024-06-15',
    usageCount: 45000,
  },
  {
    id: '5',
    name: 'Twilio',
    service: 'Communications',
    status: 'active',
    apiKey: 'sk-****-****-****-****',
    lastUsed: '2024-06-21',
    usageCount: 15600,
  },
];

const mockBillingRecords: BillingRecord[] = [
  {
    id: '1',
    client: 'Tech Innovations Ltd',
    period: 'Jun 2024',
    amount: 1250.00,
    currency: 'USD',
    status: 'paid',
    invoiceDate: '2024-06-01',
    dueDate: '2024-06-15',
    paidDate: '2024-06-10',
  },
  {
    id: '2',
    client: 'Global Solutions Inc',
    period: 'Jun 2024',
    amount: 2450.75,
    currency: 'USD',
    status: 'paid',
    invoiceDate: '2024-06-01',
    dueDate: '2024-06-15',
    paidDate: '2024-06-12',
  },
  {
    id: '3',
    client: 'Creative Designs Co',
    period: 'Jun 2024',
    amount: 150.25,
    currency: 'USD',
    status: 'pending',
    invoiceDate: '2024-06-01',
    dueDate: '2024-06-15',
    paidDate: null,
  },
  {
    id: '4',
    client: 'Tech Innovations Ltd',
    period: 'May 2024',
    amount: 1120.50,
    currency: 'USD',
    status: 'paid',
    invoiceDate: '2024-05-01',
    dueDate: '2024-05-15',
    paidDate: '2024-05-10',
  },
];

// Data fetching functions
export async function getProjects(): Promise<Project[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockProjects;
}

export async function getClients(): Promise<Client[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockClients;
}

export async function getVendors(): Promise<Vendor[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockVendors;
}

export async function getBillingRecords(): Promise<BillingRecord[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockBillingRecords;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockProjects.find(project => project.id === id);
}

export async function getClientById(id: string): Promise<Client | undefined> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockClients.find(client => client.id === id);
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockVendors.find(vendor => vendor.id === id);
}

export async function getBillingRecordById(id: string): Promise<BillingRecord | undefined> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockBillingRecords.find(record => record.id === id);
}

// Data mutation functions
export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newProject: Project = {
    ...project,
    id: `project-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  
  mockProjects.push(newProject);
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockProjects.findIndex(project => project.id === id);
  if (index === -1) {
    throw new Error('Project not found');
  }
  
  mockProjects[index] = {
    ...mockProjects[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  
  return mockProjects[index];
}

export async function deleteProject(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockProjects.findIndex(project => project.id === id);
  if (index === -1) {
    throw new Error('Project not found');
  }
  
  mockProjects.splice(index, 1);
}

export async function createClient(client: Omit<Client, 'id' | 'createdAt' | 'lastActive'>): Promise<Client> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newClient: Client = {
    ...client,
    id: `client-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastActive: new Date().toISOString().split('T')[0],
  };
  
  mockClients.push(newClient);
  return newClient;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockClients.findIndex(client => client.id === id);
  if (index === -1) {
    throw new Error('Client not found');
  }
  
  mockClients[index] = {
    ...mockClients[index],
    ...updates,
    lastActive: new Date().toISOString().split('T')[0],
  };
  
  return mockClients[index];
}

export async function deleteClient(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockClients.findIndex(client => client.id === id);
  if (index === -1) {
    throw new Error('Client not found');
  }
  
  mockClients.splice(index, 1);
}