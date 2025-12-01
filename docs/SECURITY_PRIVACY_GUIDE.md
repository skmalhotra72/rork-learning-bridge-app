# Security & Privacy Features Guide

## Overview

This guide documents the security and privacy features implemented in the Learning Bridge app. These features ensure user data protection, privacy controls, and secure authentication.

## Security Features

### 1. Secure Token Storage

**Location:** `utils/security.ts`

The app uses Expo SecureStore (native devices) and localStorage (web) for secure token storage:

```typescript
import { storeSecureToken, getSecureToken, deleteSecureToken } from '@/utils/security';

// Store sensitive data
await storeSecureToken('auth_token', token);

// Retrieve sensitive data
const token = await getSecureToken('auth_token');

// Delete sensitive data
await deleteSecureToken('auth_token');
```

**Platform Support:**
- **iOS/Android**: Uses iOS Keychain and Android Keystore
- **Web**: Falls back to localStorage (polyfilled for web compatibility)

### 2. Input Sanitization

Protect against XSS attacks by sanitizing user inputs:

```typescript
import { sanitizeInput } from '@/utils/security';

const cleanInput = sanitizeInput(userInput);
```

This function:
- Escapes HTML special characters
- Removes potential XSS vectors
- Trims whitespace

### 3. Activity Monitoring

Detect suspicious activity patterns:

```typescript
import { detectSuspiciousActivity } from '@/utils/security';

const result = detectSuspiciousActivity(activityLog);
if (result.suspicious) {
  console.warn('Suspicious activity detected:', result.reason);
}
```

Currently monitors:
- Rate limiting (>50 actions per minute)
- Can be extended for additional patterns

### 4. User ID Anonymization

For analytics and logging without exposing user identity:

```typescript
import { anonymizeUserId } from '@/utils/security';

const anonymousId = anonymizeUserId(userId);
```

## Privacy Controls

### User Privacy Settings

**Location:** `app/profile.tsx`

Users can control their privacy through the Profile screen:

#### 1. Share Progress
- **Purpose**: Control whether progress can be shared with friends
- **Default**: Enabled
- **Stored in**: `profiles.notification_preferences`

#### 2. Parent Access
- **Purpose**: Allow/deny parent portal access
- **Default**: Enabled
- **Affects**: Parent invitation code generation and data visibility

#### 3. Analytics Collection
- **Purpose**: Opt-in/out of usage analytics
- **Default**: Enabled
- **Affects**: Anonymous usage data collection

### Data Management Features

#### Export Personal Data

Users can export all their data:
- Profile information
- Subject progress
- Learning statistics
- Activity history

**Implementation:**
```typescript
const handleExportData = async () => {
  const exportData = {
    profile,
    subjectProgress,
    userStats,
    exportedAt: new Date().toISOString(),
  };
  // Download as JSON
};
```

#### Delete Account

Full account deletion with confirmation:
- Permanently deletes all user data
- Cannot be undone
- Requires double confirmation
- Immediately logs user out

**Important**: This uses `supabase.auth.admin.deleteUser()` which requires proper RLS policies.

## Database Privacy

### Privacy Settings Schema

The privacy settings are stored in the `profiles` table:

```sql
profiles {
  id: uuid (primary key)
  notification_preferences: jsonb {
    shareProgress: boolean
    allowParentAccess: boolean
    dataCollection: boolean
  }
}
```

### Recommended RLS Policies

```sql
-- Users can only read/update their own privacy settings
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Parent access respects privacy settings
CREATE POLICY "Parents can view child data if allowed"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships
      WHERE child_id = profiles.id
      AND parent_id = auth.uid()
      AND verified = true
    )
    AND (notification_preferences->>'allowParentAccess')::boolean = true
  );
```

## Best Practices

### 1. Authentication
- Always use `authUser.id` from context
- Never store passwords in plain text
- Use Supabase's built-in auth flow

### 2. Data Access
- Respect privacy settings in all queries
- Check `allowParentAccess` before showing data to parents
- Use RLS policies for database-level protection

### 3. Logging
- Anonymize user IDs in logs
- Don't log sensitive information
- Use console.error for security events

### 4. User Consent
- Get explicit consent for data collection
- Provide clear privacy policy
- Allow users to opt-out anytime

## Privacy Compliance

### GDPR Compliance
- ✅ Right to access (Export Data)
- ✅ Right to deletion (Delete Account)
- ✅ Right to rectification (Edit Profile)
- ✅ Data minimization (Optional fields)
- ✅ Purpose limitation (Clear privacy settings)

### Data Retention
- User data retained while account is active
- Deleted immediately upon account deletion
- Temporary data (sessions) auto-expires

## Security Checklist

- [x] Secure token storage
- [x] Input sanitization
- [x] User authentication
- [x] Privacy controls UI
- [x] Data export functionality
- [x] Account deletion
- [x] Activity monitoring
- [ ] Two-factor authentication (future)
- [ ] Email verification on signup
- [ ] Password strength requirements
- [ ] Session timeout
- [ ] Audit logging

## Future Enhancements

### Recommended Additions:
1. **Two-Factor Authentication (2FA)**
   - SMS or authenticator app
   - Required for sensitive operations

2. **Email Verification**
   - Verify email on signup
   - Prevent fake accounts

3. **Session Management**
   - View active sessions
   - Remote logout capability
   - Session timeout after inactivity

4. **Privacy Dashboard**
   - View all data collected
   - Download reports
   - See data sharing status

5. **Audit Trail**
   - Log all privacy setting changes
   - Track data access
   - Show to users in dashboard

## Support & Compliance

**Privacy Officer Contact:** privacy@learningbridge.com
**Data Protection:** GDPR, CCPA compliant
**Last Updated:** 2025-01-01

For security concerns, please contact: security@learningbridge.com
