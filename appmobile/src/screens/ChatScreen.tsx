import React, {useState} from 'react';
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
import {chatStyles as styles} from '../styles/chatStyles';
import {ChatHeader} from '../components/chat/ChatHeader';
import {ChatMessageItem} from '../components/chat/ChatMessageItem';
import {EditBanner} from '../components/chat/EditBanner';
import {MessageActionSheet} from '../components/chat/MessageActionSheet';
import {ChatInputBar} from '../components/ChatInputBar';
import type {ChatMessage} from '../hooks/useChatScreen';
import type {LoginResponse} from '../types/auth';
import type {OnlinePlayerInfo} from '../types/player';

interface Props {
  session: LoginResponse;
  onlinePlayers: OnlinePlayerInfo[];
  onBack: () => void;
}

export function ChatScreen({session, onlinePlayers, onBack: _onBack}: Props) {
  const {t} = useTranslation();
  const [actionSheetMessage, setActionSheetMessage] = useState<ChatMessage | null>(null);

  const {
    reversedMessages,
    text,
    connected,
    error,
    showMentions,
    filteredPlayers,
    canSend,
    editingMessage,
    listRef,
    inputRef,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleDelete,
    handleTextChange,
    insertMention,
  } = useChatScreen(session, onlinePlayers);

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader connected={connected} onlinePlayers={onlinePlayers} />

      {!!error && (
        <View style={styles.errorBanner} testID="chat-error-banner">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            renderItem={({item}) => (
              <ChatMessageItem
                item={item}
                myPlayerId={session.playerId}
                myUsername={session.username}
                onLongPress={setActionSheetMessage}
              />
            )}
            contentContainerStyle={styles.list}
            inverted
            showsVerticalScrollIndicator={false}
            testID="chat-message-list"
          />
        )}

        {editingMessage && (
          <EditBanner message={editingMessage} onCancel={handleCancelEdit} />
        )}

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

      {actionSheetMessage && (
        <MessageActionSheet
          message={actionSheetMessage}
          onEdit={() => {
            handleStartEdit(actionSheetMessage);
            setActionSheetMessage(null);
          }}
          onDelete={() => {
            handleDelete(actionSheetMessage.id);
            setActionSheetMessage(null);
          }}
          onDismiss={() => setActionSheetMessage(null)}
        />
      )}
    </SafeAreaView>
  );
}
