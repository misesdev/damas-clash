import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';

export type TabName = 'home' | 'profile';

interface Props {
  active: TabName;
  onPress: (tab: TabName) => void;
  onNewGame: () => void;
  creating?: boolean;
}

export function BottomTabBar({active, onPress, onNewGame, creating}: Props) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, {paddingBottom: Math.max(16, insets.bottom)}]}>
      {/* Subtle separator */}
      <View style={styles.separator} />

      <View style={styles.row}>
        {/* Partidas */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onPress('home')}
          activeOpacity={0.7}
          testID="tab-home">
          <BoardIcon active={active === 'home'} />
          <Text style={[styles.label, active === 'home' && styles.labelActive]}>
            {t('bottomTab.games')}
          </Text>
        </TouchableOpacity>

        {/* Nova Partida — center action */}
        <View style={styles.centerWrapper}>
          <TouchableOpacity
            style={styles.centerBtn}
            onPress={onNewGame}
            disabled={creating}
            activeOpacity={0.85}
            testID="new-game-button">
            {creating ? (
              <ActivityIndicator color={colors.primaryText} size="small" />
            ) : (
              <>
                <Text style={styles.centerPlus}>+</Text>
                <Text style={styles.centerLabel}>{t('bottomTab.newGame')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Perfil */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onPress('profile')}
          activeOpacity={0.7}
          testID="tab-profile">
          <ProfileIcon active={active === 'profile'} />
          <Text style={[styles.label, active === 'profile' && styles.labelActive]}>
            {t('bottomTab.profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BoardIcon({active}: {active: boolean}) {
  const c = active ? colors.text : colors.textMuted;
  return (
    <View style={styles.icon}>
      <View style={styles.iconRow}>
        <View style={[styles.cell, {backgroundColor: c}]} />
        <View style={[styles.cell, {backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c}]} />
      </View>
      <View style={styles.iconRow}>
        <View style={[styles.cell, {backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c}]} />
        <View style={[styles.cell, {backgroundColor: c}]} />
      </View>
    </View>
  );
}

function ProfileIcon({active}: {active: boolean}) {
  const c = active ? colors.text : colors.textMuted;
  return (
    <View style={styles.icon}>
      <View style={[styles.profileHead, {borderColor: c}]} />
      <View style={[styles.profileBody, {borderColor: c}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },

  // Center action button
  centerWrapper: {
    flex: 1.6,
    alignItems: 'center',
    // Floats above the bar
    marginTop: -26,
  },
  centerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 6,
    // Shadow (iOS)
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    // Elevation (Android)
    elevation: 8,
  },
  centerPlus: {
    color: colors.primaryText,
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 20,
    marginTop: -1,
  },
  centerLabel: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Icons
  icon: {width: 22, height: 22, justifyContent: 'center', alignItems: 'center'},
  iconRow: {flexDirection: 'row', gap: 2, marginBottom: 2},
  cell: {width: 8, height: 8, borderRadius: 1.5},
  profileHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    marginBottom: 2,
  },
  profileBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
});
