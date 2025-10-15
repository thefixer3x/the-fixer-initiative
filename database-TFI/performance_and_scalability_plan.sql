-- Performance and Scalability Plan

-- 1. Partitioning Strategy
-- For large datasets, especially in a multi-tenant environment, partitioning is key to maintaining performance.
-- The `tasks` and `sub_tasks` tables are expected to grow significantly.

-- Recommendation: Partition the `tasks` table by `project_id`. This will allow the database to efficiently
-- query tasks for a specific project without having to scan the entire table. This is particularly effective
-- in a SaaS environment where queries are often scoped to a single tenant or project.
-- The implementation of partitioning can be done using PostgreSQL's declarative partitioning.
-- Example (conceptual):
-- CREATE TABLE tasks ( ... ) PARTITION BY LIST (project_id);
-- CREATE TABLE tasks_project_1 PARTITION OF tasks FOR VALUES IN (1);
-- CREATE TABLE tasks_project_2 PARTITION OF tasks FOR VALUES IN (2);


-- 2. Indexing Strategy
-- A comprehensive indexing strategy is crucial for query performance. The following indexes are recommended
-- for the new project management tables to support common query patterns.

-- Indexes for `tasks` table
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status_id ON public.tasks(status_id);
CREATE INDEX idx_tasks_priority_id ON public.tasks(priority_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
-- Composite index for filtering tasks by project and status
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status_id);

-- Indexes for `sub_tasks` table
CREATE INDEX idx_sub_tasks_parent_task_id ON public.sub_tasks(parent_task_id);
CREATE INDEX idx_sub_tasks_assignee_id ON public.sub_tasks(assignee_id);
CREATE INDEX idx_sub_tasks_status_id ON public.sub_tasks(status_id);

-- Indexes for junction tables
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_project_teams_team_id ON public.project_teams(team_id);
CREATE INDEX idx_task_dependencies_depends_on ON public.task_dependencies(depends_on_task_id);


-- 3. Real-Time Analytics and Reporting
-- To support real-time analytics and dashboards without putting a heavy load on the primary database,
-- we can use materialized views to pre-aggregate data.

-- Recommendation: Create a materialized view to provide a summary of project health.
-- This view can be refreshed periodically (e.g., every 5 minutes) to provide near real-time data.

CREATE MATERIALIZED VIEW public.project_health_summary AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN ts.name = 'To Do' THEN 1 ELSE 0 END) AS tasks_to_do,
    SUM(CASE WHEN ts.name = 'In Progress' THEN 1 ELSE 0 END) AS tasks_in_progress,
    SUM(CASE WHEN ts.name = 'Done' THEN 1 ELSE 0 END) AS tasks_done,
    MAX(t.updated_at) AS last_task_update
FROM
    public.company_projects p
LEFT JOIN
    public.tasks t ON p.id = t.project_id
LEFT JOIN
    public.task_statuses ts ON t.status_id = ts.id
GROUP BY
    p.id;

-- To keep the data fresh, the materialized view should be refreshed periodically.
-- REFRESH MATERIALIZED VIEW public.project_health_summary;