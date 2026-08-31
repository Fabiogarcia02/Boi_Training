-- Amplia a anamnese para suportar o fluxo guiado e rascunhos progressivos.
alter table public.student_anamneses
  drop constraint if exists student_anamneses_consent_check;

alter table public.student_anamneses
  add column if not exists assessment_date date default current_date,
  add column if not exists resting_heart_rate integer,
  add column if not exists blood_pressure_systolic integer,
  add column if not exists blood_pressure_diastolic integer,
  add column if not exists supplements text,
  add column if not exists alcohol_use text,
  add column if not exists tobacco_use boolean,
  add column if not exists weekend_habits text,
  add column if not exists available_training_days text[] not null default '{}',
  add column if not exists parq_answers jsonb not null default '{}'::jsonb,
  add column if not exists observations text,
  add column if not exists is_complete boolean not null default false,
  add column if not exists completed_at timestamptz;

create index if not exists student_anamneses_complete_idx
  on public.student_anamneses (student_id, is_complete);
