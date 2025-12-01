# Database Integrity Check Report

## Overview
The Database Integrity Check utility provides comprehensive verification of all database components including tables, columns, functions, views, constraints, and data relationships.

## How to Access

1. **Via Developer Menu:**
   - Open any screen with the developer menu (Home, Progress, Profile)
   - Tap 5 times on the screen header/title
   - Select "Database Integrity Check"

2. **Direct Navigation:**
   ```typescript
   import { router } from 'expo-router';
   router.push('/database-check');
   ```

## What Gets Checked

### 1. Tables (22 Expected)
The utility verifies the existence and accessibility of all required tables:

#### Core Tables
- `profiles` - User profile information
- `user_preferences` - Language, difficulty, selected subjects
- `user_stats` - XP, level, streak, concepts mastered

#### Learning & Assessment
- `subject_progress` - Progress tracking per subject
- `assessments` - Completed assessments
- `assessment_questions` - Question responses
- `learning_gaps` - Identified knowledge gaps
- `learning_paths` - Personalized learning recommendations

#### Gamification
- `badges` - Available badges
- `user_badges` - Earned badges
- `xp_transactions` - XP gain/loss history
- `learning_streaks` - Daily streak tracking

#### AI Tutoring
- `ai_tutor_sessions` - AI tutoring sessions
- `ai_chat_messages` - Chat message history

#### Parent Portal
- `parent_child_relationships` - Parent-child links
- `parent_goals` - Goals set by parents
- `parent_rewards` - Reward system
- `weekly_reports` - Automated weekly reports

#### System Tables
- `offline_queue` - Pending offline actions
- `sync_status` - Sync state tracking
- `error_logs` - Application error logs
- `performance_metrics` - Performance tracking

### 2. Columns Verification
Checks that all expected columns exist in key tables:

- **profiles**: id, full_name, email, grade, avatar_url, created_at, updated_at
- **user_preferences**: id, user_id, language, difficulty_level, selected_subjects, created_at, updated_at
- **subject_progress**: id, user_id, subject, current_chapter, confidence_level, stuck_points, status, mastery_percentage, created_at, updated_at
- **assessments**: id, user_id, subject, chapter, score, total_questions, time_taken, created_at
- **user_stats**: id, user_id, total_xp, current_level, streak_count, concepts_mastered, last_activity, created_at, updated_at
- **xp_transactions**: id, user_id, amount, reason, created_at
- **badges**: id, name, description, icon, xp_required, category, created_at
- **user_badges**: id, user_id, badge_id, earned_at, created_at

### 3. Database Functions (7 Expected)
Verifies existence and executability of database functions:

- `award_xp` - Awards XP to user and creates transaction
- `check_and_unlock_badges` - Checks user XP and unlocks eligible badges
- `update_user_level` - Updates user level based on XP
- `calculate_mastery_percentage` - Calculates subject mastery
- `get_learning_recommendations` - Gets personalized learning recommendations
- `get_parent_dashboard_data` - Retrieves parent dashboard data
- `generate_weekly_report` - Generates weekly progress report

### 4. Database Views (3 Expected)
Checks that views are queryable:

- `user_progress_summary` - Aggregated user progress across subjects
- `badge_progress` - Badge unlock progress
- `parent_dashboard_view` - Optimized parent dashboard data

### 5. Indexes
Verifies that performance-critical indexes exist (requires admin access)

### 6. Constraints
Tests database constraints:

- **Foreign Keys**: Ensures referential integrity (e.g., user_stats.user_id → profiles.id)
- **Unique Constraints**: Prevents duplicates (e.g., user_badges unique on user_id + badge_id)
- **Not Null Constraints**: Ensures required fields are populated

### 7. Triggers
Checks that automated triggers are functioning:

- Auto-timestamp updates
- Cascade operations
- Validation triggers

### 8. Orphaned Records
Searches for data integrity issues:

- subject_progress records without valid user
- assessments without valid user
- user_badges without valid badge reference

### 9. Data Relationships
Validates critical data relationships:

- **Profile → User Stats**: Every profile should have user_stats
- **User Stats → XP Transactions**: Total XP should match sum of transactions
- **User Badges → Badges**: All badge references should be valid

### 10. Query Performance
Measures query execution time:

- Simple queries (should be < 1000ms)
- Complex joins (should be < 2000ms)
- Reports slow queries for optimization

## Check Status Types

- ✅ **PASS**: Check completed successfully, no issues found
- ❌ **FAIL**: Critical issue detected, requires immediate attention
- ⚠️ **WARNING**: Non-critical issue or cannot verify (e.g., requires admin access)

## Example Output

