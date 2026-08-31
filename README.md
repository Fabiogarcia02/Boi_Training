# Boi Training — Touro Fit

Aplicativo de treino para **professores** e **alunos**, com backend no **Supabase** (sem servidor próprio pago) e app mobile em **Expo (React Native)**.

## Stack

- `apps/mobile` — Expo + TypeScript + Expo Router
- `supabase/` — Postgres schema, RLS e seed
- Auth, banco e API via Supabase free tier

## Como rodar

### 1. Projeto Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor (ou CLI), aplique a migration:
   - [`supabase/migrations/20260809190317_initial_schema.sql`](supabase/migrations/20260809190317_initial_schema.sql)
   - [`supabase/migrations/20260831120000_student_anamnesis.sql`](supabase/migrations/20260831120000_student_anamnesis.sql) — anamnese obrigatória e relatório para o professor
   - [`supabase/migrations/20260831130000_backfill_profiles.sql`](supabase/migrations/20260831130000_backfill_profiles.sql) — corrige perfis de usuários já existentes
   - [`supabase/migrations/20260831140000_expand_anamnesis_flow.sql`](supabase/migrations/20260831140000_expand_anamnesis_flow.sql) — fluxo guiado, PAR-Q, rascunho e disponibilidade semanal
   - [`supabase/migrations/20260831150000_anamnesis_draft_defaults.sql`](supabase/migrations/20260831150000_anamnesis_draft_defaults.sql) — permite salvar rascunhos sem contato informado
3. Em **Authentication → Providers**, desative “Confirm email” enquanto testa
4. Copie **Project URL** e **anon/publishable key**

Com CLI (opcional):

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

### 2. App mobile

```bash
cd apps/mobile
cp .env.example .env
# edite .env com URL e anon key
npm start
```

Abra no Expo Go (Android/iOS) ou no emulador.

### 3. Fluxo de teste

1. Cadastre um usuário **Professor** e um **Aluno**
2. No app do professor, vincule o aluno pelo **e-mail**
3. Abra o aluno → **Criar treino**
4. Entre como aluno → dashboard → **Começar** → registrar séries

## Estrutura

```
BOI_TRAINING/
├── apps/mobile/          # App Expo
├── supabase/
│   ├── migrations/       # Schema + RLS
│   └── seed.sql
├── README.md
└── Touro Fit Vitrine (standalone).html  # protótipo visual
```

## Segurança

- RLS em todas as tabelas
- Role guardada em `profiles` (não use `user_metadata` para autorização)
- App usa só a chave `anon` — nunca a `service_role`
