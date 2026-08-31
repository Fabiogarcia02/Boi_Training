-- Permite salvar o rascunho antes de o aluno chegar à etapa de segurança.
alter table public.student_anamneses
  alter column emergency_contact set default 'Não informado';
