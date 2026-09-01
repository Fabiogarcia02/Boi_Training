import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Card, Label, Muted, Title } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { AnamnesisHistory, StudentAnamnesis } from '../../../lib/types';

function Sheet({ data, date, current }: { data: StudentAnamnesis; date: string; current?: boolean }) {
  return <Card style={styles.card}><View style={styles.cardHeader}><Label>{current ? 'Ficha atual' : 'Ficha anterior'}</Label><Muted>{new Date(date).toLocaleString('pt-BR')}</Muted></View><Text style={styles.item}>Objetivo: {data.goal || 'Não informado'}</Text><Text style={styles.item}>Experiência: {data.experience_level || 'Não informada'}</Text><Text style={styles.item}>Altura: {data.height_cm ? `${data.height_cm} cm` : '—'} · Peso: {data.weight_kg ? `${data.weight_kg} kg` : '—'}</Text><Text style={styles.item}>Condições: {data.health_conditions || 'Não informado'}</Text><Text style={styles.item}>Lesões: {data.injuries || 'Não informado'}</Text><Text style={styles.item}>Medicamentos: {data.medications || 'Não informado'}</Text><Text style={styles.item}>Restrições: {data.exercise_restrictions || 'Não informado'}</Text><Text style={styles.item}>Dias disponíveis: {data.available_training_days?.join(', ') || 'Não informado'}</Text><Text style={styles.item}>Contato de emergência: {data.emergency_contact || 'Não informado'}</Text></Card>;
}
export default function AnamnesisHistoryScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>(); const [current, setCurrent] = useState<StudentAnamnesis | null>(null); const [history, setHistory] = useState<AnamnesisHistory[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { if (!studentId) return; const [currentResult, historyResult] = await Promise.all([supabase.from('student_anamneses').select('*').eq('student_id', studentId).maybeSingle(), supabase.from('student_anamnesis_history').select('*').eq('student_id', studentId).order('created_at', { ascending: false })]); setCurrent((currentResult.data as StudentAnamnesis) ?? null); setHistory((historyResult.data as AnamnesisHistory[]) ?? []); setLoading(false); }, [studentId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.red} /></View>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Label>Evolução</Label><Title>Histórico de fichas</Title><Muted>Cada versão é preservada para comparação ao longo do acompanhamento.</Muted>{current && <Sheet data={current} date={current.updated_at} current />}{history.map((item) => <Sheet key={item.id} data={item.snapshot} date={item.created_at} />)}{!current && !history.length && <Card><Muted>Nenhuma ficha encontrada.</Muted></Card>}</ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }, card: { gap: 7 }, cardHeader: { gap: 2 }, item: { color: colors.ink, fontSize: 14, lineHeight: 20 } });
