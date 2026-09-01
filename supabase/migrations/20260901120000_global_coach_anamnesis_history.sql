-- Modelo atual: todos os alunos pertencem ao professor da plataforma.
create table if not exists public.student_anamnesis_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  anamnesis_id uuid references public.student_anamneses(id) on delete set null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists anamnesis_history_student_idx on public.student_anamnesis_history(student_id, created_at desc);
alter table public.student_anamnesis_history enable row level security;
create policy "anamnesis_history_select_student_or_professor" on public.student_anamnesis_history for select to authenticated using (
  student_id = auth.uid() or private.current_role() = 'professor'
);
grant select on public.student_anamnesis_history to authenticated;

create or replace function public.snapshot_anamnesis_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and to_jsonb(old) is distinct from to_jsonb(new) then
    insert into public.student_anamnesis_history(student_id, anamnesis_id, snapshot, changed_by)
    values (old.student_id, old.id, to_jsonb(old), auth.uid());
  end if;
  return new;
end;
$$;
drop trigger if exists student_anamnesis_history_trigger on public.student_anamneses;
create trigger student_anamnesis_history_trigger before update on public.student_anamneses for each row execute function public.snapshot_anamnesis_change();

-- Libera acesso e criação de treinos para o professor global.
drop policy if exists "workouts_insert_coach" on public.workouts;
create policy "workouts_insert_platform_coach" on public.workouts for insert to authenticated with check (
  coach_id = auth.uid() and private.current_role() = 'professor' and exists (select 1 from public.profiles p where p.id = student_id and p.role = 'aluno')
);
drop policy if exists "availability_select_linked" on public.coach_availability;
create policy "availability_select_global_coach" on public.coach_availability for select to authenticated using (
  coach_id = auth.uid() or private.current_role() = 'aluno'
);
drop policy if exists "appointments_insert_participant" on public.appointments;
create policy "appointments_insert_platform_participant" on public.appointments for insert to authenticated with check (
  (student_id = auth.uid() or coach_id = auth.uid()) and exists (select 1 from public.profiles p where p.id = student_id and p.role = 'aluno')
);
