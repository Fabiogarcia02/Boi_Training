import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button, Input, Screen, Subtitle, Title } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setLoadingAvatar(true);
      try {
        const uri = result.assets[0].uri;
        const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
        const fileName = `${profile?.id}/${Date.now()}.${ext}`;

        const res = await fetch(uri);
        const blob = await res.blob();

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: true,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        setAvatarUrl(publicUrl);
      } catch (err: any) {
        Alert.alert('Erro', 'Falha ao fazer upload da imagem.');
        console.warn(err);
      } finally {
        setLoadingAvatar(false);
      }
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const newName = fullName.trim();
    const newAvatar = avatarUrl.trim() || null;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: newName,
        avatar_url: newAvatar,
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
      console.warn(error.message);
    } else {
      await refreshProfile();
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.back();
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <Screen>
      <Title>Editar Perfil</Title>
      <Subtitle>Atualize seu nome e avatar</Subtitle>

      <View style={styles.form}>
        <Pressable onPress={pickImage} style={styles.avatarContainer}>
          {loadingAvatar ? (
            <View style={[styles.avatar, styles.avatarLoading]}>
              <ActivityIndicator color={colors.red} />
            </View>
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
        </Pressable>

        <Input
          placeholder="Nome completo"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        <Input
          placeholder="URL do Avatar (opcional)"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Button label="Salvar alterações" onPress={handleSave} loading={saving} disabled={loadingAvatar} />

        <View style={styles.spacer} />

        <Button
          label="Sair do aplicativo"
          onPress={handleSignOut}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    borderStyle: 'dashed',
  },
  spacer: {
    height: spacing.xl,
  },
});
