import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Muted } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { SetLog, WorkoutExercise, WorkoutSession } from '../../../lib/types';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!s) {
        setLoading(false);
        return;
      }

      const sessionData = s as WorkoutSession;
      setSession(sessionData);

      const [{ data: ex }, { data: existingLogs }] = await Promise.all([
        supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_id', sessionData.workout_id)
          .order('sort_order', { ascending: true }),
        supabase.from('set_logs').select('*').eq('session_id', sessionData.id),
      ]);

      setExercises((ex as WorkoutExercise[]) ?? []);
      setLogs((existingLogs as SetLog[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  const current = exercises[exerciseIndex];
  const completedSets = useMemo(
    () => logs.filter((l) => l.exercise_id === current?.id).length,
    [logs, current?.id],
  );

  async function completeSet() {
    if (!session || !current) return;
    const nextSet = completedSets + 1;
    if (nextSet > current.sets) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('set_logs')
      .insert({
        session_id: session.id,
        exercise_id: current.id,
        set_number: nextSet,
        reps: current.reps,
        weight_kg: current.target_weight_kg ?? 0,
      })
      .select('*')
      .single();
    setSaving(false);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    setLogs((prev) => [...prev, data as SetLog]);

    if (nextSet >= current.sets) {
      if (exerciseIndex < exercises.length - 1) {
        setExerciseIndex((i) => i + 1);
      } else {
        await finishSession();
      }
    }
  }

  async function finishSession() {
    if (!session) return;
    await supabase
      .from('workout_sessions')
      .update({ status: 'completed', finished_at: new Date().toISOString() })
      .eq('id', session.id);
    Alert.alert('Treino concluído', 'Mandou bem!', [
      { text: 'OK', onPress: () => router.replace('/(aluno)') },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!session || !current) {
    return (
      <SafeAreaView style={styles.safe}>
        <Muted>Sessão inválida.</Muted>
        <Button label="Voltar" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Fechar</Text>
        </Pressable>
        <Text style={styles.progress}>
          Exercício {exerciseIndex + 1}/{exercises.length}
        </Text>
      </View>

      <View style={styles.body}>
        {current.image_url ? <Image source={{ uri: current.image_url }} style={styles.exerciseImage} /> : null}
        <Text style={styles.name}>{current.name}</Text>
        <Text style={styles.setLabel}>
          Série {Math.min(completedSets + 1, current.sets)} de {current.sets}
        </Text>

        <View style={styles.metrics}>
          <Card style={styles.metric}>
            <Text style={styles.metricValue}>{current.reps}</Text>
            <Text style={styles.metricLabel}>REPETIÇÕES</Text>
          </Card>
            <Card style={styles.metric}>
            <Text style={styles.metricValue}>{current.target_weight_kg ?? 0}</Text>
            <Text style={styles.metricLabel}>KG CARGA</Text>
          </Card>
        </View>

        <Card style={styles.tip}>
          <Text style={styles.tipText}>Mais uma série e você bate seu recorde!</Text>
        </Card>
        {current.video_url ? <Pressable onPress={() => Linking.openURL(current.video_url ?? '')}><Text style={styles.videoLink}>▶ Ver execução antes de começar</Text></Pressable> : null}
      </View>

      <View style={styles.footer}>
        <Button
          label={completedSets >= current.sets ? 'Próximo' : 'Concluir série'}
          onPress={completeSet}
          loading={saving}
        />
        <Button label="Finalizar treino" variant="ghost" onPress={finishSession} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black, padding: spacing.lg },
  centered: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: { color: '#aaa', fontWeight: '600' },
  progress: { color: '#fff', fontWeight: '700' },
  body: { flex: 1, justifyContent: 'center', gap: spacing.md },
  name: { color: '#fff', fontSize: 32, fontWeight: '800' },
  setLabel: { color: colors.red, fontWeight: '700', fontSize: 16 },
  metrics: { flexDirection: 'row', gap: 12 },
  metric: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  metricValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  metricLabel: { color: '#888', marginTop: 4, fontWeight: '700', fontSize: 12 },
  tip: { backgroundColor: '#1F1515', borderColor: '#3A2020' },
  tipText: { color: '#F5C2C0', fontWeight: '600' },
  exerciseImage: { width: '100%', height: 170, borderRadius: 14 },
  videoLink: { color: colors.red, fontWeight: '800', paddingTop: 4 },
  footer: { gap: 10 },
});
