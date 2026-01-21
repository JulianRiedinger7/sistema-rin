-- Policies for 'exercises' storage bucket

-- Allow public read access to the bucket objects
create policy "Public Access to exercises"
  on storage.objects for select
  using ( bucket_id = 'exercises' );

-- Allow Admins to upload/insert objects
create policy "Admins can upload to exercises"
  on storage.objects for insert
  with check (
    bucket_id = 'exercises' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Allow Admins to update objects
create policy "Admins can update exercises objects"
  on storage.objects for update
  using (
    bucket_id = 'exercises' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Allow Admins to delete objects
create policy "Admins can delete exercises objects"
  on storage.objects for delete
  using (
    bucket_id = 'exercises' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
