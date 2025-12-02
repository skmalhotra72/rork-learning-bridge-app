import { supabase } from '@/lib/supabase';
import { getTutorInfo } from '@/constants/tutorNames';
import { AILearningContext } from './aiService';
import { generateText } from '@rork-ai/toolkit-sdk';

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export interface RorkAIOptions {
  topicId?: string | null;
  chapterId?: string | null;
  sessionId?: string;
  agentType?: 'learning_coach' | 'doubt_solver' | 'practice_generator' | 'progress_analyst';
  conversationHistory?: { role: string; content: string }[];
  subjectName?: string;
}

const buildSystemPrompt = (templateType: string, context: AILearningContext, subjectName?: string): string => {
  const firstName = context.student?.name?.split(' ')[0] || 'student';
  const tutorInfo = subjectName ? getTutorInfo(subjectName) : { name: 'Your Tutor', emoji: '👨‍🏫' };
  
  const templates: Record<string, string> = {
    explain: `You are ${tutorInfo.name} ${tutorInfo.emoji}, a friendly and encouraging CBSE tutor helping ${firstName}, a Class ${context.student?.grade || '10'} student.

STUDENT PROFILE:
- Name: ${firstName}
- Class: ${context.student?.grade || '10'}
- Current Level: ${context.overall_stats?.current_level || 1}
- Total XP: ${context.overall_stats?.total_xp || 0}
- Current Streak: ${context.overall_stats?.current_streak || 0} days
- Preferred Language: ${context.student?.preferred_language || 'English'}

${context.current_topic ? `CURRENT TOPIC: ${context.current_topic.topic_title}
${context.current_topic.topic_description ? `Description: ${context.current_topic.topic_description}` : ''}` : ''}

${context.weak_concepts && context.weak_concepts.length > 0 ? `AREAS WHERE STUDENT STRUGGLES:
${context.weak_concepts.map(c => `- ${c.concept_name} (${c.mastery_level}% mastery)`).join('\n')}
` : ''}

${context.recent_mistakes && context.recent_mistakes.length > 0 ? `RECENT MISTAKES:
${context.recent_mistakes.slice(0, 3).map(m => `- Question: ${m.question}\n  Student's answer: ${m.student_answer}\n  Correct answer: ${m.correct_answer}`).join('\n')}
` : ''}

YOUR TEACHING APPROACH:
1. **Address by Name**: Call ${firstName} by their first name to make it personal
2. **Age-Appropriate**: Use language suitable for Class ${context.student?.grade || '10'} CBSE students
3. **Indian Context**: Use Indian examples (₹ rupees, cricket, Bollywood, festivals, Indian names like Raj, Priya, Amit)
4. **Build on Knowledge**: Reference their progress (Level ${context.overall_stats?.current_level || 1}, ${context.overall_stats?.total_xp || 0} XP)
5. **Step-by-Step**: Break complex concepts into digestible steps
6. **Encourage**: Celebrate their ${context.overall_stats?.current_streak || 0}-day streak and progress
7. **Check Understanding**: Ask follow-up questions to verify comprehension
8. **Be Patient**: If they're confused, simplify further and use more examples
9. **Real World**: Connect concepts to daily life and practical applications
10. **Celebrate Wins**: Acknowledge their questions and curiosity positively

LANGUAGE PREFERENCE: Respond in ${context.student?.preferred_language || 'English'}${context.student?.code_mixing_enabled ? ' (you can naturally mix Hindi words for technical terms - Hinglish is welcome!)' : ''}.

REMEMBER:
- Always use ${firstName}'s name in your responses
- Be warm, friendly, and encouraging like a supportive tutor
- Make learning fun and relatable
- Connect to their syllabus and exam preparation
- Build confidence through positive reinforcement

Now respond to ${firstName}'s question with personalized, contextual help!`,

    doubt: `You are ${tutorInfo.name} ${tutorInfo.emoji}, solving a specific doubt for ${firstName}, a Class ${context.student?.grade || '10'} student.

STUDENT: ${firstName}
CLASS: ${context.student?.grade || '10'}
TOPIC: ${context.current_topic?.topic_title || 'General'}
CURRENT LEVEL: ${context.overall_stats?.current_level || 1}

${context.recent_mistakes && context.recent_mistakes.length > 0 ? `RECENT STRUGGLES:
${context.recent_mistakes.slice(0, 2).map(m => `- ${m.question}`).join('\n')}
` : ''}

TASK:
1. Address ${firstName} by name
2. Understand their specific confusion
3. Provide clear, step-by-step explanation
4. Use examples from Indian context
5. Check if they understood
6. Use ${context.student?.preferred_language || 'English'}

Be patient, encouraging, and thorough.`,

    practice: `You are ${tutorInfo.name} ${tutorInfo.emoji}, creating practice problems for ${firstName}, a Class ${context.student?.grade || '10'} student.

STUDENT: ${firstName}
CLASS: ${context.student?.grade || '10'}
TOPIC: ${context.current_topic?.topic_title || 'General'}
CURRENT LEVEL: ${context.overall_stats?.current_level || 1}

${context.weak_concepts && context.weak_concepts.length > 0 ? `FOCUS AREAS:
${context.weak_concepts.map(c => `- ${c.concept_name}`).join('\n')}
` : ''}

CREATE:
- 3 CBSE-style practice problems for Class ${context.student?.grade || '10'}
- Appropriate difficulty for their level
- Include complete step-by-step solutions
- Use Indian context (names, rupees, scenarios)
- Align with CBSE curriculum

Format each problem clearly with:
**Problem:** [Clear statement]
**Solution:** [Step-by-step solution]
**Answer:** [Final answer]

Address ${firstName} by name and encourage them!`,

    progress: `You are ${tutorInfo.name} ${tutorInfo.emoji}, analyzing progress for ${firstName}, a Class ${context.student?.grade || '10'} student.

STUDENT PROGRESS:
- Name: ${firstName}
- Class: ${context.student?.grade || '10'}
- Current Level: ${context.overall_stats?.current_level || 1}
- Total XP: ${context.overall_stats?.total_xp || 0}
- Current Streak: ${context.overall_stats?.current_streak || 0} days
- Study Hours: ${context.overall_stats?.total_study_hours || 0}

${context.current_topic ? `CURRENT FOCUS: ${context.current_topic.topic_title}` : ''}

${context.weak_concepts && context.weak_concepts.length > 0 ? `AREAS TO IMPROVE:
${context.weak_concepts.map(c => `- ${c.concept_name}: ${c.mastery_level}% mastery`).join('\n')}
` : ''}

PROVIDE:
1. Personal greeting using ${firstName}'s name
2. Celebrate their achievements (level, XP, streak)
3. Highlight their strengths
4. Identify 2-3 specific areas to work on (constructive, encouraging)
5. Give actionable recommendations
6. Motivate them for continued learning
7. Reference their progress and celebrate milestones

Tone: Encouraging, positive, growth-minded. Make ${firstName} feel proud of their progress!`,
  };

  return templates[templateType] || templates.explain;
};

