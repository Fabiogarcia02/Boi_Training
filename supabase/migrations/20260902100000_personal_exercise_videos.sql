alter table public.exercise_catalog
  add column if not exists instructions text,
  add column if not exists equipment text[] not null default '{}',
  add column if not exists video_source text not null default 'plataforma',
  add column if not exists audit_image_status text not null default 'pendente',
  add column if not exists audit_video_status text not null default 'pendente',
  add column if not exists audit_notes text;

create table if not exists public.coach_exercise_videos (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog(id) on delete cascade,
  video_url text not null,
  source text not null default 'url' check (source in ('upload', 'url')),
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, exercise_id)
);

create index if not exists coach_exercise_videos_coach_idx on public.coach_exercise_videos(coach_id);
create index if not exists coach_exercise_videos_exercise_idx on public.coach_exercise_videos(exercise_id);

alter table public.coach_exercise_videos enable row level security;
drop policy if exists "coach_exercise_videos_select" on public.coach_exercise_videos;
create policy "coach_exercise_videos_select" on public.coach_exercise_videos for select to authenticated
  using (coach_id = auth.uid() or (private.current_role() = 'aluno' and exists (
    select 1 from public.workouts w where w.coach_id = coach_exercise_videos.coach_id and w.student_id = auth.uid()
  )));
drop policy if exists "coach_exercise_videos_insert" on public.coach_exercise_videos;
create policy "coach_exercise_videos_insert" on public.coach_exercise_videos for insert to authenticated
  with check (coach_id = auth.uid() and private.current_role() = 'professor');
drop policy if exists "coach_exercise_videos_update" on public.coach_exercise_videos;
create policy "coach_exercise_videos_update" on public.coach_exercise_videos for update to authenticated
  using (coach_id = auth.uid() and private.current_role() = 'professor')
  with check (coach_id = auth.uid() and private.current_role() = 'professor');
drop policy if exists "coach_exercise_videos_delete" on public.coach_exercise_videos;
create policy "coach_exercise_videos_delete" on public.coach_exercise_videos for delete to authenticated
  using (coach_id = auth.uid() and private.current_role() = 'professor');

grant select, insert, update, delete on public.coach_exercise_videos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-videos', 'exercise-videos', false, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = false, file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "exercise_videos_read" on storage.objects;
create policy "exercise_videos_read" on storage.objects for select to authenticated
  using (bucket_id = 'exercise-videos' and ((storage.foldername(name))[1] = auth.uid()::text or (private.current_role() = 'aluno' and exists (
    select 1 from public.workouts w where w.coach_id::text = (storage.foldername(name))[1] and w.student_id = auth.uid()
  ))));
drop policy if exists "exercise_videos_insert" on storage.objects;
create policy "exercise_videos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'exercise-videos' and (storage.foldername(name))[1] = auth.uid()::text and private.current_role() = 'professor');
drop policy if exists "exercise_videos_update" on storage.objects;
create policy "exercise_videos_update" on storage.objects for update to authenticated
  using (bucket_id = 'exercise-videos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "exercise_videos_delete" on storage.objects;
create policy "exercise_videos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'exercise-videos' and (storage.foldername(name))[1] = auth.uid()::text);
