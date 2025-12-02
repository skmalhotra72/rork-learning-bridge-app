-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================
-- Run this AFTER running database-setup.sql

-- ============================================
-- SAMPLE BOOKS
-- ============================================

-- Get grade and subject IDs for Class 10 Mathematics
DO $$
DECLARE
  v_grade_10_id UUID;
  v_math_subject_id UUID;
  v_science_subject_id UUID;
  v_english_subject_id UUID;
  v_book_math_id UUID;
  v_book_science_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO v_grade_10_id FROM cbse_grades WHERE grade_number = 10;
  SELECT id INTO v_math_subject_id FROM cbse_subjects WHERE subject_code = 'MATH';
  SELECT id INTO v_science_subject_id FROM cbse_subjects WHERE subject_code = 'SCIENCE';
  SELECT id INTO v_english_subject_id FROM cbse_subjects WHERE subject_code = 'ENGLISH';

  -- Insert Mathematics book for Class 10
  INSERT INTO cbse_books (grade_id, subject_id, book_title, book_code, publication_year)
  VALUES (v_grade_10_id, v_math_subject_id, 'Mathematics - Class X', 'MATH-10', 2023)
  ON CONFLICT (grade_id, subject_id) DO UPDATE SET book_title = EXCLUDED.book_title
  RETURNING id INTO v_book_math_id;

  -- Insert Mathematics chapters
  INSERT INTO cbse_chapters (book_id, chapter_number, chapter_title, description, difficulty_level, estimated_duration_hours)
  VALUES 
    (v_book_math_id, 1, 'Real Numbers', 'Euclid''s division algorithm, Fundamental Theorem of Arithmetic', 'medium', 3.0),
    (v_book_math_id, 2, 'Polynomials', 'Zeros of a polynomial, Relationship between zeros and coefficients', 'medium', 3.5),
    (v_book_math_id, 3, 'Pair of Linear Equations in Two Variables', 'Graphical and algebraic methods of solving linear equations', 'medium', 4.0),
    (v_book_math_id, 4, 'Quadratic Equations', 'Standard form, Solution by factorization, quadratic formula', 'hard', 4.5),
    (v_book_math_id, 5, 'Arithmetic Progressions', 'General term, Sum of first n terms', 'medium', 3.0),
    (v_book_math_id, 6, 'Triangles', 'Similar triangles, Pythagoras theorem', 'medium', 4.0),
    (v_book_math_id, 7, 'Coordinate Geometry', 'Distance formula, Section formula', 'medium', 3.5),
    (v_book_math_id, 8, 'Introduction to Trigonometry', 'Trigonometric ratios, Identities', 'hard', 5.0),
    (v_book_math_id, 9, 'Applications of Trigonometry', 'Heights and distances', 'medium', 3.0),
    (v_book_math_id, 10, 'Circles', 'Tangent to a circle, Number of tangents from a point', 'medium', 3.5),
    (v_book_math_id, 11, 'Areas Related to Circles', 'Perimeter and area of circle, areas of sector and segment', 'medium', 3.0),
    (v_book_math_id, 12, 'Surface Areas and Volumes', 'Problems on finding surface areas and volumes', 'medium', 4.0),
    (v_book_math_id, 13, 'Statistics', 'Mean, median and mode of grouped data', 'easy', 3.0),
    (v_book_math_id, 14, 'Probability', 'Classical definition of probability', 'medium', 2.5),
    (v_book_math_id, 15, 'Constructions', 'Division of a line segment, Construction of tangents', 'easy', 2.0)
  ON CONFLICT (book_id, chapter_number) DO NOTHING;

  -- Insert Science book for Class 10
  INSERT INTO cbse_books (grade_id, subject_id, book_title, book_code, publication_year)
  VALUES (v_grade_10_id, v_science_subject_id, 'Science - Class X', 'SCI-10', 2023)
  ON CONFLICT (grade_id, subject_id) DO UPDATE SET book_title = EXCLUDED.book_title
  RETURNING id INTO v_book_science_id;

  -- Insert Science chapters
  INSERT INTO cbse_chapters (book_id, chapter_number, chapter_title, description, difficulty_level, estimated_duration_hours)
  VALUES 
    (v_book_science_id, 1, 'Chemical Reactions and Equations', 'Types of chemical reactions', 'medium', 3.0),
    (v_book_science_id, 2, 'Acids, Bases and Salts', 'Understanding pH scale', 'medium', 3.5),
    (v_book_science_id, 3, 'Metals and Non-metals', 'Physical and chemical properties', 'medium', 4.0),
    (v_book_science_id, 4, 'Carbon and its Compounds', 'Covalent bonding, Versatile nature of carbon', 'hard', 4.5),
    (v_book_science_id, 5, 'Life Processes', 'Nutrition, respiration, transportation', 'medium', 4.0),
    (v_book_science_id, 6, 'Control and Coordination', 'Nervous system, Hormones in animals', 'medium', 3.5),
    (v_book_science_id, 7, 'How do Organisms Reproduce?', 'Modes of reproduction', 'medium', 4.0),
    (v_book_science_id, 8, 'Heredity and Evolution', 'Heredity, Evolution and classification', 'hard', 4.5),
    (v_book_science_id, 9, 'Light - Reflection and Refraction', 'Laws of reflection and refraction', 'medium', 4.0),
    (v_book_science_id, 10, 'The Human Eye and the Colourful World', 'Structure of eye, defects of vision', 'medium', 3.0),
    (v_book_science_id, 11, 'Electricity', 'Electric current, Ohm''s law', 'hard', 5.0),
    (v_book_science_id, 12, 'Magnetic Effects of Electric Current', 'Magnetic field, Electromagnetic induction', 'hard', 4.5),
    (v_book_science_id, 13, 'Our Environment', 'Ecosystem, Environmental problems', 'easy', 2.5)
  ON CONFLICT (book_id, chapter_number) DO NOTHING;

  RAISE NOTICE '✅ Sample data inserted successfully!';
  RAISE NOTICE '📚 Mathematics book: % chapters', (SELECT COUNT(*) FROM cbse_chapters WHERE book_id = v_book_math_id);
  RAISE NOTICE '🔬 Science book: % chapters', (SELECT COUNT(*) FROM cbse_chapters WHERE book_id = v_book_science_id);
