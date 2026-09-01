create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique, platform text not null, created_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
drop policy if exists "push_tokens_own" on public.push_tokens;
create policy "push_tokens_own" on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_tokens to authenticated;