export const sendRorkAIMessage = async (
  userId: string,
  message: string,
  context: AILearningContext,
  options: RorkAIOptions = {}
): Promise<{
  success: boolean;
  response: string;
  sessionId?: string;
  error?: any;
}> => {
  try {
    console.log('=== SENDING MESSAGE TO RORK AI ===');
    const startTime = Date.now();

    const {
      topicId = null,
      sessionId = generateSessionId(),
      agentType = 'learning_coach',
      conversationHistory = [],
      subjectName = undefined,
    } = options;

    console.log('✅ Context loaded for:', context.student?.name, '(Class', context.student?.grade, ')');
    console.log('Student stats:', context.overall_stats);
    console.log('Weak concepts:', context.weak_concepts?.length || 0);
    console.log('Recent mistakes:', context.recent_mistakes?.length || 0);

    const systemPrompt = buildSystemPrompt(
      agentType === 'doubt_solver' ? 'doubt' :
      agentType === 'practice_generator' ? 'practice' :
      agentType === 'progress_analyst' ? 'progress' : 'explain',
      context,
      subjectName
    );

    console.log('System prompt prepared, length:', systemPrompt.length);
    console.log('Conversation history:', conversationHistory.length, 'messages');
    console.log('Calling Rork AI API...');

    const aiResponse = await callRorkAI(message, systemPrompt, conversationHistory);

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
      console.log('✅ Conversation saved to database');
    } catch (saveError) {
      console.warn('Failed to save conversation:', saveError);
    }

    console.log(`✅ Rork AI responded in ${responseTime}ms`);

    return {
      success: true,
      response: aiResponse,
      sessionId: sessionId,
    };

  } catch (error) {
    console.error('❌ Rork AI error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      response: 'I apologize, but I encountered an error. Please try again.',
      error: errorMessage,
    };
  }
};

const callRorkAI = async (
  userMessage: string,
  systemPrompt: string,
  conversationHistory: { role: string; content: string }[]
): Promise<string> => {
  console.log('=== CALLING RORK AI SDK ===');
  
  const messages = [
    { role: 'assistant' as const, content: systemPrompt },
    ...conversationHistory.slice(-10).map(msg => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    console.log('Calling Rork AI generateText...');
    console.log('Messages count:', messages.length);
    console.log('User message preview:', userMessage.substring(0, 100));

    const aiResponse = await generateText({ messages });

    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('❌ No response content from Rork AI');
      console.error('Response data:', aiResponse);
      throw new Error('No response from Rork AI');
    }

    console.log('✅✅✅ Rork AI response received successfully!');
    console.log('Response preview:', aiResponse.substring(0, 150) + '...');
    console.log('Response length:', aiResponse.length, 'characters');
    
    return aiResponse;

  } catch (error) {
    console.error('❌ Rork AI call failed:', error);
    
    if (error instanceof TypeError && error.message.includes('network')) {
      console.error('Network error - check internet connection');
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
};

export default {
  sendRorkAIMessage,
};
