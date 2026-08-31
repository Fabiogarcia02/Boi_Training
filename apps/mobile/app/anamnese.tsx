import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Input, Label, Muted, Screen, Subtitle, Title } from '../components/ui';
import { colors, radius, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const parqQuestions = [
  'Seu médico já disse que você possui um problema cardíaco e recomendou exercícios apenas sob supervisão?',
  'Você sente dor no peito provocada por exercícios?',
  'Você sentiu dor no peito no último mês?',
  'Você já perdeu a consciência ou sofreu uma queda por causa de tontura?',
  'Você tem algum problema ósseo ou articular que pode piorar com exercícios?',
  'Algum médico já prescreveu medicamento para pressão ou coração?',
  'Você conhece algum motivo que poderia impedir exercícios sem supervisão médica?',
];
const initial = {
  assessment_date: new Date().toISOString().slice(0, 10), birth_date: '', height_cm: '', weight_kg: '',
  resting_heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
  health_conditions: [] as string[], other_condition: '', injuries: '', injury_details: '',
  recent_surgery: '', surgery_details: '', surgery_date: '', spine_pain: [] as string[],
  medical_restriction: '', restriction_details: '', medications: '', medication_details: '',
  supplements: '', supplement_details: '', alcohol_use: '', tobacco_use: '', weekend_habits: '',
  available_training_days: [] as string[], emergency_contact: '', goals: [] as string[], parq_answers: {} as Record<string, boolean>, observations: '',
};

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{selected ? '✓  ' : ''}{label}</Text>
  </Pressable>;
}

