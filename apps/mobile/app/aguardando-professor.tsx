import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button, Card, Label, Muted, Screen, Subtitle, Title } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function WaitingForCoach() {
  const { profile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  async function checkAgain() {
    if (!profile) return;
    setChecking(true);
    const { data, error } = await supabase.from('coach_students').select('id').eq('student_id', profile.id).limit(1);
    setChecking(false);
    if (error) { Alert.alert('Não foi possível verificar', error.message); return; }
    if ((data ?? []).length > 0) Alert.alert('Vínculo encontrado', 'Feche e abra o app para carregar seus treinos.');
  }
  return <Screen style={styles.screen}><Text style={styles.mark}>TF</Text><Label>Acesso pendente</Label><Title>Aguardando seu professor</Title><Subtitle>Para acessar os treinos, um professor precisa vincular seu cadastro à equipe dele.</Subtitle><Card style={styles.card}><Text style={styles.cardTitle}>Como liberar o acesso</Text><Muted>Envie seu e-mail ao professor. Assim que ele fizer o vínculo, toque em verificar novamente.</Muted><Button label="Verificar vínculo" onPress={checkAgain} loading={checking} /></Card><Text style={styles.logout} onPress={signOut}>Sair</Text></Screen>;
}

const styles = StyleSheet.create({ screen: { justifyContent: 'center', gap: spacing.md }, mark: { color: colors.red, fontSize: 22, fontWeight: '900', letterSpacing: 2 }, card: { gap: spacing.md }, cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, logout: { color: colors.muted, textAlign: 'center', fontWeight: '800' } });
