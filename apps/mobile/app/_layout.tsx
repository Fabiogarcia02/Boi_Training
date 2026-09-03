import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { colors } from '../constants/theme';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from '../components/NotificationBell';

function PushRegistration() {
  const { profile } = useAuth();
  useEffect(() => {
    if (!profile || Platform.OS === 'web') return;
    (async () => {
      try {
        const current = await Notifications.getPermissionsAsync();
        const permission = current as any;
        if (permission.status !== 'granted') { const requested = await Notifications.requestPermissionsAsync() as any; if (requested.status !== 'granted') return; }
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await supabase.from('notification_preferences').upsert({ user_id: profile.id, push_token: token, push_enabled: true }, { onConflict: 'user_id' });
      } catch (error) { console.warn('push registration unavailable', error); }
    })();
  }, [profile]);
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PushRegistration />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.bg },
          headerRight: () => <NotificationBell />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Entrar' }} />
        <Stack.Screen name="perfil" options={{ title: 'Meu perfil' }} />
        <Stack.Screen name="notificacoes" options={{ title: 'Notificações' }} />
        <Stack.Screen name="aguardando-professor" options={{ headerShown: false }} />
        <Stack.Screen name="(aluno)" options={{ headerShown: false }} />
        <Stack.Screen name="(professor)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
