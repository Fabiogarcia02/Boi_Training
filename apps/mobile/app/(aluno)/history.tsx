import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, Muted } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Workout, WorkoutSession } from '../../lib/types';

type SessionHistory = WorkoutSession & { 
  workout: Workout;
  set_logs?: { id: string }[];
};

export default function HistoryScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, workout:workouts(*), set_logs(id)')
      .eq('student_id', profile.id)
      .eq('status', 'completed')
      .order('finished_at', { ascending: false })
      .limit(50);

    if (error) {
      setErrorMsg('Não foi possível carregar o histórico de treinos.');
    } else if (data) {
      setSessions(data as SessionHistory[]);
    }
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Button label="Tentar novamente" onPress={load} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum treino concluído</Text>
            <Muted>Os treinos que você finalizar aparecerão aqui.</Muted>
          </View>
        }
        renderItem={({ item }) => {
          const finishedAt = item.finished_at ? new Date(item.finished_at) : null;
          let durationStr = '—';
          if (item.started_at && item.finished_at) {
            const start = new Date(item.started_at);
            const end = new Date(item.finished_at);
            const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);
            durationStr = `${diffMin} min`;
          }
          const setsCount = item.set_logs?.length || 0;

          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.workout?.title || 'Treino removido'}</Text>
                {finishedAt && (
                  <Text style={styles.date}>
                    {finishedAt.toLocaleDateString('pt-BR')}
                  </Text>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Muted>Duração: {durationStr}</Muted>
                <Muted>{setsCount} {setsCount === 1 ? 'série' : 'séries'}</Muted>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: spacing.xl },
  errorText: { color: colors.ink, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  empty: { padding: spacing.lg, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: colors.ink, marginBottom: 8 },
  card: { gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontWeight: '800', fontSize: 18, color: colors.ink, flex: 1, marginRight: 8 },
  date: { fontSize: 13, color: colors.muted, fontWeight: '600', marginTop: 2 },
  cardFooter: { flexDirection: 'row', gap: 16 },
});
