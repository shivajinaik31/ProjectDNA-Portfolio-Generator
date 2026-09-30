-- ========================================================
-- PROJECTDNA SCHEMA MIGRATION V2
-- Fixes Skills RLS and adds Status Constraints
-- ========================================================

-- 1. Allow authenticated users to insert new skills
DROP POLICY IF EXISTS "Users can insert skills" ON public.skills;
CREATE POLICY "Users can insert skills" 
  ON public.skills FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Ensure project_skills can be deleted by project owners
DROP POLICY IF EXISTS "Users can delete skills for their projects" ON public.project_skills;
CREATE POLICY "Users can delete skills for their projects" 
  ON public.project_skills FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );

-- 3. Ensure project_analyses can be updated/deleted by project owners
DROP POLICY IF EXISTS "Users can update analyses for their projects" ON public.project_analyses;
CREATE POLICY "Users can update analyses for their projects" 
  ON public.project_analyses FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );

DROP POLICY IF EXISTS "Users can delete analyses for their projects" ON public.project_analyses;
CREATE POLICY "Users can delete analyses for their projects" 
  ON public.project_analyses FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );

-- 4. Enforce status values with CHECK constraint
-- (Drops first to ensure it's re-runnable)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS chk_project_status;
ALTER TABLE public.projects
  ADD CONSTRAINT chk_project_status
  CHECK (status IN ('active', 'completed', 'archived'));
