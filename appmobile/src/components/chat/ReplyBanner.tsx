import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {chatStyles as styles} from '../../styles/chatStyles';
import type {ChatMessage} from '../../hooks/useChatScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../../theme/colors';

interface Props {
  message: ChatMessage;
  onCancel: () => void;
}

export function ReplyBanner({message, onCancel}: Props) {
  const {t} = useTranslation();
  return (
    <View style={styles.replyBanner} testID="chat-reply-banner">
      <View style={styles.replyBannerBar} />
      <View style={styles.replyBannerIconWrap}>
        <Ionicons name="return-up-forward" size={16} color={colors.text} />
      </View>
      <View style={styles.replyBannerContent}>
        <Text style={styles.replyBannerLabel}>
          {t('chat.replyingLabel')} @{message.username}
        </Text>
        <Text style={styles.replyBannerPreview} numberOfLines={1}>
          {message.isDeleted ? t('chat.replyDeleted') : message.text}
        </Text>
      </View>
      <Pressable
        style={styles.replyBannerCancel}
        onPress={onCancel}
        testID="reply-banner-cancel">
        <Text style={styles.replyBannerCancelText}>✕</Text>
      </Pressable>
    </View>
  );
}
