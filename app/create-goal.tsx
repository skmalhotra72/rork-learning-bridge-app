import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';

import { useUser } from '@/contexts/UserContext';
import { createParentGoal } from '@/services/parentPortal';

interface GoalType {
  value: string;
  label: string;
  emoji: string;
  unit: string;
}

const CreateGoalScreen = () => {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { authUser } = useUser();
  const router = useRouter();

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalType, setGoalType] = useState('xp_target');
  const [targetValue, setTargetValue] = useState('');
  const [targetSubject, setTargetSubject] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [reminderFrequency, setReminderFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const goalTypes: GoalType[] = [
    { value: 'xp_target', label: 'Earn XP Points', emoji: '⭐', unit: 'XP' },
    { value: 'concepts_mastery', label: 'Master Concepts', emoji: '🎓', unit: 'concepts' },
    { value: 'quiz_streak', label: 'Quiz Streak', emoji: '🔥', unit: 'days' },
    { value: 'subject_mastery', label: 'Subject Progress', emoji: '📚', unit: '% mastery' },
    { value: 'study_time', label: 'Study Time', emoji: '⏱️', unit: 'minutes' },
    { value: 'badge_collection', label: 'Collect Badges', emoji: '🏆', unit: 'badges' },
  ];

  const selectedGoalType = goalTypes.find((t) => t.value === goalType);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!goalTitle.trim()) {
      newErrors.goalTitle = 'Please enter a goal title';
    }

    if (!targetValue || parseInt(targetValue) <= 0) {
      newErrors.targetValue = 'Please enter a valid target value';
    }

    if (!authUser?.id || !childId) {
      newErrors.general = 'Missing user information';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);

    try {
      const result = await createParentGoal(authUser!.id, childId, {
        goalTitle: goalTitle.trim(),
        goalDescription: goalDescription.trim(),
        goalType: goalType,
        targetValue: parseInt(targetValue),
        targetSubject: targetSubject.trim() || undefined,
        targetDeadline: targetDeadline || undefined,
        reminderFrequency: reminderFrequency,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Goal Created! 🎯', 'Your child can now see this goal and work towards it!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to create goal. Please try again.');
      }
    } catch (error) {
      console.error('Create goal error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Goal',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Goal Type</Text>
            <View style={styles.goalTypesGrid}>
              {goalTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.goalTypeCard,
                    goalType === type.value && styles.goalTypeCardSelected,
                  ]}
                  onPress={() => setGoalType(type.value)}
                >
                  <Text style={styles.goalTypeEmoji}>{type.emoji}</Text>
                  <Text
                    style={[
                      styles.goalTypeLabel,
                      goalType === type.value && styles.goalTypeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Goal Title *</Text>
            <TextInput
              style={[styles.input, errors.goalTitle && styles.inputError]}
              placeholder="e.g., Earn 500 XP this week"
              value={goalTitle}
              onChangeText={(text) => {
                setGoalTitle(text);
                if (errors.goalTitle) setErrors(prev => ({...prev, goalTitle: ''}));
              }}
              editable={!loading}
            />
            {errors.goalTitle && <Text style={styles.errorText}>{errors.goalTitle}</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Target ({selectedGoalType?.unit}) *</Text>
            <TextInput
              style={[styles.input, errors.targetValue && styles.inputError]}
              placeholder={`Enter target ${selectedGoalType?.unit}`}
              value={targetValue}
              onChangeText={(text) => {
                setTargetValue(text);
                if (errors.targetValue) setErrors(prev => ({...prev, targetValue: ''}));
              }}
              keyboardType="numeric"
              editable={!loading}
            />
            {errors.targetValue && <Text style={styles.errorText}>{errors.targetValue}</Text>}
          </View>

          {(goalType === 'subject_mastery' || goalType === 'concepts_mastery') && (
            <View style={styles.section}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mathematics"
                value={targetSubject}
                onChangeText={setTargetSubject}
                editable={!loading}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add more details about this goal..."
              value={goalDescription}
              onChangeText={setGoalDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Deadline (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={targetDeadline}
              onChangeText={setTargetDeadline}
              editable={!loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Remind Child</Text>
            <View style={styles.reminderOptions}>
              {['daily', 'weekly', 'none'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.reminderOption,
                    reminderFrequency === freq && styles.reminderOptionSelected,
                  ]}
                  onPress={() => setReminderFrequency(freq)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      reminderFrequency === freq && styles.reminderOptionTextSelected,
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Goal 🎯'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  goalTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalTypeCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  goalTypeCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  goalTypeEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  goalTypeLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  goalTypeLabelSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  reminderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  reminderOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  reminderOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  reminderOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  reminderOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default CreateGoalScreen;
