-- Gera eventos internos quando o professor altera exercícios ou disponibilidade.
create or replace function public.notify_exercise_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_workout uuid; target_student uuid; workout_title text;
begin
  target_workout := coalesce(new.workout_id, old.workout_id);
  select student_id, title into target_student, workout_title from public.workouts where id = target_workout;
  if target_student is not null then
    perform public.notify_user(target_student, 'Treino alterado', 'Seu professor modificou exercícios do treino ' || workout_title || '.', 'workout');
  end if;
  return coalesce(new, old);
end;
$$;
revoke execute on function public.notify_exercise_change() from public, anon, authenticated;
drop trigger if exists exercise_change_notification on public.workout_exercises;
create trigger exercise_change_notification after update or delete on public.workout_exercises for each row execute function public.notify_exercise_change();

create or replace function public.notify_availability_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare student record;
begin
  for student in select id from public.profiles where role = 'aluno' loop
    perform public.notify_user(student.id, 'Agenda atualizada', 'O professor atualizou os horários disponíveis.', 'availability');
  end loop;
  return null;
end;
$$;
revoke execute on function public.notify_availability_change() from public, anon, authenticated;
drop trigger if exists availability_change_notification on public.coach_availability;
create trigger availability_change_notification after insert or update or delete on public.coach_availability for each statement execute function public.notify_availability_change();
