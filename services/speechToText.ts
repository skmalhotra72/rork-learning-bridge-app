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

    if (Platform.OS === 'web') {
      const response = await fetch(options.audioUri);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', options.language || 'en');

      const apiResponse = await fetch('https://api.rork.app/v1/audio/transcriptions', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error(`Transcription API error: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      return {
        success: true,
        text: data.text || data.transcription,
      };
    } else {
      const fileInfo = await FileSystem.getInfoAsync(options.audioUri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: options.audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', options.language || 'en');

      console.log('📤 Sending audio to transcription API...');

      const apiResponse = await fetch('https://api.rork.app/v1/audio/transcriptions', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('❌ API Error:', apiResponse.status, errorText);
        throw new Error(`Transcription failed: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      
      if (!data.text && !data.transcription) {
        throw new Error('No transcription in response');
      }

      console.log('✅ Transcription successful');
      
      return {
        success: true,
        text: data.text || data.transcription,
      };
    }
  } catch (error) {
    console.error('❌ Transcription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
