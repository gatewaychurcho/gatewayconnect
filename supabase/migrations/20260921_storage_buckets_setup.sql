-- ==============================================================================
-- GATEWAY CONNECT: STORAGE BUCKETS & RLS POLICIES FOR UNSTRUCTURED MEDIA
-- Media (videos, voice audio, documents, posts, sermon recordings, church links)
-- Avatars (profile pictures, church page logos, group icons)
--
-- RUN IN SUPABASE SQL EDITOR (Dashboard -> SQL Editor -> Run).
-- Note: In Supabase, 'storage.objects' already has Row Level Security (RLS) enabled
-- by default and is owned by 'supabase_storage_admin'. Running
-- 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY' causes SQLSTATE 42501
-- because only the table owner can alter it. It has been omitted here.
-- ==============================================================================

-- 1. Create or update storage buckets in Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('media', 'media', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true;

-- Update size limits & mime types if columns exist in this Supabase version
DO $$
BEGIN
  UPDATE storage.buckets 
  SET file_size_limit = 104857600 -- 100MB max for videos, audio, images, documents
  WHERE id = 'media';

  UPDATE storage.buckets 
  SET file_size_limit = 15728640, -- 15MB max for avatars
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  WHERE id = 'avatars';
EXCEPTION WHEN OTHERS THEN
  -- Gracefully ignore if optional limit columns are not present
  NULL;
END $$;

-- 2. Storage Policies on storage.objects
-- Note: RLS is ALREADY enabled on storage.objects by Supabase. Do NOT run ALTER TABLE.

-- Clean up any existing policies
DROP POLICY IF EXISTS "Public access to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public access to avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update on media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update on avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete on media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete on avatars bucket" ON storage.objects;

-- READ ACCESS: Public read for all uploaded church media and user avatars
CREATE POLICY "Public access to media bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Public access to avatars bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- INSERT ACCESS: Allow authenticated and anon members to upload media and avatars
CREATE POLICY "Allow upload to media bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Allow upload to avatars bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- UPDATE ACCESS: Allow updating existing files
CREATE POLICY "Allow update on media bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Allow update on avatars bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- DELETE ACCESS: Allow deleting media
CREATE POLICY "Allow delete on media bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'media');

CREATE POLICY "Allow delete on avatars bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- 3. Reconcile direct_messages table for media_type and media_url
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);
