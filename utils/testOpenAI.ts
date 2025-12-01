import { Config, isOpenAIConfigured } from '@/constants/config';

/**
 * Test OpenAI API Connection
 * This utility tests if the OpenAI API is configured correctly and responding
 */

export const testOpenAIConnection = async (): Promise<{
  success: boolean;
  message: string;
  response?: string;
  error?: any;
}> => {
  try {
    console.log('=== TESTING OPENAI CONNECTION ===');
    console.log('API Key exists:', !!Config.OPENAI_API_KEY);
    console.log('API Key configured:', isOpenAIConfigured());
    console.log('API Key length:', Config.OPENAI_API_KEY?.length);
    console.log('API Key starts with:', Config.OPENAI_API_KEY?.substring(0, 15));

    if (!isOpenAIConfigured()) {
      return {
        success: false,
        message: 'OpenAI API key not configured',
        error: 'No API key found in environment variables. Please add EXPO_PUBLIC_OPENAI_API_KEY to your env file and restart the app.',
      };
    }

    const apiKey = Config.OPENAI_API_KEY!;

    const testMessage = {
      role: 'user',
      content: 'Hello! This is a test message. Please respond with "API connection successful!"'
    };

    console.log('Sending test request to OpenAI...');
    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond briefly and confirm the connection is working.'
          },
          testMessage
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ OpenAI API error:', response.status, errorData);
      
      return {
        success: false,
        message: `OpenAI API error: ${response.status}`,
        error: errorData?.error?.message || response.statusText,
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return {
        success: false,
        message: 'No response from OpenAI',
        error: 'Empty response received',
      };
    }

    console.log('✅ OpenAI response received in', responseTime, 'ms');
    console.log('Response:', aiResponse);

    return {
      success: true,
      message: `API connection successful! (Response time: ${responseTime}ms)`,
      response: aiResponse,
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      message: 'Test failed with exception',
      error: errorMessage,
    };
  }
};

/**
 * Test with a specific prompt
 */
export const testOpenAIWithPrompt = async (
  prompt: string
): Promise<{
  success: boolean;
  message: string;
  response?: string;
  error?: any;
}> => {
  try {
    if (!isOpenAIConfigured()) {
      return {
        success: false,
        message: 'OpenAI API key not configured',
        error: 'No API key found. Please add EXPO_PUBLIC_OPENAI_API_KEY to your env file and restart the app.',
      };
    }

    const apiKey = Config.OPENAI_API_KEY!;

    console.log('=== TESTING WITH CUSTOM PROMPT ===');
    console.log('Prompt:', prompt);

    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI tutor for students.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        message: `API error: ${response.status}`,
        error: errorData?.error?.message || response.statusText,
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return {
        success: false,
        message: 'No response received',
        error: 'Empty response',
      };
    }

    console.log('✅ Response received in', responseTime, 'ms');
    console.log('Response:', aiResponse.substring(0, 200));

    return {
      success: true,
      message: `Success! (${responseTime}ms)`,
      response: aiResponse,
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      message: 'Test failed',
      error: errorMessage,
    };
  }
};
