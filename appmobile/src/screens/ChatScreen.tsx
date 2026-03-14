import React from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {useChatScreen} from '../hooks/useChatScreen';
import {ChatInputBar} from '../components/ChatInputBar';
import {chatStyles as styles} from '../styles/chatStyles';
import type {ChatMessage} from '../hooks/useChatScreen';
import type {LoginResponse} from '../types/auth';
import type {OnlinePlayerInfo} from '../types/player';
import { Avatar } from '../components/chat/Avatar';
import { MentionText } from '../components/chat/MentionText';


function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

interface Props {
  session: LoginResponse;
  onlinePlayers: OnlinePlayerInfo[];
  onBack: () => void;
}

export function ChatScreen({session, onlinePlayers, onBack: _onBack}: Props) {
  const {t} = useTranslation();
  const {
    reversedMessages,
    text,
    connected,
    error,
    showMentions,
    filteredPlayers,
    canSend,
    listRef,
    inputRef,
    handleSend,
    handleTextChange,
    insertMention,
  } = useChatScreen(session, onlinePlayers);

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isMe = item.playerId === session.playerId;
    return (
      <View
        style={[styles.msgRow, isMe && styles.msgRowMe]}
        testID={`chat-message-${item.id}`}>
        {!isMe && <Avatar username={item.username} />}
        <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
          {!isMe && <Text style={styles.msgUsername}>{item.username}</Text>}
          <MentionText text={item.text} myUsername={session.username} />
          <Text style={styles.msgTime}>{formatTime(item.sentAt)}</Text>
        </View>
        {isMe && <Avatar username={item.username} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerDot, connected ? styles.headerDotOn : styles.headerDotOff]} />
          <View>
            <Text style={styles.headerTitle}>{t('chat.title')}</Text>
            <Text style={styles.headerSub} testID="chat-conn-status">
              {connected ? 'online' : t('chat.connecting')}
            </Text>
          </View>
        </View>
        {onlinePlayers.length > 0 && (
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineCount}>{onlinePlayers.length}</Text>
          </View>
        )}
      </View>

      {/* Error banner */}
      {!!error && (
        <View style={styles.errorBanner} testID="chat-error-banner">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Messages / empty */}
        {reversedMessages.length === 0 ? (
          <View style={styles.emptyContainer} testID="chat-empty">
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>{t('chat.empty')}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={reversedMessages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            inverted
            showsVerticalScrollIndicator={false}
            testID="chat-message-list"
          />
        )}

        {/* Input bar with @mention suggestions */}
        <ChatInputBar
          text={text}
          canSend={canSend}
          showMentions={showMentions}
          filteredPlayers={filteredPlayers}
          inputRef={inputRef}
          placeholder={t('chat.inputPlaceholder')}
          onChangeText={handleTextChange}
          onSend={handleSend}
          onInsertMention={insertMention}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
