import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Label, Muted, Title } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { Profile, Workout } from '../../../lib/types';

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<Profile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profile }, { data: ws }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('workouts')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false }),
    ]);
    setStudent((profile as Profile) ?? null);
    setWorkouts((ws as Workout[]) ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.container}>
        <Muted>Aluno não encontrado.</Muted>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title>{student.full_name}</Title>
      <Muted>Streak: {student.streak_days} dias</Muted>

      <Button
        label="Criar treino"
        onPress={() =>
          router.push({ pathname: '/(professor)/workout/new', params: { studentId: student.id } })
        }
      />

      <Label>Treinos</Label>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={<Muted>Nenhum treino criado para este aluno.</Muted>}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.workoutTitle}>{item.title}</Text>
            <Muted>
              {item.duration_minutes} min · {item.level}
              {item.scheduled_for ? ` · ${item.scheduled_for}` : ''}
            </Muted>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  workoutTitle: { fontWeight: '700', fontSize: 16, color: colors.ink },
});
