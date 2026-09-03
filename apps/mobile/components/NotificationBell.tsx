import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function NotificationBell() {
  const { profile } = useAuth();
  const [unread, setUnread] = useState(0);
  const load = useCallback(async () => {
    if (!profile) return;
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).is('read_at', null);
    setUnread(count ?? 0);
  }, [profile]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!profile) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${unread} notificações não lidas`} onPress={() => router.push('/notificacoes')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.icon}>🔔</Text>{unread > 0 ? <Text style={styles.badge}>{unread > 99 ? '99+' : unread}</Text> : null}</Pressable>;
}
const styles = StyleSheet.create({ button: { minWidth: 48, minHeight: 44, justifyContent: 'center', alignItems: 'center', marginRight: 8 }, pressed: { opacity: 0.65 }, icon: { color: colors.ink, fontSize: 25, fontWeight: '800' }, badge: { position: 'absolute', top: 1, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 10, backgroundColor: colors.red, color: colors.surface, textAlign: 'center', fontSize: 10, lineHeight: 18, fontWeight: '900' } });
