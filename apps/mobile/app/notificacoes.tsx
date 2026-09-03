import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, Label, Muted, Title } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Notification } from '../lib/types';
export default function Notifications() {
  const { profile } = useAuth(); const [items, setItems] = useState<Notification[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { if (!profile) return; setLoading(true); const { data, error } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50); if (error) Alert.alert('Não foi possível carregar', error.message); setItems((data as Notification[]) ?? []); setLoading(false); }, [profile]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function read(item: Notification) { if (!item.read_at) { const now = new Date().toISOString(); const { error } = await supabase.from('notifications').update({ read_at: now }).eq('id', item.id); if (error) Alert.alert('Não foi possível atualizar', error.message); else setItems((all) => all.map((n) => n.id === item.id ? { ...n, read_at: now } : n)); } }
  async function readAll() { if (!profile) return; const now = new Date().toISOString(); const { error } = await supabase.from('notifications').update({ read_at: now }).eq('user_id', profile.id).is('read_at', null); if (error) Alert.alert('Não foi possível atualizar', error.message); else setItems((all) => all.map((item) => ({ ...item, read_at: item.read_at ?? now }))); }
  return <ScrollView contentContainerStyle={styles.content}><View style={styles.header}><View><Label>Central</Label><Title>Notificações</Title></View>{items.some((item) => !item.read_at) ? <Pressable onPress={readAll}><Text style={styles.action}>Marcar todas como lidas</Text></Pressable> : null}</View>{loading ? <ActivityIndicator color={colors.red} /> : items.length ? items.map((item) => <Pressable key={item.id} onPress={() => read(item)}><Card style={!item.read_at ? styles.unread : styles.card}><Text style={styles.kind}>{item.kind === 'workout' ? 'TREINO' : item.kind === 'appointment' ? 'AGENDA' : 'AVISO'}</Text><Text style={styles.title}>{item.title}</Text><Muted>{item.body}</Muted><Muted>{new Date(item.created_at).toLocaleString('pt-BR')}</Muted></Card></Pressable>) : <Card><Muted>Nenhuma notificação nova.</Muted></Card>}</ScrollView>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.sm }, card: { gap: 4 }, unread: { gap: 4, borderColor: colors.red, borderWidth: 2 }, title: { color: colors.ink, fontSize: 16, fontWeight: '800' }, kind: { color: colors.red, fontSize: 11, fontWeight: '900', letterSpacing: 1 }, action: { color: colors.red, fontWeight: '800', textAlign: 'right' } });
