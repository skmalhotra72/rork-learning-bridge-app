const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

console.log('=== CONFIG LOADED ===');
console.log('OpenAI API Key exists:', !!OPENAI_API_KEY);
console.log('OpenAI API Key length:', OPENAI_API_KEY?.length);
console.log('OpenAI API Key prefix:', OPENAI_API_KEY?.substring(0, 10) + '...');
console.log('OpenAI API Key is valid format:', !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-'));

export const Config = {
  OPENAI_API_KEY,
} as const;

export const isOpenAIConfigured = (): boolean => {
  const isConfigured = !!OPENAI_API_KEY && 
    OPENAI_API_KEY !== 'your_openai_api_key_here' && 
    OPENAI_API_KEY.startsWith('sk-') &&
    OPENAI_API_KEY.length > 20;
  
  console.log('=== API KEY VALIDATION ===');
  console.log('Is configured:', isConfigured);
  if (!isConfigured) {
    console.log('⚠️ OpenAI API key not properly configured');
    console.log('Key exists:', !!OPENAI_API_KEY);
    console.log('Not placeholder:', OPENAI_API_KEY !== 'your_openai_api_key_here');
    console.log('Starts with sk-:', OPENAI_API_KEY?.startsWith('sk-'));
    console.log('Length > 20:', (OPENAI_API_KEY?.length || 0) > 20);
  }
  
  return isConfigured;
};
