-- Create avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Auth Insert" on storage.objects for insert to authenticated with check ( bucket_id = 'avatars' );
create policy "Auth Update" on storage.objects for update to authenticated using ( bucket_id = 'avatars' );
create policy "Auth Delete" on storage.objects for delete to authenticated using ( bucket_id = 'avatars' );
