
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/colors';
import { Radius } from '../../theme/radius';
import { Spacing } from '../../theme/spacing';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ChatInputProps {
    onSend: (text: string) => void;
    loading?: boolean;
    placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading, placeholder }) => {
    const theme = useTheme();
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim()) {
            onSend(text.trim());
            setText('');
        }
    };

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: Spacing['spacing-element-m'],
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        inputContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surfaceAlt,
            borderRadius: Radius.pill,
            paddingHorizontal: Spacing['spacing-group-s'],
            minHeight: 48,
        },
        input: {
            flex: 1,
            fontSize: 16,
            fontFamily: 'Inter_400Regular',
            color: theme.textPrimary,
            maxHeight: 100,
            paddingVertical: 12,
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.brand.normal,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: Spacing['spacing-element-s'],
            opacity: (!text.trim() || loading) ? 0.5 : 1,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder={placeholder || "Ask something..."}
                    placeholderTextColor={theme.placeholder}
                    multiline
                />
            </View>
            <TouchableOpacity 
                style={styles.sendButton} 
                onPress={handleSend} 
                disabled={!text.trim() || loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                ) : (
                    <Ionicons name="arrow-up" size={24} color="#FFF" />
                )}
            </TouchableOpacity>
        </View>
    );
};
