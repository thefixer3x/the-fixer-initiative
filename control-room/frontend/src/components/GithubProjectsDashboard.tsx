'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  GitPullRequest,
  Bug,
  Users,
  Lock,
  Globe
} from 'lucide-react';

interface GithubProject {
  id: string;
  project_ref: string; // owner/repo
  project_name: string;
  project_description: string;
  project_url: string;
  visibility: 'public' | 'private';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  github_stats?: {
    stars: number;
    forks: number;
    language: string;
    last_updated: string;
    has_issues: boolean;
    archived: boolean;
  };
  client_id?: string;
  clients?: {
    name: string;
    email: string;
  };
}

export default function GitHubProjectsDashboard() {
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading GitHub projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_ref.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'public' && project.visibility === 'public') || 
                           (selectedCategory === 'private' && project.visibility === 'private');
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (isActive: boolean, visibility: string) => {
    if (!isActive) return 'bg-gray-100 text-gray-800';
    return visibility === 'public' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="animate-spin h-8 w-8 text-indigo-600" />
        <span className="ml-2">Loading GitHub projects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub Project Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your GitHub repositories and their associations with clients
          </p>
        </div>
        <Button onClick={loadProjects}>
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'public' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('public')}
              className="flex items-center"
            >
              <Globe className="h-4 w-4 mr-2" />
              Public
            </Button>
            <Button
              variant={selectedCategory === 'private' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('private')}
              className="flex items-center"
            >
              <Lock className="h-4 w-4 mr-2" />
              Private
            </Button>
          </div>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Repository
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GitBranch className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Repositories</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Public Repos</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.visibility === 'public').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Lock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Private Repos</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.visibility === 'private').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Associated Clients</p>
                <p className="text-2xl font-bold">
                  {new Set(projects.filter(p => p.client_id).map(p => p.client_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <GitBranch className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{project.project_name}</span>
                  </div>
                  <Badge className={getStatusColor(project.is_active, project.visibility)}>
                    {project.visibility}
                  </Badge>
                </CardTitle>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="truncate">{project.project_ref}</span>
                  <ExternalLink className="h-4 w-4 ml-2" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {project.project_description || 'No description provided'}
                </p>
                
                {project.github_stats && (
                  <div className="flex items-center space-x-4 text-sm mb-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{project.github_stats.stars}</span>
                    </div>
                    <div className="flex items-center">
                      <GitFork className="h-4 w-4 text-gray-500 mr-1" />
                      <span>{project.github_stats.forks}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {project.github_stats.language}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500">
                      {project.clients?.name ? `Client: ${project.clients.name}` : 'Not assigned'}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    Updated: {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                      View on GitHub
                    </a>
                  </Button>
                  <Button size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <GitBranch className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No GitHub projects found</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding a GitHub repository.'}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col items-center justify-center h-24">
              <GitBranch className="h-6 w-6 mb-2" />
              <span>New Repo</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center justify-center h-24">
              <GitPullRequest className="h-6 w-6 mb-2" />
              <span>Pull Requests</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center justify-center h-24">
              <Bug className="h-6 w-6 mb-2" />
              <span>Issues</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center justify-center h-24">
              <Users className="h-6 w-6 mb-2" />
              <span>Collaborators</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}