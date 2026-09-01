import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Input, Label, Muted, Title } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { resolveAvatarUrl } from '../lib/avatar';
import { Avatar } from '../components/Avatar';

export default function PerfilScreen() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? ''); const [avatar, setAvatar] = useState(profile?.avatar_url ?? ''); const [bio, setBio] = useState(profile?.bio ?? ''); const [phone, setPhone] = useState(profile?.phone ?? ''); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false);
  if (!profile) return null;
  const currentProfile = profile;
  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher sua imagem de perfil.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0]; const response = await fetch(asset.uri); const bytes = await response.arrayBuffer(); const extension = asset.mimeType === 'image/png' ? 'png' : asset.mimeType === 'image/webp' ? 'webp' : 'jpg'; const path = `${currentProfile.id}/profile.${extension}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const signedUrl = await resolveAvatarUrl(path);
      const { error: profileError } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', currentProfile.id);
      if (profileError) throw profileError;
      setAvatar(signedUrl ?? ''); await refreshProfile();
    } catch (error) { Alert.alert('Não foi possível enviar a foto', error instanceof Error ? error.message : 'Tente novamente.'); } finally { setUploading(false); }
  }
  async function save() {
    if (!name.trim()) { Alert.alert('Informe seu nome', 'O nome completo é obrigatório.'); return; }
    setSaving(true); const { error } = await supabase.from('profiles').update({ full_name: name.trim(), bio: bio.trim(), phone: phone.trim() || null }).eq('id', currentProfile.id); setSaving(false);
    if (error) Alert.alert('Não foi possível salvar', error.message); else { await refreshProfile(); Alert.alert('Perfil atualizado', 'Suas alterações foram salvas.'); }
  }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Label>Meu perfil</Label><Title>{profile.role === 'professor' ? 'Perfil do professor' : 'Perfil do aluno'}</Title><Muted>Estas informações serão compartilhadas entre professor e aluno.</Muted>
    <Card style={styles.card}><View style={styles.avatarWrap}><Avatar name={name} value={avatar} size={120} /></View><Button label={uploading ? 'Enviando foto…' : 'Escolher foto da galeria'} variant="ghost" onPress={choosePhoto} disabled={uploading} />
      <View><Muted>Nome completo</Muted><Input placeholder="Digite seu nome" value={name} onChangeText={setName} /></View><View><Muted>Telefone</Muted><Input placeholder="(00) 00000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View><View><Muted>Sobre você</Muted><Input placeholder="Conte um pouco sobre sua experiência e objetivos" value={bio} onChangeText={setBio} multiline style={styles.bio} /></View><Button label="Salvar perfil" onPress={save} loading={saving} /></Card>
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 }, card: { gap: spacing.md }, avatarWrap: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' }, bio: { minHeight: 100, textAlignVertical: 'top' } });
