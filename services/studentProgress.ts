import { supabase } from '@/lib/supabase';

export interface ChapterProgressData {
  chapterId: string;
  completed: boolean;
  difficult: boolean;
  confidence: number;
}

export interface InitialAssessmentData {
  completedChapters: number[];
  difficultChapters: number[];
  confidence: number;
  learningGoals: string[];
  studyPace: 'slow' | 'medium' | 'fast';
}

export interface ChapterProgressSummary {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  marked_completed: boolean;
  marked_difficult: boolean;
  confidence_level: number;
  study_time_minutes: number;
  last_studied: string | null;
}

export const initializeChapterProgress = async (
  userId: string,
  chapterId: string,
  options: {
    markedCompleted?: boolean;
    markedDifficult?: boolean;
    confidence?: number;
  } = {}
): Promise<{ success: boolean; progressId?: string; error?: any }> => {
  try {
    console.log('=== INITIALIZING CHAPTER PROGRESS ===');
    console.log('Chapter:', chapterId);
    console.log('Options:', options);

    const { data, error } = await supabase
      .from('student_chapter_progress')
      .insert({
        user_id: userId,
        chapter_id: chapterId,
        marked_completed: options.markedCompleted || false,
        marked_difficult: options.markedDifficult || false,
        confidence_level: options.confidence || 5,
        study_time_minutes: 0,
        last_studied: options.markedCompleted ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Initialize progress error:', error);
      return { success: false, error };
    }

    console.log('✅ Chapter progress initialized');
    return { success: true, progressId: data?.id };

  } catch (error) {
    console.error('Initialize progress exception:', error);
    return { success: false, error };
  }
};

export const saveInitialAssessment = async (
  userId: string,
  subjectId: string,
  assessmentData: InitialAssessmentData
): Promise<{ success: boolean; assessmentId?: string; error?: any }> => {
  try {
    console.log('=== SAVING INITIAL ASSESSMENT ===');
    console.log('Subject:', subjectId);

    const { data, error } = await supabase
      .from('initial_assessments')
      .insert({
        user_id: userId,
        subject_id: subjectId,
        completed_chapters: assessmentData.completedChapters,
        difficult_chapters: assessmentData.difficultChapters,
        overall_confidence: assessmentData.confidence,
        learning_goals: assessmentData.learningGoals,
        study_pace: assessmentData.studyPace,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Save assessment error:', error);
      return { success: false, error };
    }

    console.log('✅ Initial assessment saved');
    return { success: true, assessmentId: data?.id };

  } catch (error) {
    console.error('Save assessment exception:', error);
    return { success: false, error };
  }
};

export const getChapterProgressSummary = async (
  userId: string,
  subjectCode: string,
  gradeNumber: number
): Promise<ChapterProgressSummary[]> => {
  try {
    console.log('=== FETCHING CHAPTER PROGRESS SUMMARY ===');

    const { data: gradeData, error: gradeError } = await supabase
      .from('cbse_grades')
      .select('id')
      .eq('grade_number', gradeNumber)
      .single();

    if (gradeError || !gradeData) {
      console.error('Grade lookup error:', gradeError);
      return [];
    }

    const { data: subjectData, error: subjectError } = await supabase
      .from('cbse_subjects')
      .select('id')
      .eq('subject_code', subjectCode)
      .single();

    if (subjectError || !subjectData) {
      console.error('Subject lookup error:', subjectError);
      return [];
    }

    const { data: bookData, error: bookError } = await supabase
      .from('cbse_books')
      .select('id')
      .eq('grade_id', gradeData.id)
      .eq('subject_id', subjectData.id)
      .single();

    if (bookError || !bookData) {
      console.error('Book lookup error:', bookError);
      return [];
    }

    const { data: progress, error } = await supabase
      .from('student_chapter_progress')
      .select(`
        *,
        chapter:cbse_chapters!student_chapter_progress_chapter_id_fkey(
          chapter_number,
          chapter_title
        )
      `)
      .eq('user_id', userId)
      .eq('chapter.book_id', bookData.id);

    if (error) {
      console.error('Get progress summary error:', error);
      return [];
    }

    console.log(`✅ Found progress for ${progress?.length || 0} chapters`);
    return (progress || []).map((p: any) => ({
      chapter_id: p.chapter_id,
      chapter_number: p.chapter?.chapter_number,
      chapter_title: p.chapter?.chapter_title,
      marked_completed: p.marked_completed,
      marked_difficult: p.marked_difficult,
      confidence_level: p.confidence_level,
      study_time_minutes: p.study_time_minutes,
      last_studied: p.last_studied,
    }));

  } catch (error) {
    console.error('Get progress summary exception:', error);
    return [];
  }
};

export const bulkInitializeChapters = async (
  userId: string,
  chapters: ChapterProgressData[]
): Promise<{ success: boolean; count: number; error?: any }> => {
  try {
    console.log('=== BULK INITIALIZING CHAPTERS ===');
    console.log(`Initializing ${chapters.length} chapters`);

    const records = chapters.map(chapter => ({
      user_id: userId,
      chapter_id: chapter.chapterId,
      marked_completed: chapter.completed,
      marked_difficult: chapter.difficult,
      confidence_level: chapter.confidence,
      study_time_minutes: 0,
      last_studied: chapter.completed ? new Date().toISOString() : null,
    }));

    const { data, error } = await supabase
      .from('student_chapter_progress')
      .insert(records)
      .select('id');

    if (error) {
      console.error('Bulk initialize error:', error);
      return { success: false, count: 0, error };
    }

    const successCount = data?.length || 0;
    console.log(`✅ Successfully initialized ${successCount}/${chapters.length} chapters`);

    return { success: true, count: successCount };

  } catch (error) {
    console.error('Bulk initialize exception:', error);
    return { success: false, count: 0, error };
  }
};

export const getStudentOverallProgress = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('student_chapter_progress')
      .select(`
        *,
        chapter:cbse_chapters!student_chapter_progress_chapter_id_fkey(
          chapter_title,
          chapter_number,
          book:cbse_books!cbse_chapters_book_id_fkey(
            subject:cbse_subjects!cbse_books_subject_id_fkey(subject_name)
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Get overall progress error:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('Get overall progress exception:', error);
    return [];
  }
};

export const updateChapterProgress = async (
  userId: string,
  chapterId: string,
  updates: Partial<{
    marked_completed: boolean;
    marked_difficult: boolean;
    confidence_level: number;
    study_time_minutes: number;
    last_studied: string;
  }>
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('student_chapter_progress')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Update chapter progress error:', error);
      return { success: false, error };
    }

    console.log('✅ Chapter progress updated');
    return { success: true };

  } catch (error) {
    console.error('Update progress exception:', error);
    return { success: false, error };
  }
};
