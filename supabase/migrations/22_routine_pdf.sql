-- =============================================
-- Migration: Add PDF support to routines
-- =============================================

-- 1. Add pdf_url column to workouts table (nullable, no impact on existing data)
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS pdf_url text;

-- 2. Create storage bucket for routine PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('routine-pdfs', 'routine-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for the 'routine-pdfs' bucket

-- Allow public read access (students can view/download)
CREATE POLICY "Public read access to routine PDFs"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'routine-pdfs' );

-- Allow admins to upload PDFs
CREATE POLICY "Admins can upload routine PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'routine-pdfs' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to update PDFs
CREATE POLICY "Admins can update routine PDFs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'routine-pdfs' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to delete PDFs
CREATE POLICY "Admins can delete routine PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'routine-pdfs' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
