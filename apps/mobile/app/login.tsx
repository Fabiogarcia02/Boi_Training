import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Input, Label, Muted, Subtitle, Title } from '../components/ui';
import { colors, radius, spacing, typography } from '../constants/theme';
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
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalizedEmail)) { Alert.alert('E-mail inválido', 'Informe um e-mail com formato válido, como nome@dominio.com.'); return; }
    if (password.length < 6) { Alert.alert('Senha inválida', 'Use pelo menos 6 caracteres.'); return; }
    if (mode === 'signup' && !fullName.trim()) { Alert.alert('Nome obrigatório', 'Informe seu nome completo.'); return; }
    setLoading(true);
    const result = mode === 'login' ? await signIn(normalizedEmail, password) : await signUp(normalizedEmail, password, fullName.trim(), role);
    setLoading(false);
    if (result.error) { Alert.alert('Não foi possível continuar', result.error); return; }
    if (mode === 'signup') { Alert.alert('Conta criada', 'Agora entre para completar seu perfil e, se for aluno, preencher a anamnese.'); setMode('login'); return; }
    router.replace('/');
  }

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.brand}><View style={styles.brandCopy}><Text style={styles.kicker}>TOURO FIT</Text><Text style={styles.brandTitle}>FORÇA PARA{`\n`}EVOLUIR</Text><Muted>Treine com propósito.</Muted></View><Image source={require('../assets/touro-mascot.png')} style={styles.mascot} resizeMode="contain" /></View>
    <View style={styles.formHeader}><Label>{mode === 'login' ? 'Acesso à plataforma' : 'Primeiro passo'}</Label><Title>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</Title><Subtitle>{mode === 'login' ? 'Continue sua evolução de onde parou.' : 'Monte sua rotina e treine com acompanhamento.'}</Subtitle></View>
    <View style={styles.form}>
      {mode === 'signup' && <Input placeholder="Nome completo" value={fullName} onChangeText={setFullName} autoCapitalize="words" />}
      <Input placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <View style={styles.passwordWrap}><Input style={styles.passwordInput} placeholder="Senha (mínimo 6 caracteres)" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} style={styles.eye} onPress={() => setShowPassword((visible) => !visible)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} /></Pressable></View>
      {mode === 'signup' && <View style={styles.roleBox}><Text style={styles.roleLabel}>Você é</Text><View style={styles.roleRow}>{(['aluno', 'professor'] as UserRole[]).map((item) => <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleChip, role === item && styles.roleChipActive]}><Text style={[styles.roleText, role === item && styles.roleTextActive]}>{item === 'aluno' ? 'Aluno' : 'Professor'}</Text></Pressable>)}</View></View>}
      <Button label={mode === 'login' ? 'Entrar na conta' : 'Criar conta'} onPress={onSubmit} loading={loading} />
      <Pressable accessibilityRole="button" onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}><Text style={styles.switch}>{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta — entrar'}</Text></Pressable>
    </View>
    <Text style={styles.legal}>Ao continuar, você concorda com os termos de uso do Touro Fit.</Text>
  </ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1, backgroundColor: colors.bg }, content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg }, brand: { minHeight: 220, backgroundColor: colors.black, borderRadius: radius.md, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end', paddingLeft: spacing.lg }, brandCopy: { flex: 1, paddingBottom: spacing.lg, gap: 8 }, kicker: { color: colors.red, fontWeight: '900', letterSpacing: 2, fontSize: 12 }, brandTitle: { color: colors.surface, fontFamily: typography.display, fontWeight: '900', fontSize: 32, lineHeight: 34 }, mascot: { width: 170, height: 210, marginRight: -8, marginBottom: -4 }, formHeader: { gap: 6 }, form: { gap: spacing.sm }, passwordWrap: { position: 'relative', justifyContent: 'center' }, passwordInput: { paddingRight: 52 }, eye: { position: 'absolute', right: 14, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, roleBox: { gap: 8 }, roleLabel: { color: colors.muted, fontWeight: '800', fontSize: 13 }, roleRow: { flexDirection: 'row', gap: spacing.xs }, roleChip: { flex: 1, minHeight: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }, roleChipActive: { borderColor: colors.red, backgroundColor: colors.redSoft }, roleText: { color: colors.muted, fontWeight: '800' }, roleTextActive: { color: colors.red }, switch: { color: colors.ink, textAlign: 'center', fontWeight: '800', paddingVertical: 8 }, legal: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 } });
