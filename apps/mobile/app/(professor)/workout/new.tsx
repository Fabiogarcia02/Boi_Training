import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Input, Label, Muted } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

type DraftExercise = {
  name: string;
  muscle_group: string;
  sets: string;
  reps: string;
  target_weight_kg: string;
};

const emptyExercise = (): DraftExercise => ({
  name: '',
  muscle_group: '',
  sets: '3',
  reps: '10',
  target_weight_kg: '20',
});

export default function NewWorkout() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const { profile } = useAuth();
  const [title, setTitle] = useState('Peito & Tríceps');
  const [focus, setFocus] = useState('Empurrar');
  const [duration, setDuration] = useState('45');
  const [level, setLevel] = useState('Intermediário');
  const [exercises, setExercises] = useState<DraftExercise[]>([
    {
      name: 'Supino Reto',
      muscle_group: 'Peito',
      sets: '4',
      reps: '10',
      target_weight_kg: '40',
    },
    {
      name: 'Crucifixo',
      muscle_group: 'Peito',
      sets: '3',
      reps: '12',
      target_weight_kg: '14',
    },
  ]);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(
    () => Boolean(title.trim() && studentId && profile && exercises.every((e) => e.name.trim())),
    [title, studentId, profile, exercises],
  );

  function updateExercise(index: number, patch: Partial<DraftExercise>) {
    setExercises((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function save() {
    if (!profile || !studentId || !canSave) return;
    setSaving(true);

    const today = new Date().toISOString().slice(0, 10);
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        coach_id: profile.id,
        student_id: studentId,
        title: title.trim(),
        focus: focus.trim() || null,
        duration_minutes: Number(duration) || 45,
        level: level.trim() || 'Intermediário',
        scheduled_for: today,
      })
      .select('id')
      .single();

    if (error || !workout) {
      setSaving(false);
      Alert.alert('Erro', error?.message ?? 'Falha ao criar treino');
      return;
    }

    const rows = exercises.map((ex, index) => ({
      workout_id: workout.id,
      name: ex.name.trim(),
      muscle_group: ex.muscle_group.trim() || null,
      sets: Number(ex.sets) || 3,
      reps: Number(ex.reps) || 10,
      target_weight_kg: Number(ex.target_weight_kg) || null,
      sort_order: index + 1,
    }));

    const { error: exError } = await supabase.from('workout_exercises').insert(rows);
    setSaving(false);

    if (exError) {
      Alert.alert('Erro', exError.message);
      return;
    }

    Alert.alert('Treino criado', 'O aluno já pode ver no dashboard.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Label>Novo treino</Label>
      <Input placeholder="Título" value={title} onChangeText={setTitle} />
      <Input placeholder="Foco (ex: Empurrar)" value={focus} onChangeText={setFocus} />
      <View style={styles.row}>
        <Input
          style={{ flex: 1 }}
          placeholder="Duração (min)"
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />
        <Input style={{ flex: 1 }} placeholder="Nível" value={level} onChangeText={setLevel} />
      </View>

      <Label>Exercícios</Label>
      {exercises.map((ex, index) => (
        <Card key={index} style={styles.exCard}>
          <Text style={styles.exTitle}>Exercício {index + 1}</Text>
          <Input
            placeholder="Nome"
            value={ex.name}
            onChangeText={(v) => updateExercise(index, { name: v })}
          />
          <Input
            placeholder="Grupo muscular"
            value={ex.muscle_group}
            onChangeText={(v) => updateExercise(index, { muscle_group: v })}
          />
          <View style={styles.row}>
            <Input
              style={{ flex: 1 }}
              placeholder="Séries"
              keyboardType="numeric"
              value={ex.sets}
              onChangeText={(v) => updateExercise(index, { sets: v })}
            />
            <Input
              style={{ flex: 1 }}
              placeholder="Reps"
              keyboardType="numeric"
              value={ex.reps}
              onChangeText={(v) => updateExercise(index, { reps: v })}
            />
            <Input
              style={{ flex: 1 }}
              placeholder="Kg"
              keyboardType="numeric"
              value={ex.target_weight_kg}
              onChangeText={(v) => updateExercise(index, { target_weight_kg: v })}
            />
          </View>
        </Card>
      ))}

      <Button
        label="Adicionar exercício"
        variant="ghost"
        onPress={() => setExercises((prev) => [...prev, emptyExercise()])}
      />
      <Button label="Salvar treino" onPress={save} loading={saving} disabled={!canSave} />
      <Muted>O treino fica agendado para hoje e aparece no app do aluno.</Muted>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 48 },
  row: { flexDirection: 'row', gap: 8 },
  exCard: { gap: 8 },
  exTitle: { fontWeight: '700', color: colors.ink },
});
