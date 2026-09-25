-- ========================================================
-- PROJECTDNA CUSTOM USERS TABLE & AUTOMATIC TRIGGERS (SAFE & RE-RUNNABLE)
-- Copy and paste this directly into Supabase SQL Editor
-- ========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Nullable for OAuth (Google/GitHub) users
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'student' NOT NULL,
  github_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. RLS Security Policies (Safely drop existing policies first to prevent 42710 error)
DROP POLICY IF EXISTS "Public user profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public user profiles are viewable by everyone" 
  ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
CREATE POLICY "Users can insert their own record" 
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
CREATE POLICY "Users can update their own record" 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4. TRIGGER #1: Automatically update `updated_at` timestamp on modifications
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. TRIGGER #2: Automatically insert new Auth users (Email, Google, GitHub) into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'student'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- TABLES REQUIRED FOR PROJECTDNA APP
-- ========================================================

-- 6. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  github_url TEXT,
  live_demo_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  ai_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and add Policies for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public projects are viewable by everyone" 
  ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" 
  ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" 
  ON public.projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" 
  ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Trigger for Projects updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 7. Create Project Analyses Table
CREATE TABLE IF NOT EXISTS public.project_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ai_summary TEXT,
  ai_technologies TEXT[],
  ai_skills TEXT[],
  raw_api_response JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public analyses are viewable by everyone" ON public.project_analyses;
CREATE POLICY "Public analyses are viewable by everyone" 
  ON public.project_analyses FOR SELECT USING (true);
  
DROP POLICY IF EXISTS "Users can insert analyses for their projects" ON public.project_analyses;
CREATE POLICY "Users can insert analyses for their projects" 
  ON public.project_analyses FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );


-- 8. Create Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50)
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
CREATE POLICY "Skills are viewable by everyone" 
  ON public.skills FOR SELECT USING (true);


-- 9. Create Project Skills (Junction Table)
CREATE TABLE IF NOT EXISTS public.project_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  confidence_score DECIMAL(5,2),
  UNIQUE(project_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_project_skills_lookup ON public.project_skills (project_id, skill_id);

ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public project skills are viewable by everyone" ON public.project_skills;
CREATE POLICY "Public project skills are viewable by everyone" 
  ON public.project_skills FOR SELECT USING (true);
  
DROP POLICY IF EXISTS "Users can insert skills for their projects" ON public.project_skills;
CREATE POLICY "Users can insert skills for their projects" 
  ON public.project_skills FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );
  

-- 10. Create User Skills (Derived / Caching Table)
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  proficiency_score INT DEFAULT 0,
  project_count INT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_lookup ON public.user_skills (user_id, skill_id);

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public user skills are viewable by everyone" ON public.user_skills;
CREATE POLICY "Public user skills are viewable by everyone" 
  ON public.user_skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can modify their own user skills" ON public.user_skills;
CREATE POLICY "Users can modify their own user skills" 
  ON public.user_skills FOR ALL USING (auth.uid() = user_id);


-- 11. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);


-- ========================================================
-- AUTOMATIC STATS SYNCING (Controlled Denormalization)
-- ========================================================

-- Trigger Function to update user_skills (project_count & proficiency_score)
CREATE OR REPLACE FUNCTION public.sync_user_skill_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  target_skill_id UUID;
  c_count INT;
  avg_conf DECIMAL(5,2);
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_skill_id := OLD.skill_id;
    SELECT user_id INTO target_user_id FROM public.projects WHERE id = OLD.project_id;
  ELSE
    target_skill_id := NEW.skill_id;
    SELECT user_id INTO target_user_id FROM public.projects WHERE id = NEW.project_id;
  END IF;

  IF target_user_id IS NOT NULL THEN
    -- Calculate project count for this user and skill
    SELECT COUNT(ps.id), COALESCE(AVG(ps.confidence_score), 0)
    INTO c_count, avg_conf
    FROM public.project_skills ps
    JOIN public.projects p ON p.id = ps.project_id
    WHERE p.user_id = target_user_id AND ps.skill_id = target_skill_id;

    IF c_count > 0 THEN
      -- Upsert into user_skills
      INSERT INTO public.user_skills (user_id, skill_id, project_count, proficiency_score, last_updated)
      VALUES (
        target_user_id, 
        target_skill_id, 
        c_count, 
        COALESCE(LEAST(100, (c_count * 25 + avg_conf * 0.5)::int), 0), 
        NOW()
      )
      ON CONFLICT (user_id, skill_id) 
      DO UPDATE SET 
        project_count = EXCLUDED.project_count,
        proficiency_score = EXCLUDED.proficiency_score,
        last_updated = NOW();
    ELSE
      -- Remove if no projects use this skill anymore
      DELETE FROM public.user_skills WHERE user_id = target_user_id AND skill_id = target_skill_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_user_skill_stats ON public.project_skills;
CREATE TRIGGER trg_sync_user_skill_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.project_skills
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_skill_stats();


-- View for Dashboard Overview Stats
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT 
  u.id AS user_id,
  COUNT(DISTINCT p.id) AS total_projects,
  COUNT(DISTINCT us.skill_id) AS total_skills,
  COALESCE(ROUND(AVG(p.ai_score)), 0) AS avg_ai_score
FROM public.users u
LEFT JOIN public.projects p ON p.user_id = u.id
LEFT JOIN public.user_skills us ON us.user_id = u.id
GROUP BY u.id;

-- ========================================================
-- MIGRATION V2 (Added to enforce RLS and Constraints)
-- ========================================================

-- Allow authenticated users to insert new skills
DROP POLICY IF EXISTS "Users can insert skills" ON public.skills;
CREATE POLICY "Users can insert skills" 
  ON public.skills FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure project_skills can be deleted by project owners
DROP POLICY IF EXISTS "Users can delete skills for their projects" ON public.project_skills;
CREATE POLICY "Users can delete skills for their projects" 
  ON public.project_skills FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
  );

-- Ensure project_analyses can be updated/deleted by project owners
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

-- Enforce status values with CHECK constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS chk_project_status;
ALTER TABLE public.projects
  ADD CONSTRAINT chk_project_status
  CHECK (status IN ('active', 'completed', 'archived'));
