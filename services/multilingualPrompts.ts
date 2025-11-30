import { supabase } from '@/lib/supabase';
import { getStudentContext, buildAIContextString } from './learningHistory';
import { findConceptInCurriculum } from '@/data/cbseCurriculum';

export interface LanguageSettings {
  user_id: string;
  school_instruction_language: string;
  preferred_tutoring_language: string;
  allow_code_mixing: boolean;
  technical_terms_language: string;
  examples_language: string;
  english_proficiency?: number;
  hindi_proficiency?: number;
  prefer_transliteration?: boolean;
  prefer_simple_vocabulary: boolean;
  created_at?: string;
  updated_at?: string;
}

export const getLanguageSettings = async (userId: string): Promise<LanguageSettings> => {
  try {
    console.log('=== FETCHING LANGUAGE SETTINGS ===');
    console.log('User ID:', userId);

    const { data, error } = await supabase
      .from('language_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.log('No language settings found, using defaults');
      return {
        user_id: userId,
        school_instruction_language: 'English',
        preferred_tutoring_language: 'English',
        allow_code_mixing: false,
        technical_terms_language: 'English',
        examples_language: 'English',
        english_proficiency: 3,
        prefer_simple_vocabulary: true
      };
    }

    console.log('✅ Language settings loaded');
    console.log('Preferred language:', data.preferred_tutoring_language);
    console.log('Code mixing:', data.allow_code_mixing);

    return data as LanguageSettings;
  } catch (error) {
    console.error('❌ Get language settings error:', error);
    return {
      user_id: userId,
      school_instruction_language: 'English',
      preferred_tutoring_language: 'English',
      allow_code_mixing: false,
      technical_terms_language: 'English',
      examples_language: 'English',
      prefer_simple_vocabulary: true
    };
  }
};

export const saveLanguageSettings = async (userId: string, languageData: {
  schoolMedium: string;
  preferredLanguage: string;
  allowCodeMixing: boolean;
  englishProficiency?: number;
}): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    console.log('=== SAVING LANGUAGE SETTINGS ===');
    console.log('User:', userId);
    console.log('Preferred language:', languageData.preferredLanguage);
    console.log('Code mixing:', languageData.allowCodeMixing);

    const { data, error } = await supabase
      .from('language_settings')
      .upsert({
        user_id: userId,
        school_instruction_language: languageData.schoolMedium,
        preferred_tutoring_language: languageData.preferredLanguage,
        allow_code_mixing: languageData.allowCodeMixing,
        technical_terms_language: 'English',
        examples_language: languageData.preferredLanguage,
        english_proficiency: languageData.englishProficiency || 3,
        prefer_simple_vocabulary: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('❌ Save language settings error:', error);
      return { success: false, error };
    }

    await supabase
      .from('profiles')
      .update({
        school_medium: languageData.schoolMedium,
        preferred_language: languageData.preferredLanguage
      })
      .eq('id', userId);

    console.log('✅ Language settings saved');
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('❌ Save language settings exception:', error);
    return { success: false, error };
  }
};

const buildLanguageInstructions = (settings: LanguageSettings): string => {
  const lang = settings.preferred_tutoring_language;
  const codeMix = settings.allow_code_mixing;
  const techLang = settings.technical_terms_language;

  let instructions = `PRIMARY LANGUAGE: ${lang}\n`;

  if (codeMix && (lang === 'Hindi' || lang === 'Hinglish')) {
    instructions += `CODE-MIXING: Allowed - Mix Hindi and English naturally (Hinglish style)\n`;
    instructions += `Example: "Chalo, quadratic equation ko solve karte hain using formula method"\n`;
  } else if (codeMix) {
    instructions += `CODE-MIXING: Allowed - Mix ${lang} with English for technical terms\n`;
  } else {
    instructions += `CODE-MIXING: Not preferred - Use pure ${lang} as much as possible\n`;
  }

  instructions += `TECHNICAL TERMS: Always use ${techLang} for subject-specific terminology\n`;

  if (settings.prefer_transliteration) {
    instructions += `SCRIPT: Use Roman transliteration (Latin script) for better readability\n`;
  }

  if (settings.prefer_simple_vocabulary) {
    instructions += `VOCABULARY: Use simple, everyday words - avoid complex academic language\n`;
  }

  return instructions;
};

