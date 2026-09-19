-- Candidate photos, uploaded from Manajemen Voting instead of pasted URLs.
--
-- Public bucket: the pengurus voting page shows the photos by their public
-- URL. Only super admins can add, replace or remove files. The dashboard
-- resizes photos to a ~480px-wide WebP before uploading.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-photos',
  'candidate-photos',
  true,
  1048576,  -- 1 MB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "Super admins upload candidate photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'candidate-photos' and (select public.is_super_admin()));

create policy "Super admins replace candidate photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'candidate-photos' and (select public.is_super_admin()));

create policy "Super admins remove candidate photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'candidate-photos' and (select public.is_super_admin()));
