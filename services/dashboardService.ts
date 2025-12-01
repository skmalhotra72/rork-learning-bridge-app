import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  total_chapters: number;
  completed_chapters: number;
  in_progress_chapters: number;
  mastered_chapters: number;
  total_study_hours: number;
  avg_mastery_score: number;
  current_streak: number;
  total_xp: number;
  current_level: number;
}

export interface SubjectOverview {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  icon_emoji: string;
  total_chapters: number;
  completed_chapters: number;
  in_progress_chapters: number;
  difficult_chapters_count: number;
  progress_percentage: number;
  avg_mastery_score: number | null;
  last_studied_at: string | null;
}

export interface LearningActivity {
  activity_id: string;
  chapter_id: string;
  chapter_title: string;
  chapter_number: number;
  subject_name: string;
  subject_code: string;
  icon_emoji: string;
  activity_type: 'study' | 'practice' | 'assessment';
  completion_percentage: number;
  mastery_score: number | null;
  time_spent_minutes: number;
  last_studied_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  streak_count: number;
  concepts_mastered: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface CompleteDashboardData {
  stats: DashboardStats;
  subjects: SubjectOverview[];
  recentActivity: LearningActivity[];
  userStats: UserStats | null;
  success: boolean;
  error?: any;
}

export const getDashboardData = async (userId: string): Promise<CompleteDashboardData> => {
  try {
    console.log('=== FETCHING COMPLETE DASHBOARD DATA ===', userId);

    const { data: progressData, error: progressError } = await supabase
      .from('student_chapter_progress')
      .select(`
        *,
        chapter:cbse_chapters!student_chapter_progress_chapter_id_fkey(
          chapter_number,
          chapter_title,
          book:cbse_books!cbse_chapters_book_id_fkey(
            subject:cbse_subjects!cbse_books_subject_id_fkey(
              id,
              subject_code,
              subject_name,
              icon_emoji
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (progressError) {
      console.error('Progress data error:', progressError);
    }

    const progress = progressData || [];

    const completed = progress.filter(p => p.is_completed || p.confidence_level >= 90).length;
    const inProgress = progress.filter(p => !p.is_completed && p.confidence_level < 90 && p.last_studied).length;
    const mastered = progress.filter(p => (p.confidence_level || 0) >= 80).length;
    const totalStudyMinutes = 0;

    const stats: DashboardStats = {
      total_chapters: progress.length,
      completed_chapters: completed,
      in_progress_chapters: inProgress,
      mastered_chapters: mastered,
      total_study_hours: Math.round((totalStudyMinutes / 60) * 10) / 10,
      avg_mastery_score: progress.length > 0 
        ? Math.round(progress.reduce((sum, p) => sum + (p.confidence_level || 0), 0) / progress.length)
        : 0,
      current_streak: 0,
      total_xp: 0,
      current_level: 1,
    };

    const subjectMap = new Map<string, any>();
    progress.forEach((p: any) => {
      const subject = p.chapter?.book?.subject;
      if (!subject) return;

      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subject_id: subject.id,
          subject_code: subject.subject_code,
          subject_name: subject.subject_name,
          icon_emoji: subject.icon_emoji,
          total_chapters: 0,
          completed_chapters: 0,
          in_progress_chapters: 0,
          difficult_chapters_count: 0,
          total_confidence: 0,
          last_studied_at: null,
        });
      }

      const subj = subjectMap.get(subject.id);
      subj.total_chapters++;
      const isCompleted = p.is_completed || p.confidence_level >= 90;
      if (isCompleted) subj.completed_chapters++;
      if (!isCompleted && p.last_studied) subj.in_progress_chapters++;
      if (p.is_difficult || p.confidence_level < 40) subj.difficult_chapters_count++;
      subj.total_confidence += p.confidence_level || 0;
      if (!subj.last_studied_at || (p.last_studied && p.last_studied > subj.last_studied_at)) {
        subj.last_studied_at = p.last_studied;
      }
    });

    const subjects: SubjectOverview[] = Array.from(subjectMap.values()).map(s => ({
      ...s,
      progress_percentage: s.total_chapters > 0 
        ? Math.round((s.completed_chapters / s.total_chapters) * 100)
        : 0,
      avg_mastery_score: s.total_chapters > 0 
        ? Math.round(s.total_confidence / s.total_chapters)
        : null,
    })).sort((a, b) => a.subject_name.localeCompare(b.subject_name));

    const recentActivity: LearningActivity[] = progress
      .filter((p: any) => p.last_studied)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.last_studied || 0).getTime();
        const dateB = new Date(b.last_studied || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10)
      .map((p: any) => ({
        activity_id: p.id,
        chapter_id: p.chapter_id,
        chapter_title: p.chapter?.chapter_title || 'Unknown',
        chapter_number: p.chapter?.chapter_number || 0,
        subject_name: p.chapter?.book?.subject?.subject_name || 'Unknown',
        subject_code: p.chapter?.book?.subject?.subject_code || '',
        icon_emoji: p.chapter?.book?.subject?.icon_emoji || '📚',
        activity_type: 'study' as const,
        completion_percentage: (p.is_completed || p.confidence_level >= 90) ? 100 : (p.confidence_level || 0),
        mastery_score: p.confidence_level,
        time_spent_minutes: 0,
        last_studied_at: p.last_studied,
      }));

    const { data: userStats, error: userStatsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userStatsError) {
      console.error('User stats error:', userStatsError);
    }

    if (userStats) {
      stats.current_streak = userStats.streak_count || 0;
      stats.total_xp = userStats.total_xp || 0;
      stats.current_level = userStats.current_level || 1;
    }

    console.log('✅ Complete dashboard data loaded');
    console.log('Stats:', stats);
    console.log('Subjects:', subjects.length);
    console.log('Activities:', recentActivity.length);

    return {
      stats,
      subjects,
      recentActivity,
      userStats: userStats as UserStats,
      success: true,
    };

  } catch (error) {
    console.error('Get dashboard data exception:', error);
    return {
      stats: {
        total_chapters: 0,
        completed_chapters: 0,
        in_progress_chapters: 0,
        mastered_chapters: 0,
        total_study_hours: 0,
        avg_mastery_score: 0,
        current_streak: 0,
        total_xp: 0,
        current_level: 1,
      },
      subjects: [],
      recentActivity: [],
      userStats: null,
      success: false,
      error,
    };
  }
};

export interface SubjectDetailData {
  book: any;
  chapters: any[];
  success: boolean;
  error?: any;
}

export const getSubjectDetail = async (
  userId: string,
  subjectCode: string,
  gradeNumber: number
): Promise<SubjectDetailData> => {
  try {
    console.log('=== FETCHING SUBJECT DETAIL ===', { subjectCode, gradeNumber });

    const { data: gradeData, error: gradeError } = await supabase
      .from('cbse_grades')
      .select('id')
      .eq('grade_number', gradeNumber)
      .single();

    if (gradeError) {
      console.error('Grade lookup error:', gradeError);
      throw new Error(`Grade not found: ${gradeError.message}`);
    }
    if (!gradeData) throw new Error('Grade not found: No data returned');

    const { data: subjectData, error: subjectError } = await supabase
      .from('cbse_subjects')
      .select('id')
      .eq('subject_code', subjectCode)
      .single();

    if (subjectError) {
      console.error('Subject lookup error:', subjectError);
      throw new Error(`Subject not found: ${subjectError.message}`);
    }
    if (!subjectData) throw new Error('Subject not found: No data returned');

    const { data: books, error: bookError } = await supabase
      .from('cbse_books')
      .select(`
        *,
        subject:cbse_subjects!cbse_books_subject_id_fkey(*),
        grade:cbse_grades!cbse_books_grade_id_fkey(*)
      `)
      .eq('grade_id', gradeData.id)
      .eq('subject_id', subjectData.id);

    if (bookError) {
      console.error('Book lookup error:', bookError);
      throw new Error(`Book lookup failed: ${bookError.message}`);
    }

    const book = books?.[0];
    if (!book) throw new Error('Book not found for this grade and subject');

    const { data: chapters, error: chaptersError } = await supabase
      .from('cbse_chapters')
      .select('*')
      .eq('book_id', book.id)
      .order('chapter_number');

    if (chaptersError) {
      console.error('Chapters lookup error:', chaptersError);
      throw new Error(`Chapters lookup failed: ${chaptersError.message}`);
    }

    const chapterIds = (chapters || []).map(c => c.id);
    let progressData = [];

    if (chapterIds.length > 0) {
      const { data: progress, error: progressError } = await supabase
        .from('student_chapter_progress')
        .select('*')
        .eq('user_id', userId)
        .in('chapter_id', chapterIds);

      if (progressError) {
        console.error('Progress lookup error:', progressError);
      } else {
        progressData = progress || [];
      }
    }

    const chaptersWithProgress = (chapters || []).map(chapter => ({
      ...chapter,
      progress: progressData?.find(p => p.chapter_id === chapter.id) || null,
    }));

    console.log('✅ Subject detail loaded:', {
      bookId: book.id,
      chaptersCount: chaptersWithProgress.length,
      progressCount: progressData.length
    });

    return {
      book,
      chapters: chaptersWithProgress,
      success: true,
    };

  } catch (error) {
    console.error('Get subject detail exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return {
      book: null,
      chapters: [],
      success: false,
      error: errorMessage,
    };
  }
};

export interface TodayStudySummary {
  totalTimeSeconds: number;
  chaptersStudied: number;
  chapters: any[];
  success: boolean;
}

export const getTodayStudySummary = async (userId: string): Promise<TodayStudySummary> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('student_chapter_progress')
      .select(`
        chapter_id,
        chapter:cbse_chapters!student_chapter_progress_chapter_id_fkey(chapter_title)
      `)
      .eq('user_id', userId)
      .gte('last_studied', today.toISOString());

    if (error) throw error;

    const totalTime = 0;
    const chaptersStudied = (data || []).length;

    return {
      totalTimeSeconds: totalTime * 60,
      chaptersStudied,
      chapters: data || [],
      success: true,
    };

  } catch (error) {
    console.error('Get today summary exception:', error);
    return {
      totalTimeSeconds: 0,
      chaptersStudied: 0,
      chapters: [],
      success: false,
    };
  }
};

export interface ProgressUpdate {
  is_completed?: boolean;
  is_difficult?: boolean;
  confidence_level?: number;
}

export const quickProgressUpdate = async (
  userId: string,
  chapterId: string,
  updates: ProgressUpdate
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('student_chapter_progress')
      .upsert({
        user_id: userId,
        chapter_id: chapterId,
        ...updates,
        last_studied: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,chapter_id',
      });

    if (error) throw error;

    console.log('✅ Progress updated');
    return { success: true };

  } catch (error) {
    console.error('Quick progress update exception:', error);
    return { success: false, error };
  }
};
