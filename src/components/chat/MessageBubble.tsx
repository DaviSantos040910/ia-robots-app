
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../../types/chat';
import { useTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radius } from '../../theme/radius';
import { Spacing } from '../../theme/spacing';

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const theme = useTheme();
    const isUser = message.role === 'user';

    const styles = useMemo(() => StyleSheet.create({
        container: {
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            marginBottom: Spacing['spacing-element-m'],
            padding: Spacing['spacing-group-s'],
            borderRadius: Radius.card,
            backgroundColor: isUser ? theme.brand.surface : theme.surface, // NotebookLM: User often has distinct background or just alignment
            borderWidth: isUser ? 0 : 1,
            borderColor: isUser ? 'transparent' : theme.border,
            // Additional styling for "Notebook" feel
            borderTopLeftRadius: isUser ? Radius.card : 2,
            borderTopRightRadius: isUser ? 2 : Radius.card,
        },
        text: {
            ...Typography.presets.bodyRegular.medium,
            color: theme.textPrimary,
        },
        time: {
            ...Typography.presets.caption,
            color: theme.textSecondary,
            alignSelf: 'flex-end',
            marginTop: 4,
        }
    }), [theme, isUser]);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{message.content}</Text>
            {/* Optional Timestamp */}
            {/* <Text style={styles.time}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text> */}
        </View>
    );
};
