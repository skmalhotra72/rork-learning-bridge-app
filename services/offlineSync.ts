import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const PENDING_ACTIONS_KEY = '@buddy_pending_actions';
const CACHE_PREFIX = '@cache_';

export interface PendingAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

export interface CachedData {
  data: any;
  timestamp: number;
}

let isConnected = true;

// Simple network status check
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('user_profiles').select('id').limit(1);
    isConnected = !error;
    return isConnected;
  } catch {
    isConnected = false;
    return false;
  }
};

export const isOnline = (): boolean => {
  return isConnected;
};

// Queue action for later sync
export const queueAction = async (action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<{ success: boolean; error?: any }> => {
  try {
    const pending = await getPendingActions();
    const newAction: PendingAction = {
      ...action,
      timestamp: Date.now(),
      id: `${Date.now()}_${Math.random()}`
    };
    
    pending.push(newAction);
    
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
    console.log('Action queued for offline sync:', action.type);
    
    return { success: true };
  } catch (error) {
    console.error('Queue action error:', error);
    return { success: false, error };
  }
};

// Get pending actions
export const getPendingActions = async (): Promise<PendingAction[]> => {
  try {
    const data = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Get pending actions error:', error);
    return [];
  }
};

// Sync pending actions with retry logic
export const syncPendingActions = async (maxRetries: number = 3): Promise<{ success: boolean; synced: number; failed: number; reason?: string }> => {
  try {
    const online = await checkConnection();
    if (!online) {
      console.log('Offline - sync skipped');
      return { success: false, synced: 0, failed: 0, reason: 'offline' };
    }

    const pending = await getPendingActions();
    if (pending.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }

    console.log(`Syncing ${pending.length} pending actions...`);

    let synced = 0;
    const failed: PendingAction[] = [];

    for (const action of pending) {
      let retries = 0;
      let actionSuccess = false;

      while (retries < maxRetries && !actionSuccess) {
        try {
          await executeAction(action);
          synced++;
          actionSuccess = true;
          console.log(`✅ Synced action: ${action.type}`);
        } catch (error) {
          retries++;
          console.error(`Action sync failed (attempt ${retries}/${maxRetries}):`, action.type, error);
          
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } else {
            failed.push(action);
          }
        }
      }
    }

    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(failed));

    console.log(`✅ Synced ${synced}/${pending.length} actions`);
    if (failed.length > 0) {
      console.log(`⚠️ ${failed.length} actions will retry later`);
    }

    return { success: true, synced, failed: failed.length };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, synced: 0, failed: 0 };
  }
};

// Execute queued action with error handling
const executeAction = async (action: PendingAction): Promise<void> => {
  try {
    switch (action.type) {
      case 'add_xp': {
        const { error } = await supabase.rpc('add_xp_to_user', action.data);
        if (error) throw error;
        break;
      }
      
      case 'save_learning_session': {
        const { error } = await supabase.from('learning_history').insert(action.data);
        if (error) throw error;
        break;
      }
      
      case 'update_streak': {
        const { error } = await supabase.rpc('update_learning_streak', action.data);
        if (error) throw error;
        break;
      }
      
      case 'save_assessment': {
        const { error } = await supabase.from('assessments').insert(action.data);
        if (error) throw error;
        break;
      }

      case 'save_xp_transaction': {
        const { error } = await supabase.from('xp_transactions').insert(action.data);
        if (error) throw error;
        break;
      }
      
      default:
        console.warn('Unknown action type:', action.type);
        throw new Error(`Unknown action type: ${action.type}`);
    }
  } catch (error) {
    console.error(`Failed to execute action ${action.type}:`, error);
    throw error;
  }
};

// Cache data locally
export const cacheData = async (key: string, data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache data error:', error);
  }
};

// Get cached data
export const getCachedData = async <T = any>(key: string, maxAge: number = 3600000): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp }: CachedData = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - timestamp > maxAge) {
      return null;
    }

    return data as T;
  } catch (error) {
    console.error('Get cached data error:', error);
    return null;
  }
};

// Clear all cached data
export const clearCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('Cache cleared');
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

// Initialize offline sync - call on app start
export const initOfflineSync = async (): Promise<void> => {
  // Check connection status
  await checkConnection();
  
  // Try to sync pending actions
  if (isConnected) {
    await syncPendingActions();
  }
  
  // Set up periodic sync check (every 30 seconds)
  setInterval(async () => {
    const wasOffline = !isConnected;
    await checkConnection();
    
    if (wasOffline && isConnected) {
      console.log('Connection restored - syncing...');
      await syncPendingActions();
    }
  }, 30000);
};
