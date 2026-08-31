import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Muted, Screen, Subtitle, Title } from '../components/ui';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function Index() {
  const { loading, session, profile, configured } = useAuth();
  const [anamnesisComplete, setAnamnesisComplete] = useState<boolean | null>(null);
  const [hasCoach, setHasCoach] = useState<boolean | null>(null);

  useEffect(() => {
    if (!profile || profile.role === 'professor') {
      setAnamnesisComplete(true);
      setHasCoach(true);
      return;
    }
    let active = true;
    Promise.all([
      supabase.from('student_anamneses').select('id').eq('student_id', profile.id).eq('is_complete', true).maybeSingle(),
      supabase.from('coach_students').select('id').eq('student_id', profile.id).limit(1),
    ]).then(([anamnesisResult, coachResult]) => {
      if (!active) return;
      if (anamnesisResult.error) console.warn('anamnesis check error', anamnesisResult.error.message);
      if (coachResult.error) console.warn('coach check error', coachResult.error.message);
      setAnamnesisComplete(Boolean(anamnesisResult.data));
      setHasCoach((coachResult.data ?? []).length > 0);
    });
    return () => { active = false; };
  }, [profile]);

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

  if (loading || (profile?.role === 'aluno' && (anamnesisComplete === null || hasCoach === null))) {
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

  if (profile.role === 'aluno' && !hasCoach) {
    return <Redirect href="/aguardando-professor" />;
  }

  if (profile.role === 'aluno' && !anamnesisComplete) {
    return <Redirect href="/anamnese" />;
  }

  if (profile.role === 'professor') {
    return <Redirect href="/(professor)" />;
  }

  return <Redirect href="/(aluno)" />;
}
