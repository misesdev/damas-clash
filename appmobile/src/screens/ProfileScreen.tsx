import React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {WEB_URL} from '@env';
import {useProfileScreen} from '../hooks/useProfileScreen';
import {styles} from '../styles/profileStyles';
import type {LoginResponse} from '../types/auth';
import {SafeAreaView} from 'react-native-safe-area-context';

interface Props {
  user: LoginResponse;
  onLogout: () => void;
  onEditUsername: () => void;
  onEditEmail: () => void;
  onAvatarChanged: (url: string) => void;
  onOpenHistory: () => void;
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
  onOpenHistory,
}: Props) {
  const {uploading, stats, handleLogout, handleDeleteAccount, handleAvatarPress} = useProfileScreen(
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

        {/* Stats */}
        <View style={{flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14}}>
          {[
            {label: 'Partidas', value: stats?.total ?? '—'},
            {label: 'Vitórias', value: stats?.wins ?? '—'},
            {label: 'Derrotas', value: stats?.losses ?? '—'},
          ].map(stat => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: '#131313',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#232323',
                paddingVertical: 14,
                alignItems: 'center',
              }}>
              <Text style={{color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 26}}>
                {stat.value}
              </Text>
              <Text style={{color: '#4e4e4e', fontSize: 10, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5}}>
                {stat.label}
              </Text>
            </View>
          ))}
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
          <Text style={styles.sectionTitle}>Histórico</Text>
          <View style={styles.card}>
            <MenuItem label="Partidas jogadas" onPress={onOpenHistory} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jurídico</Text>
          <View style={styles.card}>
            <MenuItem label="Termos de Uso" onPress={() => Linking.openURL(`${WEB_URL}/termos`)} />
            <View style={styles.separator} />
            <MenuItem label="Política de Privacidade" onPress={() => Linking.openURL(`${WEB_URL}/privacidade`)} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem label="Excluir Conta" danger onPress={handleDeleteAccount} testID="delete-account-button" />
            <View style={styles.separator} />
            <MenuItem label="Sair" danger onPress={handleLogout} testID="logout-button" />
            {/* <View style={styles.separator} /> */}
            {/* <MenuItem label="Excluir Conta" danger onPress={handleDeleteAccount} testID="delete-account-button" /> */}
          </View>
        </View>

        <Text style={styles.version}>Damas Clash · v1.3</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
