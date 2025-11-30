import { supabase } from '@/lib/supabase';

export interface LearningSession {
  user_id: string;
  subject: string;
  chapter?: string;
  concept: string;
  session_type?: 'explanation' | 'practice' | 'assessment' | 'general';
  conversation_summary?: string;
  key_points_learned?: string[];
  concepts_explained?: string[];
  examples_used?: string[];
  problems_attempted?: number;
  problems_solved?: number;
  mistakes_made?: string[];
  understanding_level?: number;
  confidence_before?: number;
  confidence_after?: number;
  questions_asked?: number;
  ai_responses_count?: number;
  session_duration?: number;
}

export interface LearningHistoryRecord {
  id: string;
  user_id: string;
  subject: string;
  chapter?: string;
  concept: string;
  session_type: string;
  conversation_summary?: string;
  key_points_learned: string[];
  concepts_explained: string[];
  examples_used: string[];
  problems_attempted: number;
  problems_solved: number;
  mistakes_made: string[];
  understanding_level: number;
  confidence_before?: number;
  confidence_after?: number;
  questions_asked: number;
  ai_responses_count: number;
  session_duration: number;
  created_at: string;
}

export interface ConceptMastery {
  id: string;
  user_id: string;
  subject: string;
  chapter?: string;
  concept: string;
  mastery_level: number;
  attempts_count: number;
  successful_attempts: number;
  last_practiced_at: string;
  status: 'learning' | 'mastered' | 'needs_revision';
  created_at: string;
  updated_at: string;
}

export interface LearningInsight {
  id: string;
  user_id: string;
  subject: string;
  insight_type: 'strength' | 'weakness' | 'recommendation' | 'achievement';
  insight_text: string;
  related_concepts: string[];
  evidence: any;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved' | 'dismissed';
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
  totalSessions: number;
  totalTimeSpent: number;
  masteredConcepts: string[];
  needsRevision: string[];
}

export const saveLearningSession = async (sessionData: LearningSession): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    console.log('=== SAVING LEARNING SESSION ===');
    console.log('User:', sessionData.user_id);
    console.log('Subject:', sessionData.subject);
    console.log('Concept:', sessionData.concept);
    console.log('Duration:', sessionData.session_duration, 'seconds');

    const { data, error } = await supabase
      .from('learning_history')
      .insert({
        user_id: sessionData.user_id,
        subject: sessionData.subject,
        chapter: sessionData.chapter,
        concept: sessionData.concept,
        session_type: sessionData.session_type || 'general',
        conversation_summary: sessionData.conversation_summary,
        key_points_learned: sessionData.key_points_learned || [],
        concepts_explained: sessionData.concepts_explained || [],
        examples_used: sessionData.examples_used || [],
        problems_attempted: sessionData.problems_attempted || 0,
        problems_solved: sessionData.problems_solved || 0,
        mistakes_made: sessionData.mistakes_made || [],
        understanding_level: sessionData.understanding_level || 5,
        confidence_before: sessionData.confidence_before,
        confidence_after: sessionData.confidence_after,
        questions_asked: sessionData.questions_asked || 0,
        ai_responses_count: sessionData.ai_responses_count || 0,
        session_duration: sessionData.session_duration || 0
      })
      .select();

    if (error) {
      console.error('❌ Save session error:', error);
      return { success: false, error };
    }

    console.log('✅ Learning session saved:', data?.[0]?.id);
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('❌ Save session exception:', error);
    return { success: false, error };
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

    const totalTimeSpent = history.reduce((sum, h) => sum + (h.session_duration || 0), 0);
    const allConcepts = [...new Set(history.flatMap(h => h.concepts_explained || []))];

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
        : 5,
      totalSessions: history.length,
      totalTimeSpent: totalTimeSpent,
      masteredConcepts: allConcepts.slice(0, 10),
      needsRevision: []
    };

    console.log('✅ Built student context');
    console.log('- Total sessions:', context.totalSessions);
    console.log('- Problems solved:', context.problemsSolved);
    console.log('- Time spent:', Math.floor(context.totalTimeSpent / 60), 'minutes');
    
    return context;
  } catch (error) {
    console.error('❌ Get student context error:', error);
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
      averageUnderstanding: 5,
      totalSessions: 0,
      totalTimeSpent: 0,
      masteredConcepts: [],
      needsRevision: []
    };
  }
};

