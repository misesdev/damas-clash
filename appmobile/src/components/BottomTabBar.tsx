import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';

export type TabName = 'home' | 'profile';

interface Props {
  active: TabName;
  onPress: (tab: TabName) => void;
}

export function BottomTabBar({active, onPress}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingBottom: Math.max(12, insets.bottom)}]}>
      <TabItem
        label="Partidas"
        icon={<BoardIcon active={active === 'home'} />}
        active={active === 'home'}
        testID="tab-home"
        onPress={() => onPress('home')}
      />
      <TabItem
        label="Perfil"
        icon={<ProfileIcon active={active === 'profile'} />}
        active={active === 'profile'}
        testID="tab-profile"
        onPress={() => onPress('profile')}
      />
    </View>
  );
}

interface TabItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  testID?: string;
  onPress: () => void;
}

function TabItem({label, icon, active, testID, onPress}: TabItemProps) {
  const color = active ? colors.text : colors.textMuted;
  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}>
      {icon}
      <Text style={[styles.label, {color}]}>{label}</Text>
      {active && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

function BoardIcon({active}: {active: boolean}) {
  const c = active ? colors.text : colors.textMuted;
  return (
    <View style={styles.icon}>
      <View style={styles.iconRow}>
        <View style={[styles.cell, {backgroundColor: c}]} />
        <View style={[styles.cell, {backgroundColor: 'transparent', borderWidth: 1, borderColor: c}]} />
      </View>
      <View style={styles.iconRow}>
        <View style={[styles.cell, {backgroundColor: 'transparent', borderWidth: 1, borderColor: c}]} />
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
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {fontSize: 10, fontWeight: '500', letterSpacing: 0.3},
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text,
    marginTop: 2,
  },
  icon: {width: 22, height: 22, justifyContent: 'center', alignItems: 'center'},
  iconRow: {flexDirection: 'row', gap: 2, marginBottom: 2},
  cell: {width: 8, height: 8, borderRadius: 1},
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
