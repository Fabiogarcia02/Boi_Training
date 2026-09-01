# Boi Training — Touro Fit

Aplicativo mobile de acompanhamento físico para um professor e todos os alunos da plataforma, com Expo, React Native e Supabase.

## Recursos

- cadastro e login de professor ou aluno;
- anamnese obrigatória antes de liberar os recursos do aluno;
- histórico completo das versões anteriores da anamnese;
- professor com acesso automático a todos os alunos;
- perfis com foto privada, nome, telefone e apresentação;
- criação de treinos usando catálogo com imagens e vídeos;
- agenda semanal do professor e solicitação de horários pelo aluno;
- central de notificações e fila segura de e-mails;
- registro de tokens para notificações push.

## Como executar

```powershell
cd apps/mobile
npm install
npx expo start -c
```

As variáveis abaixo devem existir em `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

As migrations estão em `supabase/migrations` e devem ser executadas pela ordem do nome do arquivo. Elas já foram aplicadas no projeto Supabase usado durante o desenvolvimento.

## Fluxo atual

1. O aluno cria a conta e preenche a anamnese.
2. O professor visualiza automaticamente o aluno no painel.
3. O professor consulta a ficha atual, o histórico e cria treinos.
4. O aluno acompanha treinos, exercícios, vídeos e agenda horários.
5. Alterações de treinos, exercícios e agenda geram notificações internas.

## Notificações externas

O banco mantém tokens push e uma fila de e-mails. O envio remoto exige configuração externa:

- push: credenciais FCM/APNs e build de desenvolvimento ou produção do Expo;
- e-mail: chave de um provedor como Resend, SendGrid ou SMTP.

Esses segredos nunca devem ser colocados no aplicativo ou em variáveis `EXPO_PUBLIC_*`.

## Segurança

- RLS habilitado nas tabelas;
- fotos em bucket privado com links temporários;
- alunos enxergam somente o próprio perfil e o professor;
- o professor enxerga todos os alunos e suas anamneses;
- o aplicativo utiliza apenas a chave anônima do Supabase.
