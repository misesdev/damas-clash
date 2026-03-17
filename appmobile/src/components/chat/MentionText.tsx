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

// Matches @[name with spaces] or @word — used as splitter so both groups appear as parts
const MENTION_RE = /(@\[[^\]]+\]|@\w+)/g;

export function MentionText({
  text,
  myUsername,
  textStyle,
  mentionStyle,
  myMentionStyle,
}: Props) {
  const parts = text.split(MENTION_RE);
  return (
    <Text style={[styles.msgText, textStyle]}>
      {parts.map((part, i) => {
        if (!part.startsWith('@')) {
          return <Text key={i}>{part}</Text>;
        }
        // @[Name With Spaces] → display as @Name With Spaces (strip brackets)
        const username = part.startsWith('@[')
          ? part.slice(2, -1)
          : part.slice(1);
        const isMe = username.toLowerCase() === myUsername.toLowerCase();
        return (
          <Text
            key={i}
            style={[
              styles.mention,
              mentionStyle,
              isMe && (myMentionStyle ?? styles.mentionMe),
            ]}>
            @{username}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  msgText: {color: colors.text, fontSize: 15, lineHeight: 21},
  mention: {color: '#4A9EFF', fontWeight: '700'},
  mentionMe: {color: '#FFD700', fontWeight: '700'},
});
