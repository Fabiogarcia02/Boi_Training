import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Label, Muted, Title } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { Profile, StudentAnamnesis, Workout } from '../../../lib/types';
import { Avatar } from '../../../components/Avatar';

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<Profile | null>(null); const [workouts, setWorkouts] = useState<Workout[]>([]); const [anamnesis, setAnamnesis] = useState<StudentAnamnesis | null>(null); const [historyCount, setHistoryCount] = useState(0); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!id) return; setLoading(true);
    const [profileResult, workoutsResult, anamnesisResult, historyResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('workouts').select('*').eq('student_id', id).order('created_at', { ascending: false }),
      supabase.from('student_anamneses').select('*').eq('student_id', id).maybeSingle(),
      supabase.from('student_anamnesis_history').select('id', { count: 'exact', head: true }).eq('student_id', id),
    ]);
    setStudent((profileResult.data as Profile) ?? null); setWorkouts((workoutsResult.data as Workout[]) ?? []); setAnamnesis((anamnesisResult.data as StudentAnamnesis) ?? null); setHistoryCount(historyResult.count ?? 0); setLoading(false);
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.red} /></View>;
  if (!student) return <View style={styles.center}><Muted>Aluno não encontrado.</Muted></View>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
    <View style={styles.profileHeader}><Avatar name={student.full_name} value={student.avatar_url} size={72} /><View style={styles.profileInfo}><Title>{student.full_name}</Title><Muted>{student.bio || `Sequência de ${student.streak_days} dia(s)`}</Muted></View></View>
    <Button label="Criar novo treino" onPress={() => router.push({ pathname: '/(professor)/workout/new', params: { studentId: student.id } })} />
    <Card style={styles.report}><Label>Anamnese atual</Label>{anamnesis ? <View style={styles.reportContent}>
      <Text style={styles.item}>Objetivo: {anamnesis.goal || 'Não informado'}</Text><Text style={styles.item}>Experiência: {anamnesis.experience_level || 'Não informada'}</Text><Text style={styles.item}>Altura/peso: {anamnesis.height_cm ? `${anamnesis.height_cm} cm` : '—'} / {anamnesis.weight_kg ? `${anamnesis.weight_kg} kg` : '—'}</Text><Text style={styles.item}>Condições de saúde: {anamnesis.health_conditions || 'Nenhuma informada'}</Text><Text style={styles.item}>Lesões ou dores: {anamnesis.injuries || 'Nenhuma informada'}</Text><Text style={styles.item}>Medicamentos: {anamnesis.medications || 'Nenhum informado'}</Text><Text style={styles.item}>Restrições: {anamnesis.exercise_restrictions || 'Nenhuma informada'}</Text><Text style={styles.item}>Dias disponíveis: {anamnesis.available_training_days?.join(', ') || 'Não informado'}</Text><Text style={styles.item}>PAR-Q positivo: {Object.values(anamnesis.parq_answers ?? {}).filter(Boolean).length}</Text><Muted>Atualizada em {new Date(anamnesis.updated_at).toLocaleDateString('pt-BR')}</Muted>
    </View> : <Muted>Este aluno ainda não preencheu a anamnese.</Muted>}
      <Button label={`Ver histórico (${historyCount})`} variant="ghost" onPress={() => router.push({ pathname: '/(professor)/student/history', params: { studentId: student.id } })} />
    </Card>
    <Label>Treinos</Label>{workouts.length ? workouts.map((workout) => <Card key={workout.id}><Text style={styles.workoutTitle}>{workout.title}</Text><Muted>{workout.duration_minutes} min · {workout.level}{workout.scheduled_for ? ` · ${workout.scheduled_for}` : ''}</Muted></Card>) : <Card><Muted>Nenhum treino criado para este aluno.</Muted></Card>}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }, profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, profileInfo: { flex: 1 }, report: { gap: spacing.sm }, reportContent: { gap: 6 }, item: { color: colors.ink, fontSize: 14, lineHeight: 20 }, workoutTitle: { color: colors.ink, fontWeight: '800', fontSize: 16 } });
