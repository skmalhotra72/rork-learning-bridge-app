# App Configuration Usage Guide

## Overview

The app configuration is centralized in `constants/appConfig.ts` for easy management of app settings, features, and metadata.

## Importing Configuration

```typescript
import { 
  APP_VERSION, 
  BUILD_NUMBER, 
  APP_CONFIG, 
  FEATURES,
  LIMITS,
  APP_LINKS,
  isFeatureEnabled,
  getAppInfo 
} from '@/constants/appConfig';
```

## Common Use Cases

### 1. Display App Version

```typescript
import { APP_VERSION, BUILD_NUMBER } from '@/constants/appConfig';

function VersionDisplay() {
  return (
    <Text>Version {APP_VERSION} (Build {BUILD_NUMBER})</Text>
  );
}
```

### 2. Check Feature Availability

```typescript
import { isFeatureEnabled } from '@/constants/appConfig';

function UploadButton() {
  if (!isFeatureEnabled('imageUpload')) {
    return <Text>Feature coming soon!</Text>;
  }
  
  return <Button title="Upload Image" onPress={handleUpload} />;
}
```

### 3. Get App Information

```typescript
import { getAppInfo, APP_CONFIG } from '@/constants/appConfig';

function AboutScreen() {
  const appInfo = getAppInfo();
  
  return (
    <View>
      <Text>Name: {appInfo.name}</Text>
      <Text>Version: {appInfo.version}</Text>
      <Text>Environment: {appInfo.environment}</Text>
    </View>
  );
}
```

### 4. Environment-Based Logic

```typescript
import { APP_CONFIG } from '@/constants/appConfig';

function enableDebugMode() {
  if (APP_CONFIG.ENV === 'development') {
    console.log('Debug mode enabled');
    // Enable debug features
  }
}
```

### 5. Contact Support

```typescript
import { APP_CONFIG } from '@/constants/appConfig';
import * as Linking from 'expo-linking';

async function contactSupport() {
  await Linking.openURL(
    `mailto:${APP_CONFIG.supportEmail}?subject=Support Request`
  );
}
```

### 6. Open External Links

```typescript
import { APP_LINKS } from '@/constants/appConfig';
import * as Linking from 'expo-linking';

async function openPrivacyPolicy() {
  await Linking.openURL(APP_LINKS.privacy);
}

async function openTerms() {
  await Linking.openURL(APP_LINKS.terms);
}

async function openFAQ() {
  await Linking.openURL(APP_LINKS.faq);
}
```

### 7. Check Usage Limits

```typescript
import { LIMITS } from '@/constants/appConfig';

function checkQuestionLimit(userTier: 'free' | 'premium', questionsAsked: number) {
  const limit = LIMITS[userTier].dailyQuestions;
  
  if (limit === -1) {
    return { allowed: true, remaining: Infinity };
  }
  
  const remaining = limit - questionsAsked;
  return { 
    allowed: remaining > 0, 
    remaining: Math.max(0, remaining) 
  };
}
```

### 8. Language Selection

```typescript
import { SUPPORTED_LANGUAGES } from '@/constants/appConfig';

function LanguagePicker() {
  return (
    <View>
      {SUPPORTED_LANGUAGES.map(lang => (
        <Button 
          key={lang.code}
          title={lang.nativeName}
          onPress={() => selectLanguage(lang.code)}
        />
      ))}
    </View>
  );
}
```

### 9. Subject Configuration

```typescript
import { SUBJECTS } from '@/constants/appConfig';

function SubjectList() {
  return (
    <View>
      {SUBJECTS.map(subject => (
        <View key={subject.id} style={{ backgroundColor: subject.color }}>
          <Text>{subject.emoji} {subject.name}</Text>
        </View>
      ))}
    </View>
  );
}
```

### 10. Grade Selection

```typescript
import { GRADES } from '@/constants/appConfig';

function GradePicker() {
  return (
    <ScrollView>
      {GRADES.map(grade => (
        <Button 
          key={grade.value}
          title={grade.label}
          onPress={() => selectGrade(grade.value)}
        />
      ))}
    </ScrollView>
  );
}
```

## TypeScript Types

Use the exported types for type safety:

```typescript
import type { 
  AppFeature, 
  AppLanguage, 
  AppSubject, 
  AppGrade 
} from '@/constants/appConfig';

interface UserPreferences {
  language: AppLanguage;
  subjects: AppSubject[];
  grade: AppGrade;
}

function isFeatureAvailable(feature: AppFeature): boolean {
  return isFeatureEnabled(feature);
}
```

## Constants Reference

### APP_CONFIG
```typescript
{
  name: 'Buddy - AI Learning Companion',
  shortName: 'Buddy',
  description: 'Your personal AI tutor for CBSE success',
  website: 'https://buddylearning.com',
  supportEmail: 'support@buddylearning.com',
  privacyEmail: 'privacy@buddylearning.com',
  legalEmail: 'legal@buddylearning.com',
  ENV: 'development' | 'production',
  ENABLE_ANALYTICS: boolean,
  ENABLE_CRASH_REPORTING: boolean
}
```

### FEATURES
```typescript
{
  offlineMode: true,
  parentPortal: true,
  gamification: true,
  multiLanguage: true,
  imageUpload: true,
  voiceInput: false,
  socialSharing: false
}
```

### LIMITS
```typescript
{
  free: {
    dailyQuestions: 10,
    assessmentsPerDay: 3,
    practiceProblemsPerDay: 20
  },
  premium: {
    dailyQuestions: -1,  // unlimited
    assessmentsPerDay: -1,
    practiceProblemsPerDay: -1
  },
  maxQuestionsPerDay: 100,
  maxUploadSizeMB: 10,
  cacheExpiryHours: 24,
  maxOfflineActions: 50
}
```

### APP_LINKS
```typescript
{
  website: 'https://buddylearning.com',
  support: 'https://buddylearning.com/support',
  privacy: 'https://buddylearning.com/privacy',
  terms: 'https://buddylearning.com/terms',
  faq: 'https://buddylearning.com/faq',
  contact: 'https://buddylearning.com/contact'
}
```

## Best Practices

1. **Always use the config constants** instead of hardcoding values
2. **Check feature flags** before using features
3. **Use TypeScript types** for type safety
4. **Respect usage limits** for free tier users
5. **Use environment detection** for debug features
6. **Keep links updated** in the config file

## Updating Configuration

To update the app configuration:

1. Edit `constants/appConfig.ts`
2. Run TypeScript checks: `npm run lint`
3. Test changes in development
4. Update this documentation if needed
5. Deploy changes to production

---

**Last Updated**: 2025-01-01
