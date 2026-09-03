alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists cref text,
  add column if not exists specialties text,
  add column if not exists city text,
  add column if not exists instagram text;
