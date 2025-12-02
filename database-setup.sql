-- ============================================
-- BUDDY LEARNING APP - DATABASE SCHEMA
-- ============================================
-- Run this SQL script in your Supabase SQL Editor
-- Database: https://dcirvexmyhpjqavnigre.supabase.co

-- ============================================
-- 1. CBSE GRADES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cbse_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_number INT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add description column if it doesn't exist (for existing tables)
DO $ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cbse_grades' AND column_name = 'description') THEN
    ALTER TABLE cbse_grades ADD COLUMN description TEXT;
  END IF;
END $;

-- Insert default grades
INSERT INTO cbse_grades (grade_number, display_name, description) VALUES
  (6, 'Class 6', 'Grade 6 - Middle School'),
  (7, 'Class 7', 'Grade 7 - Middle School'),
  (8, 'Class 8', 'Grade 8 - Middle School'),
  (9, 'Class 9', 'Grade 9 - Secondary School'),
  (10, 'Class 10', 'Grade 10 - Secondary School'),
  (11, 'Class 11', 'Grade 11 - Senior Secondary School'),
  (12, 'Class 12', 'Grade 12 - Senior Secondary School')
ON CONFLICT (grade_number) DO NOTHING;

-- ============================================
-- 2. CBSE SUBJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cbse_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  icon_emoji TEXT DEFAULT '📚',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO cbse_subjects (subject_code, subject_name, icon_emoji, description) VALUES
  ('MATH', 'Mathematics', '🔢', 'Mathematics curriculum'),
  ('SCIENCE', 'Science', '🔬', 'Science curriculum'),
  ('ENGLISH', 'English', '📖', 'English language and literature'),
  ('HINDI', 'Hindi', '📝', 'Hindi language'),
  ('SOCIAL', 'Social Science', '🌍', 'History, Geography, Civics, Economics')
ON CONFLICT (subject_code) DO NOTHING;

-- ============================================
-- 3. CBSE BOOKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cbse_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES cbse_grades(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES cbse_subjects(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_code TEXT,
  publication_year INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(grade_id, subject_id)
);

-- Add missing columns if they don't exist
DO $ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cbse_books' AND column_name = 'book_code') THEN
    ALTER TABLE cbse_books ADD COLUMN book_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cbse_books' AND column_name = 'publication_year') THEN
    ALTER TABLE cbse_books ADD COLUMN publication_year INT;
  END IF;
END $;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cbse_books_grade ON cbse_books(grade_id);
CREATE INDEX IF NOT EXISTS idx_cbse_books_subject ON cbse_books(subject_id);

-- ============================================
-- 4. CBSE CHAPTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cbse_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES cbse_books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  chapter_title TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT DEFAULT 'medium',
  estimated_duration_hours DECIMAL(4,2) DEFAULT 2.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, chapter_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cbse_chapters_book ON cbse_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_cbse_chapters_number ON cbse_chapters(chapter_number);

-- ============================================
-- 5. STUDENT CHAPTER PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_chapter_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES cbse_chapters(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  is_difficult BOOLEAN DEFAULT FALSE,
  confidence_level INT DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  study_time_minutes INT DEFAULT 0,
  mastery_score INT CHECK (mastery_score >= 0 AND mastery_score <= 100),
  last_studied TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_user ON student_chapter_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_chapter ON student_chapter_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_difficult ON student_chapter_progress(user_id, is_difficult) WHERE is_difficult = TRUE;
CREATE INDEX IF NOT EXISTS idx_student_progress_last_studied ON student_chapter_progress(user_id, last_studied);

-- ============================================
-- 6. USER STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INT DEFAULT 0,
  current_level INT DEFAULT 1,
  streak_count INT DEFAULT 0,
  concepts_mastered INT DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);

-- ============================================
-- 7. PROFILES TABLE (if not exists from auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. SUBJECT PROGRESS TABLE (Old schema compatibility)
-- ============================================
CREATE TABLE IF NOT EXISTS subject_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  current_chapter TEXT,
  confidence_level INT DEFAULT 0,
  stuck_points TEXT,
  status TEXT DEFAULT 'getting_to_know_you',
  mastery_percentage INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject)
);

CREATE INDEX IF NOT EXISTS idx_subject_progress_user ON subject_progress(user_id);

-- ============================================
-- 9. VIEWS FOR DASHBOARD
-- ============================================