const getLanguageGuidance = (settings: LanguageSettings): string => {
  const responses: Record<string, string> = {
    'English': 'Respond in clear, simple English',
    'Hindi': settings.allow_code_mixing 
      ? 'Respond in Hinglish (Hindi + English mix) - use English for technical terms'
      : 'Respond in Hindi, but use English for mathematical/scientific terms',
    'Hinglish': 'Respond in Hinglish (natural mix of Hindi and English)',
    'Tamil': `Respond in Tamil, use ${settings.technical_terms_language} for technical terms`,
    'Telugu': `Respond in Telugu, use ${settings.technical_terms_language} for technical terms`,
    'Marathi': `Respond in Marathi, use ${settings.technical_terms_language} for technical terms`,
    'Kannada': `Respond in Kannada, use ${settings.technical_terms_language} for technical terms`,
    'Malayalam': `Respond in Malayalam, use ${settings.technical_terms_language} for technical terms`,
    'Bengali': `Respond in Bengali, use ${settings.technical_terms_language} for technical terms`,
    'Gujarati': `Respond in Gujarati, use ${settings.technical_terms_language} for technical terms`,
    'Punjabi': `Respond in Punjabi, use ${settings.technical_terms_language} for technical terms`
  };

  return responses[settings.preferred_tutoring_language] || responses['English'];
};

const getLanguageSpecificGuidelines = (language: string, codeMixing: boolean): string => {
  const guidelines: Record<string, string> = {
    'English': `
ENGLISH GUIDELINES:
- Use simple, conversational English
- Avoid complex academic jargon
- Use Indian examples (rupees, cricket, Bollywood)
- Explain terms before using them`,

    'Hindi': codeMixing ? `
HINGLISH GUIDELINES:
- Mix Hindi and English naturally
- Use Hindi for everyday words: "chalo", "achha", "samajh", "dekho"
- Use English for technical terms: "equation", "formula", "variable"
- Example: "Achha, toh quadratic equation kya hota hai? Yeh ek equation hai jisme highest power 2 hoti hai."
- Keep it conversational and natural` : `
HINDI GUIDELINES:
- Use pure Hindi as much as possible
- Technical terms can be in English: quadratic equation, formula
- Example: "चलिए द्विघात समीकरण को समझते हैं। यह एक समीकरण है जिसमें सर्वोच्च घात 2 होती है।"`,

    'Hinglish': `
HINGLISH GUIDELINES:
- Natural mix of Hindi and English
- Hindi for common words, English for technical terms
- Example: "Toh pehle hum basic concept samajhte hain, fir solve karenge"
- Keep it casual and conversational`,

    'Tamil': `
TAMIL GUIDELINES:
- Use Tamil for explanations
- Keep English for mathematical terms
- Example: "சமன்பாட்டை படிப்படியாக தீர்ப்போம்"`,

    'Telugu': `
TELUGU GUIDELINES:
- Use Telugu for explanations
- Keep English for mathematical terms
- Example: "సమీకరణాన్ని దశల వారీగా పరిష్కరిద్దాం"`,

    'Marathi': `
MARATHI GUIDELINES:
- Use Marathi for explanations
- Keep English for technical terms
- Example: "चला समीकरण पायरीने सोडवूया"`
  };

  return guidelines[language] || guidelines['English'];
};