export default function AnamnesisScreen() {
  const { profile, signOut } = useAuth();
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: 'health_conditions' | 'spine_pain' | 'available_training_days' | 'goals', value: string) => {
    const current = form[key];
    set(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };
  const progress = useMemo(() => `${step} de 5`, [step]);

  useEffect(() => {
    if (!profile) return;
    supabase.from('student_anamneses').select('*').eq('student_id', profile.id).maybeSingle().then(({ data }) => {
      if (!data || data.is_complete) return;
      setForm((current) => ({
        ...current,
        ...data,
        health_conditions: data.health_conditions ? String(data.health_conditions).split(', ') : [],
        goals: data.goal ? String(data.goal).split(', ') : [],
        available_training_days: data.available_training_days ?? [],
        parq_answers: data.parq_answers ?? {},
        height_cm: data.height_cm ? String(data.height_cm) : '', weight_kg: data.weight_kg ? String(data.weight_kg) : '',
        resting_heart_rate: data.resting_heart_rate ? String(data.resting_heart_rate) : '',
        blood_pressure_systolic: data.blood_pressure_systolic ? String(data.blood_pressure_systolic) : '',
        blood_pressure_diastolic: data.blood_pressure_diastolic ? String(data.blood_pressure_diastolic) : '',
      }));
      setStarted(true);
      setStep(1);
    });
  }, [profile]);

  async function saveDraft(complete = false) {
    if (!profile) return false;
    setSaving(true);
    const { error } = await supabase.from('student_anamneses').upsert({
      student_id: profile.id, assessment_date: form.assessment_date || null, birth_date: form.birth_date || null,
      height_cm: form.height_cm ? Number(form.height_cm.replace(',', '.')) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg.replace(',', '.')) : null,
      resting_heart_rate: form.resting_heart_rate ? Number(form.resting_heart_rate) : null,
      blood_pressure_systolic: form.blood_pressure_systolic ? Number(form.blood_pressure_systolic) : null,
      blood_pressure_diastolic: form.blood_pressure_diastolic ? Number(form.blood_pressure_diastolic) : null,
      health_conditions: form.health_conditions.join(', ') || 'Nenhuma informada', injuries: form.injuries || 'Não',
      medications: form.medications || 'Não', exercise_restrictions: form.medical_restriction || 'Não',
      available_training_days: form.available_training_days, goal: form.goals.join(', ') || 'Não informado',
      experience_level: 'A avaliar', supplements: form.supplement_details || 'Não', alcohol_use: form.alcohol_use || 'Não',
      tobacco_use: form.tobacco_use === 'Sim', weekend_habits: form.weekend_habits, parq_answers: form.parq_answers,
      emergency_contact: form.emergency_contact || 'Não informado', observations: form.observations, consent: complete, is_complete: complete, completed_at: complete ? new Date().toISOString() : null,
    }, { onConflict: 'student_id' });
    setSaving(false);
    if (error) { Alert.alert('Não foi possível salvar', error.message); return false; }
    return true;
  }

  async function next() {
    if (step === 3 && form.available_training_days.length === 0) { Alert.alert('Disponibilidade', 'Escolha pelo menos um dia para treinar.'); return; }
    if (step === 4) {
      if (form.goals.length === 0 || Object.keys(form.parq_answers).length < parqQuestions.length) { Alert.alert('Complete esta etapa', 'Selecione seus objetivos e responda todas as perguntas do PAR-Q.'); return; }
      if (await saveDraft(true)) setSuccess(true);
      return;
    }
    if (await saveDraft()) setStep((current) => current + 1);
  }

  if (success) return <Screen style={styles.success}><Image source={require('../assets/touro-mascot.png')} style={styles.successMascot} resizeMode="contain" /><Text style={styles.successMark}>✓</Text><Title>Anamnese concluída!</Title><Subtitle>Suas informações foram registradas e seu professor já poderá consultá-las.</Subtitle><Button label="Ir para o início" onPress={() => router.replace('/(aluno)')} /></Screen>;
  if (!started) return <Screen style={styles.intro}><Label>Primeiro acesso</Label><Title>Antes de começar</Title><Subtitle>Precisamos conhecer um pouco mais sobre você para tornar seus treinos mais seguros e adequados aos seus objetivos.</Subtitle><Card style={styles.introCard}><Text style={styles.introTime}>⏱ 5 minutos</Text><Muted>Você poderá voltar e continuar depois sem perder suas respostas.</Muted><Button label="Começar anamnese" onPress={() => setStarted(true)} /></Card><Text style={styles.logout} onPress={signOut}>Sair</Text></Screen>;

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content}><Screen style={styles.screen}>
    <View style={styles.top}><Pressable onPress={() => step > 1 ? setStep(step - 1) : setStarted(false)}><Text style={styles.back}>‹ Anamnese</Text></Pressable><Text style={styles.progressText}>Etapa {progress}</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} /></View>
    {step === 1 && <Card style={styles.card}><Label>01 — Dados básicos</Label><Title>Sobre você</Title><Muted>Vamos começar com algumas informações básicas.</Muted><Input placeholder="Data da avaliação (AAAA-MM-DD)" value={form.assessment_date} onChangeText={(v) => set('assessment_date', v)} /><View style={styles.row}><Input style={styles.half} placeholder="Peso (kg)" value={form.weight_kg} onChangeText={(v) => set('weight_kg', v)} keyboardType="decimal-pad" /><Input style={styles.half} placeholder="Estatura (cm)" value={form.height_cm} onChangeText={(v) => set('height_cm', v)} keyboardType="decimal-pad" /></View><Input placeholder="Data de nascimento (AAAA-MM-DD)" value={form.birth_date} onChangeText={(v) => set('birth_date', v)} /><Input placeholder="Frequência cardíaca em repouso (bpm)" value={form.resting_heart_rate} onChangeText={(v) => set('resting_heart_rate', v)} keyboardType="number-pad" /><View style={styles.row}><Input style={styles.half} placeholder="PA sistólica" value={form.blood_pressure_systolic} onChangeText={(v) => set('blood_pressure_systolic', v)} keyboardType="number-pad" /><Input style={styles.half} placeholder="PA diastólica" value={form.blood_pressure_diastolic} onChangeText={(v) => set('blood_pressure_diastolic', v)} keyboardType="number-pad" /></View></Card>}
    {step === 2 && <Card style={styles.card}><Label>02 — Histórico de saúde</Label><Title>Saúde e limitações</Title><Muted>Selecione todas as opções que se aplicam.</Muted><Text style={styles.question}>Condições de saúde</Text>{['Hipertensão', 'Diabetes', 'Problemas de tireoide', 'Doenças pulmonares', 'Problemas cardíacos', 'Problemas osteoarticulares', 'Nenhuma'].map((item) => <Choice key={item} label={item} selected={form.health_conditions.includes(item)} onPress={() => item === 'Nenhuma' ? set('health_conditions', form.health_conditions.includes('Nenhuma') ? [] : ['Nenhuma']) : set('health_conditions', [...form.health_conditions.filter((v) => v !== 'Nenhuma'), ...(form.health_conditions.includes(item) ? [] : [item])])} />)}<Text style={styles.question}>Possui lesão, dor ou limitação?</Text><View style={styles.row}>{['Não', 'Sim'].map((item) => <Choice key={item} label={item} selected={form.injuries === item} onPress={() => set('injuries', item)} />)}</View>{form.injuries === 'Sim' && <Input placeholder="Conte quais e em qual região" value={form.injury_details} onChangeText={(v) => set('injury_details', v)} multiline />}<Text style={styles.question}>Dores na coluna</Text>{['Cervical', 'Torácica', 'Lombar', 'Não sinto dores'].map((item) => <Choice key={item} label={item} selected={form.spine_pain.includes(item)} onPress={() => item === 'Não sinto dores' ? set('spine_pain', form.spine_pain.includes(item) ? [] : [item]) : set('spine_pain', [...form.spine_pain.filter((v) => v !== 'Não sinto dores'), ...(form.spine_pain.includes(item) ? [] : [item])])} />)}<Text style={styles.question}>Restrição médica?</Text><View style={styles.row}>{['Não', 'Sim'].map((item) => <Choice key={item} label={item} selected={form.medical_restriction === item} onPress={() => set('medical_restriction', item)} />)}</View>{form.medical_restriction === 'Sim' && <Input placeholder="Qual restrição?" value={form.restriction_details} onChangeText={(v) => set('restriction_details', v)} multiline />}<Text style={styles.question}>Usa medicamentos continuamente?</Text><View style={styles.row}>{['Não', 'Sim'].map((item) => <Choice key={item} label={item} selected={form.medications === item} onPress={() => set('medications', item)} />)}</View>{form.medications === 'Sim' && <Input placeholder="Qual(is)?" value={form.medication_details} onChangeText={(v) => set('medication_details', v)} multiline />}</Card>}
    {step === 3 && <Card style={styles.card}><Label>03 — Hábitos e rotina</Label><Title>Sua rotina</Title><Muted>Alguns hábitos influenciam seu treino e sua recuperação.</Muted><Text style={styles.question}>Dias disponíveis para treinar</Text>{days.map((day) => <Choice key={day} label={day} selected={form.available_training_days.includes(day)} onPress={() => toggle('available_training_days', day)} />)}<Text style={styles.question}>Consome bebidas alcoólicas?</Text><View style={styles.row}>{['Não', 'Sim'].map((v) => <Choice key={v} label={v} selected={form.alcohol_use === v} onPress={() => set('alcohol_use', v)} />)}</View><Text style={styles.question}>Fuma ou utiliza tabaco?</Text><View style={styles.row}>{['Não', 'Sim'].map((v) => <Choice key={v} label={v} selected={form.tobacco_use === v} onPress={() => set('tobacco_use', v)} />)}</View><Input placeholder="Como costuma ser seu final de semana?" value={form.weekend_habits} onChangeText={(v) => set('weekend_habits', v)} multiline /><Input placeholder="Usa suplementos ou vitaminas? Quais?" value={form.supplement_details} onChangeText={(v) => set('supplement_details', v)} multiline /><Input placeholder="Contato de emergência (nome e telefone)" value={form.emergency_contact} onChangeText={(v) => set('emergency_contact', v)} /></Card>}
    {step === 4 && <Card style={styles.card}><Label>04 — Objetivos</Label><Title>O que você busca?</Title><Muted>Você pode selecionar mais de uma opção.</Muted>{['Hipertrofia muscular', 'Capacidade aeróbica', 'Saúde e qualidade de vida', 'Fortalecimento muscular', 'Condicionamento geral', 'Perda de peso', 'Recomendação médica', 'Estética'].map((goal) => <Choice key={goal} label={goal} selected={form.goals.includes(goal)} onPress={() => toggle('goals', goal)} />)}<Label>05 — PAR-Q</Label><Title>Prontidão para atividade física</Title><Muted>Responda com atenção. Uma resposta “Sim” será sinalizada para o professor avaliar.</Muted>{parqQuestions.map((question, index) => <View key={question} style={styles.parq}><Text style={styles.question}>{index + 1}. {question}</Text><View style={styles.row}>{['Não', 'Sim'].map((answer) => <Choice key={answer} label={answer} selected={form.parq_answers[String(index)] === (answer === 'Sim')} onPress={() => set('parq_answers', { ...form.parq_answers, [String(index)]: answer === 'Sim' })} />)}</View></View>)}<Input placeholder="Algo importante para seu professor? (opcional)" value={form.observations} onChangeText={(v) => set('observations', v)} multiline /><Muted>Ao concluir, você declara que as informações fornecidas são verdadeiras e autoriza seu uso para orientar seus treinos.</Muted></Card>}
    <View style={styles.actions}>{step > 1 && <Button label="Voltar" variant="ghost" onPress={() => setStep(step - 1)} />}<Button label={step === 4 ? 'Concluir anamnese' : 'Continuar'} onPress={next} loading={saving} /></View>
  </Screen></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1, backgroundColor: colors.bg }, content: { flexGrow: 1 }, screen: { paddingBottom: 40, gap: spacing.md }, intro: { justifyContent: 'center', gap: spacing.md }, introCard: { gap: spacing.md }, introTime: { color: colors.ink, fontWeight: '800', fontSize: 16 }, success: { justifyContent: 'center', gap: spacing.md }, successMascot: { width: 180, height: 220, alignSelf: 'center' }, successMark: { color: colors.red, fontSize: 56, fontWeight: '800' }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, back: { color: colors.ink, fontWeight: '800', fontSize: 15 }, progressText: { color: colors.muted, fontWeight: '800', fontSize: 12 }, progressTrack: { height: 6, backgroundColor: colors.secondary, borderRadius: radius.pill, overflow: 'hidden' }, progressFill: { height: 6, backgroundColor: colors.red, borderRadius: radius.pill }, card: { gap: spacing.sm, minWidth: 0 }, question: { color: colors.ink, fontWeight: '800', fontSize: 15, lineHeight: 21, marginTop: spacing.sm }, choice: { minHeight: 46, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary, minWidth: 0, flexShrink: 1 }, choiceSelected: { borderColor: colors.red, backgroundColor: colors.redSoft }, choiceText: { color: colors.ink, fontWeight: '700' }, choiceTextSelected: { color: colors.red }, row: { flexDirection: 'row', gap: spacing.xs, minWidth: 0 }, half: { flex: 1, flexBasis: 0, minWidth: 0, width: 0 }, parq: { gap: spacing.xs }, actions: { gap: spacing.xs }, logout: { textAlign: 'center', color: colors.muted, fontWeight: '700' }, });
