import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function ProfessorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Alunos' }} />
      <Stack.Screen name="student/[id]" options={{ title: 'Aluno' }} />
      <Stack.Screen name="workout/new" options={{ title: 'Novo treino' }} />
    </Stack>
  );
}
