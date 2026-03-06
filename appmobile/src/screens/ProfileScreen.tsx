import React from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useProfileScreen} from '../hooks/useProfileScreen';
import {styles} from '../styles/profileStyles';
import type {LoginResponse} from '../types/auth';

interface Props {
  user: LoginResponse;
  onLogout: () => void;
  onEditUsername: () => void;
  onEditEmail: () => void;
  onAvatarChanged: (url: string) => void;
}

const AVATAR_SIZE = 88;

function Avatar({
  user,
  onPress,
  uploading,
}: {
  user: LoginResponse;
  onPress: () => void;
  uploading: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.avatarWrapper}
      testID="avatar-button">
      {user.avatarUrl ? (
        <Image
          source={{uri: user.avatarUrl}}
          style={[
            styles.avatarImage,
            {width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2},
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            {width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2},
          ]}>
          <Text style={styles.avatarInitials}>{user.username.slice(0, 2).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.avatarBadge}>
        {uploading ? (
          <ActivityIndicator color="#fff" size={12} />
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
      <Text style={[styles.menuLabel, danger && {color: '#E74C3C'}]}>{label}</Text>
      <View style={styles.menuRight}>
        {value ? (
          <Text style={styles.menuValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {!danger && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export function ProfileScreen({
  user,
  onLogout,
  onEditUsername,
  onEditEmail,
  onAvatarChanged,
}: Props) {
  const {uploading, handleLogout, handleAvatarPress} = useProfileScreen(
    user,
    onLogout,
    onAvatarChanged,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <Avatar user={user} onPress={handleAvatarPress} uploading={uploading} />
          <Text style={styles.displayName}>{user.username}</Text>
          <Text style={styles.emailLabel}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.card}>
            <MenuItem label="Nome de usuário" value={user.username} onPress={onEditUsername} />
            <View style={styles.separator} />
            <MenuItem label="E-mail" value={user.email} onPress={onEditEmail} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem label="Sair" danger onPress={handleLogout} testID="logout-button" />
          </View>
        </View>

        <Text style={styles.version}>Damas · v0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