export const buildMultilingualSystemPrompt = async (
  userId: string,
  subject: string,
  concept: string,
  studentQuestion?: string
): Promise<string> => {
  try {
    console.log('=== BUILDING MULTILINGUAL SYSTEM PROMPT ===');
    console.log('User ID:', userId);
    console.log('Subject:', subject);
    console.log('Concept:', concept);

    const langSettings = await getLanguageSettings(userId);
    console.log('Language settings loaded');

    const context = await getStudentContext(userId, subject);
    console.log('Student context loaded');

    const languageInstructions = buildLanguageInstructions(langSettings);

    const conceptInfo = findConceptInCurriculum(subject, concept);

    const systemPrompt = `You are Buddy 🦉, an expert CBSE tutor for ${subject}.

LANGUAGE INSTRUCTIONS:
${languageInstructions}

STUDENT PROFILE:
- Class: ${context.grade}
- Subject: ${subject}
- School Medium: ${langSettings.school_instruction_language}
- Preferred Language: ${langSettings.preferred_tutoring_language}
- English Proficiency: ${langSettings.english_proficiency || 3}/5
${langSettings.hindi_proficiency ? `- Hindi Proficiency: ${langSettings.hindi_proficiency}/5` : ''}

${buildAIContextString(context)}

${conceptInfo ? `
CURRENT CONCEPT: ${concept}
Grade level: ${conceptInfo.grade}
Related chapter: ${conceptInfo.chapter}
Key concepts: ${conceptInfo.concepts.join(', ')}
` : ''}

YOUR TEACHING APPROACH:
1. **Language Adaptation**: ${getLanguageGuidance(langSettings)}
2. **Technical Terms**: Always use ${langSettings.technical_terms_language} for mathematical/scientific terms
3. **Examples**: Use Indian context and ${langSettings.preferred_tutoring_language} language examples
4. **Step-by-Step**: Break concepts into simple steps
5. **Check Understanding**: Ask simple questions to verify
6. **Encourage**: Always be positive and patient

${getLanguageSpecificGuidelines(langSettings.preferred_tutoring_language, langSettings.allow_code_mixing)}

${studentQuestion ? `
STUDENT'S QUESTION: "${studentQuestion}"
Address this specifically while building on their existing knowledge.
` : `
TASK: Help the student understand "${concept}". Start by checking what they already know, then build up the explanation.
`}

Remember: Your goal is to make the student comfortable and confident in their learning!`;

    console.log('✅ Multilingual system prompt built');
    console.log('Language:', langSettings.preferred_tutoring_language);
    return systemPrompt;
  } catch (error) {
    console.error('❌ Build multilingual prompt error:', error);
    return `You are Buddy 🦉, a tutor for ${subject}. Explain ${concept} clearly with Indian examples.
${studentQuestion ? `Student's question: ${studentQuestion}` : ''}`;
  }
};

export const buildMultilingualPracticeProblemPrompt = async (
  userId: string,
  subject: string,
  concept: string
): Promise<string> => {
  try {
    const langSettings = await getLanguageSettings(userId);
    const studentContext = await getStudentContext(userId, subject);

    return `You are creating a practice problem for a Class ${studentContext.grade} CBSE ${subject} student.

LANGUAGE: ${langSettings.preferred_tutoring_language}
${langSettings.allow_code_mixing ? 'CODE-MIXING: Allowed' : 'CODE-MIXING: Not preferred'}

Student's mastery level: ${studentContext.masteryPercentage}%
Student's confidence: ${studentContext.confidenceLevel}/10
Problems solved so far: ${studentContext.problemsSolved || 0}
${studentContext.commonMistakes.length > 0 ? `Common mistakes to address: ${studentContext.commonMistakes.slice(0, 2).join(', ')}` : ''}

CONCEPT: ${concept}

Create ONE practice problem that:
1. Tests understanding of ${concept}
2. Is appropriate for Class ${studentContext.grade} CBSE curriculum
3. Uses Indian context (Indian names like Raj, Priya, Amit; rupees ₹; familiar situations)
4. Matches student's current level
5. ${studentContext.commonMistakes.length > 0 ? `Helps address: ${studentContext.commonMistakes[0]}` : 'Builds confidence'}

IMPORTANT: Use ${langSettings.preferred_tutoring_language} language for the problem and explanation.
${langSettings.allow_code_mixing ? 'You can mix languages naturally (e.g., Hinglish).' : 'Use pure language with English technical terms.'}

Format your response clearly:
**Problem:** [Clear problem statement in ${langSettings.preferred_tutoring_language}]

**Solution:** [Step-by-step solution]

**Answer:** [Final answer]

**Hint:** [Helpful hint if stuck]`;
  } catch {
    return `Create a practice problem for ${concept} suitable for CBSE students. Use Indian context and step-by-step solutions.`;
  }
};
