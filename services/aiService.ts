import { supabase } from '@/lib/supabase';

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
  weak_concepts?: Array<{
    concept_name: string;
    mastery_level: number;
  }>;
  recent_mistakes?: Array<{
    question: string;
    student_answer: string;
    correct_answer: string;
  }>;
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
  chapterId: string | null = null
): Promise<{
  success: boolean;
  context: AILearningContext | null;
  error?: any;
}> => {
  try {
    console.log('=== FETCHING AI CONTEXT ===', { userId, topicId, chapterId });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, grade, email')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      console.warn('User stats error:', statsError);
    }

    let topicData = null;
    if (topicId) {
      const { data, error } = await supabase
        .from('cbse_topics')
        .select('topic_title, topic_description')
        .eq('id', topicId)
        .single();

      if (!error && data) {
        topicData = data;
      }
    }

    const context: AILearningContext = {
      student: {
        name: profile?.full_name,
        grade: profile?.grade,
        preferred_language: 'English',
        code_mixing_enabled: true,
      },
      current_topic: topicData ? {
        topic_title: topicData.topic_title,
        topic_description: topicData.topic_description,
      } : undefined,
      overall_stats: {
        current_level: userStats?.current_level || 1,
        total_xp: userStats?.total_xp || 0,
        current_streak: userStats?.streak_count || 0,
        total_study_hours: 0,
      },
      weak_concepts: [],
      recent_mistakes: [],
    };

    console.log('✅ Context loaded');
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

const buildSystemPrompt = (templateType: string, context: AILearningContext): string => {
  const templates: Record<string, string> = {
    explain: `You are Buddy, a friendly and encouraging AI tutor helping ${context.student?.name || 'student'}, a Class ${context.student?.grade || '10'} student.

${context.current_topic ? `CURRENT TOPIC: ${context.current_topic.topic_title}
${context.current_topic.topic_description ? `Description: ${context.current_topic.topic_description}` : ''}` : ''}

STUDENT'S LEVEL: Class ${context.student?.grade || '10'}

${context.weak_concepts && context.weak_concepts.length > 0 ? `
AREAS WHERE STUDENT STRUGGLES:
${context.weak_concepts.map(c => `- ${c.concept_name} (${c.mastery_level}% mastery)`).join('\n')}
` : ''}

LANGUAGE: Use ${context.student?.preferred_language || 'English'}${context.student?.code_mixing_enabled ? ' with natural Hinglish code-mixing for technical terms' : ''}.

YOUR APPROACH:
1. Be friendly, patient, and encouraging
2. Start with what they know
3. Use simple language for Class ${context.student?.grade || '10'}
4. Give real-world examples (Indian context - rupees, cricket, festivals)
5. Break complex ideas into steps
6. Check understanding frequently
7. Celebrate progress and build confidence
8. If confused, simplify further

Respond to the student's question in a helpful, encouraging way.`,

    doubt: `You are Buddy, solving a specific doubt for ${context.student?.name || 'student'}.

TOPIC: ${context.current_topic?.topic_title || 'General'}
STUDENT'S LEVEL: Class ${context.student?.grade || '10'}

${context.recent_mistakes && context.recent_mistakes.length > 0 ? `
They recently struggled with:
${context.recent_mistakes.map(m => `- ${m.question}`).join('\n')}
` : ''}

TASK:
1. Understand their confusion
2. Provide clear step-by-step explanation
3. Use examples if helpful
4. Use ${context.student?.preferred_language || 'English'}

Be concise but thorough.`,

    practice: `You are Buddy, generating practice problems.

TOPIC: ${context.current_topic?.topic_title || 'General'}
LEVEL: Class ${context.student?.grade || '10'}

${context.weak_concepts && context.weak_concepts.length > 0 ? `
FOCUS ON:
${context.weak_concepts.map(c => `- ${c.concept_name}`).join('\n')}
` : ''}

GENERATE:
- 3 practice problems for CBSE Class ${context.student?.grade || '10'}
- Mix of difficulty
- Include complete solutions
- Use Indian context

Format:
Problem 1: [statement]
Solution: [steps]
Answer: [final answer]`,

    progress: `You are Buddy, analyzing progress for ${context.student?.name || 'student'}.

OVERALL:
- Level ${context.overall_stats?.current_level || 1}
- ${context.overall_stats?.total_xp || 0} XP
- ${context.overall_stats?.current_streak || 0} day streak

${context.current_topic ? `CURRENT TOPIC: ${context.current_topic.topic_title}` : ''}

${context.weak_concepts && context.weak_concepts.length > 0 ? `
NEEDS WORK:
${context.weak_concepts.map(c => `- ${c.concept_name}: ${c.mastery_level}%`).join('\n')}
` : ''}

PROVIDE:
1. Progress summary (be positive!)
2. Strengths
3. Areas to improve (constructive)
4. Specific recommendations
5. Encouragement

Focus on growth mindset.`,
  };

  return templates[templateType] || templates.explain;
};

export interface SendAIMessageOptions {
  topicId?: string | null;
  chapterId?: string | null;
  sessionId?: string;
  agentType?: 'learning_coach' | 'doubt_solver' | 'practice_generator' | 'progress_analyst';
  conversationHistory?: Array<{ role: string; content: string }>;
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
      conversationHistory = [],
    } = options;

    const contextResult = await getAILearningContext(userId, topicId, chapterId);
    if (!contextResult.success || !contextResult.context) {
      throw new Error('Failed to load context');
    }

    const context = contextResult.context;

    const systemPrompt = buildSystemPrompt(
      agentType === 'doubt_solver' ? 'doubt' :
      agentType === 'practice_generator' ? 'practice' :
      agentType === 'progress_analyst' ? 'progress' : 'explain',
      context
    );

    const aiResponse = await callAIAPI(message, systemPrompt, conversationHistory);

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
    return {
      success: false,
      response: 'I apologize, but I encountered an error. Please try again.',
      error,
    };
  }
};

