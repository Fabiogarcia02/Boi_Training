import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Badge, Button, Card, Label, Muted, Stat, Title } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Workout, WorkoutExercise } from '../../lib/types';

type TodayWorkout = Workout & { exercises: WorkoutExercise[] };

export default function AlunoDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<TodayWorkout | null>(null);
  const [weekDone, setWeekDone] = useState(0);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const today = new Date().toISOString().slice(0, 10);
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('student_id', profile.id)
      .or(`scheduled_for.eq.${today},scheduled_for.is.null`)
      .order('scheduled_for', { ascending: false, nullsFirst: false })
      .limit(1);

    const current = (workouts?.[0] as Workout | undefined) ?? null;

    if (current) {
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', current.id)
        .order('sort_order', { ascending: true });
      setWorkout({ ...current, exercises: (exercises as WorkoutExercise[]) ?? [] });
    } else {
      setWorkout(null);
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile.id)
      .eq('status', 'completed')
      .gte('finished_at', weekAgo.toISOString());

    setWeekDone(count ?? 0);
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function startWorkout() {
    if (!workout || !profile) return;
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        workout_id: workout.id,
        student_id: profile.id,
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (error) {
      console.warn(error.message);
      return;
    }
    router.push(`/(aluno)/session/${data.id}`);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.header}>
        <View>
          <Muted>Olá,</Muted>
          <Title>{firstName}</Title>
        </View>
        <Badge text={`🔥 ${profile?.streak_days ?? 0} dias`} />
      </View>

      <Label>Treino de hoje</Label>
      {workout ? (
        <Card style={styles.hero}>
          <Text style={styles.heroEyebrow}>TREINO DE HOJE</Text>
          <Text style={styles.heroTitle}>{workout.title}</Text>
          <Muted>
            {workout.duration_minutes} min · {workout.exercises.length} exercícios
          </Muted>
          <View style={styles.heroActions}>
            <Button label="Começar" onPress={startWorkout} />
            <Button
              label="Ver detalhes"
              variant="ghost"
              onPress={() => router.push(`/(aluno)/workout/${workout.id}`)}
            />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.emptyTitle}>Nenhum treino para hoje</Text>
          <Muted>Peça ao seu professor para atribuir um treino.</Muted>
        </Card>
      )}

      <View style={styles.statsRow}>
        <Stat value={`${weekDone}/5`} label="Semana" />
        <Stat value={`${workout?.exercises.length ?? 0}`} label="Exercícios" />
        <Stat value={workout?.level ?? '—'} label="Nível" />
      </View>

      <Card style={styles.tip}>
        <Muted>
          Faltam treinos pra bater a meta semanal. Bora treinar!
        </Muted>
      </Card>

      <Button
        label="Histórico de treinos"
        variant="secondary"
        onPress={() => router.push('/(aluno)/history')}
      />

      <Pressable onPress={() => router.push('/profile')}>
        <Text style={styles.logout}>Perfil</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hero: {
    backgroundColor: colors.black,
    borderColor: colors.black,
    gap: 8,
  },
  heroEyebrow: {
    color: colors.red,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroActions: { gap: 8, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 8 },
  tip: { backgroundColor: colors.redSoft, borderColor: colors.redSoft },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: colors.ink, marginBottom: 4 },
  logout: { textAlign: 'center', color: colors.muted, marginTop: 8, fontWeight: '600' },
});
