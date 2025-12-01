import { supabase } from '@/lib/supabase';

export interface CBSESubject {
  id: string;
  subject_code: string;
  subject_name: string;
  icon_emoji: string;
  applicable_grades: number[];
  is_active: boolean;
  created_at: string;
}

export interface CBSEBook {
  id: string;
  grade_id: string;
  subject_id: string;
  book_title: string;
  publisher: string;
  edition: string;
  total_chapters: number;
  is_active: boolean;
  created_at: string;
  grade?: {
    grade_number: number;
    display_name: string;
  };
  subject?: {
    subject_code: string;
    subject_name: string;
    icon_emoji: string;
  };
}

export interface CBSEChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  chapter_title: string;
  chapter_description?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  weightage_marks?: number;
  estimated_duration_hours?: number;
  created_at: string;
}

export interface CBSETopic {
  id: string;
  chapter_id: string;
  topic_number: number;
  topic_title: string;
  topic_description?: string;
  estimated_duration_minutes?: number;
  created_at: string;
}

export interface Formula {
  id: string;
  topic_id: string;
  formula_title: string;
  formula_latex?: string;
  formula_text: string;
  variables_description?: string;
  example_usage?: string;
  created_at: string;
}

export interface Example {
  id: string;
  topic_id: string;
  example_number: number;
  problem_statement: string;
  solution_steps: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export const getSubjectsForGrade = async (gradeNumber: number): Promise<CBSESubject[]> => {
  try {
    console.log('=== FETCHING SUBJECTS FOR GRADE ===', gradeNumber);

    const { data: subjects, error } = await supabase
      .from('cbse_subjects')
      .select('*')
      .contains('applicable_grades', [gradeNumber])
      .eq('is_active', true)
      .order('subject_name');

    if (error) {
      console.error('Get subjects error:', error);
      return [];
    }

    console.log(`✅ Found ${subjects?.length || 0} subjects`);
    return (subjects as CBSESubject[]) || [];

  } catch (error) {
    console.error('Get subjects exception:', error);
    return [];
  }
};

export const getBook = async (gradeNumber: number, subjectCode: string): Promise<CBSEBook | null> => {
  try {
    console.log('=== FETCHING BOOK ===', { gradeNumber, subjectCode });

    const { data: gradeData, error: gradeError } = await supabase
      .from('cbse_grades')
      .select('id')
      .eq('grade_number', gradeNumber)
      .single();

    if (gradeError || !gradeData) {
      console.error('Grade lookup error:', gradeError);
      return null;
    }

    const { data: subjectData, error: subjectError } = await supabase
      .from('cbse_subjects')
      .select('id')
      .eq('subject_code', subjectCode)
      .single();

    if (subjectError || !subjectData) {
      console.error('Subject lookup error:', subjectError);
      return null;
    }

    const { data: book, error: bookError } = await supabase
      .from('cbse_books')
      .select(`
        *,
        grade:cbse_grades!cbse_books_grade_id_fkey(grade_number, display_name),
        subject:cbse_subjects!cbse_books_subject_id_fkey(subject_code, subject_name, icon_emoji)
      `)
      .eq('grade_id', gradeData.id)
      .eq('subject_id', subjectData.id)
      .eq('is_active', true)
      .single();

    if (bookError) {
      console.error('Get book error:', bookError);
      return null;
    }

    console.log(`✅ Found book: ${book?.book_title}`);
    return book as CBSEBook;

  } catch (error) {
    console.error('Get book exception:', error);
    return null;
  }
};

export const getChapters = async (bookId: string): Promise<CBSEChapter[]> => {
  try {
    console.log('=== FETCHING CHAPTERS ===', bookId);

    const { data: chapters, error } = await supabase
      .from('cbse_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number');

    if (error) {
      console.error('Get chapters error:', error);
      return [];
    }

    console.log(`✅ Found ${chapters?.length || 0} chapters`);
    return (chapters as CBSEChapter[]) || [];

  } catch (error) {
    console.error('Get chapters exception:', error);
    return [];
  }
};

export const getTopics = async (chapterId: string): Promise<CBSETopic[]> => {
  try {
    console.log('=== FETCHING TOPICS ===', chapterId);

    const { data: topics, error } = await supabase
      .from('cbse_topics')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('topic_number');

    if (error) {
      console.error('Get topics error:', error);
      return [];
    }

    console.log(`✅ Found ${topics?.length || 0} topics`);
    return (topics as CBSETopic[]) || [];

  } catch (error) {
    console.error('Get topics exception:', error);
    return [];
  }
};

export const getChapterWithTopics = async (chapterId: string): Promise<(CBSEChapter & { topics: CBSETopic[] }) | null> => {
  try {
    const { data: chapter, error: chapterError } = await supabase
      .from('cbse_chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      console.error('Get chapter error:', chapterError);
      return null;
    }

    const topics = await getTopics(chapterId);

    return {
      ...(chapter as CBSEChapter),
      topics
    };

  } catch (error) {
    console.error('Get chapter with topics error:', error);
    return null;
  }
};

export const getFormulas = async (topicId: string): Promise<Formula[]> => {
  try {
    const { data, error } = await supabase
      .from('formula_library')
      .select('*')
      .eq('topic_id', topicId);

    if (error) {
      console.error('Get formulas error:', error);
      return [];
    }

    return (data as Formula[]) || [];

  } catch (error) {
    console.error('Get formulas exception:', error);
    return [];
  }
};

export const getExamples = async (topicId: string): Promise<Example[]> => {
  try {
    const { data, error } = await supabase
      .from('examples_library')
      .select('*')
      .eq('topic_id', topicId)
      .order('example_number');

    if (error) {
      console.error('Get examples error:', error);
      return [];
    }

    return (data as Example[]) || [];

  } catch (error) {
    console.error('Get examples exception:', error);
    return [];
  }
};
