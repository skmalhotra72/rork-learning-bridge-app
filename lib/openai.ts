import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface StudentContext {
  grade: number;
  subject: string;
  confidenceLevel: number;
  stuckPoints?: string;
  gaps?: string[];
}

interface PracticeProblem {
  problem: string;
  solution: string;
  answer: string;
  hint: string;
}

export const explainConcept = async (
  studentContext: StudentContext,
  concept: string,
  studentQuestion: string | null = null
): Promise<string> => {
  try {
    console.log('=== CALLING OPENAI API ===');
    console.log('Concept:', concept);
    console.log('Question:', studentQuestion);

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured. Please add it to your .env file.');
    }

    const systemMessage = `You are Buddy, a friendly AI tutor for Indian CBSE Class ${studentContext.grade} students studying ${studentContext.subject}.

Student's current confidence: ${studentContext.confidenceLevel}/10
Student struggles with: ${studentContext.stuckPoints || 'Not specified'}

Teaching style:
- Simple language for Class ${studentContext.grade}
- Use Indian examples (rupees, cricket, daily life)
- Break concepts into small steps
- Be encouraging and patient
- Use emojis occasionally

Current topic: ${concept}`;

    const userMessage = studentQuestion
      ? `I'm learning about ${concept}. ${studentQuestion}`
      : `Please explain ${concept} to me simply with examples.`;

    console.log('Making OpenAI request...');

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI error:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Got OpenAI response');

    const aiText = data.choices[0].message.content;
    return aiText;
  } catch (error) {
    console.error('❌ OpenAI Error:', error);
    throw error;
  }
};

export const generatePracticeProblem = async (
  studentContext: StudentContext,
  concept: string
): Promise<PracticeProblem> => {
  try {
    console.log('=== GENERATING PRACTICE PROBLEM ===');

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured');
    }

    const systemMessage = `Create a practice problem for Class ${studentContext.grade} CBSE ${studentContext.subject}.

Return ONLY a JSON object with this exact format:
{
  "problem": "the problem statement",
  "solution": "step-by-step solution",
  "answer": "final answer",
  "hint": "helpful hint"
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Create a practice problem for ${concept}` },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Parse error:', e);
    }

    return {
      problem: text,
      solution: 'Work through step by step',
      answer: 'Check your work',
      hint: 'Break it into parts',
    };
  } catch (error) {
    console.error('❌ Problem generation error:', error);
    throw error;
  }
};
