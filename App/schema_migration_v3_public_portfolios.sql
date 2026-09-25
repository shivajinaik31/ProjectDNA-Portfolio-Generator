-- ========================================================
-- PROJECTDNA SCHEMA MIGRATION V3: PUBLIC PORTFOLIOS
-- Run this after supabase_schema.sql and schema_migration_v2.sql.
-- ========================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS portfolio_slug TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_portfolio_slug;
ALTER TABLE public.users ADD CONSTRAINT chk_portfolio_slug
  CHECK (portfolio_slug IS NULL OR portfolio_slug ~ '^[a-z0-9-]{3,40}$');

CREATE UNIQUE INDEX IF NOT EXISTS users_portfolio_slug_lower_unique
  ON public.users (LOWER(portfolio_slug))
  WHERE portfolio_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS projects_public_portfolio_order_idx
  ON public.projects (user_id, portfolio_order, created_at DESC)
  WHERE is_public = true;

-- Replace the prototype's broad public reads. Owners retain access to their
-- records; anonymous visitors only receive the explicitly shaped RPC result.
DROP POLICY IF EXISTS "Public user profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public analyses are viewable by everyone" ON public.project_analyses;
DROP POLICY IF EXISTS "Users can view analyses for their projects" ON public.project_analyses;
CREATE POLICY "Users can view analyses for their projects"
  ON public.project_analyses FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );

DROP POLICY IF EXISTS "Public project skills are viewable by everyone" ON public.project_skills;
DROP POLICY IF EXISTS "Users can view skills for their projects" ON public.project_skills;
CREATE POLICY "Users can view skills for their projects"
  ON public.project_skills FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );

DROP POLICY IF EXISTS "Public user skills are viewable by everyone" ON public.user_skills;
DROP POLICY IF EXISTS "Users can view their own user skills" ON public.user_skills;
CREATE POLICY "Users can view their own user skills"
  ON public.user_skills FOR SELECT USING (auth.uid() = user_id);

-- Public visitors use this narrowly scoped function instead of selecting from
-- users/projects directly. It deliberately excludes email, roles, raw AI data,
-- and every project that its owner has not explicitly published.
CREATE OR REPLACE FUNCTION public.get_public_portfolio(requested_slug TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'slug', u.portfolio_slug,
    'full_name', u.full_name,
    'avatar_url', u.avatar_url,
    'bio', u.bio,
    'github_url', u.github_url,
    'linkedin_url', u.linkedin_url,
    'updated_at', COALESCE(u.portfolio_updated_at, u.updated_at),
    'projects', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'github_url', p.github_url,
          'live_demo_url', p.live_demo_url,
          'thumbnail_url', p.thumbnail_url,
          'status', p.status,
          'technologies', COALESCE((
            SELECT jsonb_agg(s.name ORDER BY s.name)
            FROM public.project_skills ps
            JOIN public.skills s ON s.id = ps.skill_id
            WHERE ps.project_id = p.id
          ), '[]'::jsonb)
        )
        ORDER BY p.portfolio_order ASC, p.created_at DESC
      )
      FROM public.projects p
      WHERE p.user_id = u.id AND p.is_public = true
    ), '[]'::jsonb)
  )
  FROM public.users u
  WHERE u.portfolio_is_public = true
    AND LOWER(u.portfolio_slug) = LOWER(TRIM(requested_slug))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_portfolio(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_portfolio(TEXT) TO anon, authenticated;
