# 🗄️ Database Setup Guide

## Problem: "Failed to fetch" Errors

You're seeing these errors because the Supabase database schema hasn't been set up yet:

```
❌ Get difficult chapters error: TypeError: Failed to fetch
❌ Get recent activity error: [object Object]
❌ Get subject progress error: [object Object]
❌ Get dashboard summary error: [object Object]
```

## Solution: Set Up Database Schema

Follow these steps to set up your Supabase database:

---

## 📋 Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `dcirvexmyhpjqavnigre`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

---

## 📋 Step 2: Run Database Setup SQL

1. Open the file `database-setup.sql` in this project
2. Copy **ALL** the SQL code from that file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Wait for the query to complete (should take 5-10 seconds)
6. You should see: ✅ Database schema created successfully!

This will create:
- ✅ All required tables (grades, subjects, books, chapters, progress, etc.)
- ✅ Database views for dashboard queries
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updating timestamps
- ✅ Default data (grades 6-12, main subjects)

---

## 📋 Step 3: Populate Sample Data (Optional but Recommended)

1. Open the file `database-sample-data.sql` in this project
2. Copy **ALL** the SQL code from that file
3. Paste it into a **new query** in Supabase SQL Editor
4. Click **Run**
5. Wait for completion (should take a few seconds)

This will add:
- ✅ Class 10 Mathematics (15 chapters)
- ✅ Class 10 Science (13 chapters)
- ✅ Class 9 Mathematics (12 chapters)
- ✅ Auto-creation of user stats on signup

---

## 📋 Step 4: Verify Database Setup

Run this query in the SQL Editor to verify everything is set up:

```sql
-- Check tables exist
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

Expected results:
- `cbse_grades`: 7 rows (grades 6-12)
- `cbse_subjects`: 5 rows (Math, Science, English, Hindi, Social)
- `cbse_books`: 3+ rows (depends on sample data)
- `cbse_chapters`: 40+ rows (depends on sample data)
- Views: `student_subject_progress`, `student_recent_activity`, `student_dashboard_summary`

---

## 📋 Step 5: Test the App

1. Restart your app (refresh the browser or reload the Expo app)
2. Log in or create a new account
3. Navigate to the home screen
4. You should now see:
   - ✅ Dashboard stats loading correctly
   - ✅ Subject progress cards
   - ✅ Recent activity feed
   - ✅ No more "Failed to fetch" errors

---

## 🔧 Troubleshooting

### Issue: "relation does not exist" error

**Solution:** Make sure you ran `database-setup.sql` completely. Try running it again.

### Issue: "permission denied" error

**Solution:** Check Row Level Security policies. You might need to disable RLS temporarily:

```sql
ALTER TABLE cbse_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_books DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_chapters DISABLE ROW LEVEL SECURITY;
```

### Issue: Still getting "Failed to fetch"

**Solution:** 
1. Check browser console for detailed error messages
2. Verify Supabase connection in `lib/supabase.ts`
3. Make sure your Supabase URL and anon key are correct
4. Check if you're logged in (auth session exists)

### Issue: Views not working

**Solution:** Recreate the views manually. In SQL Editor:

```sql
-- Drop and recreate views
DROP VIEW IF EXISTS student_subject_progress CASCADE;
DROP VIEW IF EXISTS student_recent_activity CASCADE;
DROP VIEW IF EXISTS student_dashboard_summary CASCADE;

-- Then run the view creation SQL from database-setup.sql
```

---

## 📚 Database Schema Overview

### Core Tables

1. **cbse_grades** - Grade/class information (6-12)
2. **cbse_subjects** - Subjects (Math, Science, etc.)
3. **cbse_books** - Textbooks for each grade+subject
4. **cbse_chapters** - Individual chapters in each book
5. **student_chapter_progress** - Student progress on each chapter
6. **user_stats** - User XP, level, streak, etc.
7. **profiles** - User profile information
8. **subject_progress** - Legacy subject progress tracking

### Views (Computed Data)

1. **student_subject_progress** - Aggregated progress by subject
2. **student_recent_activity** - Recent learning activities
3. **student_dashboard_summary** - Overall dashboard statistics

---

## 🎯 Next Steps

After setting up the database:

1. **Add More Content**: Populate more books and chapters for other grades
2. **Test User Flow**: Create a test account and go through the onboarding
3. **Check Progress Tracking**: Study some chapters and verify progress is saved
4. **Monitor Performance**: Check if queries are fast enough

---

## 📝 Adding More Chapters

To add chapters for other subjects/grades, use this template:

```sql
-- Get IDs
DO $$
DECLARE
  v_grade_id UUID;
  v_subject_id UUID;
  v_book_id UUID;
BEGIN
  -- Get grade and subject
  SELECT id INTO v_grade_id FROM cbse_grades WHERE grade_number = 11;
  SELECT id INTO v_subject_id FROM cbse_subjects WHERE subject_code = 'SCIENCE';

  -- Create book
  INSERT INTO cbse_books (grade_id, subject_id, book_title, book_code)
  VALUES (v_grade_id, v_subject_id, 'Physics - Class XI', 'PHY-11')
  ON CONFLICT (grade_id, subject_id) DO UPDATE SET book_title = EXCLUDED.book_title
  RETURNING id INTO v_book_id;

  -- Add chapters
  INSERT INTO cbse_chapters (book_id, chapter_number, chapter_title, difficulty_level)
  VALUES 
    (v_book_id, 1, 'Physical World', 'easy'),
    (v_book_id, 2, 'Units and Measurements', 'medium'),
    (v_book_id, 3, 'Motion in a Straight Line', 'medium')
  ON CONFLICT (book_id, chapter_number) DO NOTHING;
END $$;
```

---

## 🔒 Security Notes

- ✅ Row Level Security (RLS) is enabled on all user tables
- ✅ Users can only access their own progress data
- ✅ Curriculum tables (grades, subjects, books, chapters) are publicly readable
- ✅ Users cannot modify curriculum data
- ✅ All policies are defined in `database-setup.sql`

---

## ✅ Success Checklist

Before moving on, make sure:

- [ ] Ran `database-setup.sql` successfully
- [ ] Ran `database-sample-data.sql` successfully
- [ ] Verified tables exist (7 grades, 5 subjects, etc.)
- [ ] Verified views exist (3 views)
- [ ] App loads without "Failed to fetch" errors
- [ ] Dashboard shows data correctly
- [ ] Subject detail pages work

---

## 🆘 Need Help?

If you're still having issues:

1. Check the browser console for detailed error messages
2. Look at Supabase logs in Dashboard > Logs
3. Verify your Supabase credentials in `lib/supabase.ts`
4. Make sure you're using the correct project URL

---

## 📖 Related Files

- `database-setup.sql` - Main schema creation
- `database-sample-data.sql` - Sample data for testing
- `lib/supabase.ts` - Supabase client configuration
- `services/dashboardService.ts` - Dashboard data queries
- `services/studentProgress.ts` - Progress tracking queries

---

Happy Learning! 🎓
