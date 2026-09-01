import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, Label, Muted, Title } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/types';
import { Avatar } from '../../components/Avatar';

export default function ProfessorHome() {
  const { profile, signOut } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('id, full_name, role, avatar_url, streak_days, bio, phone').eq('role', 'aluno').order('full_name');
    if (error) console.warn('students load error', error.message);
    setStudents((data as Profile[]) ?? []);
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
      <View style={styles.actions}><Button label="Agenda" variant="secondary" onPress={() => router.push('/(professor)/agenda')} /><Button label="Notificações" variant="ghost" onPress={() => router.push('/notificacoes')} /></View>
      <View style={styles.sectionRow}><Label>Alunos</Label><Text style={styles.count}>{students.length}</Text></View>
    </View>}
    ListEmptyComponent={loading ? <ActivityIndicator color={colors.red} /> : <Card><Muted>Nenhum aluno cadastrado ainda.</Muted></Card>}
    renderItem={({ item }) => <Pressable onPress={() => router.push(`/(professor)/student/${item.id}`)}><Card style={styles.studentCard}><Avatar name={item.full_name} value={item.avatar_url} /><View style={styles.studentInfo}><Text style={styles.studentName}>{item.full_name}</Text><Muted>{item.bio || `Sequência de ${item.streak_days} dia(s)`}</Muted></View><Text style={styles.chevron}>›</Text></Card></Pressable>}
    ListFooterComponent={<Pressable onPress={signOut}><Text style={styles.logout}>Sair da conta</Text></Pressable>}
  />;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.bg, paddingBottom: 48 },
  headerContent: { gap: spacing.md, marginBottom: spacing.sm }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  actions: { gap: spacing.xs }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, count: { color: colors.red, fontWeight: '800' },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, studentInfo: { flex: 1 }, studentName: { fontSize: 17, fontWeight: '800', color: colors.ink }, chevron: { fontSize: 30, color: colors.muted },
  logout: { textAlign: 'center', color: colors.muted, fontWeight: '700', padding: spacing.lg },
});
