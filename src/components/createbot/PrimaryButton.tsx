import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
}

const PrimaryButton: React.FC<Props> = ({ label }) => {
  return (
    <TouchableOpacity style={styles.button}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 24,
    backgroundColor: '#6A4DFF',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PrimaryButton;
