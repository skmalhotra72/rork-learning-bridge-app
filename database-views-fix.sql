-- ============================================
-- FIX FOR DATABASE VIEWS
-- ============================================
-- This script fixes the database views to handle cases where users have no progress data
-- Run this in your Supabase SQL Editor after running database-setup.sql

-- ============================================
-- 1. DROP AND RECREATE: Student Subject Progress View
-- ============================================
DROP VIEW IF EXISTS student_subject_progress CASCADE;

CREATE OR REPLACE VIEW student_subject_progress AS
SELECT 
  s.id AS subject_id,
  s.subject_code,
  s.subject_name,
  s.icon_emoji,
  scp.user_id,
  COALESCE(COUNT(DISTINCT c.id), 0) AS total_chapters,
  COALESCE(COUNT(DISTINCT CASE WHEN scp.is_completed = TRUE THEN c.id END), 0) AS completed_chapters,
  COALESCE(COUNT(DISTINCT CASE WHEN scp.last_studied IS NOT NULL AND scp.is_completed = FALSE THEN c.id END), 0) AS in_progress_chapters,
  COALESCE(COUNT(DISTINCT CASE WHEN scp.is_difficult = TRUE THEN c.id END), 0) AS difficult_chapters_count,
  CASE 
    WHEN COUNT(DISTINCT c.id) > 0 THEN 
      ROUND((COUNT(DISTINCT CASE WHEN scp.is_completed = TRUE THEN c.id END)::DECIMAL / COUNT(DISTINCT c.id)) * 100)
    ELSE 0
  END AS progress_percentage,
  ROUND(COALESCE(AVG(NULLIF(scp.confidence_level, 0)), 0)) AS avg_mastery_score,
  MAX(scp.last_studied) AS last_studied_at
FROM cbse_subjects s
CROSS JOIN auth.users u
LEFT JOIN cbse_books b ON b.subject_id = s.id
LEFT JOIN cbse_chapters c ON c.book_id = b.id
LEFT JOIN student_chapter_progress scp ON scp.chapter_id = c.id AND scp.user_id = u.id
WHERE s.is_active = TRUE
GROUP BY s.id, s.subject_code, s.subject_name, s.icon_emoji, u.id
HAVING scp.user_id IS NOT NULL OR COUNT(c.id) > 0;

-- ============================================
-- 2. DROP AND RECREATE: Student Recent Activity View
-- ============================================
DROP VIEW IF EXISTS student_recent_activity CASCADE;

CREATE OR REPLACE VIEW student_recent_activity AS
SELECT 
  scp.id AS activity_id,
  scp.user_id,
  c.id AS chapter_id,
  c.chapter_title,
  s.subject_name,
  s.icon_emoji,
  CASE 
    WHEN scp.is_completed = TRUE THEN 100
    ELSE COALESCE(scp.confidence_level, 0)
  END AS completion_percentage,
  scp.last_studied AS last_studied_at
FROM student_chapter_progress scp
JOIN cbse_chapters c ON c.id = scp.chapter_id
JOIN cbse_books b ON b.id = c.book_id
JOIN cbse_subjects s ON s.id = b.subject_id
WHERE scp.last_studied IS NOT NULL
ORDER BY scp.last_studied DESC;

-- ============================================
-- 3. DROP AND RECREATE: Student Dashboard Summary View
-- ============================================
DROP VIEW IF EXISTS student_dashboard_summary CASCADE;

CREATE OR REPLACE VIEW student_dashboard_summary AS
SELECT 
  u.id AS user_id,
  COALESCE(COUNT(DISTINCT CASE WHEN scp.is_completed = TRUE THEN scp.chapter_id END), 0) AS chapters_completed,
  COALESCE(COUNT(DISTINCT CASE WHEN scp.confidence_level >= 80 THEN scp.chapter_id END), 0) AS chapters_mastered,
  COALESCE(ROUND(SUM(scp.study_time_minutes)::DECIMAL / 60, 1), 0) AS total_hours_studied,
  COALESCE(ROUND(AVG(NULLIF(scp.confidence_level, 0))), 0) AS avg_mastery_score,
  COALESCE(COUNT(DISTINCT CASE WHEN scp.last_studied IS NOT NULL AND scp.is_completed = FALSE THEN scp.chapter_id END), 0) AS chapters_in_progress,
  COALESCE(COUNT(DISTINCT CASE WHEN scp.is_difficult = TRUE THEN scp.chapter_id END), 0) AS difficult_chapters_count
FROM auth.users u
LEFT JOIN student_chapter_progress scp ON scp.user_id = u.id
GROUP BY u.id;

-- ============================================
-- 4. GRANT PERMISSIONS TO VIEWS
-- ============================================
GRANT SELECT ON student_subject_progress TO authenticated;
GRANT SELECT ON student_recent_activity TO authenticated;
GRANT SELECT ON student_dashboard_summary TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database views fixed successfully!';
  RAISE NOTICE '📊 Views now handle empty data gracefully';
  RAISE NOTICE '🔒 Permissions granted to authenticated users';
END $$;
