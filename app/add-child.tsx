import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useUser } from '@/contexts/UserContext';
import { acceptParentInvitation } from '@/services/parentPortal';

export default function AddChildScreen() {
  const router = useRouter();
  const { authUser } = useUser();

  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (success) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [success, fadeAnim, scaleAnim]);

  const handleSubmit = async () => {
    if (!invitationCode.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter an invitation code');
      return;
    }

    setLoading(true);

    try {
      const result = await acceptParentInvitation(
        authUser!.id,
        invitationCode.trim().toUpperCase()
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        setTimeout(() => {
          Alert.alert('Success! 🎉', 'Child added successfully!', [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]);
        }, 1000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Invalid Code',
          'The invitation code is invalid or has already been used. Please ask your child to generate a new code.'
        );
      }
    } catch (error) {
      console.error('Add child error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to add child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {success && (
        <Animated.View 
          style={[
            styles.successOverlay,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successText}>Connected!</Text>
        </Animated.View>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>👨‍👩‍👧</Text>
        <Text style={styles.title}>Add Your Child</Text>
        <Text style={styles.subtitle}>
          Ask your child to generate an invitation code from their app settings
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Invitation Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 8-character code"
            value={invitationCode}
            onChangeText={setInvitationCode}
            autoCapitalize="characters"
            maxLength={8}
            editable={!loading}
            testID="invitation-code-input"
          />
          <Text style={styles.inputHint}>Example: ABC12345</Text>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to get the code:</Text>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Ask your child to open their Buddy app
            </Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Go to Settings → Parent Portal</Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Tap &quot;Generate Parent Code&quot;</Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>
              Enter the 8-character code here
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          testID="submit-button"
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Connecting...' : 'Add Child'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  inputSection: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    letterSpacing: 2,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row' as const,
    marginBottom: 12,
    alignItems: 'flex-start' as const,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    textAlign: 'center' as const,
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#4F46E5',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center' as const,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  successOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(79, 70, 229, 0.95)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  successText: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
});
