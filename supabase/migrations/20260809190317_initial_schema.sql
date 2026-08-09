-- Touro Fit / Boi Training — schema inicial + RLS

create extension if not exists "pgcrypto";

create type public.user_role as enum ('aluno', 'professor');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'aluno',
  avatar_url text,
  streak_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_students (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coach_id, student_id),
  check (coach_id <> student_id)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  focus text,
  duration_minutes integer not null default 45,
  level text not null default 'Intermediário',
  scheduled_for date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  name text not null,
  muscle_group text,
  sets integer not null default 3,
  reps integer not null default 10,
  target_weight_kg numeric(6,2),
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number integer not null,
  reps integer not null,
  weight_kg numeric(6,2) not null default 0,
  completed_at timestamptz not null default now(),
  unique (session_id, exercise_id, set_number)
);

create index workouts_student_idx on public.workouts (student_id, scheduled_for);
create index workouts_coach_idx on public.workouts (coach_id);
create index coach_students_coach_idx on public.coach_students (coach_id);
create index coach_students_student_idx on public.coach_students (student_id);
create index sessions_student_idx on public.workout_sessions (student_id, started_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger workouts_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

-- Impede auto-promoção de role via update do próprio perfil
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception 'role cannot be changed by the user';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Cria perfil no signup (role vem de raw_user_meta_data só na criação)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.user_role;
begin
  chosen_role := case
    when lower(coalesce(new.raw_user_meta_data->>'role', 'aluno')) = 'professor' then 'professor'::public.user_role
    else 'aluno'::public.user_role
  end;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Usuário'),
    chosen_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers RLS (security definer, schema privado)
create schema if not exists private;

create or replace function private.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function private.is_coach_of(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_students cs
    where cs.coach_id = auth.uid()
      and cs.student_id = target_student
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_coach_of(uuid) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.coach_students enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;

-- profiles
create policy "profiles_select_own_or_linked"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or private.is_coach_of(id)
    or exists (
      select 1 from public.coach_students cs
      where cs.student_id = auth.uid() and cs.coach_id = profiles.id
    )
    or (private.current_role() = 'professor' and role = 'aluno')
  );

-- Professor vincula aluno pelo e-mail (security definer; e-mail não fica exposto na API)
create or replace function public.link_student_by_email(student_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
begin
  if private.current_role() <> 'professor' then
    raise exception 'only professors can link students';
  end if;

  select u.id into target_id
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(student_email)
    and p.role = 'aluno'
  limit 1;

  if target_id is null then
    raise exception 'student not found for email %', student_email;
  end if;

  insert into public.coach_students (coach_id, student_id)
  values (auth.uid(), target_id)
  on conflict (coach_id, student_id) do nothing;

  return target_id;
end;
$$;

grant execute on function public.link_student_by_email(text) to authenticated;

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- coach_students
create policy "coach_students_select"
  on public.coach_students for select to authenticated
  using (coach_id = auth.uid() or student_id = auth.uid());

create policy "coach_students_insert_coach"
  on public.coach_students for insert to authenticated
  with check (
    coach_id = auth.uid()
    and private.current_role() = 'professor'
  );

create policy "coach_students_delete_coach"
  on public.coach_students for delete to authenticated
  using (coach_id = auth.uid() and private.current_role() = 'professor');

-- workouts
create policy "workouts_select"
  on public.workouts for select to authenticated
  using (
    student_id = auth.uid()
    or coach_id = auth.uid()
  );

create policy "workouts_insert_coach"
  on public.workouts for insert to authenticated
  with check (
    coach_id = auth.uid()
    and private.current_role() = 'professor'
    and private.is_coach_of(student_id)
  );

create policy "workouts_update_coach"
  on public.workouts for update to authenticated
  using (coach_id = auth.uid() and private.current_role() = 'professor')
  with check (coach_id = auth.uid() and private.current_role() = 'professor');

create policy "workouts_delete_coach"
  on public.workouts for delete to authenticated
  using (coach_id = auth.uid() and private.current_role() = 'professor');

-- workout_exercises
create policy "exercises_select"
  on public.workout_exercises for select to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and (w.student_id = auth.uid() or w.coach_id = auth.uid())
    )
  );

create policy "exercises_insert_coach"
  on public.workout_exercises for insert to authenticated
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and w.coach_id = auth.uid()
        and private.current_role() = 'professor'
    )
  );

create policy "exercises_update_coach"
  on public.workout_exercises for update to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.coach_id = auth.uid()
    )
  );

create policy "exercises_delete_coach"
  on public.workout_exercises for delete to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.coach_id = auth.uid()
    )
  );

-- workout_sessions
create policy "sessions_select"
  on public.workout_sessions for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.coach_id = auth.uid()
    )
  );

create policy "sessions_insert_student"
  on public.workout_sessions for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.student_id = auth.uid()
    )
  );

create policy "sessions_update_student"
  on public.workout_sessions for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- set_logs
create policy "set_logs_select"
  on public.set_logs for select to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id
        and (
          s.student_id = auth.uid()
          or exists (
            select 1 from public.workouts w
            where w.id = s.workout_id and w.coach_id = auth.uid()
          )
        )
    )
  );

create policy "set_logs_insert_student"
  on public.set_logs for insert to authenticated
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.student_id = auth.uid()
    )
  );

create policy "set_logs_update_student"
  on public.set_logs for update to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.student_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.student_id = auth.uid()
    )
  );

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.coach_students to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.workout_exercises to authenticated;
grant select, insert, update on public.workout_sessions to authenticated;
grant select, insert, update on public.set_logs to authenticated;
