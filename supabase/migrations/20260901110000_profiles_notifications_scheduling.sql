-- Perfis, notificações, disponibilidade e agendamentos
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  push_token text,
  updated_at timestamptz not null default now()
);
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique, platform text not null, created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text not null, kind text not null default 'general', read_at timestamptz, created_at timestamptz not null default now()
);
alter table public.notifications add column if not exists email text;
alter table public.notifications add column if not exists email_status text not null default 'not_requested' check (email_status in ('pending','sent','failed','not_requested'));
create table if not exists public.coach_availability (
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), start_time time not null, end_time time not null,
  valid_from date not null default current_date, valid_until date, active boolean not null default true, created_at timestamptz not null default now(), check (end_time > start_time)
);
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, availability_id uuid references public.coach_availability(id) on delete set null,
  starts_at timestamptz not null, ends_at timestamptz not null, status text not null default 'requested' check (status in ('requested','confirmed','cancelled','completed')),
  notes text not null default '', created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (ends_at > starts_at)
);
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists bio text not null default '';
alter table public.appointments enable row level security;
alter table public.coach_availability enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_tokens enable row level security;
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists availability_coach_idx on public.coach_availability(coach_id, day_of_week);
create index if not exists appointments_participants_idx on public.appointments(coach_id, student_id, starts_at);
drop policy if exists "notifications_select_own" on public.notifications; create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_update_own" on public.notifications; create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "preferences_own" on public.notification_preferences; create policy "preferences_own" on public.notification_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "push_tokens_own" on public.push_tokens; create policy "push_tokens_own" on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "availability_select_linked" on public.coach_availability; create policy "availability_select_linked" on public.coach_availability for select to authenticated using (coach_id = auth.uid() or exists (select 1 from public.coach_students cs where cs.coach_id = coach_availability.coach_id and cs.student_id = auth.uid()));
drop policy if exists "availability_manage_coach" on public.coach_availability; create policy "availability_manage_coach" on public.coach_availability for all to authenticated using (coach_id = auth.uid() and private.current_role() = 'professor') with check (coach_id = auth.uid() and private.current_role() = 'professor');
drop policy if exists "appointments_select_participant" on public.appointments; create policy "appointments_select_participant" on public.appointments for select to authenticated using (coach_id = auth.uid() or student_id = auth.uid());
drop policy if exists "appointments_insert_participant" on public.appointments; create policy "appointments_insert_participant" on public.appointments for insert to authenticated with check ((student_id = auth.uid() or coach_id = auth.uid()) and exists (select 1 from public.coach_students cs where cs.coach_id = appointments.coach_id and cs.student_id = appointments.student_id));
drop policy if exists "appointments_update_participant" on public.appointments; create policy "appointments_update_participant" on public.appointments for update to authenticated using (coach_id = auth.uid() or student_id = auth.uid()) with check (coach_id = auth.uid() or student_id = auth.uid());
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.push_tokens to authenticated;
grant select, insert, update, delete on public.coach_availability to authenticated;
grant select, insert, update on public.appointments to authenticated;
create or replace function public.notify_user(target uuid, notification_title text, notification_body text, notification_kind text default 'general') returns void language plpgsql security definer set search_path = public, auth as $$ declare target_email text; begin select email into target_email from auth.users where id = target; insert into public.notifications(user_id,title,body,kind,email,email_status) values(target,notification_title,notification_body,notification_kind,target_email,case when target_email is null then 'not_requested' else 'pending' end); end; $$;
create or replace function public.notify_workout_change() returns trigger language plpgsql security definer set search_path = public as $$ begin perform public.notify_user(new.student_id,'Novo treino disponível','Seu professor atualizou o treino ' || new.title || '.','workout'); return new; end; $$;
drop trigger if exists workout_student_notification on public.workouts;
create trigger workout_student_notification after insert or update on public.workouts for each row execute function public.notify_workout_change();
create or replace function public.notify_appointment_change() returns trigger language plpgsql security definer set search_path = public as $$ declare other_user uuid; begin other_user := case when auth.uid() = new.coach_id then new.student_id else new.coach_id end; perform public.notify_user(other_user,'Agendamento atualizado','Seu agendamento foi ' || new.status || '.','appointment'); return new; end; $$;
drop trigger if exists appointment_notification on public.appointments;
create trigger appointment_notification after insert or update on public.appointments for each row execute function public.notify_appointment_change();
