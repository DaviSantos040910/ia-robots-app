
import React from 'react';
import { View } from 'react-native';
export const Divider: React.FC<{ color: string }> = ({ color }) => (<View style={{ height: 0.5, backgroundColor: color, width: '100%' }} />);
