# 🚨 CRITICAL FIX: Database Setup Required

## Problem Summary

Your app is experiencing **"Failed to fetch"** errors because the **Supabase database schema has not been set up yet**.

### Error Messages:
```
❌ Get difficult chapters error: TypeError: Failed to fetch
❌ Get recent activity error: [object Object]
❌ Get subject progress error: [object Object]  
❌ Get dashboard summary error: [object Object]
❌ Error loading subject progress: TypeError: Failed to fetch
```

### Root Cause:
The app code is trying to query database tables and views that don't exist in your Supabase database:
- `cbse_grades`, `cbse_subjects`, `cbse_books`, `cbse_chapters`
- `student_chapter_progress`, `user_stats`, `profiles`, `subject_progress`
- Views: `student_subject_progress`, `student_recent_activity`, `student_dashboard_summary`

---

## ✅ SOLUTION: 3-Step Quick Fix

### Step 1: Go to Supabase SQL Editor
1. Visit: https://supabase.com/dashboard
2. Select project: `dcirvexmyhpjqavnigre`
3. Click **SQL Editor** → **New Query**

### Step 2: Run Database Setup Script
1. Open `database-setup.sql` in this project
2. Copy ALL the SQL code
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl/Cmd + Enter)
5. Wait 5-10 seconds for completion
6. Verify you see: ✅ Database schema created successfully!

### Step 3: Add Sample Data (Recommended)
1. Open `database-sample-data.sql`
2. Copy ALL the SQL code
3. Paste into a NEW query in Supabase SQL Editor
4. Click **Run**
5. Wait a few seconds
6. Verify you see success messages

### Step 4: Test Your App
1. Refresh your app (reload browser or Expo app)
2. Log in or create a new account
3. Navigate to home screen
4. Errors should be gone! ✅

---

## 📋 What Gets Created

### Tables (8 total):
- ✅ `cbse_grades` - Grade/class levels (6-12)
- ✅ `cbse_subjects` - Subjects (Math, Science, English, Hindi, Social)
- ✅ `cbse_books` - Textbooks for each grade+subject
- ✅ `cbse_chapters` - Individual chapters in books
- ✅ `student_chapter_progress` - Student progress tracking
- ✅ `user_stats` - XP, level, streak, concepts mastered
- ✅ `profiles` - User profile data
- ✅ `subject_progress` - Legacy subject tracking

### Views (3 total):
- ✅ `student_subject_progress` - Aggregated subject progress
- ✅ `student_recent_activity` - Recent learning activities
- ✅ `student_dashboard_summary` - Dashboard statistics

### Security:
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own data
- ✅ Curriculum data is publicly readable
- ✅ Proper indexes for performance

### Sample Data:
- ✅ 7 grades (Class 6-12)
- ✅ 5 subjects
- ✅ Class 10 Mathematics (15 chapters)
- ✅ Class 10 Science (13 chapters)
- ✅ Class 9 Mathematics (12 chapters)

---

## 🔧 Troubleshooting Database

### Use the Built-in Database Checker

The app now includes a database checker page:

**To access it:**
1. Navigate to `/database-check` in your app
2. Or add a button to navigate there:
```typescript
router.push('/database-check');
```

This page will:
- ✅ Test Supabase connection
- ✅ Check if all tables exist
- ✅ Check if all views exist
- ✅ Show detailed error messages
- ✅ Guide you to fix issues

### Common Issues

#### Issue: "relation does not exist"
**Solution:** Run `database-setup.sql` completely

#### Issue: "permission denied"  
**Solution:** Check RLS policies or temporarily disable:
```sql
ALTER TABLE cbse_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_books DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_chapters DISABLE ROW LEVEL SECURITY;
```

#### Issue: Still getting errors
**Solution:**
1. Check browser console for detailed errors
2. Verify Supabase URL/key in `lib/supabase.ts`
3. Make sure you're logged in
4. Run database checker: `/database-check`

---

## 📁 Important Files

### Database Setup:
- `database-setup.sql` - **Main schema creation** (RUN THIS FIRST)
- `database-sample-data.sql` - Sample data for testing (RUN THIS SECOND)
- `DATABASE_SETUP_GUIDE.md` - Detailed setup instructions

### App Files:
- `lib/supabase.ts` - Supabase client configuration
- `services/dashboardService.ts` - Dashboard queries
- `services/studentProgress.ts` - Progress tracking
- `app/database-check.tsx` - Database testing tool
- `app/home.tsx` - Home screen with dashboard
- `app/subject-detail.tsx` - Subject detail page

---

## ✅ Success Checklist

Before considering this fixed:

- [ ] Ran `database-setup.sql` in Supabase SQL Editor
- [ ] Ran `database-sample-data.sql` in Supabase SQL Editor  
- [ ] Verified tables exist (run verification query)
- [ ] Verified views exist (run verification query)
- [ ] Refreshed/reloaded the app
- [ ] App loads without "Failed to fetch" errors
- [ ] Dashboard shows data correctly
- [ ] Subject detail pages work
- [ ] Database checker shows all green ✅

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check table row counts
SELECT 
  'cbse_grades' as table_name, COUNT(*) as row_count FROM cbse_grades
UNION ALL
SELECT 'cbse_subjects', COUNT(*) FROM cbse_subjects
UNION ALL
SELECT 'cbse_books', COUNT(*) FROM cbse_books
UNION ALL
SELECT 'cbse_chapters', COUNT(*) FROM cbse_chapters;

-- Check views exist
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE 'student_%';
```

**Expected Results:**
- cbse_grades: 7 rows
- cbse_subjects: 5 rows
- cbse_books: 3+ rows
- cbse_chapters: 40+ rows
- 3 views: student_subject_progress, student_recent_activity, student_dashboard_summary

---

## 📚 Next Steps After Setup

Once database is set up and errors are gone:

1. **Test the complete user flow**
   - Sign up → Onboarding → Subject Selection → Home
   - Check that progress tracking works
   - Verify dashboard loads correctly

2. **Add more content** (optional)
   - Add more books for other grades
   - Add chapters for other subjects
   - Use the template in `database-sample-data.sql`

3. **Monitor performance**
   - Check query speed in Supabase Dashboard
   - Look at logs for any slow queries
   - Add indexes if needed

4. **Test on different devices**
   - Test on web browser
   - Test on iOS (if available)
   - Test on Android (if available)

---

## 🆘 Still Need Help?

If problems persist after following this guide:

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for error messages

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for red error messages
   - Note any "Failed to fetch" details

3. **Use Database Checker**
   - Navigate to `/database-check` in app
   - Run tests
   - Share the results

4. **Verify Credentials**
   - Check `lib/supabase.ts`
   - Verify URL: `https://dcirvexmyhpjqavnigre.supabase.co`
   - Verify anon key is correct

---

## 📖 Additional Resources

- [Supabase SQL Editor Docs](https://supabase.com/docs/guides/database/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Views Documentation](https://www.postgresql.org/docs/current/sql-createview.html)

---

**Remember:** The database setup is a **one-time operation**. Once you run these SQL scripts successfully, you won't need to run them again (unless you reset your database).

**Status:** Once you complete these steps, all "Failed to fetch" errors will be resolved! 🎉
