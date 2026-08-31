-- Cria perfis para usuários que foram cadastrados antes do trigger inicial.
-- Execute depois da migration inicial, que cria public.profiles e o trigger.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Usuário'),
  case
    when lower(coalesce(u.raw_user_meta_data->>'role', 'aluno')) = 'professor'
      then 'professor'::public.user_role
    else 'aluno'::public.user_role
  end
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
