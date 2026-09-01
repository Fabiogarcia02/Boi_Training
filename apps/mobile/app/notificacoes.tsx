import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, Label, Muted, Title } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Notification } from '../lib/types';

export default function Notifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { if (!profile) return; setLoading(true); const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50); setItems((data as Notification[]) ?? []); setLoading(false); }, [profile]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function read(item: Notification) { if (!item.read_at) { const now = new Date().toISOString(); await supabase.from('notifications').update({ read_at: now }).eq('id', item.id); setItems((all) => all.map((n) => n.id === item.id ? { ...n, read_at: now } : n)); } }
  return <ScrollView contentContainerStyle={styles.content}><Label>Central</Label><Title>Notificações</Title>{loading ? <ActivityIndicator color={colors.red} /> : items.length ? items.map((item) => <Pressable key={item.id} onPress={() => read(item)}><Card style={!item.read_at ? { gap: 4, borderColor: colors.red, borderWidth: 2 } : styles.card}><Text style={styles.title}>{item.title}</Text><Muted>{item.body}</Muted><Muted>{new Date(item.created_at).toLocaleString('pt-BR')}</Muted></Card></Pressable>) : <Card><Muted>Nenhuma notificação nova.</Muted></Card>}</ScrollView>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md }, card: { gap: 4 }, title: { color: colors.ink, fontSize: 16, fontWeight: '800' } });
