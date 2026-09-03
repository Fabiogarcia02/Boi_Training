import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export type ChartPoint = { label: string; value: number };

export function MiniBarChart({ data, suffix = '' }: { data: ChartPoint[]; suffix?: string }) {
  const max = Math.max(...data.map((point) => point.value), 1);
  return <View style={styles.wrap} accessibilityRole="summary">
    <View style={styles.chart}>{data.map((point, index) => <View key={`${point.label}-${index}`} style={styles.column}><Text style={styles.value}>{point.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{suffix}</Text><View style={styles.track}><View style={[styles.bar, { height: `${Math.max(8, (point.value / max) * 100)}%` }]} /></View><Text style={styles.label} numberOfLines={1}>{point.label}</Text></View>)}</View>
  </View>;
}

const styles = StyleSheet.create({ wrap: { width: '100%' }, chart: { minHeight: 180, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }, column: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5 }, track: { width: '70%', maxWidth: 42, height: 120, borderRadius: radius.sm, backgroundColor: colors.secondary, overflow: 'hidden', justifyContent: 'flex-end' }, bar: { width: '100%', backgroundColor: colors.red, borderRadius: radius.sm }, value: { color: colors.ink, fontSize: 10, fontWeight: '800' }, label: { color: colors.muted, fontSize: 10, width: '100%', textAlign: 'center' } });
