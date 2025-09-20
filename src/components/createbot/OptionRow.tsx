import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon: string;
  label: string;
  value: string;
}

const OptionRow: React.FC<Props> = ({ icon, label, value }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.arrow}>›</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  value: {
    fontSize: 15,
    color: '#6E6E73',
  },
  arrow: {
    fontSize: 20,
    color: '#C7C7CC',
    marginLeft: 8,
  },
});

export default OptionRow;
