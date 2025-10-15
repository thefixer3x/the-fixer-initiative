-- Security and Access Control Plan

-- 1. Enable Row-Level Security (RLS)
-- RLS must be enabled on all tables that contain project-specific data.

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- 2. Define Helper Functions
-- These helper functions will simplify the RLS policies.

-- Function to check if a user is a member of a project.
CREATE OR REPLACE FUNCTION is_project_member(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.project_teams pt
        JOIN public.team_members tm ON pt.team_id = tm.team_id
        WHERE pt.project_id = is_project_member.project_id AND tm.user_id = is_project_member.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has a specific role in a project.
CREATE OR REPLACE FUNCTION has_project_role(user_id UUID, project_id UUID, role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.project_teams pt
        JOIN public.team_members tm ON pt.team_id = tm.team_id
        WHERE pt.project_id = has_project_role.project_id AND tm.user_id = has_project_role.user_id AND tm.role = has_project_role.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RLS Policies for Project Management Tables

-- Policies for `tasks` table
CREATE POLICY "Allow project members to view tasks" ON public.tasks FOR SELECT
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Allow project managers to create tasks" ON public.tasks FOR INSERT
WITH CHECK (has_project_role(auth.uid(), project_id, 'Project Manager'));

CREATE POLICY "Allow assigned users to update tasks" ON public.tasks FOR UPDATE
USING (assignee_id = auth.uid() OR has_project_role(auth.uid(), project_id, 'Project Manager'));

CREATE POLICY "Allow project managers to delete tasks" ON public.tasks FOR DELETE
USING (has_project_role(auth.uid(), project_id, 'Project Manager'));


-- Policies for `teams` and `team_members` (assuming teams are managed at a higher level, e.g., by organization admins)
-- For simplicity, we'll allow any authenticated user to create teams, but only team members to view them.
CREATE POLICY "Allow authenticated users to create teams" ON public.teams FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow team members to view their teams" ON public.teams FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid()
));

-- 4. Audit Compliance
-- To ensure audit compliance, we will create a trigger-based auditing system.
-- A new table, `project_audit_log`, will store a record of all changes to project-related tables.

CREATE TABLE public.project_audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB
);

-- Function to log changes
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.project_audit_log (table_name, record_id, operation, changed_by, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.project_audit_log (table_name, record_id, operation, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.project_audit_log (table_name, record_id, operation, changed_by, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all project-related tables
CREATE TRIGGER tasks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION log_project_changes();

CREATE TRIGGER sub_tasks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sub_tasks
FOR EACH ROW EXECUTE FUNCTION log_project_changes();