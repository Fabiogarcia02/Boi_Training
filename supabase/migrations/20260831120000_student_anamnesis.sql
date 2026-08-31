-- Anamnese obrigatória do aluno, visível ao professor vinculado.
create table public.student_anamneses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles (id) on delete cascade,
  birth_date date,
  height_cm numeric(5,2),
  weight_kg numeric(6,2),
  goal text not null,
  experience_level text not null,
  health_conditions text not null,
  injuries text not null,
  medications text not null,
  exercise_restrictions text not null,
  emergency_contact text not null,
  medical_clearance boolean not null default false,
  consent boolean not null default false check (consent = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_anamneses_student_idx on public.student_anamneses (student_id);

create trigger student_anamneses_updated_at
  before update on public.student_anamneses
  for each row execute function public.set_updated_at();

alter table public.student_anamneses enable row level security;

create policy "anamneses_select_student_or_coach"
  on public.student_anamneses for select to authenticated
  using (student_id = auth.uid() or private.is_coach_of(student_id));

create policy "anamneses_insert_own_student"
  on public.student_anamneses for insert to authenticated
  with check (student_id = auth.uid() and private.current_role() = 'aluno');

create policy "anamneses_update_own_student"
  on public.student_anamneses for update to authenticated
  using (student_id = auth.uid() and private.current_role() = 'aluno')
  with check (student_id = auth.uid() and private.current_role() = 'aluno');

grant select, insert, update on public.student_anamneses to authenticated;