-- View: Student Subject Progress
CREATE OR REPLACE VIEW student_subject_progress AS
SELECT 
  s.id AS subject_id,
  s.subject_code,
  s.subject_name,
  s.icon_emoji,
  scp.user_id,
  COUNT(DISTINCT c.id) AS total_chapters,
  COUNT(DISTINCT CASE WHEN scp.is_completed THEN c.id END) AS completed_chapters,
  COUNT(DISTINCT CASE WHEN scp.last_studied IS NOT NULL AND NOT scp.is_completed THEN c.id END) AS in_progress_chapters,
  COUNT(DISTINCT CASE WHEN scp.is_difficult THEN c.id END) AS difficult_chapters_count,
  CASE 
    WHEN COUNT(DISTINCT c.id) > 0 THEN 
      ROUND((COUNT(DISTINCT CASE WHEN scp.is_completed THEN c.id END)::DECIMAL / COUNT(DISTINCT c.id)) * 100)
    ELSE 0
  END AS progress_percentage,
  ROUND(AVG(scp.confidence_level)) AS avg_mastery_score,
  MAX(scp.last_studied) AS last_studied_at
FROM cbse_subjects s
LEFT JOIN cbse_books b ON b.subject_id = s.id
LEFT JOIN cbse_chapters c ON c.book_id = b.id
LEFT JOIN student_chapter_progress scp ON scp.chapter_id = c.id
GROUP BY s.id, s.subject_code, s.subject_name, s.icon_emoji, scp.user_id;

-- View: Student Recent Activity
CREATE OR REPLACE VIEW student_recent_activity AS
SELECT 
  scp.id AS activity_id,
  scp.user_id,
  c.id AS chapter_id,
  c.chapter_title,
  s.subject_name,
  s.icon_emoji,
  CASE 
    WHEN scp.is_completed THEN 100
    ELSE scp.confidence_level
  END AS completion_percentage,
  scp.last_studied AS last_studied_at
FROM student_chapter_progress scp
JOIN cbse_chapters c ON c.id = scp.chapter_id
JOIN cbse_books b ON b.id = c.book_id
JOIN cbse_subjects s ON s.id = b.subject_id
WHERE scp.last_studied IS NOT NULL
ORDER BY scp.last_studied DESC;

-- View: Student Dashboard Summary
CREATE OR REPLACE VIEW student_dashboard_summary AS
SELECT 
  scp.user_id,
  COUNT(DISTINCT CASE WHEN scp.is_completed THEN scp.chapter_id END) AS chapters_completed,
  COUNT(DISTINCT CASE WHEN scp.confidence_level >= 80 THEN scp.chapter_id END) AS chapters_mastered,
  ROUND(SUM(scp.study_time_minutes)::DECIMAL / 60, 1) AS total_hours_studied,
  ROUND(AVG(scp.confidence_level)) AS avg_mastery_score,
  COUNT(DISTINCT CASE WHEN scp.last_studied IS NOT NULL AND NOT scp.is_completed THEN scp.chapter_id END) AS chapters_in_progress,
  COUNT(DISTINCT CASE WHEN scp.is_difficult THEN scp.chapter_id END) AS difficult_chapters_count
FROM student_chapter_progress scp
GROUP BY scp.user_id;

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all user-related tables
ALTER TABLE student_chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_progress ENABLE ROW LEVEL SECURITY;

-- Policies for student_chapter_progress
CREATE POLICY "Users can view own chapter progress" ON student_chapter_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chapter progress" ON student_chapter_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chapter progress" ON student_chapter_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for subject_progress
CREATE POLICY "Users can view own subject progress" ON subject_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject progress" ON subject_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subject progress" ON subject_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for curriculum tables
ALTER TABLE cbse_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbse_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grades" ON cbse_grades FOR SELECT USING (true);
CREATE POLICY "Anyone can view subjects" ON cbse_subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view books" ON cbse_books FOR SELECT USING (true);
CREATE POLICY "Anyone can view chapters" ON cbse_chapters FOR SELECT USING (true);

-- ============================================
-- 11. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_cbse_grades_updated_at BEFORE UPDATE ON cbse_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbse_subjects_updated_at BEFORE UPDATE ON cbse_subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbse_books_updated_at BEFORE UPDATE ON cbse_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbse_chapters_updated_at BEFORE UPDATE ON cbse_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_chapter_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_progress_updated_at BEFORE UPDATE ON subject_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📚 Next steps:';
  RAISE NOTICE '   1. Populate cbse_books with actual books for each grade+subject';
  RAISE NOTICE '   2. Populate cbse_chapters with actual chapter data';
  RAISE NOTICE '   3. Test the app and verify data flows correctly';
END $$;
