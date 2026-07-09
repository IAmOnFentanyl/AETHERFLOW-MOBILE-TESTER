/*
# Aetherflow Schema

1. New Tables

## profiles
- id (uuid, FK to auth.users)
- username (text)
- avatar_url (text)
- bio (text)
- plan (text: 'free' | 'pro' | 'studio')
- created_at

## projects
- id (uuid, PK)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- name (text)
- bpm (integer, default 120)
- key_signature (text, default 'C')
- time_signature (text, default '4/4')
- color (text)
- cover_url (text)
- is_favorite (boolean)
- created_at, updated_at

## tracks
- id (uuid, PK)
- project_id (uuid, FK projects)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- name (text)
- type (text: 'audio' | 'vocal' | 'midi')
- color (text)
- volume (numeric, default 0.8)
- pan (numeric, default 0)
- is_muted (boolean)
- is_solo (boolean)
- position (integer)
- created_at

## vocal_takes
- id (uuid, PK)
- track_id (uuid, FK tracks)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- name (text)
- duration (numeric)
- file_url (text)
- created_at

2. Security
- RLS enabled on all tables
- Owner-scoped CRUD policies on all tables
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  avatar_url text,
  bio text,
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bpm integer NOT NULL DEFAULT 120,
  key_signature text NOT NULL DEFAULT 'C Major',
  time_signature text NOT NULL DEFAULT '4/4',
  color text NOT NULL DEFAULT '#00F2FE',
  cover_url text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tracks
CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'audio',
  color text NOT NULL DEFAULT '#00F2FE',
  volume numeric NOT NULL DEFAULT 0.8,
  pan numeric NOT NULL DEFAULT 0,
  is_muted boolean NOT NULL DEFAULT false,
  is_solo boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tracks" ON tracks;
CREATE POLICY "select_own_tracks" ON tracks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tracks.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_tracks" ON tracks;
CREATE POLICY "insert_own_tracks" ON tracks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = tracks.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_tracks" ON tracks;
CREATE POLICY "update_own_tracks" ON tracks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tracks.project_id AND projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = tracks.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_tracks" ON tracks;
CREATE POLICY "delete_own_tracks" ON tracks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tracks.project_id AND projects.user_id = auth.uid()));

-- vocal_takes
CREATE TABLE IF NOT EXISTS vocal_takes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id) ON DELETE SET NULL,
  name text NOT NULL,
  duration numeric NOT NULL DEFAULT 0,
  file_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vocal_takes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_takes" ON vocal_takes;
CREATE POLICY "select_own_takes" ON vocal_takes FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_takes" ON vocal_takes;
CREATE POLICY "insert_own_takes" ON vocal_takes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_takes" ON vocal_takes;
CREATE POLICY "update_own_takes" ON vocal_takes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_takes" ON vocal_takes;
CREATE POLICY "delete_own_takes" ON vocal_takes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
