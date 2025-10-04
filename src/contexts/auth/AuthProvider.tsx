// src/contexts/auth/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';

interface AuthContextData {
  isAuthenticated: boolean;
  login: (token: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if a token exists when the app starts
    async function loadToken() {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    }
    loadToken();
  }, []);

  const login = async (token: string, refresh: string) => {
    await SecureStore.setItemAsync('authToken', token);
    await SecureStore.setItemAsync('refreshToken', refresh);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setIsAuthenticated(false);
  };

  // Show a loading indicator while checking for the token
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}