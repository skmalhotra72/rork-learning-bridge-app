# Deployment Checklist

## ✅ Production Configuration Completed

### 1. App Configuration (`constants/appConfig.ts`)
- ✅ Version and build number defined
- ✅ Environment detection (development/production)
- ✅ Feature flags configured
- ✅ Limits and constraints set
- ✅ Support and legal links configured
- ✅ Helper functions for feature checks

### 2. Profile Screen Updates (`app/profile.tsx`)
- ✅ App information section added
- ✅ Version and build number display
- ✅ Environment indicator
- ✅ Support & Legal section with:
  - Contact Support (email link)
  - Privacy Policy
  - Terms of Service
  - FAQ & Help Center
- ✅ Copyright footer

### 3. App.json Updates Needed

**IMPORTANT:** You need to manually update `app.json` with the following changes:

```json
{
  "expo": {
    "name": "Buddy - AI Learning Companion",
    "slug": "buddy-learning",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "buddy-learning",
    "userInterfaceStyle": "light",
    "description": "Your personal AI tutor for CBSE success. Learn at your pace with personalized explanations in your preferred language.",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#4F46E5"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.buddylearning.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Buddy needs access to your photos to help analyze learning materials and homework questions",
        "NSCameraUsageDescription": "Buddy needs camera access to scan textbook pages and homework questions for instant help",
        "NSMicrophoneUsageDescription": "Buddy needs microphone access for voice-based learning features",
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#4F46E5"
      },
      "package": "com.buddylearning.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Buddy needs access to your photos to help analyze learning materials and homework questions",
          "cameraPermission": "Buddy needs camera access to scan textbook pages and homework questions for instant help"
        }
      ]
    ]
  }
}
```

## 📋 Pre-Deployment Checklist

### Environment Variables
- [ ] `EXPO_PUBLIC_SUPABASE_URL` set in production
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in production
- [ ] All API endpoints configured

### Assets
- [ ] App icon (1024x1024) created and optimized
- [ ] Splash screen designed
- [ ] Adaptive icon for Android created
- [ ] Favicon for web created

### Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on web browser
- [ ] Test offline functionality
- [ ] Test parent portal features
- [ ] Test gamification system
- [ ] Test AI tutor functionality
- [ ] Test all language options

### Legal & Compliance
- [ ] Privacy Policy published at `https://buddylearning.com/privacy`
- [ ] Terms of Service published at `https://buddylearning.com/terms`
- [ ] FAQ/Help Center available at `https://buddylearning.com/faq`
- [ ] Support email active: `support@buddylearning.com`

### App Store Requirements

#### iOS App Store
- [ ] App Store Connect account ready
- [ ] Apple Developer account ($99/year)
- [ ] App screenshots (iPhone 6.7", 6.5", 5.5")
- [ ] App preview video (optional)
- [ ] App description (4000 characters max)
- [ ] Keywords (100 characters max)
- [ ] App category selected
- [ ] Age rating completed

#### Google Play Store
- [ ] Google Play Console account ready ($25 one-time)
- [ ] App screenshots (Phone + Tablet)
- [ ] Feature graphic (1024x500)
- [ ] High-res icon (512x512)
- [ ] App description (4000 characters max)
- [ ] Short description (80 characters max)
- [ ] Content rating questionnaire completed

## 🚀 Build Commands

### Development Build
```bash
# Start development server
npm start
```

### Production Build
```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production
```

### Submit to Stores
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

## 📊 Post-Deployment Monitoring

### Analytics Setup
- [ ] User engagement tracking enabled (when ENABLE_ANALYTICS is true)
- [ ] Crash reporting configured (when ENABLE_CRASH_REPORTING is true)
- [ ] Error logging monitored

### Performance Metrics
- [ ] App load time < 3 seconds
- [ ] API response times monitored
- [ ] Image loading optimized
- [ ] Offline sync working properly

### User Feedback
- [ ] In-app feedback mechanism
- [ ] App Store reviews monitored
- [ ] Support email monitored
- [ ] Bug reporting system active

## 🔄 Version Update Process

When releasing a new version:

1. Update version in `constants/appConfig.ts`:
   ```typescript
   export const APP_VERSION = '1.0.1';
   export const BUILD_NUMBER = 2;
   ```

2. Update version in `app.json`:
   ```json
   {
     "version": "1.0.1",
     "ios": { "buildNumber": "2" },
     "android": { "versionCode": 2 }
   }
   ```

3. Create changelog in `CHANGELOG.md`

4. Build and submit new version

## 🛡️ Security Checklist

- [ ] No API keys in client code
- [ ] All sensitive data encrypted
- [ ] HTTPS only for API calls
- [ ] User data privacy compliant
- [ ] Secure authentication implemented
- [ ] Parent verification working
- [ ] Data backup strategy in place

## 📱 Feature Flags

Current feature status (can be toggled in `constants/appConfig.ts`):

- ✅ Offline Mode: `true`
- ✅ Parent Portal: `true`
- ✅ Gamification: `true`
- ✅ Multi-Language: `true`
- ✅ Image Upload: `true`
- ❌ Voice Input: `false` (coming soon)
- ❌ Social Sharing: `false` (coming soon)

## 📞 Support Contacts

- **Technical Support**: `support@buddylearning.com`
- **Privacy Inquiries**: `privacy@buddylearning.com`
- **Legal Matters**: `legal@buddylearning.com`

## 🎉 Launch Day Tasks

1. [ ] Submit app to both stores
2. [ ] Announce on social media
3. [ ] Send press release
4. [ ] Enable monitoring and analytics
5. [ ] Monitor support email
6. [ ] Watch for critical bugs
7. [ ] Prepare hotfix process

---

**Last Updated**: 2025-01-01
**App Version**: 1.0.0
**Build**: 1
