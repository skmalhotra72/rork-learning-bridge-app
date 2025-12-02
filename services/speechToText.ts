import { Platform } from 'react-native';

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
    console.log('Language:', options.language || 'auto');

    console.log('📤 Sending audio to Rork AI transcription...');

    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      const response = await fetch(options.audioUri);
      const blob = await response.blob();
      formData.append('audio', blob, 'recording.webm');
    } else {
      const uriParts = options.audioUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const audioFile: any = {
        uri: options.audioUri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      };
      
      formData.append('audio', audioFile);
    }
    
    if (options.language) {
      formData.append('language', options.language);
    }

    const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Transcription API error:', response.status, errorData);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.text) {
      console.error('❌ No transcription in response');
      throw new Error('No transcription received');
    }

    const transcribedText = data.text;
    console.log('✅ Transcription successful');
    console.log('Transcribed text:', transcribedText);
    console.log('Detected language:', data.language);
    
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