```
================================================================================
DATABASE INTEGRITY REPORT
================================================================================
Timestamp: 2025-12-01T10:30:00.000Z
Overall Status: PASS

Summary:
  Total Checks: 68
  ✅ Passed: 62
  ❌ Failed: 0
  ⚠️ Warnings: 6
================================================================================

📂 Tables (22/22 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ profiles
   Table exists and is accessible
✅ user_preferences
   Table exists and is accessible
✅ subject_progress
   Table exists and is accessible
... (continues for all tables)

📂 Columns (8/8 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ profiles
   All expected columns present
✅ user_preferences
   All expected columns present
... (continues for all tables)

📂 Functions (5/7 passed, 0 failed, 2 warnings)
--------------------------------------------------------------------------------
✅ award_xp
   Function exists and executed successfully
✅ check_and_unlock_badges
   Function exists and executed successfully
⚠️ update_user_level
   Function test not implemented
... (continues for all functions)

📂 Views (3/3 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ user_progress_summary
   View exists and is queryable
✅ badge_progress
   View exists and is queryable
✅ parent_dashboard_view
   View exists and is queryable

📂 Indexes (1/1 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ Index Check
   Index verification requires database admin access (skipped)

📂 Constraints (2/2 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ Foreign Key: user_stats.user_id
   Constraint is enforced correctly
✅ Unique: user_badges (user_id, badge_id)
   Constraint is enforced correctly

📂 Triggers (1/1 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ Trigger Check
   Trigger verification requires database admin access (skipped)

📂 Orphaned Records (3/3 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ subject_progress without user
   No orphaned records found
✅ assessments without user
   No orphaned records found
✅ user_badges without badge
   No orphaned records found

📂 Relationships (3/3 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ Profile → User Stats
   Relationship intact
✅ User Stats → XP Transactions
   XP matches (150)
✅ User Badges → Badges
   All badge references valid

📂 Performance (4/4 passed, 0 failed, 0 warnings)
--------------------------------------------------------------------------------
✅ profiles query
   Fast query: 45ms
✅ subject_progress query
   Fast query: 67ms
✅ assessments query
   Fast query: 52ms
✅ user_stats with joins
   Fast query: 123ms

================================================================================
END OF REPORT
================================================================================
```

## Common Issues and Solutions

### Issue: Table Does Not Exist
**Status**: ❌ FAIL  
**Solution**: 
1. Verify Supabase connection
2. Check if migrations have been run
3. Review database schema in Supabase dashboard
4. Run missing migrations

### Issue: Missing Columns
**Status**: ⚠️ WARNING  
**Solution**:
1. Check if table schema is up to date
2. Run migration to add missing columns
3. Verify column names match expected schema

### Issue: Function Does Not Exist
**Status**: ❌ FAIL  
**Solution**:
1. Create missing function in Supabase SQL Editor
2. Verify function permissions (should be executable by authenticated users)
3. Check function parameters match expected signature

### Issue: XP Mismatch
**Status**: ⚠️ WARNING  
**Solution**:
1. Investigate xp_transactions table for inconsistencies
2. Check for failed XP award operations
3. Manually reconcile if needed:
```sql
UPDATE user_stats 
SET total_xp = (SELECT SUM(amount) FROM xp_transactions WHERE user_id = '{user_id}')
WHERE user_id = '{user_id}';
```

### Issue: Orphaned Records
**Status**: ⚠️ WARNING  
**Solution**:
1. Investigate why foreign key constraint failed
2. Clean up orphaned records:
```sql
DELETE FROM subject_progress WHERE user_id IS NULL;
DELETE FROM assessments WHERE user_id NOT IN (SELECT id FROM profiles);
```

### Issue: Slow Query Performance
**Status**: ⚠️ WARNING (if > 1000ms)  
**Solution**:
1. Add indexes to frequently queried columns
2. Optimize query joins
3. Consider query result caching
4. Review database query execution plan

## Running Checks Programmatically

```typescript
import { runDatabaseIntegrityCheck, printReport } from '@/utils/databaseIntegrityCheck';

async function runCheck() {
  const report = await runDatabaseIntegrityCheck();
  printReport(report);
  
  // Access individual results
  const failedChecks = report.checks.filter(c => c.status === 'fail');
  if (failedChecks.length > 0) {
    console.error('Critical issues found:', failedChecks);
  }
  
  return report;
}
```

## Best Practices

1. **Run Regularly**: Run integrity checks after major updates or migrations
2. **Monitor Warnings**: Don't ignore warnings - they may indicate future problems
3. **Performance Baseline**: Track query performance over time to detect degradation
4. **Pre-Production**: Always run checks before deploying to production
5. **User Session**: Run relationship checks only when user is logged in for complete validation

## Integration with CI/CD

You can integrate these checks into your CI/CD pipeline:

```typescript
// In test script
const report = await runDatabaseIntegrityCheck();
if (report.overallStatus === 'fail') {
  process.exit(1); // Fail the build
}
```

## Limitations

1. **Admin-Only Features**: Some checks (indexes, triggers) require database admin access
2. **Session Required**: Relationship checks require an active user session
3. **Test Data**: Some constraint tests require test data to be present
4. **Performance**: Full check may take 30-60 seconds depending on data size

## Future Enhancements

- [ ] Automated healing for common issues
- [ ] Historical trend tracking
- [ ] Email alerts for critical failures
- [ ] Scheduled background checks
- [ ] More comprehensive constraint testing
- [ ] RLS (Row Level Security) policy verification
- [ ] Backup/restore verification
