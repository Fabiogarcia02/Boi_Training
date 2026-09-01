create table if not exists public.notification_email_queue (
  id uuid primary key default gen_random_uuid(), notification_id uuid references public.notifications(id) on delete cascade,
  recipient_email text not null, subject text not null, body text not null, status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts integer not null default 0, created_at timestamptz not null default now(), sent_at timestamptz
);
alter table public.notification_email_queue enable row level security;
revoke all on public.notification_email_queue from anon, authenticated;
create or replace function public.notify_user(target uuid, notification_title text, notification_body text, notification_kind text default 'general') returns void language plpgsql security definer set search_path = public, auth as $$
declare notification_id uuid; recipient text; email_on boolean;
begin
  insert into public.notifications(user_id,title,body,kind) values(target,notification_title,notification_body,notification_kind) returning id into notification_id;
  select u.email, coalesce(np.email_enabled, true) into recipient, email_on from auth.users u left join public.notification_preferences np on np.user_id = target where u.id = target;
  if email_on and recipient is not null then insert into public.notification_email_queue(notification_id,recipient_email,subject,body) values(notification_id,recipient,notification_title,notification_body); end if;
end; $$;
revoke execute on function public.notify_user(uuid, text, text, text) from public, anon, authenticated;
