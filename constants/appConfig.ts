export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = 1;
export const API_VERSION = 'v1';
export const MIN_SUPPORTED_VERSION = '1.0.0';

export const APP_CONFIG = {
  name: 'Buddy - AI Learning Companion',
  shortName: 'Buddy',
  description: 'Your personal AI tutor for CBSE success',
  website: 'https://buddylearning.com',
  supportEmail: 'support@buddylearning.com',
  privacyEmail: 'privacy@buddylearning.com',
  legalEmail: 'legal@buddylearning.com'
} as const;

export const FEATURES = {
  offlineMode: true,
  parentPortal: true,
  gamification: true,
  multiLanguage: true,
  imageUpload: true,
  voiceInput: false,
  socialSharing: false
} as const;

export const LIMITS = {
  free: {
    dailyQuestions: 10,
    assessmentsPerDay: 3,
    practiceProblemsPerDay: 20
  },
  premium: {
    dailyQuestions: -1,
    assessmentsPerDay: -1,
    practiceProblemsPerDay: -1
  }
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'hi-en', name: 'Hinglish', nativeName: 'Hinglish' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
] as const;

export const SUBJECTS = [
  { id: 'mathematics', name: 'Mathematics', emoji: '🔢', color: '#3B82F6' },
  { id: 'physics', name: 'Physics', emoji: '⚡', color: '#8B5CF6' },
  { id: 'chemistry', name: 'Chemistry', emoji: '🧪', color: '#10B981' },
  { id: 'biology', name: 'Biology', emoji: '🧬', color: '#F59E0B' }
] as const;

export const GRADES = [
  { value: 6, label: 'Class 6' },
  { value: 7, label: 'Class 7' },
  { value: 8, label: 'Class 8' },
  { value: 9, label: 'Class 9' },
  { value: 10, label: 'Class 10' },
  { value: 11, label: 'Class 11' },
  { value: 12, label: 'Class 12' }
] as const;

export const CACHE_DURATIONS = {
  short: 5 * 60 * 1000,
  medium: 30 * 60 * 1000,
  long: 24 * 60 * 60 * 1000
} as const;

export const SYNC_INTERVALS = {
  background: 30 * 1000,
  foreground: 10 * 1000,
  onNetworkChange: 0
} as const;

export const APP_LINKS = {
  website: 'https://buddylearning.com',
  support: 'https://buddylearning.com/support',
  privacy: 'https://buddylearning.com/privacy',
  terms: 'https://buddylearning.com/terms',
  faq: 'https://buddylearning.com/faq',
  contact: 'https://buddylearning.com/contact'
} as const;

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/buddylearning',
  facebook: 'https://facebook.com/buddylearning',
  instagram: 'https://instagram.com/buddylearning',
  youtube: 'https://youtube.com/buddylearning'
} as const;
