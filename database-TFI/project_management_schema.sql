-- Enhanced Project Management Schema

-- Drop existing tables if they exist (for idempotency)
DROP TABLE IF EXISTS public.task_dependencies CASCADE;
DROP TABLE IF EXISTS public.sub_tasks CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.project_teams CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.task_priorities CASCADE;
DROP TABLE IF EXISTS public.task_statuses CASCADE;
DROP TABLE IF EXISTS public.project_stages CASCADE;

-- Normalization Tables

-- project_stages: Defines the customizable stages of a project lifecycle.
CREATE TABLE public.project_stages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    "order" INT NOT NULL
);

-- task_statuses: Defines the statuses that can be assigned to a task.
CREATE TABLE public.task_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- task_priorities: Defines the priority levels for tasks.
CREATE TABLE public.task_priorities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Core Project Management Tables

-- teams: Represents a team of users.
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- team_members: A junction table to link users to teams.
CREATE TABLE public.team_members (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Team Member', -- e.g., 'Project Manager', 'Team Member'
    PRIMARY KEY (team_id, user_id)
);

-- project_teams: A junction table to link teams to projects.
CREATE TABLE public.project_teams (
    project_id UUID REFERENCES public.company_projects(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, team_id)
);

-- tasks: Represents a task within a project.
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.company_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status_id INT REFERENCES public.task_statuses(id),
    priority_id INT REFERENCES public.task_priorities(id),
    assignee_id UUID REFERENCES auth.users(id),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sub_tasks: Represents a sub-task within a parent task.
CREATE TABLE public.sub_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status_id INT REFERENCES public.task_statuses(id),
    assignee_id UUID REFERENCES auth.users(id),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- task_dependencies: Defines dependencies between tasks.
CREATE TABLE public.task_dependencies (
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- Insert default values for normalization tables
INSERT INTO public.project_stages (name, "order") VALUES
('Planning', 1),
('In Progress', 2),
('In Review', 3),
('Completed', 4),
('On Hold', 5);

INSERT INTO public.task_statuses (name) VALUES
('To Do'),
('In Progress'),
('Done');

INSERT INTO public.task_priorities (name) VALUES
('Low'),
('Medium'),
('High'),
('Urgent');