-- ========================================================
-- PROJECTDNA SCHEMA MIGRATION V4: RESUME PROFILE DATA
-- Run this after supabase_schema.sql and earlier migrations.
-- ========================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS professional_title TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Profile images are publicly readable" ON storage.objects;
CREATE POLICY "Profile images are publicly readable"
  ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users can upload their profile image" ON storage.objects;
CREATE POLICY "Users can upload their profile image"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their profile image" ON storage.objects;
CREATE POLICY "Users can update their profile image"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their profile image" ON storage.objects;
CREATE POLICY "Users can delete their profile image"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE TABLE IF NOT EXISTS public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_year INTEGER,
  end_year INTEGER,
  grade TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_education_user_id
  ON public.education (user_id, start_year DESC);

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own education" ON public.education;
CREATE POLICY "Users can view their own education"
  ON public.education FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own education" ON public.education;
CREATE POLICY "Users can insert their own education"
  ON public.education FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own education" ON public.education;
CREATE POLICY "Users can update their own education"
  ON public.education FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own education" ON public.education;
CREATE POLICY "Users can delete their own education"
  ON public.education FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  job_title TEXT,
  employment_type TEXT,
  start_date TEXT,
  end_date TEXT,
  currently_working BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_experience_user_id
  ON public.experience (user_id, start_date DESC);

ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own experience" ON public.experience;
CREATE POLICY "Users can view their own experience"
  ON public.experience FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own experience" ON public.experience;
CREATE POLICY "Users can insert their own experience"
  ON public.experience FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own experience" ON public.experience;
CREATE POLICY "Users can update their own experience"
  ON public.experience FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own experience" ON public.experience;
CREATE POLICY "Users can delete their own experience"
  ON public.experience FOR DELETE USING (auth.uid() = user_id);