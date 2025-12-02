import { supabase } from '@/lib/supabase';
import { sendRorkAIMessage } from './rorkAIService';

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export interface AILearningContext {
  student?: {
    name?: string;
    grade?: string;
    preferred_language?: string;
    code_mixing_enabled?: boolean;
  };
  current_topic?: {
    topic_title?: string;
    topic_description?: string;
  };
  topic_progress?: {
    understanding_score?: number;
    success_rate?: number;
    status?: string;
  };
  weak_concepts?: {
    concept_name: string;
    mastery_level: number;
  }[];
  recent_mistakes?: {
    question: string;
    student_answer: string;
    correct_answer: string;
  }[];
  overall_stats?: {
    current_level?: number;
    total_xp?: number;
    current_streak?: number;
    total_study_hours?: number;
  };
}

export const getAILearningContext = async (
  userId: string,
  topicId: string | null = null,
  chapterId: string | null = null,
  subjectName?: string
): Promise<{
  success: boolean;
  context: AILearningContext | null;
  error?: any;
}> => {
  try {
    console.log('=== FETCHING AI CONTEXT ===', { userId, topicId, chapterId, subjectName });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, grade, email')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    console.log('✅ Profile loaded:', profile?.full_name);

    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      console.warn('User stats error:', statsError);
    } else {
      console.log('✅ Stats loaded: Level', userStats?.current_level, 'XP', userStats?.total_xp);
    }

    const { data: languageSettings } = await supabase
      .from('user_language_settings')
      .select('preferred_tutoring_language, allow_code_mixing')
      .eq('user_id', userId)
      .single();

    console.log('✅ Language settings:', languageSettings?.preferred_tutoring_language || 'English');

    let topicData = null;
    if (topicId) {
      const { data, error } = await supabase
        .from('cbse_topics')
        .select('topic_title, topic_description')
        .eq('id', topicId)
        .single();

      if (!error && data) {
        topicData = data;
        console.log('✅ Topic loaded:', data.topic_title);
      }
    }

    const { data: weakConcepts } = await supabase
      .from('concept_mastery')
      .select('concept_name, mastery_level')
      .eq('user_id', userId)
      .lt('mastery_level', 70)
      .order('mastery_level', { ascending: true })
      .limit(5);

    if (weakConcepts && weakConcepts.length > 0) {
      console.log('✅ Weak concepts found:', weakConcepts.length);
    }

    const { data: recentMistakes } = await supabase
      .from('practice_attempts')
      .select('question_text, student_answer, correct_answer')
      .eq('user_id', userId)
      .eq('is_correct', false)
      .order('attempted_at', { ascending: false })
      .limit(5);

    if (recentMistakes && recentMistakes.length > 0) {
      console.log('✅ Recent mistakes found:', recentMistakes.length);
    }

    const { data: subjectProgress } = await supabase
      .from('subject_progress')
      .select('success_rate, understanding_score')
      .eq('user_id', userId)
      .eq('subject', subjectName || '')
      .maybeSingle();

    if (subjectProgress) {
      console.log('✅ Subject progress loaded');
    }

    const context: AILearningContext = {
      student: {
        name: profile?.full_name,
        grade: profile?.grade,
        preferred_language: languageSettings?.preferred_tutoring_language || 'English',
        code_mixing_enabled: languageSettings?.allow_code_mixing ?? true,
      },
      current_topic: topicData ? {
        topic_title: topicData.topic_title,
        topic_description: topicData.topic_description,
      } : (subjectName ? {
        topic_title: subjectName,
        topic_description: `${subjectName} - Class ${profile?.grade}`,
      } : undefined),
      topic_progress: subjectProgress ? {
        understanding_score: subjectProgress.understanding_score,
        success_rate: subjectProgress.success_rate,
        status: subjectProgress.success_rate >= 70 ? 'good' : 'needs_work',
      } : undefined,
      overall_stats: {
        current_level: userStats?.current_level || 1,
        total_xp: userStats?.total_xp || 0,
        current_streak: userStats?.streak_count || 0,
        total_study_hours: Math.floor((userStats?.total_xp || 0) / 100),
      },
      weak_concepts: (weakConcepts || []).map(wc => ({
        concept_name: wc.concept_name,
        mastery_level: wc.mastery_level,
      })),
      recent_mistakes: (recentMistakes || []).map(rm => ({
        question: rm.question_text || '',
        student_answer: rm.student_answer || '',
        correct_answer: rm.correct_answer || '',
      })),
    };

    console.log('✅ Full context loaded for', context.student?.name);
    return {
      success: true,
      context,
    };

  } catch (error) {
    console.error('Get context exception:', error);
    return {
      success: false,
      context: null,
      error,
    };
  }
};



