import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface SpeechToTextOptions {
  audioUri: string;
  language?: string;
}

export interface SpeechToTextResult {
  success: boolean;
  text?: string;
  error?: string;
}

export const transcribeAudio = async (
  options: SpeechToTextOptions
): Promise<SpeechToTextResult> => {
  try {
    console.log('=== TRANSCRIBING AUDIO WITH RORK AI ===');
    console.log('Audio URI:', options.audioUri);
    console.log('Language:', options.language || 'en');

    console.log('📤 Sending audio to Rork AI transcription...');

    let base64Audio: string;
    
    if (Platform.OS === 'web') {
      const response = await fetch(options.audioUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      base64Audio = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      base64Audio = await FileSystem.readAsStringAsync(options.audioUri, {
        encoding: 'base64',
      });
    }

    const response = await fetch('https://api.rork.app/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: base64Audio,
        language: options.language || 'en',
        mimeType: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Transcription API error:', response.status, errorData);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.text && !data.transcription) {
      console.error('❌ No transcription in response');
      throw new Error('No transcription received');
    }

    const transcribedText = data.text || data.transcription;
    console.log('✅ Transcription successful');
    console.log('Transcribed text:', transcribedText);
    
    return {
      success: true,
      text: transcribedText,
    };
  } catch (error) {
    console.error('❌ Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
};
