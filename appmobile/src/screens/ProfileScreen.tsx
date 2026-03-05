import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {updateAvatar} from '../api/players';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';

interface Props {
  user: LoginResponse;
  onLogout: () => void;
  onEditUsername: () => void;
  onEditEmail: () => void;
  onAvatarChanged: (url: string) => void;
}

function Avatar({user, onPress, uploading}: {user: LoginResponse; onPress: () => void; uploading: boolean}) {
  const size = 88;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.avatarWrapper} testID="avatar-button">
      {user.avatarUrl ? (
        <Image
          source={{uri: user.avatarUrl}}
          style={[styles.avatarImage, {width: size, height: size, borderRadius: size / 2}]}
        />
      ) : (
        <View style={[styles.avatarFallback, {width: size, height: size, borderRadius: size / 2}]}>
          <Text style={styles.avatarInitials}>{user.username.slice(0, 2).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.avatarBadge}>
        {uploading ? (
          <ActivityIndicator color={colors.primaryText} size={12} />
        ) : (
          <Text style={styles.avatarBadgeText}>✎</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface MenuItemProps {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}

function MenuItem({label, value, onPress, danger, testID}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.65}
      testID={testID}>
      <Text style={[styles.menuLabel, danger && {color: colors.error}]}>{label}</Text>
      <View style={styles.menuRight}>
        {value ? <Text style={styles.menuValue} numberOfLines={1}>{value}</Text> : null}
        {!danger && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export function ProfileScreen({user, onLogout, onEditUsername, onEditEmail, onAvatarChanged}: Props) {
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Encerrar sessão', 'Deseja sair da sua conta?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Sair', style: 'destructive', onPress: onLogout},
    ]);
  };

  const handleAvatarPress = () => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800},
      async response => {
        if (response.didCancel || response.errorCode) {return;}
        const asset = response.assets?.[0];
        if (!asset?.uri) {return;}

        setUploading(true);
        try {
          const url = await updateAvatar(
            user.token,
            user.playerId,
            asset.uri,
            asset.fileName ?? 'avatar.jpg',
            asset.type ?? 'image/jpeg',
          );
          onAvatarChanged(url);
        } catch (e: any) {
          Alert.alert('Erro', e.message ?? 'Não foi possível enviar a imagem.');
        } finally {
          setUploading(false);
        }
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <Avatar user={user} onPress={handleAvatarPress} uploading={uploading} />
          <Text style={styles.displayName}>{user.username}</Text>
          <Text style={styles.emailLabel}>{user.email}</Text>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.card}>
            <MenuItem
              label="Nome de usuário"
              value={user.username}
              onPress={onEditUsername}
            />
            <View style={styles.separator} />
            <MenuItem
              label="E-mail"
              value={user.email}
              onPress={onEditEmail}
            />
          </View>
        </View>

        {/* Session section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem
              label="Sair"
              danger
              onPress={handleLogout}
              testID="logout-button"
            />
          </View>
        </View>

        <Text style={styles.version}>Damas · v0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {paddingBottom: 32},

  profileHeader: {alignItems: 'center', paddingTop: 36, paddingBottom: 36},
  avatarWrapper: {position: 'relative', marginBottom: 14},
  avatarFallback: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarImage: {
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarInitials: {color: colors.text, fontWeight: '700', fontSize: 32},
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  avatarBadgeText: {
    color: colors.primaryText,
    fontSize: 13,
  },
  displayName: {color: colors.text, fontSize: 22, fontWeight: '700'},
  emailLabel: {color: colors.textSecondary, fontSize: 14, marginTop: 4},

  section: {paddingHorizontal: 20, marginBottom: 14},
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuLabel: {color: colors.text, fontSize: 15},
  menuRight: {flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end'},
  menuValue: {color: colors.textSecondary, fontSize: 14, maxWidth: 150},
  chevron: {color: colors.textMuted, fontSize: 22, fontWeight: '300'},
  separator: {height: 1, backgroundColor: colors.border, marginHorizontal: 18},
  version: {color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8},
});
