const getOpenAIKey = (): string | undefined => {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY;
};

const OPENAI_API_KEY = getOpenAIKey();

console.log('=== CONFIG LOADED ===');
console.log('OpenAI API Key exists:', !!OPENAI_API_KEY);
console.log('OpenAI API Key length:', OPENAI_API_KEY?.length);
if (OPENAI_API_KEY) {
  console.log('OpenAI API Key prefix:', OPENAI_API_KEY.substring(0, 20) + '...');
  console.log('OpenAI API Key suffix:', '...' + OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10));
}
console.log('OpenAI API Key is valid format:', !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-'));

export const Config = {
  get OPENAI_API_KEY() {
    return getOpenAIKey();
  },
} as const;

export const isOpenAIConfigured = (): boolean => {
  const key = getOpenAIKey();
  const isConfigured = !!key && 
    key !== 'your_openai_api_key_here' && 
    key.startsWith('sk-') &&
    key.length > 20;
  
  console.log('=== API KEY VALIDATION ===');
  console.log('Is configured:', isConfigured);
  if (!isConfigured) {
    console.log('⚠️ OpenAI API key not properly configured');
    console.log('Key exists:', !!key);
    console.log('Not placeholder:', key !== 'your_openai_api_key_here');
    console.log('Starts with sk-:', key?.startsWith('sk-'));
    console.log('Length > 20:', (key?.length || 0) > 20);
    console.log('Full key value for debugging:', key);
  }
  
  return isConfigured;
};
