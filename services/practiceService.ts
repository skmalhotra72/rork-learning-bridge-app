import { supabase } from '@/lib/supabase'

interface PracticeOptions {
  difficulty?: string | null
  limit?: number
}

interface AnswerData {
  option?: string | null
  text?: string
}

interface PracticeQuestion {
  id: string
  question_text: string
  question_type: string
  difficulty_level: string
  options?: string[]
  correct_answer?: string
  explanation?: string
}

interface QuestionAttempt {
  is_correct: boolean
  correct_answer: string
  explanation?: string
  xp_earned?: number
}

interface SessionSummary {
  session_id: string
  total_questions: number
  correct_answers: number
  score_percentage: number
  total_time_seconds: number
  xp_earned: number
  topics_practiced: string[]
}

interface PracticeSessionRecord {
  id: string
  user_id: string
  topic_id: string
  session_type: string
  status: string
  total_questions: number
  completed_questions: number
  correct_answers: number
  score_percentage: number
  total_time_seconds: number
  xp_earned: number
  created_at: string
  completed_at?: string
  topic?: {
    topic_title: string
  }
}

// Get practice questions for a topic
export const getPracticeQuestions = async (
  topicId: string,
  userId: string,
  options: PracticeOptions = {}
): Promise<{ success: boolean; questions: PracticeQuestion[]; error?: any }> => {
  try {
    console.log('=== FETCHING PRACTICE QUESTIONS ===', { topicId, options })

    const { data, error } = await supabase.rpc('get_practice_questions', {
      p_topic_id: topicId,
      p_user_id: userId,
      p_difficulty_level: options.difficulty || null,
      p_limit: options.limit || 10,
    })

    if (error) {
      console.error('Get questions error:', error)
      throw error
    }

    console.log(`✅ Loaded ${data?.length || 0} questions`)
    return {
      success: true,
      questions: data || [],
    }
  } catch (error) {
    console.error('Get questions exception:', error)
    return {
      success: false,
      questions: [],
      error,
    }
  }
}

// Start a practice session
export const startPracticeSession = async (
  userId: string,
  topicId: string,
  totalQuestions: number
): Promise<{ success: boolean; sessionId?: string; error?: any }> => {
  try {
    console.log('=== STARTING PRACTICE SESSION ===')

    const { data, error } = await supabase.rpc('start_practice_session', {
      p_user_id: userId,
      p_topic_id: topicId,
      p_session_type: 'topic_practice',
      p_total_questions: totalQuestions,
    })

    if (error) {
      console.error('Start session error:', error)
      throw error
    }

    console.log('✅ Session started:', data)
    return {
      success: true,
      sessionId: data,
    }
  } catch (error) {
    console.error('Start session exception:', error)
    return {
      success: false,
      error,
    }
  }
}

// Submit a question attempt
export const submitQuestionAttempt = async (
  userId: string,
  questionId: string,
  answer: AnswerData,
  timeTaken: number,
  sessionId: string | null = null
): Promise<{ success: boolean; result?: QuestionAttempt; error?: any }> => {
  try {
    console.log('=== SUBMITTING ANSWER ===', { questionId, answer })

    const { data, error } = await supabase.rpc('submit_question_attempt', {
      p_user_id: userId,
      p_question_id: questionId,
      p_student_answer: answer.text || '',
      p_selected_option: answer.option || null,
      p_time_taken_seconds: timeTaken,
      p_practice_session_id: sessionId,
    })

    if (error) {
      console.error('Submit attempt error:', error)
      throw error
    }

    console.log('✅ Answer submitted:', data)
    return {
      success: true,
      result: data,
    }
  } catch (error) {
    console.error('Submit attempt exception:', error)
    return {
      success: false,
      error,
    }
  }
}

// Complete a practice session
export const completePracticeSession = async (
  sessionId: string
): Promise<{ success: boolean; summary?: SessionSummary; error?: any }> => {
  try {
    console.log('=== COMPLETING PRACTICE SESSION ===', sessionId)

    const { data, error } = await supabase.rpc('complete_practice_session', {
      p_session_id: sessionId,
    })

    if (error) {
      console.error('Complete session error:', error)
      throw error
    }

    console.log('✅ Session completed:', data)
    return {
      success: true,
      summary: data,
    }
  } catch (error) {
    console.error('Complete session exception:', error)
    return {
      success: false,
      error,
    }
  }
}

// Get session history
export const getPracticeHistory = async (
  userId: string,
  topicId: string | null = null
): Promise<{ success: boolean; history: PracticeSessionRecord[]; error?: any }> => {
  try {
    let query = supabase
      .from('practice_sessions')
      .select(
        `
        *,
        topic:topic_id(topic_title)
      `
      )
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    if (topicId) {
      query = query.eq('topic_id', topicId)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      history: data || [],
    }
  } catch (error) {
    console.error('Get history exception:', error)
    return {
      success: false,
      history: [],
      error,
    }
  }
}
