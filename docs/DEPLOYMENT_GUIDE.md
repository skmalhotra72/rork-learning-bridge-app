# Deployment Guide for Buddy - AI Learning Companion

This guide outlines the steps to prepare and deploy Buddy to the App Store and Google Play Store.

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings addressed
- [ ] No console.log statements in production code (or using proper logging)
- [ ] All features tested on both iOS and Android
- [ ] Performance optimizations applied
- [ ] Memory leaks checked and fixed

### 2. Content & Assets
- [ ] App icon created (1024x1024px)
- [ ] Splash screen designed
- [ ] Screenshots prepared (multiple device sizes)
- [ ] App preview video created (optional but recommended)
- [ ] All placeholder text replaced with final content

### 3. Legal & Compliance
- [ ] Privacy Policy reviewed and finalized
- [ ] Terms of Service reviewed and finalized
- [ ] Age rating determined
- [ ] Required permissions justified
- [ ] COPPA compliance verified (if applicable)

### 4. Backend & Services
- [ ] Production database setup and tested
- [ ] Environment variables configured for production
- [ ] API endpoints secured
- [ ] Rate limiting implemented
- [ ] Backup strategy in place
- [ ] Monitoring and logging configured

### 5. App Store Preparation
- [ ] App Store listing text prepared
- [ ] Keywords researched and selected
- [ ] Category selected
- [ ] Pricing determined
- [ ] In-app purchases configured (if applicable)

## Configuration Updates

### Update app.json

Note: The app.json file is protected. Request manual update with:

```json
{
  "expo": {
    "name": "Buddy - AI Learning Companion",
    "slug": "buddy-learning",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.buddylearning.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.buddylearning.app",
      "versionCode": 1
    }
  }
}
```

### Environment Variables

Ensure production environment variables are set:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_production_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_key

# AI Toolkit
EXPO_PUBLIC_TOOLKIT_URL=your_toolkit_url

# App Config
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=your_api_url
```

## Build Process

### Prerequisites

1. Install EAS CLI (if not already installed):
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure EAS:
```bash
eas build:configure
```

### iOS Build

1. Create iOS build:
```bash
eas build --platform ios --profile production
```

2. Wait for build to complete (15-30 minutes)

3. Download the .ipa file or submit directly to App Store:
```bash
eas submit --platform ios
```

### Android Build

1. Create Android build:
```bash
eas build --platform android --profile production
```

2. Wait for build to complete (15-30 minutes)

3. Download the .aab file or submit directly to Play Store:
```bash
eas submit --platform android
```

## App Store Submission

### Apple App Store

1. **Create App Store Connect Account**
   - Go to https://appstoreconnect.apple.com
   - Create new app
   - Fill in basic information

2. **Prepare Metadata**
   - App name: "Buddy - AI Learning Companion"
   - Subtitle: "Your Personal AI Tutor"
   - Category: Education
   - Keywords: (use from APP_STORE_DESCRIPTION.md)
   - Description: (use from APP_STORE_DESCRIPTION.md)
   - Privacy Policy URL: https://buddylearning.com/privacy
   - Support URL: https://buddylearning.com/support

3. **Upload Screenshots**
   Required sizes:
   - iPhone 6.7" (1290x2796)
   - iPhone 6.5" (1242x2688)
   - iPhone 5.5" (1242x2208)
   - iPad Pro 12.9" (2048x2732)

4. **Age Rating**
   - Complete the age rating questionnaire
   - Expected rating: 4+ or 9+

5. **Submit for Review**
   - Upload build from EAS
   - Add release notes
   - Submit for review
   - Review typically takes 1-3 days

### Google Play Store

1. **Create Play Console Account**
   - Go to https://play.google.com/console
   - Pay one-time registration fee ($25)
   - Create new application

2. **Prepare Store Listing**
   - App name: "Buddy - AI Learning Companion"
   - Short description: (from APP_STORE_DESCRIPTION.md)
   - Full description: (from APP_STORE_DESCRIPTION.md)
   - App category: Education
   - Content rating: Fill questionnaire

3. **Upload Screenshots**
   Required sizes:
   - Phone: 1080x1920 or 1080x2340
   - 7-inch tablet: 1200x1920
   - 10-inch tablet: 1920x1200
   Minimum 2 screenshots per device type

4. **Privacy Policy**
   - Add Privacy Policy URL: https://buddylearning.com/privacy
   - Complete Data Safety section
   - Declare all data collection and sharing

5. **Content Rating**
   - Complete IARC questionnaire
   - Expected rating: Everyone or Teen

6. **Submit for Review**
   - Upload build from EAS
   - Set pricing (free or paid)
   - Select countries for distribution
   - Submit for review
   - Review typically takes 1-3 days

## Post-Deployment

### 1. Monitoring

Set up monitoring for:
- Crash reports (use Sentry or similar)
- Performance metrics
- User analytics
- API usage and errors
- Database performance

### 2. User Feedback

Monitor:
- App Store reviews
- Play Store reviews
- Support email
- Social media mentions

### 3. Updates

Plan for regular updates:
- Bug fixes every 2 weeks
- Feature updates monthly
- Content updates as needed

### 4. Marketing

Launch activities:
- Social media announcement
- Email to beta testers
- Press release (optional)
- Blog post
- Educational forums/communities

## Versioning Strategy

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR** (1.x.x): Breaking changes, major features
- **MINOR** (x.1.x): New features, backwards compatible
- **PATCH** (x.x.1): Bug fixes

### Version Update Checklist
- [ ] Update version in app.json
- [ ] Update buildNumber (iOS) / versionCode (Android)
- [ ] Update constants/appConfig.ts
- [ ] Create changelog entry
- [ ] Tag release in git
- [ ] Build and test
- [ ] Submit to stores

## Troubleshooting

### Common Build Issues

**Issue:** Build fails with dependency errors
**Solution:** Clear cache and rebuild
```bash
eas build --clear-cache --platform ios
```

**Issue:** iOS submission rejected for missing info
**Solution:** Check Info.plist permissions and update descriptions

**Issue:** Android app crashes on startup
**Solution:** Check ProGuard rules and native dependencies

### Support Resources

- Expo Documentation: https://docs.expo.dev
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Play Store Guidelines: https://play.google.com/about/developer-content-policy/

## Emergency Rollback

If critical issue found after release:

1. Immediately fix the issue
2. Build new version with patch increment
3. Submit expedited review (if available)
4. Notify users via:
   - In-app notification
   - Email
   - Social media

## Maintenance Schedule

- **Daily:** Monitor crash reports and critical errors
- **Weekly:** Review user feedback and ratings
- **Bi-weekly:** Bug fix releases
- **Monthly:** Feature updates and improvements
- **Quarterly:** Major version updates

## Success Metrics

Track these KPIs:
- Downloads/Installs
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- User retention (Day 1, 7, 30)
- Average session duration
- Feature usage statistics
- Crash-free rate (target: >99%)
- App Store rating (target: >4.5)
- User feedback sentiment

---

## Contact for Deployment Support

For questions or issues during deployment:
- **Technical:** dev@buddylearning.com
- **Business:** business@buddylearning.com

**Good luck with your launch! 🚀**
