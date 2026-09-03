alter table public.workout_sessions
  add column if not exists perceived_exertion smallint
    check (perceived_exertion between 1 and 10),
  add column if not exists total_volume_kg numeric(12,2) not null default 0;

create or replace function public.calculate_session_volume(target_session uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(reps * weight_kg), 0)
  from public.set_logs
  where session_id = target_session
    and exists (
      select 1 from public.workout_sessions s
      where s.id = target_session
        and (s.student_id = auth.uid() or exists (
          select 1 from public.workouts w where w.id = s.workout_id and w.coach_id = auth.uid()
        ))
    );
$$;

grant execute on function public.calculate_session_volume(uuid) to authenticated;
