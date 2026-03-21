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
import {useTranslation} from 'react-i18next';
import {WEB_URL} from '@env';
import {useProfileScreen} from '../hooks/useProfileScreen';
import {useLanguage} from '../hooks/useLanguage';
import {pubkeyToShortNpub} from '../utils/nostr';
import {styles} from '../styles/profileStyles';
import {APP_VERSION} from '../api/appVersion';
import type {LoginResponse} from '../types/auth';
import {SafeAreaView} from 'react-native-safe-area-context';

interface Props {
  user: LoginResponse;
  onLogout: () => void;
  onEditUsername: () => void;
  onEditEmail: () => void;
  onAvatarChanged: (url: string) => void;
  onOpenHistory: () => void;
  lightningAddress?: string | null;
  onEditLightningAddress: () => void;
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
        {!danger && !!onPress && <Text style={styles.chevron}>›</Text>}
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
  lightningAddress,
  onEditLightningAddress,
}: Props) {
  const {t} = useTranslation();
  const {currentLanguage, setLanguage, options: langOptions} = useLanguage();
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
          {user.nostrPubKey
            ? <Text style={styles.emailLabel}>{pubkeyToShortNpub(user.nostrPubKey)}</Text>
            : user.email
              ? <Text style={styles.emailLabel}>{user.email}</Text>
              : null}
        </View>

        {/* Stats */}
        <View style={{flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14}}>
          {[
            {label: t('profile.stats.games'), value: stats?.total ?? '—'},
            {label: t('profile.stats.wins'), value: stats?.wins ?? '—'},
            {label: t('profile.stats.losses'), value: stats?.losses ?? '—'},
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
          <Text style={styles.sectionTitle}>{t('profile.sections.account')}</Text>
          <View style={styles.card}>
            <MenuItem label={t('profile.items.username')} value={user.username} onPress={onEditUsername} />
            <View style={styles.separator} />
            <MenuItem
              label={t('profile.items.email')}
              value={user.email ?? undefined}
              onPress={user.nostrPubKey ? undefined : onEditEmail}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.sections.lightning')}</Text>
          <View style={styles.card}>
            <MenuItem
              label={t('profile.items.lightningAddress')}
              value={lightningAddress || undefined}
              onPress={onEditLightningAddress}
              testID="lightning-address-item"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.sections.history')}</Text>
          <View style={styles.card}>
            <MenuItem label={t('profile.items.gameHistory')} onPress={onOpenHistory} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language.label')}</Text>
          <View style={styles.card}>
            <View style={[styles.menuItem, {justifyContent: 'flex-start', gap: 10}]}>
              {langOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setLanguage(opt.value)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: currentLanguage === opt.value ? '#fff' : '#333',
                    backgroundColor: currentLanguage === opt.value ? '#fff' : 'transparent',
                    marginLeft: idx > 0 ? 0 : 0,
                  }}>
                  <Text
                    style={{
                      color: currentLanguage === opt.value ? '#000' : '#666',
                      fontWeight: '600',
                      fontSize: 13,
                    }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.sections.legal')}</Text>
          <View style={styles.card}>
            <MenuItem label={t('profile.items.terms')} onPress={() => Linking.openURL(`${WEB_URL}/termos`)} />
            <View style={styles.separator} />
            <MenuItem label={t('profile.items.privacy')} onPress={() => Linking.openURL(`${WEB_URL}/privacidade`)} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem label={t('profile.items.deleteAccount')} danger onPress={handleDeleteAccount} testID="delete-account-button" />
            <View style={styles.separator} />
            <MenuItem label={t('profile.items.logout')} danger onPress={handleLogout} testID="logout-button" />
            {/* <View style={styles.separator} /> */}
            {/* <MenuItem label="Excluir Conta" danger onPress={handleDeleteAccount} testID="delete-account-button" /> */}
          </View>
        </View>

        <Text style={styles.version}>{t('profile.version', {version: APP_VERSION})}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
