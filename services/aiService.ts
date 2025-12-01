import { supabase } from '@/lib/supabase';
import { getTutorInfo } from '@/constants/tutorNames';
import { Config, isOpenAIConfigured } from '@/constants/config';

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

const buildSystemPrompt = (templateType: string, context: AILearningContext, subjectName?: string): string => {
  const firstName = context.student?.name?.split(' ')[0] || 'student';
  const tutorInfo = subjectName ? getTutorInfo(subjectName) : { name: 'Your Tutor', emoji: '👨‍🏫' };
  
  const templates: Record<string, string> = {
    explain: `You are ${tutorInfo.name} ${tutorInfo.emoji}, a friendly and encouraging tutor helping ${firstName}, a Class ${context.student?.grade || '10'} student.

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

    doubt: `You are ${tutorInfo.name} ${tutorInfo.emoji}, solving a specific doubt for ${firstName}.

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

    practice: `You are ${tutorInfo.name} ${tutorInfo.emoji}, generating practice problems.

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

    progress: `You are ${tutorInfo.name} ${tutorInfo.emoji}, analyzing progress for ${firstName}.

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
      conversationHistory = [],
      subjectName = undefined,
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
      context,
      subjectName
    );

    const aiResponse = await callAIAPI(message, systemPrompt, conversationHistory, context);

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      response: 'I apologize, but I encountered an error. Please try again.',
      error: errorMessage,
    };
  }
};

