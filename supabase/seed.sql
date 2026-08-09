-- Seed de demonstração (rode após criar usuários no Auth)
-- Substitua os UUIDs pelos IDs reais de auth.users após o signup.

-- Exemplo (comente/descomente e ajuste):
/*
insert into public.coach_students (coach_id, student_id)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
on conflict do nothing;

insert into public.workouts (id, coach_id, student_id, title, focus, duration_minutes, level, scheduled_for)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Peito & Tríceps',
  'Empurrar',
  45,
  'Intermediário',
  current_date
);

insert into public.workout_exercises (workout_id, name, muscle_group, sets, reps, target_weight_kg, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', 'Supino Reto', 'Peito', 4, 10, 40, 1),
  ('10000000-0000-0000-0000-000000000001', 'Crucifixo', 'Peito', 3, 12, 14, 2),
  ('10000000-0000-0000-0000-000000000001', 'Tríceps Corda', 'Tríceps', 3, 15, 25, 3),
  ('10000000-0000-0000-0000-000000000001', 'Tríceps Testa', 'Tríceps', 3, 12, 20, 4);
*/
