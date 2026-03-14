import React from 'react';
import {StyleSheet, Text, TextStyle} from 'react-native';
import {colors} from '../../theme/colors';

interface Props {
  text: string;
  myUsername: string;
  textStyle?: TextStyle;
  mentionStyle?: TextStyle;
  myMentionStyle?: TextStyle;
}

export function MentionText({
  text,
  myUsername,
  textStyle,
  mentionStyle,
  myMentionStyle,
}: Props) {
  const parts = text.split(/(@\w+)/g);
  return (
    <Text style={[styles.msgText, textStyle]}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const isMe = part.slice(1).toLowerCase() === myUsername.toLowerCase();
          return (
            <Text
              key={i}
              style={[styles.mention, mentionStyle, isMe && (myMentionStyle ?? styles.mentionMe)]}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  msgText: {color: colors.text, fontSize: 15, lineHeight: 21},
  mention: {color: '#4A9EFF', fontWeight: '700'},
  mentionMe: {color: '#FFD700', fontWeight: '700'},
});
