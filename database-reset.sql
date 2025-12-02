-- ============================================
-- DATABASE RESET SCRIPT
-- ============================================
-- Use this to completely reset the database if you need to start fresh
-- WARNING: This will delete ALL data!

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS student_chapter_progress CASCADE;
DROP TABLE IF EXISTS cbse_chapters CASCADE;
DROP TABLE IF EXISTS cbse_books CASCADE;
DROP TABLE IF EXISTS cbse_subjects CASCADE;
DROP TABLE IF EXISTS cbse_grades CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS subject_progress CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop views
DROP VIEW IF EXISTS student_subject_progress CASCADE;
DROP VIEW IF EXISTS student_recent_activity CASCADE;
DROP VIEW IF EXISTS student_dashboard_summary CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_user_stats_on_signup() CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database reset complete!';
  RAISE NOTICE '📚 Next steps:';
  RAISE NOTICE '   1. Run database-setup.sql';
  RAISE NOTICE '   2. Run database-sample-data.sql';
END $$;
