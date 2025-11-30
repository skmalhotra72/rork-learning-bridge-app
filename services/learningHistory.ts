import { supabase } from '@/lib/supabase';

export interface LearningSession {
  user_id: string;
  subject: string;
  chapter?: string;
  concept: string;
  conversation_summary?: string;
  concepts_explained?: string[];
  problems_solved?: number;
  mistakes_made?: string[];
  understanding_level?: number;
  session_duration?: number;
}

export interface LearningHistoryRecord {
  id: string;
  user_id: string;
  subject: string;
  chapter?: string;
  concept: string;
  conversation_summary?: string;
  concepts_explained: string[];
  problems_solved: number;
  mistakes_made: string[];
  understanding_level: number;
  session_duration: number;
  created_at: string;
}

export interface StudentContext {
  subject: string;
  grade: number;
  currentChapter: string;
  confidenceLevel: number;
  stuckPoints: string;
  masteryPercentage: number;
  recentTopics: string[];
  commonMistakes: string[];
  problemsSolved: number;
  averageUnderstanding: number;
}

export const saveLearningSession = async (sessionData: LearningSession): Promise<void> => {
  try {
    console.log('=== SAVING LEARNING SESSION ===');
    console.log('Session data:', sessionData);

    const { error } = await supabase
      .from('learning_history')
      .insert({
        user_id: sessionData.user_id,
        subject: sessionData.subject,
        chapter: sessionData.chapter,
        concept: sessionData.concept,
        conversation_summary: sessionData.conversation_summary,
        concepts_explained: sessionData.concepts_explained || [],
        problems_solved: sessionData.problems_solved || 0,
        mistakes_made: sessionData.mistakes_made || [],
        understanding_level: sessionData.understanding_level || 5,
        session_duration: sessionData.session_duration || 0
      });

    if (error) {
      console.error('Save learning history error:', error);
    } else {
      console.log('✅ Learning session saved');
    }
  } catch (error) {
    console.error('Learning history save exception:', error);
  }
};

export const getLearningHistory = async (userId: string, subject: string, concept?: string): Promise<LearningHistoryRecord[]> => {
  try {
    let query = supabase
      .from('learning_history')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('created_at', { ascending: false });

    if (concept) {
      query = query.eq('concept', concept);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error('Get learning history error:', error);
      return [];
    }

    return (data || []) as LearningHistoryRecord[];
  } catch (error) {
    console.error('Learning history fetch exception:', error);
    return [];
  }
};

export const getStudentContext = async (userId: string, subject: string): Promise<StudentContext> => {
  try {
    console.log('=== BUILDING STUDENT CONTEXT ===');
    console.log('User ID:', userId);
    console.log('Subject:', subject);

    const history = await getLearningHistory(userId, subject);
    console.log('Learning history records:', history.length);

    const { data: subjectData } = await supabase
      .from('subject_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .single();

    console.log('Subject progress data:', subjectData);

    const context: StudentContext = {
      subject: subject,
      grade: 10,
      currentChapter: subjectData?.current_chapter || 'Unknown',
      confidenceLevel: subjectData?.confidence_level || 5,
      stuckPoints: subjectData?.stuck_points || '',
      masteryPercentage: subjectData?.mastery_percentage || 0,
      recentTopics: history.map(h => h.concept).slice(0, 5),
      commonMistakes: history.flatMap(h => h.mistakes_made || []).slice(0, 10),
      problemsSolved: history.reduce((sum, h) => sum + (h.problems_solved || 0), 0),
      averageUnderstanding: history.length > 0 
        ? Math.round(history.reduce((sum, h) => sum + (h.understanding_level || 5), 0) / history.length)
        : 5
    };

    console.log('Built student context:', context);
    return context;
  } catch (error) {
    console.error('Get student context error:', error);
    return {
      subject: subject,
      grade: 10,
      currentChapter: 'Unknown',
      confidenceLevel: 5,
      stuckPoints: '',
      masteryPercentage: 0,
      recentTopics: [],
      commonMistakes: [],
      problemsSolved: 0,
      averageUnderstanding: 5
    };
  }
};
