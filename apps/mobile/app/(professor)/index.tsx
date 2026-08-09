import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, Input, Label, Muted, Title } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/types';

type StudentRow = {
  id: string;
  student: Profile;
};

export default function ProfessorHome() {
  const { profile, signOut } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('coach_students')
      .select(
        'id, student:profiles!coach_students_student_id_fkey(id, full_name, role, avatar_url, streak_days)',
      )
      .eq('coach_id', profile.id);

    if (error) {
      console.warn(error.message);
      setStudents([]);
    } else {
      const rows = (data ?? [])
        .map((row: { id: string; student: Profile | Profile[] | null }) => ({
          id: row.id,
          student: Array.isArray(row.student) ? row.student[0] : row.student,
        }))
        .filter((r): r is StudentRow => Boolean(r.student));
      setStudents(rows);
    }
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function linkStudent() {
    if (!profile || !email.trim()) return;
    setLinking(true);

    const value = email.trim();
    const uuidLike = /^[0-9a-f-]{36}$/i.test(value);

    let errorMessage: string | undefined;

    if (uuidLike) {
      const { error } = await supabase.from('coach_students').insert({
        coach_id: profile.id,
        student_id: value,
      });
      errorMessage = error?.message;
    } else if (value.includes('@')) {
      const { error } = await supabase.rpc('link_student_by_email', {
        student_email: value,
      });
      errorMessage = error?.message;
    } else {
      const { data: found, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', value)
        .eq('role', 'aluno')
        .limit(1)
        .maybeSingle();

      if (error || !found) {
        setLinking(false);
        Alert.alert('Aluno não encontrado', 'Use o e-mail do aluno, o UUID ou o nome completo.');
        return;
      }

      const { error: linkError } = await supabase.from('coach_students').insert({
        coach_id: profile.id,
        student_id: found.id,
      });
      errorMessage = linkError?.message;
    }

    setLinking(false);

    if (errorMessage) {
      Alert.alert('Erro', errorMessage);
      return;
    }

    setEmail('');
    await load();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Label>Professor</Label>
          <Title>{profile?.full_name ?? 'Painel'}</Title>
          <Muted>Vincule alunos e monte treinos.</Muted>
        </View>
        <Pressable onPress={signOut}>
          <Text style={styles.logout}>Sair</Text>
        </Pressable>
      </View>

      <Card style={styles.linkBox}>
        <Muted>Vincular aluno por e-mail, UUID ou nome</Muted>
        <Input
          placeholder="aluno@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button label="Vincular" onPress={linkStudent} loading={linking} />
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
          ListEmptyComponent={<Muted>Nenhum aluno vinculado ainda.</Muted>}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/(professor)/student/${item.student.id}`)}>
              <Card>
                <Text style={styles.studentName}>{item.student.full_name}</Text>
                <Muted>Streak: {item.student.streak_days} dias</Muted>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logout: { color: colors.muted, fontWeight: '600' },
  linkBox: { gap: 10 },
  studentName: { fontSize: 17, fontWeight: '700', color: colors.ink },
});
