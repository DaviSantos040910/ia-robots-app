import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { styles } from './CreateBot.styles';
import AvatarSelector from '../../components/createbot/AvatarSelector';
import InputField from '../../components/createbot/InputField';
import OptionRow from '../../components/createbot/OptionRow';
import PrimaryButton from '../../components/createbot/PrimaryButton';
import { useNavigation } from '@react-navigation/native';

const CreateBotScreen = () => {
    const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create a bot</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <AvatarSelector />

        {/* Name */}
        <InputField
          label="Name"
          value="BotQN0K1T00OU"
        />

        {/* Prompt */}
        <InputField
          label="Prompt"
          placeholder="e.g. You are the CatBot. You will try to respond to the user's questions, but you get easily distracted."
          multiline
        />

        {/* Options */}
        <OptionRow icon="🔊" label="Voice" value="RadiantMaiden" />
        <OptionRow icon="🌐" label="Language" value="English" />
        <OptionRow icon="⚙️" label="Publicity" value="Anyone" />

        {/* Button */}
        <PrimaryButton label="Create bot" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateBotScreen;
