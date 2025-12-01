const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

console.log('=== CONFIG LOADED ===');
console.log('OpenAI API Key exists:', !!OPENAI_API_KEY);
console.log('OpenAI API Key length:', OPENAI_API_KEY?.length);
console.log('OpenAI API Key prefix:', OPENAI_API_KEY?.substring(0, 7));

export const Config = {
  OPENAI_API_KEY,
} as const;

export const isOpenAIConfigured = (): boolean => {
  return !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here';
};
