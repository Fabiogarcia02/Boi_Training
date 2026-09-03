import { supabase } from './supabase';
import { ChartPoint } from '../components/MiniBarChart';

export type TimelineEvent = { id: string; date: string; title: string; detail: string };
export type ExerciseProgress = { name: string; initial: number; current: number; percent: number; points: ChartPoint[] };
export type StudentEvolution = { isDemo: boolean; weight: ChartPoint[]; volume: ChartPoint[]; exercise: ExerciseProgress | null; timeline: TimelineEvent[]; completedSessions: number; averageVolume: number };

function demoEvolution(currentWeight?: number | null): StudentEvolution {
  const base = currentWeight ?? 78; const day = (offset: number) => { const date = new Date(); date.setDate(date.getDate() - offset); return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
  return { isDemo: true, weight: [{ label: day(42), value: base + 2.2 }, { label: day(28), value: base + 1.4 }, { label: day(14), value: base + 0.6 }, { label: day(0), value: base }], volume: [{ label: 'Sem 1', value: 6500 }, { label: 'Sem 2', value: 7200 }, { label: 'Sem 3', value: 7800 }, { label: 'Sem 4', value: 8450 }], exercise: { name: 'Supino reto', initial: 30, current: 36, percent: 20, points: [{ label: day(42), value: 30 }, { label: day(28), value: 32 }, { label: day(14), value: 34 }, { label: day(0), value: 36 }] }, completedSessions: 14, averageVolume: 7488, timeline: [{ id: 'demo-1', date: 'Hoje', title: 'Treino A concluído', detail: 'Volume total de 8.450 kg · Cansaço 8/10 😓' }, { id: 'demo-2', date: 'Ontem', title: 'Carga aumentada', detail: 'Supino reto: 34 kg → 36 kg.' }, { id: 'demo-3', date: day(14), title: 'Peso atualizado', detail: `${(base + 0.6).toFixed(1)} kg → ${base.toFixed(1)} kg.` }] };
}

export async function loadStudentEvolution(studentId: string, currentWeight?: number | null): Promise<StudentEvolution> {
  const [{ data: sessions }, { data: history }] = await Promise.all([
    supabase.from('workout_sessions').select('id, workout_id, started_at, finished_at, status, perceived_exertion, total_volume_kg').eq('student_id', studentId).order('started_at'),
    supabase.from('student_anamnesis_history').select('id, snapshot, created_at').eq('student_id', studentId).order('created_at'),
  ]);
  const completed = (sessions ?? []).filter((session) => session.status === 'completed');
  if (!completed.length) return demoEvolution(currentWeight);
  const sessionIds = completed.map((session) => session.id); const workoutIds = [...new Set(completed.map((session) => session.workout_id))];
  const [{ data: logs }, { data: exercises }] = await Promise.all([
    supabase.from('set_logs').select('session_id, exercise_id, reps, weight_kg, completed_at').in('session_id', sessionIds),
    supabase.from('workout_exercises').select('id, name, workout_id').in('workout_id', workoutIds),
  ]);
  if (!logs?.length) return demoEvolution(currentWeight);
  const exerciseNames = new Map((exercises ?? []).map((item) => [item.id, item.name]));
  const volumes = completed.slice(-6).map((session) => ({ label: new Date(session.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: Math.round((logs ?? []).filter((log) => log.session_id === session.id).reduce((sum, log) => sum + Number(log.reps) * Number(log.weight_kg), 0)) }));
  const byExercise = new Map<string, typeof logs>(); for (const log of logs) { const name = exerciseNames.get(log.exercise_id) ?? 'Exercício'; byExercise.set(name, [...(byExercise.get(name) ?? []), log]); }
  const strongest = [...byExercise.entries()].map(([name, entries]) => { const ordered = [...entries].sort((a, b) => a.completed_at.localeCompare(b.completed_at)); const initial = Number(ordered[0].weight_kg); const current = Number(ordered[ordered.length - 1].weight_kg); return { name, entries: ordered, initial, current, percent: initial > 0 ? Math.round(((current - initial) / initial) * 100) : 0 }; }).sort((a, b) => b.percent - a.percent)[0];
  const exercise = strongest ? { name: strongest.name, initial: strongest.initial, current: strongest.current, percent: strongest.percent, points: strongest.entries.slice(-6).map((entry) => ({ label: new Date(entry.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: Number(entry.weight_kg) })) } : null;
  const weight = (history ?? []).map((item) => ({ label: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: Number((item.snapshot as { weight_kg?: number }).weight_kg ?? 0) })).filter((point) => point.value > 0).slice(-6); if (currentWeight && (!weight.length || weight[weight.length - 1].value !== currentWeight)) weight.push({ label: 'Atual', value: currentWeight });
  const averageVolume = volumes.length ? Math.round(volumes.reduce((sum, item) => sum + item.value, 0) / volumes.length) : 0;
  return { isDemo: false, weight, volume: volumes, exercise, completedSessions: completed.length, averageVolume, timeline: completed.slice(-6).reverse().map((session) => { const volume = Number(session.total_volume_kg) || volumes.find((item) => item.label === new Date(session.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }))?.value || 0; const effort = session.perceived_exertion ? ` · Cansaço ${session.perceived_exertion}/10` : ''; return { id: session.id, date: new Date(session.started_at).toLocaleDateString('pt-BR'), title: 'Treino concluído', detail: `Volume registrado: ${volume.toLocaleString('pt-BR')} kg${effort}.` }; }) };
}
