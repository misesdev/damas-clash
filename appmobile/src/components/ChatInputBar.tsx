import React from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableNativeFeedback,
  View,
  Platform,
} from 'react-native';
import {Icon} from './Icon';
import {colors} from '../theme/colors';
import {chatInputBarStyles as s} from '../styles/chatInputBarStyles';
import type {MentionCandidate} from '../hooks/useChatScreen';

// ─── Mention suggestions panel (WhatsApp-style) ────────────────────────────

interface MentionSuggestionsProps {
  players: MentionCandidate[];
  onSelect: (username: string) => void;
}

function MentionSuggestions({players, onSelect}: MentionSuggestionsProps) {
  if (players.length === 0) {return null;}

  return (
    <ScrollView
      style={s.mentionsPanel}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      testID="chat-mention-dropdown">
      {players.map(p => (
        <MentionRow key={p.playerId} player={p} onSelect={onSelect} />
      ))}
    </ScrollView>
  );
}

function MentionRow({
  player,
  onSelect,
}: {
  player: MentionCandidate;
  onSelect: (username: string) => void;
}) {
  const initial = player.username[0].toUpperCase();
  const content = (
    <View style={s.mentionRow} testID={`chat-mention-${player.username}`}>
      <View style={s.mentionAvatar}>
        <Text style={s.mentionAvatarText}>{initial}</Text>
      </View>
      <View style={s.mentionInfo}>
        <Text style={s.mentionName}>{player.username}</Text>
        <Text style={s.mentionHandle}>@{player.username}</Text>
      </View>
    </View>
  );

  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={() => onSelect(player.username)}
        background={TouchableNativeFeedback.Ripple('#2A2A2A', false)}>
        {content}
      </TouchableNativeFeedback>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onSelect(player.username)}
      activeOpacity={0.6}>
      {content}
    </TouchableOpacity>
  );
}

// ─── ChatInputBar ─────────────────────────────────────────────────────────────

interface Props {
  text: string;
  canSend: boolean;
  showMentions: boolean;
  filteredPlayers: MentionCandidate[];
  inputRef: React.RefObject<TextInput>;
  placeholder: string;
  onChangeText: (val: string) => void;
  onSend: () => void;
  onInsertMention: (username: string) => void;
}

export function ChatInputBar({
  text,
  canSend,
  showMentions,
  filteredPlayers,
  inputRef,
  placeholder,
  onChangeText,
  onSend,
  onInsertMention,
}: Props) {
  return (
    <View style={s.wrapper}>
      {/* @mention suggestions — appear above the input like WhatsApp */}
      {showMentions && (
        <MentionSuggestions players={filteredPlayers} onSelect={onInsertMention} />
      )}

      {/* Input row */}
      <View style={s.row}>
        <View style={s.inputWrap}>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={text}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            blurOnSubmit={false}
            onSubmitEditing={onSend}
            testID="chat-input"
          />
        </View>

        <TouchableOpacity
          style={[s.sendBtn, !canSend && s.sendBtnOff]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.75}
          testID="chat-send-button">
          <Icon
            name="send"
            size={20}
            color={canSend ? colors.primaryText : '#333333'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
