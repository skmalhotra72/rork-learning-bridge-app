import { APP_VERSION, BUILD_NUMBER, APP_CONFIG, FEATURES, LIMITS } from '@/constants/appConfig';

/**
 * Logs the current app configuration to console
 * Only works in development mode
 */
export const logAppConfig = () => {
  if (!__DEV__) return;
  
  console.log('=== APP CONFIGURATION ===');
  console.log('Version:', APP_VERSION);
  console.log('Build:', BUILD_NUMBER);
  console.log('Environment:', APP_CONFIG.ENV);
  console.log('Analytics:', APP_CONFIG.ENABLE_ANALYTICS);
  console.log('Crash Reporting:', APP_CONFIG.ENABLE_CRASH_REPORTING);
  console.log('');
  
  console.log('=== FEATURES ===');
  Object.entries(FEATURES).forEach(([key, value]) => {
    console.log(`${key}:`, value ? '✅' : '❌');
  });
  console.log('');
  
  console.log('=== LIMITS ===');
  console.log('Free Tier:', LIMITS.free);
  console.log('Premium Tier:', LIMITS.premium);
  console.log('Max Questions/Day:', LIMITS.maxQuestionsPerDay);
  console.log('Max Upload Size:', LIMITS.maxUploadSizeMB, 'MB');
  console.log('Cache Expiry:', LIMITS.cacheExpiryHours, 'hours');
  console.log('Max Offline Actions:', LIMITS.maxOfflineActions);
  console.log('=========================');
};

/**
 * Checks if the app is in production mode
 */
export const isProduction = (): boolean => {
  return APP_CONFIG.ENV === 'production';
};

/**
 * Checks if the app is in development mode
 */
export const isDevelopment = (): boolean => {
  return APP_CONFIG.ENV === 'development';
};

/**
 * Safe console log that only works in development
 */
export const devLog = (...args: any[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

/**
 * Safe console warn that only works in development
 */
export const devWarn = (...args: any[]) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

/**
 * Safe console error that works in both dev and production
 */
export const logError = (error: any, context?: string) => {
  const message = context ? `[${context}]` : '';
  console.error(message, error);
  
  // In production, you might want to send to error tracking service
  if (APP_CONFIG.ENABLE_CRASH_REPORTING) {
    // TODO: Send to crash reporting service (e.g., Sentry)
  }
};

/**
 * Get feature status summary
 */
export const getFeatureStatus = () => {
  const enabled = Object.entries(FEATURES)
    .filter(([_, value]) => value)
    .map(([key]) => key);
  
  const disabled = Object.entries(FEATURES)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  return { enabled, disabled };
};

/**
 * Format app version string
 */
export const getVersionString = (includeEnv = false): string => {
  const base = `v${APP_VERSION} (${BUILD_NUMBER})`;
  if (includeEnv && __DEV__) {
    return `${base} [${APP_CONFIG.ENV}]`;
  }
  return base;
};

/**
 * Check if a specific limit applies to user tier
 */
export const getUserLimit = (tier: 'free' | 'premium', limitType: keyof typeof LIMITS.free): number => {
  return LIMITS[tier][limitType];
};

/**
 * Check if user has reached limit
 */
export const hasReachedLimit = (
  tier: 'free' | 'premium',
  limitType: keyof typeof LIMITS.free,
  currentCount: number
): boolean => {
  const limit = getUserLimit(tier, limitType);
  if (limit === -1) return false; // Unlimited
  return currentCount >= limit;
};

/**
 * Get remaining count for a limit
 */
export const getRemainingCount = (
  tier: 'free' | 'premium',
  limitType: keyof typeof LIMITS.free,
  currentCount: number
): number | 'unlimited' => {
  const limit = getUserLimit(tier, limitType);
  if (limit === -1) return 'unlimited';
  return Math.max(0, limit - currentCount);
};
