import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';
import { NotificationBell } from '../../components/NotificationBell';

export default function ProfessorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        contentStyle: { backgroundColor: colors.bg },
        headerRight: () => <NotificationBell />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Alunos' }} />
      <Stack.Screen name="student/[id]" options={{ title: 'Aluno' }} />
      <Stack.Screen name="student/history" options={{ title: 'Histórico da anamnese' }} />
      <Stack.Screen name="workout/new" options={{ title: 'Novo treino' }} />
      <Stack.Screen name="library/index" options={{ title: 'Biblioteca' }} />
      <Stack.Screen name="library/[id]" options={{ title: 'Exercício' }} />
      <Stack.Screen name="agenda" options={{ title: 'Agenda' }} />
    </Stack>
  );
}