const callAIAPI = async (
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how')) {
    return `Great question! Let me break this down for you step by step:

1. **Understanding the Basics**: This topic is all about understanding the core concepts that build on what you already know.

2. **The Main Idea**: Think of it like this - imagine you're building with blocks. Each concept is a block that supports the next one.

3. **Real-World Example**: Let's say you're dividing sweets among friends at a birthday party. That's exactly how this concept works in real life!

4. **Key Points to Remember**:
   • Always start with what you know
   • Break complex problems into smaller steps
   • Practice makes perfect!

Would you like me to explain any specific part in more detail? Or shall we try a practice problem? 📝`;
  } else if (lowerMessage.includes('practice') || lowerMessage.includes('problems') || lowerMessage.includes('question')) {
    return `Excellent! Let's practice together. Here are some problems for you:

**Problem 1** (Easy 😊):
If you have 15 apples and you give 5 to your friend, how many do you have left?

**Problem 2** (Medium 🤔):
A shop sells pencils at ₹5 each. If you buy 8 pencils, how much will you pay?

**Problem 3** (Challenge 💪):
Solve: 2x + 5 = 15
What is the value of x?

Try solving these! I'm here if you need help with any step. Which one would you like to start with? 🎯`;
  } else if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('don\'t understand')) {
    return `Don't worry at all! Everyone gets stuck sometimes - that's how we learn! 🌟

Let me help you understand this better:

**Step 1**: First, let's identify what part is confusing. Is it:
- The concept itself?
- How to apply it?
- A specific calculation?

**Step 2**: Once we know where you're stuck, I'll explain it using:
- Simple language
- Real examples you can relate to
- Step-by-step guidance

**Step 3**: We'll practice together until you feel confident!

Tell me exactly where you're stuck, and I'll guide you through it. Remember, asking for help shows you're serious about learning! 💪`;
  } else if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
    return `You're doing great! Let me share your progress with you:

**Your Learning Journey** 📊:
- You've been consistent in asking questions
- You're actively seeking to understand concepts
- You're not afraid to ask for help when needed

**What's Going Well** ✨:
- You're engaged and curious
- You're building a strong foundation
- Your questions show you're thinking deeply

**Areas to Focus On** 🎯:
- Keep practicing regularly
- Try solving problems on your own first
- Review concepts you've learned

**My Recommendation** 💡:
Keep up this momentum! Try one practice problem daily. Remember, every expert was once a beginner who never gave up!

What would you like to work on next? 🚀`;
  }
  
  return `I understand what you're asking! Let me help you with that.

Based on your question, here's what I can tell you:

This is a great topic to explore, and I'm here to guide you through it step by step. The key is to understand the fundamentals first, then build on them gradually.

Would you like me to:
1. **Explain the concept** in simple terms?
2. **Give you practice problems** to try?
3. **Show you examples** from real life?
4. **Help you with a specific doubt**?

Just let me know what would help you most! I'm here to make learning easy and fun for you. 😊

*Note: This is a placeholder response. For the full AI experience, integrate with your preferred AI service (OpenAI, Claude, etc.) using the system prompts provided.*`;
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
