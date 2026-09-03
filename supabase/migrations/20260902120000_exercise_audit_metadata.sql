alter table public.exercise_catalog
  add column if not exists category text,
  add column if not exists primary_muscles text[] not null default '{}',
  add column if not exists secondary_muscles text[] not null default '{}';

update public.exercise_catalog
set
  category = coalesce(category, 'Musculação'),
  primary_muscles = case when cardinality(primary_muscles) = 0 then array[muscle_group] else primary_muscles end;

update public.exercise_catalog
set
  audit_video_status = 'incorreto',
  audit_notes = concat_ws(' ', nullif(audit_notes, ''), 'A URL cadastrada abre uma busca do YouTube, não um vídeo específico. Substituir por uma URL direta e validar título e execução.')
where video_url like '%youtube.com/results%';

update public.exercise_catalog
set
  audit_image_status = 'pendente',
  audit_notes = concat_ws(' ', nullif(audit_notes, ''), 'Imagem genérica do Unsplash: requer validação visual antes de aprovação.')
where image_url like '%images.unsplash.com%';
