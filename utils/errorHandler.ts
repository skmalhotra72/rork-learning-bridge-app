import { Alert } from 'react-native';

export const handleError = (error: any, context: string = 'Operation'): string => {
  console.error(`${context} error:`, error);
  
  let userMessage = 'Something went wrong. Please try again.';
  
  const errorMessage = error?.message || error?.toString() || '';
  
  // Network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
    userMessage = 'Network error. Please check your internet connection.';
  }
  
  // Auth errors
  else if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
    userMessage = 'Session expired. Please log in again.';
  }
  
  // Database errors
  else if (errorMessage.includes('violates') || errorMessage.includes('constraint')) {
    userMessage = 'Invalid data. Please check your input.';
  }
  
  // Rate limit
  else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    userMessage = 'Too many requests. Please wait a moment and try again.';
  }
  
  // Supabase specific errors
  else if (error?.code) {
    switch (error.code) {
      case '23505':
        userMessage = 'This record already exists.';
        break;
      case '23503':
        userMessage = 'Related record not found.';
        break;
      case '23514':
        userMessage = 'Invalid data format.';
        break;
      case 'PGRST116':
        userMessage = 'No data found.';
        break;
      default:
        userMessage = `Error: ${error.message || 'Unknown error'}`;
    }
  }
  
  return userMessage;
};

export const showError = (error: any, context: string = 'Operation'): void => {
  const message = handleError(error, context);
  Alert.alert('Error', message);
};

export const showSuccess = (message: string, title: string = 'Success'): void => {
  Alert.alert(title, message);
};

export const showConfirmation = (
  message: string,
  onConfirm: () => void,
  title: string = 'Confirm'
): void => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm }
    ]
  );
};

export const showInfo = (message: string, title: string = 'Info'): void => {
  Alert.alert(title, message);
};
