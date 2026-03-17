import React, {useRef} from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {chatStyles as styles} from '../../styles/chatStyles';
import {Avatar} from './Avatar';
import {MentionText} from './MentionText';
import type {ChatMessage} from '../../hooks/useChatScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../../theme/colors';

const SWIPE_THRESHOLD = 64;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Reply quote block (rendered inside the bubble) ──────────────────────────

interface ReplyQuoteProps {
  username: string;
  text: string;
  isDeleted: boolean;
}

function ReplyQuote({username, text, isDeleted}: ReplyQuoteProps) {
  const {t} = useTranslation();
  return (
    <View style={styles.replyQuote}>
      <View style={styles.replyQuoteBar} />
      <View style={styles.replyQuoteBody}>
        <Text style={styles.replyQuoteUsername}>@{username}</Text>
        {isDeleted ? (
          <Text style={styles.replyQuoteDeleted}>{t('chat.replyDeleted')}</Text>
        ) : (
          <Text style={styles.replyQuoteText} numberOfLines={2}>
            {text}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── ChatMessageItem ──────────────────────────────────────────────────────────

interface Props {
  item: ChatMessage;
  myPlayerId: string;
  myUsername: string;
  isSelected?: boolean;
  onLongPress?: (msg: ChatMessage) => void;
  onReply?: (msg: ChatMessage) => void;
}

export function ChatMessageItem({
  item,
  myPlayerId,
  myUsername,
  isSelected,
  onLongPress,
  onReply,
}: Props) {
  const {t} = useTranslation();
  const isMe = item.playerId === myPlayerId;

  const translateX = useRef(new Animated.Value(0)).current;

  // Opacity of the reply arrow icon: fades in as bubble slides right
  const replyIconOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.4, SWIPE_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  // ─── PanResponder lives on the ROW (outside Pressable) ───────────────────
  // onMoveShouldSetPanResponderCapture fires at the capture phase, so the row
  // intercepts horizontal swipes before Pressable or FlatList can consume them.
  // Vertical scrolling is unaffected because the condition requires dx >> dy.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Capture horizontal gestures before children claim them
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        gs.dx > 10 && Math.abs(gs.dy) < Math.abs(gs.dx) * 0.7,
      onPanResponderMove: (_, gs) => {
        if (gs.dx > 0) {
          translateX.setValue(Math.min(gs.dx, SWIPE_THRESHOLD + 12));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx >= SWIPE_THRESHOLD && onReply) {
          onReply(item);
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 160,
          friction: 14,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <View
      style={[
        styles.msgRow,
        isMe && styles.msgRowMe,
        isSelected && styles.msgSelectedOverlay,
      ]}
      {...panResponder.panHandlers}>
      {!isMe && <Avatar username={item.username} avatarUrl={item.avatarUrl} />}

      {/* Wrapper to position the reply arrow relative to the bubble */}
      <View style={styles.swipeContainer}>
        {/* Reply arrow — fades in as the bubble slides */}
        <Animated.View
          style={[styles.swipeReplyIconWrap, {opacity: replyIconOpacity}]}>
          <Ionicons
            name="return-up-forward"
            size={16}
            color={colors.textSecondary}
          />
        </Animated.View>

        {/* Sliding bubble */}
        <Animated.View style={{transform: [{translateX}]}}>
          <Pressable
            onLongPress={
              isMe && !item.isDeleted && onLongPress
                ? () => onLongPress(item)
                : undefined
            }
            delayLongPress={350}
            testID={`chat-message-${item.id}`}>
            <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
              {!isMe && (
                <Text style={styles.msgUsername}>{item.username}</Text>
              )}

              {/* Reply quote block */}
              {item.replyTo && (
                <ReplyQuote
                  username={item.replyTo.username}
                  text={item.replyTo.text}
                  isDeleted={!item.replyTo.text}
                />
              )}

              {item.isDeleted ? (
                <Text
                  style={styles.msgDeleted}
                  testID={`msg-deleted-${item.id}`}>
                  🚫 {t('chat.deleted')}
                </Text>
              ) : (
                <MentionText text={item.text} myUsername={myUsername} />
              )}

              <View style={styles.msgMeta}>
                {!item.isDeleted && item.editedAt && (
                  <Text
                    style={styles.msgEdited}
                    testID={`msg-edited-${item.id}`}>
                    {t('chat.edited')}
                  </Text>
                )}
                <Text style={styles.msgTime}>{formatTime(item.sentAt)}</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {isMe && <Avatar username={item.username} avatarUrl={item.avatarUrl} />}
    </View>
  );
}