END $$;

-- ============================================
-- SAMPLE DATA FOR OTHER GRADES
-- ============================================

-- Class 9 Mathematics
DO $$
DECLARE
  v_grade_9_id UUID;
  v_math_subject_id UUID;
  v_book_id UUID;
BEGIN
  SELECT id INTO v_grade_9_id FROM cbse_grades WHERE grade_number = 9;
  SELECT id INTO v_math_subject_id FROM cbse_subjects WHERE subject_code = 'MATH';

  INSERT INTO cbse_books (grade_id, subject_id, book_title, book_code, publication_year)
  VALUES (v_grade_9_id, v_math_subject_id, 'Mathematics - Class IX', 'MATH-9', 2023)
  ON CONFLICT (grade_id, subject_id) DO UPDATE SET book_title = EXCLUDED.book_title
  RETURNING id INTO v_book_id;

  INSERT INTO cbse_chapters (book_id, chapter_number, chapter_title, description, difficulty_level, estimated_duration_hours)
  VALUES 
    (v_book_id, 1, 'Number Systems', 'Rational and irrational numbers', 'medium', 3.0),
    (v_book_id, 2, 'Polynomials', 'Polynomials in one variable', 'medium', 3.5),
    (v_book_id, 3, 'Coordinate Geometry', 'Cartesian system, plotting points', 'easy', 2.5),
    (v_book_id, 4, 'Linear Equations in Two Variables', 'Solution of linear equations', 'medium', 3.5),
    (v_book_id, 5, 'Introduction to Euclid''s Geometry', 'Euclid''s definitions and axioms', 'medium', 2.5),
    (v_book_id, 6, 'Lines and Angles', 'Basic terms and definitions', 'easy', 3.0),
    (v_book_id, 7, 'Triangles', 'Congruence of triangles', 'medium', 4.0),
    (v_book_id, 8, 'Quadrilaterals', 'Properties of parallelogram', 'medium', 3.5),
    (v_book_id, 9, 'Circles', 'Basic properties of circles', 'medium', 3.0),
    (v_book_id, 10, 'Heron''s Formula', 'Application of Heron''s formula', 'easy', 2.0),
    (v_book_id, 11, 'Surface Areas and Volumes', 'Surface area and volume of cuboids and cylinders', 'medium', 4.0),
    (v_book_id, 12, 'Statistics', 'Collection and presentation of data', 'easy', 3.0)
  ON CONFLICT (book_id, chapter_number) DO NOTHING;

  RAISE NOTICE '✅ Class 9 Mathematics: % chapters', (SELECT COUNT(*) FROM cbse_chapters WHERE book_id = v_book_id);
END $$;

-- ============================================
-- UTILITY: Function to create user stats on signup
-- ============================================
CREATE OR REPLACE FUNCTION create_user_stats_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_xp, current_level, streak_count, concepts_mastered)
  VALUES (NEW.id, 0, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user stats
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats_on_signup();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'DATABASE VERIFICATION';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Grades: %', (SELECT COUNT(*) FROM cbse_grades);
  RAISE NOTICE 'Subjects: %', (SELECT COUNT(*) FROM cbse_subjects);
  RAISE NOTICE 'Books: %', (SELECT COUNT(*) FROM cbse_books);
  RAISE NOTICE 'Chapters: %', (SELECT COUNT(*) FROM cbse_chapters);
  RAISE NOTICE '====================================';
END $$;
