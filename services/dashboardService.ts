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

    const completed = progress.filter(p => p.marked_completed).length;
    const inProgress = progress.filter(p => !p.marked_completed && p.study_time_minutes > 0).length;
    const mastered = progress.filter(p => (p.confidence_level || 0) >= 80).length;
    const totalStudyMinutes = progress.reduce((sum, p) => sum + (p.study_time_minutes || 0), 0);

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
      if (p.marked_completed) subj.completed_chapters++;
      if (!p.marked_completed && p.study_time_minutes > 0) subj.in_progress_chapters++;
      if (p.marked_difficult) subj.difficult_chapters_count++;
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
        completion_percentage: p.marked_completed ? 100 : Math.min(Math.round((p.study_time_minutes / 60) * 25), 90),
        mastery_score: p.confidence_level,
        time_spent_minutes: p.study_time_minutes,
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

    if (gradeError || !gradeData) throw new Error('Grade not found');

    const { data: subjectData, error: subjectError } = await supabase
      .from('cbse_subjects')
      .select('id')
      .eq('subject_code', subjectCode)
      .single();

    if (subjectError || !subjectData) throw new Error('Subject not found');

    const { data: books, error: bookError } = await supabase
      .from('cbse_books')
      .select(`
        *,
        subject:cbse_subjects!cbse_books_subject_id_fkey(*),
        grade:cbse_grades!cbse_books_grade_id_fkey(*)
      `)
      .eq('grade_id', gradeData.id)
      .eq('subject_id', subjectData.id);

    if (bookError) throw bookError;

    const book = books?.[0];
    if (!book) throw new Error('Book not found');

    const { data: chapters, error: chaptersError } = await supabase
      .from('cbse_chapters')
      .select('*')
      .eq('book_id', book.id)
      .order('chapter_number');

    if (chaptersError) throw chaptersError;

    const { data: progressData, error: progressError } = await supabase
      .from('student_chapter_progress')
      .select('*')
      .eq('user_id', userId)
      .in('chapter_id', (chapters || []).map(c => c.id));

    if (progressError) throw progressError;

    const chaptersWithProgress = (chapters || []).map(chapter => ({
      ...chapter,
      progress: progressData?.find(p => p.chapter_id === chapter.id) || null,
    }));

    console.log('✅ Subject detail loaded');
    return {
      book,
      chapters: chaptersWithProgress,
      success: true,
    };

  } catch (error) {
    console.error('Get subject detail exception:', error);
    return {
      book: null,
      chapters: [],
      success: false,
      error,
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
        study_time_minutes,
        chapter:cbse_chapters!student_chapter_progress_chapter_id_fkey(chapter_title)
      `)
      .eq('user_id', userId)
      .gte('last_studied', today.toISOString());

    if (error) throw error;

    const totalTime = (data || []).reduce((sum, item: any) => sum + (item.study_time_minutes || 0), 0);
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
  marked_completed?: boolean;
  marked_difficult?: boolean;
  confidence_level?: number;
  study_time_minutes?: number;
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