export interface SendAIMessageOptions {
  topicId?: string | null;
  chapterId?: string | null;
  sessionId?: string;
  agentType?: 'learning_coach' | 'doubt_solver' | 'practice_generator' | 'progress_analyst';
  conversationHistory?: { role: string; content: string }[];
  subjectName?: string;
}

export const sendAIMessage = async (
  userId: string,
  message: string,
  options: SendAIMessageOptions = {}
): Promise<{
  success: boolean;
  response: string;
  sessionId?: string;
  context?: AILearningContext;
  error?: any;
}> => {
  try {
    console.log('=== SENDING AI MESSAGE ===');
    const startTime = Date.now();

    const {
      topicId = null,
      chapterId = null,
      sessionId = generateSessionId(),
      agentType = 'learning_coach',
      subjectName = undefined,
    } = options;

    const contextResult = await getAILearningContext(userId, topicId, chapterId, subjectName);
    if (!contextResult.success || !contextResult.context) {
      throw new Error('Failed to load context');
    }

    const context = contextResult.context;
    console.log('✅ Context loaded for:', context.student?.name, '(Class', context.student?.grade, ')');
    console.log('Student stats:', context.overall_stats);
    console.log('Weak concepts:', context.weak_concepts?.length || 0);
    console.log('Recent mistakes:', context.recent_mistakes?.length || 0);

    console.log('=== CALLING RORK AI ===');
    const rorkResult = await sendRorkAIMessage(userId, message, context, options);
    
    if (!rorkResult.success || !rorkResult.response) {
      console.error('❌ Rork AI failed:', rorkResult.error);
      throw new Error('AI service unavailable. Please try again.');
    }
    
    const aiResponse = rorkResult.response;
    console.log('✅ Rork AI response received successfully');

    const responseTime = Date.now() - startTime;

    try {
      await supabase.from('ai_conversations').insert({
        user_id: userId,
        session_id: sessionId,
        user_message: message,
        ai_response: aiResponse,
        topic_id: topicId,
        agent_type: agentType,
        response_time_ms: responseTime,
        was_helpful: null,
        user_feedback: null,
        ai_provider: 'rork',
      });
    } catch (saveError) {
      console.warn('Failed to save conversation:', saveError);
    }

    console.log(`✅ AI responded in ${responseTime}ms`);

    return {
      success: true,
      response: aiResponse,
      sessionId: sessionId,
      context: context,
    };

  } catch (error) {
    console.error('Send AI message exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      response: 'I apologize, but I encountered an error. Please try again.',
      error: errorMessage,
    };
  }
};



export const getConversationHistory = async (
  sessionId: string
): Promise<{
  success: boolean;
  history: any[];
  error?: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;

    return {
      success: true,
      history: data || [],
    };

  } catch (error) {
    console.error('Get history exception:', error);
    return {
      success: false,
      history: [],
      error,
    };
  }
};

export const rateAIResponse = async (
  conversationId: string,
  wasHelpful: boolean,
  feedback: string | null = null
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .update({
        was_helpful: wasHelpful,
        user_feedback: feedback,
      })
      .eq('id', conversationId);

    if (error) throw error;

    return { success: true };

  } catch (error) {
    console.error('Rate response exception:', error);
    return { success: false, error };
  }
};
