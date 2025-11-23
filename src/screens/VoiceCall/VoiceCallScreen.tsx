import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { NeutralColors } from '../../theme/neutralColors';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceCall'>;

const VoiceCallScreen: React.FC<Props> = ({ route }) => {
  const { botName } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.text}>Tela de Voz</Text>
        <Text style={styles.subText}>Conversando com {botName}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeutralColors.neutral.dark.black1, // Fundo preto conforme solicitado
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    color: '#CCCCCC',
    fontSize: 16,
  }
});

export default VoiceCallScreen;