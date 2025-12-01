import { supabase } from '@/lib/supabase';

export interface SubjectProgressView {
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

export interface DashboardSummary {
  chapters_completed: number;
  chapters_mastered: number;
  total_hours_studied: number;
  avg_mastery_score: number;
  chapters_in_progress: number;
  difficult_chapters_count: number;
}

export interface RecentActivity {
  activity_id: string;
  chapter_id: string;
  chapter_title: string;
  subject_name: string;
  icon_emoji: string;
  completion_percentage: number;
  last_studied_at: string;
}

export interface DifficultChapter {
  chapter_id: string;
  chapter_title: string;
  subject_name: string;
  icon_emoji: string;
  mastery_score: number | null;
  study_time_minutes: number;
}

export interface RecommendedChapter {
  chapter_id: string;
  chapter_title: string;
  subject_name: string;
  icon_emoji: string;
  difficulty_level: string;
  estimated_duration_hours: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  recent_activity: RecentActivity[];
  difficult_chapters: DifficultChapter[];
  recommended_next: RecommendedChapter[];
}

export const getDashboardData = async (userId: string): Promise<DashboardData | null> => {
  try {
    console.log('=== FETCHING DASHBOARD DATA ===', userId);

    const [summary, , recentActivity, difficultChapters] = await Promise.all([
      getDashboardSummary(userId),
      getSubjectProgress(userId),
      getRecentActivity(userId, 10),
      getDifficultChapters(userId, 5),
    ]);

    const dashboardData: DashboardData = {
      summary: summary || {
        chapters_completed: 0,
        chapters_mastered: 0,
        total_hours_studied: 0,
        avg_mastery_score: 0,
        chapters_in_progress: 0,
        difficult_chapters_count: 0,
      },
      recent_activity: recentActivity,
      difficult_chapters: difficultChapters,
      recommended_next: [],
    };

    console.log('✅ Dashboard data loaded');
    return dashboardData;

  } catch (error) {
    console.error('Get dashboard data exception:', error);
    return null;
  }
};

export const getSubjectProgress = async (userId: string): Promise<SubjectProgressView[]> => {
  try {
    console.log('=== FETCHING SUBJECT PROGRESS ===');

    const { data, error } = await supabase
      .from('student_subject_progress')
      .select('*')
      .eq('user_id', userId)
      .order('subject_name');

    if (error) {
      console.error('Get subject progress error:', error);
      return [];
    }

    console.log(`✅ Found progress for ${data?.length || 0} subjects`);
    return (data as SubjectProgressView[]) || [];

  } catch (error) {
    console.error('Get subject progress exception:', error);
    return [];
  }
};

export const getRecentActivity = async (userId: string, limit: number = 10): Promise<RecentActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('student_recent_activity')
      .select('*')
      .eq('user_id', userId)
      .order('last_studied_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get recent activity error:', error);
      return [];
    }

    return (data as RecentActivity[]) || [];

  } catch (error) {
    console.error('Get recent activity exception:', error);
    return [];
  }
};

export const getDifficultChapters = async (userId: string, limit: number = 5): Promise<DifficultChapter[]> => {
  try {
    const { data, error } = await supabase
      .from('student_chapter_progress')
      .select(`
        chapter_id,
        confidence_level,
        last_studied,
        cbse_chapters(
          chapter_title,
          cbse_books(
            cbse_subjects(subject_name, icon_emoji)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('marked_difficult', true)
      .order('last_studied', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get difficult chapters error:', error.message || JSON.stringify(error));
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((item: any) => {
      const chapter = item.cbse_chapters;
      const book = chapter?.cbse_books;
      const subject = book?.cbse_subjects;

      return {
        chapter_id: item.chapter_id,
        chapter_title: chapter?.chapter_title || '',
        subject_name: subject?.subject_name || '',
        icon_emoji: subject?.icon_emoji || '📚',
        mastery_score: item.confidence_level,
        study_time_minutes: 0,
      };
    });

  } catch (error: any) {
    console.error('Get difficult chapters exception:', error.message || JSON.stringify(error));
    return [];
  }
};

export const getSubjectStats = async (
  userId: string,
  subjectCode: string,
  gradeNumber: number
): Promise<any> => {
  try {
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

    const { data: progress, error } = await supabase
      .from('student_subject_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('subject_id', subjectData.id)
      .single();

    if (error) {
      console.error('Get subject stats error:', error);
      return null;
    }

    return progress;

  } catch (error) {
    console.error('Get subject stats exception:', error);
    return null;
  }
};

export const getDashboardSummary = async (userId: string): Promise<DashboardSummary | null> => {
  try {
    const { data, error } = await supabase
      .from('student_dashboard_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get dashboard summary error:', error);
      return null;
    }

    return data as DashboardSummary;

  } catch (error) {
    console.error('Get dashboard summary exception:', error);
    return null;
  }
};
