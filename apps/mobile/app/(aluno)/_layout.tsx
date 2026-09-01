import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function AlunoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="workout/[id]" options={{ title: 'Treino' }} />
      <Stack.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Execução', headerShown: false }} />
    </Stack>
  );
}