export const getConceptMastery = async (userId: string, subject: string, concept?: string): Promise<ConceptMastery | ConceptMastery[] | null> => {
  try {
    let query = supabase
      .from('concept_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject);

    if (concept) {
      query = query.eq('concept', concept);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get mastery error:', error);
      return concept ? null : [];
    }

    return concept ? (data?.[0] as ConceptMastery || null) : (data as ConceptMastery[] || []);
  } catch (error) {
    console.error('Get mastery exception:', error);
    return concept ? null : [];
  }
};

export const updateConceptMastery = async (
  userId: string, 
  subject: string, 
  concept: string, 
  masteryData: {
    chapter?: string;
    masteryLevel: number;
    attempts?: number;
    successfulAttempts?: number;
    status?: 'learning' | 'mastered' | 'needs_revision';
  }
): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    console.log('=== UPDATING CONCEPT MASTERY ===');
    console.log('Concept:', concept);
    console.log('Mastery level:', masteryData.masteryLevel);

    const { data, error } = await supabase
      .from('concept_mastery')
      .upsert({
        user_id: userId,
        subject: subject,
        chapter: masteryData.chapter,
        concept: concept,
        mastery_level: masteryData.masteryLevel,
        attempts_count: masteryData.attempts || 1,
        successful_attempts: masteryData.successfulAttempts || 0,
        last_practiced_at: new Date().toISOString(),
        status: masteryData.status || (masteryData.masteryLevel >= 80 ? 'mastered' : 'learning'),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,subject,concept'
      })
      .select();

    if (error) {
      console.error('❌ Update mastery error:', error);
      return { success: false, error };
    }

    console.log('✅ Concept mastery updated');
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('❌ Update mastery exception:', error);
    return { success: false, error };
  }
};

export const getLearningInsights = async (userId: string, subject: string): Promise<LearningInsight[]> => {
  try {
    const { data, error } = await supabase
      .from('learning_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Get insights error:', error);
      return [];
    }

    return (data as LearningInsight[]) || [];
  } catch (error) {
    console.error('Get insights exception:', error);
    return [];
  }
};

export const createLearningInsight = async (
  userId: string,
  subject: string,
  insightData: {
    type: 'strength' | 'weakness' | 'recommendation' | 'achievement';
    text: string;
    relatedConcepts?: string[];
    evidence?: any;
    priority?: 'low' | 'medium' | 'high';
  }
): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('learning_insights')
      .insert({
        user_id: userId,
        subject: subject,
        insight_type: insightData.type,
        insight_text: insightData.text,
        related_concepts: insightData.relatedConcepts || [],
        evidence: insightData.evidence || {},
        priority: insightData.priority || 'medium',
        status: 'active'
      })
      .select();

    if (error) {
      console.error('Create insight error:', error);
      return { success: false, error };
    }

    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Create insight exception:', error);
    return { success: false, error };
  }
};

export const buildAIContextString = (contextData: StudentContext): string => {
  if (!contextData) return '';

  let context = `STUDENT LEARNING HISTORY:
`;
  context += `- Total sessions: ${contextData.totalSessions || 0}
`;
  context += `- Total time spent: ${Math.floor((contextData.totalTimeSpent || 0) / 60)} minutes
`;
  context += `- Current mastery: ${contextData.masteryPercentage || 0}%
`;
  context += `- Confidence level: ${contextData.confidenceLevel}/10
`;
  context += `- Problems solved: ${contextData.problemsSolved || 0}
`;

  if (contextData.recentTopics && contextData.recentTopics.length > 0) {
    context += `
RECENT LEARNING:
`;
    contextData.recentTopics.slice(0, 3).forEach((topic, i) => {
      context += `${i + 1}. ${topic}
`;
    });
  }

  if (contextData.masteredConcepts && contextData.masteredConcepts.length > 0) {
    context += `
MASTERED CONCEPTS:
`;
    contextData.masteredConcepts.slice(0, 5).forEach((concept, i) => {
      context += `${i + 1}. ${concept}
`;
    });
  }

  if (contextData.commonMistakes && contextData.commonMistakes.length > 0) {
    context += `
COMMON MISTAKES TO ADDRESS:
`;
    contextData.commonMistakes.slice(0, 3).forEach((mistake, i) => {
      context += `${i + 1}. ${mistake}
`;
    });
  }

  if (contextData.stuckPoints) {
    context += `
KNOWN STRUGGLES: ${contextData.stuckPoints}
`;
  }

  return context;
};
