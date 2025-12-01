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
  
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const messageLower = userMessage.toLowerCase();
  const studentName = context.student?.name?.split(' ')[0] || 'Student';
  const grade = context.student?.grade || '10';
  const topic = context.current_topic?.topic_title || 'this topic';
  
  if (messageLower.includes('explain') || messageLower.includes('समझा') || messageLower.includes('what is')) {
    return `Great question, ${studentName}! 🎯\n\nLet me explain ${topic} in a simple way:\n\n1️⃣ **Core Concept**: Think of it like a building block in ${topic}. Just like how we use bricks to build a house, this concept helps us understand bigger ideas.\n\n2️⃣ **Real-world Example**: Imagine you're at a cricket match 🏏. The way runs add up is similar to how these concepts work together.\n\n3️⃣ **Key Points for Class ${grade}**:\n   • Start with the basics\n   • Build step by step\n   • Practice makes perfect\n\n💡 **Pro Tip**: Try to connect this with what you already know. It makes learning easier!\n\nDoes this make sense? Want me to explain any part in more detail?`;
  }
  
  if (messageLower.includes('practice') || messageLower.includes('problem') || messageLower.includes('question')) {
    return `Awesome! Let's practice! 💪\n\n**Practice Problem for Class ${grade}:**\n\nConsider this example related to ${topic}:\n\n**Question**: Solve the following step by step.\n\n**Steps to follow:**\n1. Read the problem carefully\n2. Identify what's given and what's asked\n3. Apply the formula or concept\n4. Calculate step by step\n5. Check your answer\n\n**Hint**: Remember to show your work! It helps you catch mistakes and understand better.\n\n**Example Solution Approach:**\nStep 1: Write down what you know\nStep 2: Apply the concept we discussed\nStep 3: Simplify and solve\nStep 4: Verify your answer\n\n🎯 Try solving it yourself first! If you get stuck, let me know where you're having trouble and I'll guide you.\n\n📚 Remember: Making mistakes is part of learning!`;
  }
  
  if (messageLower.includes('solve') || messageLower.includes('help') || messageLower.includes('how to')) {
    return `I'm here to help you, ${studentName}! 🙌\n\n**Let's break this down together:**\n\n🔍 **Step 1 - Understand**\nFirst, let's make sure we understand what the question is asking. Can you identify the key information?\n\n📝 **Step 2 - Plan**\nThink about which concept from ${topic} applies here. What formula or method should we use?\n\n⚡ **Step 3 - Execute**\nLet's work through it systematically:\n   • Start with what you know\n   • Apply the concept step by step\n   • Show your calculations\n\n✅ **Step 4 - Check**\nAlways verify your answer makes sense!\n\n**Key Concept for Class ${grade}:**\nThis relates to understanding the fundamentals. The more you practice, the more confident you'll become.\n\n🌟 **Tip**: Don't rush! Take your time to understand each step. Quality over speed!\n\nWhat part would you like me to focus on?`;
  }
  
  if (messageLower.includes('difficult') || messageLower.includes('hard') || messageLower.includes('confused')) {
    return `I understand, ${studentName}. Don't worry! 💙\n\nMany Class ${grade} students find ${topic} challenging at first. That's completely normal and means you're pushing yourself to learn!\n\n**Let's make it easier:**\n\n🎯 **Simplify the Concept**\nThink of it this way: [Simple analogy related to everyday life]\n\n📚 **Break it Down**\nInstead of looking at the whole problem, let's focus on small parts:\n   • Part 1: Basic understanding\n   • Part 2: Simple examples\n   • Part 3: Practice problems\n\n💪 **Build Confidence**\nStart with easier problems and gradually work your way up. Every expert was once a beginner!\n\n🌟 **Study Tips:**\n1. Review the basics first\n2. Practice regularly (even 15 minutes daily helps!)\n3. Don't hesitate to ask questions\n4. Teach someone else (best way to learn!)\n\n**Remember**: Struggling means you're learning! Keep going! 🚀\n\nShall we start with a simple example?`;
  }
  
  if (messageLower.includes('progress') || messageLower.includes('how am i doing')) {
    const level = context.overall_stats?.current_level || 1;
    const xp = context.overall_stats?.total_xp || 0;
    const streak = context.overall_stats?.current_streak || 0;
    
    return `${studentName}, you're doing great! 🎉\n\n**Your Progress Summary:**\n\n📊 **Level**: ${level}\n⭐ **Total XP**: ${xp}\n🔥 **Streak**: ${streak} days\n\n**Strengths:**\n✅ You're actively engaging with the material\n✅ Asking good questions shows curiosity\n✅ Regular practice is building your skills\n\n**Areas to Focus:**\n📚 Keep practicing ${topic} regularly\n💪 Challenge yourself with harder problems\n🎯 Try to maintain your study streak\n\n**Recommendations for Class ${grade}:**\n1. Spend 20-30 minutes daily on practice\n2. Review mistakes - they're learning opportunities\n3. Connect concepts to real-world examples\n4. Don't hesitate to ask for help\n\n🌟 **Achievement Unlocked**: You're building a strong foundation!\n\nKeep up the excellent work! Your dedication will pay off! 🚀`;
  }
  
  if (messageLower.includes('thank') || messageLower.includes('thanks') || messageLower.includes('धन्यवाद')) {
    return `You're very welcome, ${studentName}! 😊\n\nI'm so happy I could help! Remember:\n\n💡 Learning is a journey, not a race\n🎯 Every question you ask makes you smarter\n🌟 Keep that curiosity alive!\n\nIf you need help with anything else about ${topic} or any other subject, I'm always here for you!\n\nHappy learning! 📚✨`;
  }
  
  return `That's an interesting question about ${topic}, ${studentName}! 🤔\n\n**Let me help you with that:**\n\nFor Class ${grade} students, it's important to understand the core principles. Here's what you need to know:\n\n🎯 **Key Points:**\n• Focus on understanding the 'why' not just the 'how'\n• Connect new concepts to what you already know\n• Practice regularly to build mastery\n\n📝 **Approach:**\n1. Start with the fundamentals\n2. Work through examples step by step\n3. Apply concepts to different scenarios\n4. Review and reinforce your understanding\n\n💪 **Study Strategy:**\n• Break complex topics into smaller chunks\n• Use diagrams and visual aids when possible\n• Explain concepts in your own words\n• Test yourself regularly\n\n🌟 **Remember**: The fact that you're asking questions means you're on the right path to mastery!\n\nWould you like me to explain any specific part in more detail? Or shall we try a practice problem?`;
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