const simulateAIResponse = async (
  userMessage: string,
  systemPrompt: string,
  context: AILearningContext
): Promise<string> => {
  console.log('=== USING SIMULATED AI (No API Key) ===');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const messageLower = userMessage.toLowerCase();
  const studentName = context.student?.name?.split(' ')[0] || 'there';
  const currentTopic = context.current_topic?.topic_title || 'this topic';
  const studentGrade = context.student?.grade || '10';
  const topicsDone = (context.overall_stats?.total_xp || 0) / 100;
  
  if (messageLower.match(/^(hi|hello|hey|good morning|good evening|namaste)/)) {
    return `Hello ${studentName}! 👋\n\nGreat to see you learning today! You've already mastered ${topicsDone} topics - that's awesome progress! 🌟\n\nHow can I help you with ${currentTopic} today?`;
  }
  
  if (messageLower.match(/what is|what are|define|meaning of/)) {
    return `Great question! Let me explain that for you.\n\nFor Class ${studentGrade}, here's a clear explanation:\n\n**Key Concept:**\nThis is an important topic in ${currentTopic}. Let me break it down step by step:\n\n1. **Basic Understanding:** Start with the fundamental definition\n2. **Real-world Connection:** Think of it like [everyday example]\n3. **Why It Matters:** This helps you solve more complex problems later\n\n**Example to Remember:**\nFor instance, imagine you're [relatable scenario for Class ${studentGrade} student]...\n\nWould you like me to:\n- Give you a practice problem?\n- Explain with more examples?\n- Show how this connects to other topics?\n\nYou're doing great by asking questions! 🎯`;
  }
  
  if (messageLower.match(/how to|how do|how can|steps to/)) {
    return `Excellent! Let me show you the step-by-step approach.\n\n**Here's how to solve this type of problem:**\n\n**Step 1:** Understand what is given\n- Read the question carefully\n- Identify the known values\n\n**Step 2:** Determine what you need to find\n- What is the question asking for?\n\n**Step 3:** Apply the right formula/method\n- For ${currentTopic}, we typically use [relevant approach]\n\n**Step 4:** Calculate and verify\n- Show your work clearly\n- Check if your answer makes sense\n\n**Pro Tip for Class ${studentGrade}:** 💡\nRemember to always write units (if applicable) and show your steps in exams!\n\nWant me to walk you through a practice problem? 🎓`;
  }
  
  if (messageLower.match(/why|reason|purpose/)) {
    return `That's a thoughtful question! Understanding the "why" makes learning much easier.\n\n**Here's why this is important:**\n\n🎯 **In Your Syllabus:**\nThis topic appears in your Class ${studentGrade} exams and carries good marks. Understanding it well will help you score better!\n\n📚 **Foundation for Future:**\nThis concept builds the base for more advanced topics you'll learn later. It's like building blocks - you need this solid foundation.\n\n🌍 **Real-World Application:**\nYou actually use this in daily life! For example, [practical example relevant to students]...\n\n**Here's a cool fact:**\n[Interesting trivia or application related to the topic]\n\nDoes this help clarify why we study this? Want to explore more? 🚀`;
  }
  
  if (messageLower.match(/example|show me|demonstrate/)) {
    return `Sure! Let me give you a clear example.\n\n**Example Problem:**\n[Typical Class ${studentGrade} level problem for ${currentTopic}]\n\n**Solution:**\n\n**Given:** [What we know]\n**To Find:** [What we need]\n\n**Step-by-Step Solution:**\n\n1️⃣ First step: [Clear explanation]\n   \n2️⃣ Second step: [Show calculation]\n   \n3️⃣ Third step: [Continue solving]\n   \n4️⃣ Final answer: [Result with units]\n\n**Key Takeaway:**\nThe important thing here is [main learning point].\n\nReady to try a similar problem yourself? I can guide you! 💪`;
  }
  
  if (messageLower.match(/practice|problem|question|solve|help me solve/)) {
    return `Perfect! Practice is the best way to learn! 📝\n\n**Let's Practice Together:**\n\nHere's a problem for you to try:\n\n**Question:**\n[A typical problem from ${currentTopic} suitable for Class ${studentGrade}]\n\n**Hints to get you started:**\n- First, identify what's given\n- Think about which formula or method applies\n- Take it step by step\n\nTry solving it, and then tell me your answer! I'll help you check if you're on the right track.\n\nOr if you need help at any step, just ask! I'm here to guide you. 🎓\n\nWant to see the solution approach first? Let me know! 😊`;
  }
  
  if (messageLower.match(/difficult|hard|confused|don't understand|not clear/)) {
    return `I understand, ${studentName}! Don't worry - everyone finds some topics challenging at first. That's totally normal! 💪\n\nLet me help make this clearer for you:\n\n**Let's Simplify:**\nThink of ${currentTopic} like this: [Simple analogy]\n\n**Breaking it Down:**\nInstead of trying to understand everything at once, let's take it piece by piece:\n\n1. **First:** Understand just the basic idea\n2. **Then:** See one simple example\n3. **Next:** Try a small problem\n4. **Finally:** Build up to more complex ones\n\n**Remember:**\n- You've already mastered ${topicsDone} topics - you can do this too! 🌟\n- It's okay to take your time\n- Asking questions (like you're doing now) is exactly how you learn!\n\nWhich specific part is most confusing? Let me explain that part in even simpler terms! 🤝`;
  }
  
  if (messageLower.match(/thank|thanks|helpful|great|awesome|understood/)) {
    return `You're very welcome, ${studentName}! 😊\n\nI'm so happy I could help! That's what I'm here for. 🎉\n\n**Your Progress Today:**\n✅ Asked great questions\n✅ Showed interest in understanding deeply\n✅ Taking your learning seriously\n\nKeep this curiosity alive! The fact that you're asking questions and trying to understand shows you're on the right path to success. 🌟\n\n**What's Next?**\n- Want to practice more problems?\n- Move to the next concept?\n- Review anything else?\n\nRemember: I'm always here whenever you need help. Keep learning, keep growing! 🚀\n\nYour ${topicsDone} mastered topics will soon become ${topicsDone + 1}, ${topicsDone + 2}, and more! 💪`;
  }
  
  return `Thanks for your question about ${currentTopic}!\n\nBased on your progress so far (${topicsDone} topics mastered! 🌟), I know you can understand this!\n\n**Here's what I can help you with:**\n\n📖 **Understanding Concepts**\n"What is [concept]?" - I'll explain it simply\n\n💡 **Problem Solving**\n"How do I solve [problem type]?" - Step-by-step guidance\n\n📝 **Practice**\n"Give me a practice problem" - I'll create one for you\n\n🎯 **Examples**\n"Show me an example" - Real examples with solutions\n\n❓ **Doubts**\n"I'm confused about [topic]" - I'll clarify it\n\n**Your Current Topic:** ${currentTopic}\n**Your Grade:** Class ${studentGrade}\n\nJust ask me anything - I'm here to help you succeed! What would you like to know? 😊`;
};

const callAIAPI = async (
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context: AILearningContext
): Promise<string> => {
  console.log('=== CHECKING API KEY ===');
  console.log('API Key configured:', isOpenAIConfigured());
  
  if (!isOpenAIConfigured()) {
    console.log('⚠️ OpenAI API key not configured - using simulated responses');
    return simulateAIResponse(userMessage, systemPrompt, context);
  }

  const apiKey = Config.OPENAI_API_KEY!;
  console.log('=== CALLING OPENAI API ===');
  console.log('System prompt length:', systemPrompt.length);
  console.log('Conversation history length:', conversationHistory.length);
  console.log('User message:', userMessage.substring(0, 100));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ OpenAI API error:', response.status, errorData);
      console.log('⚠️ Falling back to simulated response');
      return simulateAIResponse(userMessage, systemPrompt, context);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      console.log('⚠️ No response from OpenAI - using simulated response');
      return simulateAIResponse(userMessage, systemPrompt, context);
    }

    console.log('✅ OpenAI response received:', aiResponse.substring(0, 100));
    return aiResponse;

  } catch (error) {
    console.error('❌ OpenAI API call failed:', error);
    console.log('⚠️ Falling back to simulated response');
    return simulateAIResponse(userMessage, systemPrompt, context);
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
