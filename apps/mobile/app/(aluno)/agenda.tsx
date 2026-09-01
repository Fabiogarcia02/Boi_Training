import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, Input, Label, Muted, Title } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export default function StudentAgenda() {
  const { profile } = useAuth(); const [coach, setCoach] = useState<string | null>(null); const [slots, setSlots] = useState<any[]>([]); const [appointments, setAppointments] = useState<any[]>([]); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const load = useCallback(async () => { if (!profile) return; const { data: coachProfile } = await supabase.from('profiles').select('id').eq('role', 'professor').limit(1).maybeSingle(); if (!coachProfile) return; setCoach(coachProfile.id); const [a, b] = await Promise.all([supabase.from('coach_availability').select('*').eq('coach_id', coachProfile.id).eq('active', true), supabase.from('appointments').select('*').eq('student_id', profile.id).order('starts_at')]); setSlots(a.data ?? []); setAppointments(b.data ?? []); }, [profile]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function book(slot: any) { if (!profile || !coach) return; const { error } = await supabase.from('appointments').insert({ coach_id: coach, student_id: profile.id, availability_id: slot.id, starts_at: `${date}T${String(slot.start_time).slice(0, 8)}`, ends_at: `${date}T${String(slot.end_time).slice(0, 8)}`, created_by: profile.id }); if (error) Alert.alert('Não foi possível agendar', error.message); else { Alert.alert('Solicitação enviada', 'Seu professor receberá uma notificação.'); load(); } }
  return <FlatList data={slots} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View style={styles.header}><Label>Agenda</Label><Title>Reserve seu horário</Title><Muted>Escolha a data e um horário disponível do seu professor.</Muted><Input placeholder="Data (AAAA-MM-DD)" value={date} onChangeText={setDate} /><Label>Horários disponíveis</Label></View>} renderItem={({ item }) => <Card style={styles.row}><View><Text style={styles.bold}>{days[item.day_of_week]}</Text><Muted>{String(item.start_time).slice(0, 5)}–{String(item.end_time).slice(0, 5)}</Muted></View><Button label="Solicitar" onPress={() => book(item)} /></Card>} ListFooterComponent={<View style={styles.footer}><Label>Meus agendamentos</Label>{appointments.map((item) => <Card key={item.id}><Text style={styles.bold}>{new Date(item.starts_at).toLocaleString('pt-BR')}</Text><Muted>{item.status}</Muted></Card>)}</View>} />;
}
const styles = StyleSheet.create({ content: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.bg }, header: { gap: spacing.md }, footer: { gap: spacing.md, marginTop: spacing.lg }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, bold: { fontWeight: '800', color: colors.ink } });
