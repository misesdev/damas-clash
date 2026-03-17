import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {chatStyles as styles} from '../../styles/chatStyles';
import {Avatar} from './Avatar';
import {MentionText} from './MentionText';
import type {ChatMessage} from '../../hooks/useChatScreen';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

interface Props {
  item: ChatMessage;
  myPlayerId: string;
  myUsername: string;
  onLongPress?: (msg: ChatMessage) => void;
}

export function ChatMessageItem({item, myPlayerId, myUsername, onLongPress}: Props) {
  const {t} = useTranslation();
  const isMe = item.playerId === myPlayerId;

  const longPressAction = onLongPress != null ? onLongPress : (m: ChatMessage) => {};

  return (
    <Pressable
      onLongPress={isMe && !item.isDeleted ? () => longPressAction(item) : undefined}
      delayLongPress={300}
      testID={`chat-message-${item.id}`}>
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && <Avatar username={item.username} avatarUrl={item.avatarUrl} />}
        <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
          {!isMe && <Text style={styles.msgUsername}>{item.username}</Text>}

          {item.isDeleted ? (
            <Text style={styles.msgDeleted} testID={`msg-deleted-${item.id}`}>
              🚫 {t('chat.deleted')}
            </Text>
          ) : (
            <MentionText text={item.text} myUsername={myUsername} />
          )}

          <View style={styles.msgMeta}>
            {!item.isDeleted && item.editedAt && (
              <Text style={styles.msgEdited} testID={`msg-edited-${item.id}`}>
                {t('chat.edited')}
              </Text>
            )}
            <Text style={styles.msgTime}>{formatTime(item.sentAt)}</Text>
          </View>
        </View>
        {isMe && <Avatar username={item.username} avatarUrl={item.avatarUrl} />}
      </View>
    </Pressable>
  );
}
