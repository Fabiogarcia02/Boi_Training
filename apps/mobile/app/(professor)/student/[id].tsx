import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Label, Muted, Title } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { Profile, StudentAnamnesis, Workout } from '../../../lib/types';
import { useAuth } from '../../../contexts/AuthContext';

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [student, setStudent] = useState<Profile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [anamnesis, setAnamnesis] = useState<StudentAnamnesis | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profile }, { data: ws }, { data: anamnesisData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('workouts')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('student_anamneses').select('*').eq('student_id', id).maybeSingle(),
    ]);
    setStudent((profile as Profile) ?? null);
    setWorkouts((ws as Workout[]) ?? []);
    setAnamnesis((anamnesisData as StudentAnamnesis) ?? null);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function unlinkStudent() {
    if (!profile || !id) return;
    Alert.alert('Desvincular aluno?', 'Ele perderá o acesso aos treinos desta equipe.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desvincular', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('coach_students').delete().eq('coach_id', profile.id).eq('student_id', id);
        if (error) { Alert.alert('Erro', error.message); return; }
        router.replace('/(professor)');
      } },
    ]);
  }

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
      <Pressable accessibilityRole="button" onPress={unlinkStudent}><Text style={styles.unlink}>Desvincular aluno</Text></Pressable>

      <Button
        label="Criar treino"
        onPress={() =>
          router.push({ pathname: '/(professor)/workout/new', params: { studentId: student.id } })
        }
      />

      <Card style={styles.report}>
        <Label>Relatório da anamnese</Label>
        {anamnesis ? (
          <View style={styles.reportContent}>
            <Text style={styles.reportItem}>Objetivo: {anamnesis.goal}</Text>
            <Text style={styles.reportItem}>Experiência: {anamnesis.experience_level}</Text>
            <Text style={styles.reportItem}>Altura/peso: {anamnesis.height_cm ? `${anamnesis.height_cm} cm` : '—'} / {anamnesis.weight_kg ? `${anamnesis.weight_kg} kg` : '—'}</Text>
            <Text style={styles.reportItem}>Condições de saúde: {anamnesis.health_conditions}</Text>
            <Text style={styles.reportItem}>Lesões ou dores: {anamnesis.injuries}</Text>
            <Text style={styles.reportItem}>Medicamentos: {anamnesis.medications}</Text>
            <Text style={styles.reportItem}>Restrições: {anamnesis.exercise_restrictions}</Text>
            <Text style={styles.reportItem}>Dias disponíveis: {anamnesis.available_training_days?.join(', ') || 'Não informado'}</Text>
            <Text style={styles.reportItem}>PAR-Q: {Object.values(anamnesis.parq_answers ?? {}).filter(Boolean).length} resposta(s) positiva(s)</Text>
            <Text style={styles.reportItem}>Emergência: {anamnesis.emergency_contact}</Text>
            <Muted>Atualizado em {new Date(anamnesis.updated_at).toLocaleDateString('pt-BR')}</Muted>
          </View>
        ) : <Muted>Este aluno ainda não preencheu a anamnese.</Muted>}
      </Card>

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
  report: { gap: 8 },
  reportContent: { gap: 6 },
  reportItem: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  unlink: { color: colors.red, fontWeight: '800', paddingVertical: 8 },
});
