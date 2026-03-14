import {Platform, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

export const chatInputBarStyles = StyleSheet.create({
  // ─── Outer wrapper (mentions + row) ──────────────────────────────────────────
  wrapper: {
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  // ─── @mention suggestions panel ──────────────────────────────────────────────
  mentionsPanel: {
    backgroundColor: '#111111',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    maxHeight: 220,
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1C1C1C',
  },
  mentionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionAvatarText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  mentionInfo: {
    flex: 1,
    gap: 1,
  },
  mentionName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  mentionHandle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  mentionOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CAF50',
  },

  // ─── Input row ────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 11 : 7,
    margin: 0,
    padding: 0,
  },

  // ─── Send button ──────────────────────────────────────────────────────────────
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  sendBtnOff: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
});
