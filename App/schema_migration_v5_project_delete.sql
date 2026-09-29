-- ========================================================
-- PROJECTDNA SCHEMA MIGRATION V5: PROJECT DELETION RLS
-- Run this in Supabase after the previous migrations.
-- ========================================================

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete skills for their projects" ON public.project_skills;
CREATE POLICY "Users can delete skills for their projects"
  ON public.project_skills FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT p.user_id
      FROM public.projects AS p
      WHERE p.id = project_skills.project_id
    )
  );

DROP POLICY IF EXISTS "Users can delete analyses for their projects" ON public.project_analyses;
CREATE POLICY "Users can delete analyses for their projects"
  ON public.project_analyses FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT p.user_id
      FROM public.projects AS p
      WHERE p.id = project_analyses.project_id
    )
  );