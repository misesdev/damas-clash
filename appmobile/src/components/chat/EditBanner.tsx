import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {chatStyles as styles} from '../../styles/chatStyles';
import type {ChatMessage} from '../../hooks/useChatScreen';
import Ionicons from "react-native-vector-icons/Ionicons"
import { colors } from '../../theme/colors';

interface Props {
  message: ChatMessage;
  onCancel: () => void;
}

export function EditBanner({message, onCancel}: Props) {
  const {t} = useTranslation();
  return (
    <View style={styles.editBanner} testID="chat-edit-banner">
      <View style={styles.editBannerBar} />
      <View style={styles.editBannerIconWrap}>
        <Ionicons name='create' size={18} color={colors.text}/>
        {/* <Text style={styles.editBannerIcon}>✏️</Text> */}
      </View>
      <View style={styles.editBannerContent}>
        <Text style={styles.editBannerLabel}>{t('chat.editingLabel')}</Text>
        <Text style={styles.editBannerPreview} numberOfLines={1}>
          {message.text}
        </Text>
      </View>
      <Pressable style={styles.editBannerCancel} onPress={onCancel} testID="edit-banner-cancel">
        <Text style={styles.editBannerCancelText}>✕</Text>
      </Pressable>
    </View>
  );
}
