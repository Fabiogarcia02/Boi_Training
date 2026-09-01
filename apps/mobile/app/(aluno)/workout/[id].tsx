import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Badge, Card, Label, Muted, Screen } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { Workout, WorkoutExercise } from '../../../lib/types';

export default function WorkoutDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: w }, { data: e }] = await Promise.all([
        supabase.from('workouts').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_id', id)
          .order('sort_order', { ascending: true }),
      ]);
      setWorkout((w as Workout) ?? null);
      setExercises((e as WorkoutExercise[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  if (!workout) {
    return (
      <Screen>
        <Muted>Treino não encontrado.</Muted>
      </Screen>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{workout.title}</Text>
      <View style={styles.tags}>
        {workout.focus ? <Badge text={workout.focus} tone="neutral" /> : null}
        <Badge text={`${workout.duration_minutes} min`} tone="neutral" />
        <Badge text={workout.level} tone="neutral" />
      </View>

      <Label>Exercícios</Label>
      {exercises.map((ex, index) => (
        <Card key={ex.id} style={styles.exercise}>
          {ex.image_url ? <Image source={{ uri: ex.image_url }} style={styles.exerciseImage} /> : null}
          <View style={styles.row}>
            <Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{ex.name}</Text>
              <Muted>
                {ex.sets} séries × {ex.reps} reps
                {ex.target_weight_kg != null ? ` · ${ex.target_weight_kg}kg` : ''}
              </Muted>
            </View>
            {ex.muscle_group ? <Badge text={ex.muscle_group} /> : null}
          </View>
          {ex.video_url ? <Pressable onPress={() => Linking.openURL(ex.video_url ?? '')}><Text style={styles.videoLink}>▶ Ver execução em vídeo</Text></Pressable> : null}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  exercise: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  index: { fontWeight: '800', color: colors.muted, width: 28 },
  exName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  exerciseImage: { width: '100%', height: 150, borderRadius: 12, marginBottom: 12 },
  videoLink: { color: colors.red, fontWeight: '800', paddingTop: 10 },
});
