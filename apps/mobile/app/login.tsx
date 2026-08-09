import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input, Label, Screen, Subtitle, Title } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/types';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('aluno');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    const result =
      mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim() || 'Usuário', role);
    setLoading(false);

    if (result.error) {
      Alert.alert('Erro', result.error);
      return;
    }

    if (mode === 'signup') {
      Alert.alert(
        'Conta criada',
        'Se a confirmação de e-mail estiver ativa no Supabase, verifique sua caixa de entrada. Caso contrário, faça login.',
      );
      setMode('login');
      return;
    }

    router.replace('/');
  }

  return (
    <Screen>
      <Label>Touro Fit</Label>
      <Title>{mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}</Title>
      <Subtitle>App de treino para alunos e professores — powered by Supabase.</Subtitle>

      <View style={styles.form}>
        {mode === 'signup' && (
          <Input
            placeholder="Nome completo"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}
        <Input
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {mode === 'signup' && (
          <View style={styles.roleRow}>
            {(['aluno', 'professor'] as UserRole[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setRole(item)}
                style={[styles.roleChip, role === item && styles.roleChipActive]}
              >
                <Text style={[styles.roleText, role === item && styles.roleTextActive]}>
                  {item === 'aluno' ? 'Aluno' : 'Professor'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Button
          label={mode === 'login' ? 'Entrar' : 'Cadastrar'}
          onPress={onSubmit}
          loading={loading}
        />

        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.switch}>
            {mode === 'login' ? 'Criar uma conta' : 'Já tenho conta — entrar'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  roleText: {
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'capitalize',
  },
  roleTextActive: {
    color: colors.red,
  },
  switch: {
    textAlign: 'center',
    marginTop: spacing.sm,
    color: colors.ink,
    fontWeight: '600',
  },
});
