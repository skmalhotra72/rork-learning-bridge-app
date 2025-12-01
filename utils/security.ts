import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type SecureStoreResult = { success: boolean; error?: Error };

export const storeSecureToken = async (key: string, value: string): Promise<SecureStoreResult> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
    return { success: true };
  } catch (error) {
    console.error('Secure store error:', error);
    return { success: false, error: error as Error };
  }
};

export const getSecureToken = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('Secure get error:', error);
    return null;
  }
};

export const deleteSecureToken = async (key: string): Promise<SecureStoreResult> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
    return { success: true };
  } catch (error) {
    console.error('Secure delete error:', error);
    return { success: false, error: error as Error };
  }
};

export const sanitizeInput = (input: string | unknown): string | unknown => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

type ActivityAction = {
  timestamp: number;
  type: string;
};

export const detectSuspiciousActivity = (actions: ActivityAction[]): { suspicious: boolean; reason?: string } => {
  const recentActions = actions.filter(a => 
    Date.now() - a.timestamp < 60000
  );
  
  if (recentActions.length > 50) {
    return { suspicious: true, reason: 'rate_limit' };
  }
  
  return { suspicious: false };
};

export const anonymizeUserId = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};
