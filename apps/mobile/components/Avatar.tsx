import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { resolveAvatarUrl } from '../lib/avatar';

export function Avatar({ name, value, size = 48 }: { name: string; value?: string | null; size?: number }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => { let active = true; resolveAvatarUrl(value).then((url) => { if (active) setUri(url); }); return () => { active = false; }; }, [value]);
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}><Text style={[styles.initial, { fontSize: Math.max(16, size * 0.38) }]}>{name.slice(0, 1).toUpperCase() || '?'}</Text></View>;
}
const styles = StyleSheet.create({ fallback: { backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' }, initial: { color: colors.red, fontWeight: '800' } });
