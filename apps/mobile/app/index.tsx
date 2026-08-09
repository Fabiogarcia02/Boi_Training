import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Muted, Screen, Subtitle, Title } from '../components/ui';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { loading, session, profile, configured } = useAuth();

  if (!configured) {
    return (
      <Screen style={{ justifyContent: 'center', gap: 12 }}>
        <Title>Touro Fit</Title>
        <Subtitle>
          Configure o Supabase em `apps/mobile/.env` com EXPO_PUBLIC_SUPABASE_URL e
          EXPO_PUBLIC_SUPABASE_ANON_KEY (veja `.env.example`). Depois aplique as migrations
          em `/supabase/migrations`.
        </Subtitle>
      </Screen>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!profile) {
    return (
      <Screen style={{ justifyContent: 'center', gap: 12 }}>
        <Title>Perfil não encontrado</Title>
        <Muted>
          Faça logout e entre de novo. Confirme se a migration criou o trigger de profiles.
        </Muted>
      </Screen>
    );
  }

  if (profile.role === 'professor') {
    return <Redirect href="/(professor)" />;
  }

  return <Redirect href="/(aluno)" />;
}
