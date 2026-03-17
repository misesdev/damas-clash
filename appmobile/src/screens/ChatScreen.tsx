import React, {useEffect, useState} from 'react';
import {
  BackHandler,
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
import {ReplyBanner} from '../components/chat/ReplyBanner';
import {ChatInputBar} from '../components/ChatInputBar';
import {showMessage} from '../components/MessageBox';
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
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

  const {
    reversedMessages,
    text,
    connected,
    error,
    showMentions,
    filteredPlayers,
    canSend,
    editingMessage,
    replyingTo,
    listRef,
    inputRef,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleStartReply,
    handleCancelReply,
    handleDelete,
    handleTextChange,
    insertMention,
  } = useChatScreen(session);

  // Android back: deselect message first, then allow navigation
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedMessage) {
        setSelectedMessage(null);
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [selectedMessage]);

  const handleEditSelected = () => {
    if (!selectedMessage) {return;}
    handleStartEdit(selectedMessage);
    setSelectedMessage(null);
  };

  const handleDeleteSelected = () => {
    const msg = selectedMessage;
    if (!msg) {return;}
    setSelectedMessage(null);
    showMessage({
      title: t('chat.deleteConfirmTitle'),
      message: t('chat.deleteConfirmMessage'),
      type: 'confirm',
      actions: [
        {label: t('chat.actionCancel')},
        {
          label: t('chat.deleteConfirmYes'),
          danger: true,
          onPress: () => handleDelete(msg.id),
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader
        connected={connected}
        onlinePlayers={onlinePlayers}
        selectedMessage={selectedMessage}
        onClearSelection={() => setSelectedMessage(null)}
        onEditSelected={handleEditSelected}
        onDeleteSelected={handleDeleteSelected}
      />

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
                isSelected={selectedMessage?.id === item.id}
                onLongPress={setSelectedMessage}
                onReply={handleStartReply}
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

        {replyingTo && !editingMessage && (
          <ReplyBanner message={replyingTo} onCancel={handleCancelReply} />
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
    </SafeAreaView>
  );
}
