import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, Label, Muted, Title } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile, StudentAnamnesis, Workout } from '../../lib/types';
import { Avatar } from '../../components/Avatar';

export default function ProfessorHome() {
  const { profile, signOut } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [anamneses, setAnamneses] = useState<Record<string, StudentAnamnesis>>({});
  const [studentWorkouts, setStudentWorkouts] = useState<Record<string, Workout[]>>({});
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('id, full_name, role, avatar_url, streak_days, bio, phone, created_at, birth_date').eq('role', 'aluno').order('full_name');
    if (error) console.warn('students load error', error.message);
    setStudents((data as Profile[]) ?? []);
    const ids = ((data as Profile[]) ?? []).map((item) => item.id);
    const [anamnesisResult, workoutsResult] = await Promise.all([
      ids.length ? supabase.from('student_anamneses').select('*').in('student_id', ids) : Promise.resolve({ data: [] as StudentAnamnesis[] }),
      ids.length ? supabase.from('workouts').select('*').in('student_id', ids).order('created_at', { ascending: false }) : Promise.resolve({ data: [] as Workout[] }),
    ]);
    setAnamneses(Object.fromEntries(((anamnesisResult.data as StudentAnamnesis[]) ?? []).map((item) => [item.student_id, item])));
    setStudentWorkouts(((workoutsResult.data as Workout[]) ?? []).reduce<Record<string, Workout[]>>((result, workout) => { result[workout.student_id] = [...(result[workout.student_id] ?? []), workout]; return result; }, {}));
    setLoading(false);
  }, [profile]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!profile) return null;
  return <FlatList
    data={students}
    keyExtractor={(item) => item.id}
    refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    contentContainerStyle={styles.content}
    ListHeaderComponent={<View style={styles.headerContent}>
      <View style={styles.header}><View><Label>Painel do professor</Label><Title>{profile.full_name}</Title><Muted>Todos os alunos da plataforma aparecem automaticamente.</Muted></View><Pressable onPress={() => router.push('/perfil')}><Avatar name={profile.full_name} value={profile.avatar_url} size={52} /></Pressable></View>
      <View style={styles.actions}><Button label="Biblioteca de exercícios" variant="secondary" onPress={() => router.push('/(professor)/library' as never)} /><Button label="Agenda" variant="secondary" onPress={() => router.push('/(professor)/agenda')} /><Button label="Notificações" variant="ghost" onPress={() => router.push('/notificacoes')} /></View>
      <View style={styles.sectionRow}><Label>Alunos</Label><Text style={styles.count}>{students.length}</Text></View>
    </View>}
    ListEmptyComponent={loading ? <ActivityIndicator color={colors.red} /> : <Card><Muted>Nenhum aluno cadastrado ainda.</Muted></Card>}
    renderItem={({ item }) => { const workouts = studentWorkouts[item.id] ?? []; const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); const recent = workouts.filter((workout) => new Date(workout.created_at ?? workout.scheduled_for ?? 0) >= weekStart); const birthDate = anamneses[item.id]?.birth_date; const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null; const last = workouts[0]?.created_at ?? workouts[0]?.scheduled_for; return <Pressable onPress={() => router.push(`/(professor)/student/${item.id}`)}><Card style={styles.studentCard}><Avatar name={item.full_name} value={item.avatar_url} /><View style={styles.studentInfo}><Text style={styles.studentName}>{item.full_name}</Text><Text style={styles.goal}>{anamneses[item.id]?.goal || 'Objetivo não informado'}{age !== null ? ` · ${age} anos` : ''}</Text><Muted>{last ? `Último treino: ${new Date(last).toLocaleDateString('pt-BR')}` : 'Nenhum treino registrado'}</Muted><Muted>{recent.length} treino(s) nos últimos 7 dias</Muted></View><Text style={styles.chevron}>›</Text></Card></Pressable>; }}
    ListFooterComponent={<Pressable onPress={signOut}><Text style={styles.logout}>Sair da conta</Text></Pressable>}
  />;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.bg, paddingBottom: 48 },
  headerContent: { gap: spacing.md, marginBottom: spacing.sm }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  actions: { gap: spacing.xs }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, count: { color: colors.red, fontWeight: '800' },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, studentInfo: { flex: 1, gap: 2 }, studentName: { fontSize: 17, fontWeight: '800', color: colors.ink }, goal: { color: colors.red, fontWeight: '800' }, chevron: { fontSize: 30, color: colors.muted },
  logout: { textAlign: 'center', color: colors.muted, fontWeight: '700', padding: spacing.lg },
});
