
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types/navigation';
import { ChatMessage } from '../../types/chat';
import { useTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { chatService } from '../../services/chatService'; // Assuming this service exists
import Ionicons from '@expo/vector-icons/Ionicons';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<ChatScreenNavigationProp>();
    const route = useRoute<ChatScreenRouteProp>();
    const theme = useTheme();
    const { chatId, botName, botId } = route.params;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Mock fetch messages (replace with real service call)
    useEffect(() => {
        const loadMessages = async () => {
             try {
                 // const data = await chatService.fetchMessages(chatId);
                 // setMessages(data);
                 // Mocking for now
                 setTimeout(() => {
                     setMessages([
                         { id: '1', role: 'assistant', content: `Hello! I am ${botName}. How can I help you study today?`, created_at: new Date().toISOString() }
                     ]);
                     setLoading(false);
                 }, 500);
             } catch (error) {
                 console.error("Failed to load chat", error);
                 setLoading(false);
             }
        };
        loadMessages();
    }, [chatId]);

    const handleSend = async (text: string) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
        setSending(true);

        try {
            // await chatService.sendMessage(chatId, text);
            // Simulate response
            setTimeout(() => {
                const response: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "This is a simulated response based on your notebook.",
                    created_at: new Date().toISOString(),
                };
                setMessages(prev => [...prev, response]);
                setSending(false);
            }, 1000);
        } catch (error) {
            console.error("Failed to send message", error);
            setSending(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Spacing['spacing-group-m'],
            paddingVertical: Spacing['spacing-element-m'],
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            backgroundColor: theme.surface,
        },
        backButton: {
            marginRight: Spacing['spacing-element-m'],
        },
        headerTitle: {
            ...Typography.presets.heading3,
            fontSize: 16,
            color: theme.textPrimary,
        },
        listContent: {
            padding: Spacing['spacing-group-m'],
        }
    }), [theme]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{botName}</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.brand.normal} />
                </View>
            ) : (
                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <MessageBubble message={item} />}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            <ChatInput onSend={handleSend} loading={sending} />
        </SafeAreaView>
    );
};

export default ChatScreen;
