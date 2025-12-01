import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Target, Calendar, Bell } from 'lucide-react-native';

import { useUser } from '@/contexts/UserContext';
import { createParentGoal } from '@/services/parentPortal';

interface GoalType {
  value: string;
  label: string;
  emoji: string;
  unit: string;
  description: string;
}

const goalTypes: GoalType[] = [
  {
    value: 'xp_target',
    label: 'Earn XP Points',
    emoji: '⭐',
    unit: 'XP',
    description: 'Set a target XP to earn',
  },
  {
    value: 'concepts_mastery',
    label: 'Master Concepts',
    emoji: '🎓',
    unit: 'concepts',
    description: 'Number of concepts to master',
  },
  {
    value: 'streak_days',
    label: 'Maintain Streak',
    emoji: '🔥',
    unit: 'days',
    description: 'Daily learning streak',
  },
  {
    value: 'quiz_completion',
    label: 'Complete Quizzes',
    emoji: '📝',
    unit: 'quizzes',
    description: 'Number of quizzes to complete',
  },
  {
    value: 'study_time',
    label: 'Study Time',
    emoji: '⏰',
    unit: 'minutes',
    description: 'Total study time',
  },
];

const reminderFrequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'none', label: 'None' },
];

export default function CreateGoalScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { authUser } = useUser();

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalType, setGoalType] = useState('xp_target');
  const [targetValue, setTargetValue] = useState('');
  const [targetSubject, setTargetSubject] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [reminderFrequency, setReminderFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);

  const selectedGoalType = goalTypes.find((gt) => gt.value === goalType);

  const validateInputs = () => {
    if (!goalTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a goal title');
      return false;
    }

    if (!goalDescription.trim()) {
      Alert.alert('Missing Description', 'Please enter a goal description');
      return false;
    }

    if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target value');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    if (!authUser?.id || !childId) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    setLoading(true);

    try {
      const result = await createParentGoal(authUser.id, childId, {
        goalTitle: goalTitle.trim(),
        goalDescription: goalDescription.trim(),
        goalType,
        targetValue: Number(targetValue),
        targetSubject: targetSubject.trim() || undefined,
        targetDeadline: targetDeadline || undefined,
        reminderFrequency,
      });

      if (result.success) {
        Alert.alert('Goal Created! 🎯', 'Your child can now see this goal in their profile', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create goal. Please try again.');
      }
    } catch (error) {
      console.error('Create goal error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Learning Goal</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Target size={48} color="#4F46E5" />
            </View>
            <Text style={styles.subtitle}>
              Set a learning goal to motivate your child and track their progress
            </Text>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Goal Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Master Physics Fundamentals"
                value={goalTitle}
                onChangeText={setGoalTitle}
                editable={!loading}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the goal and why it's important..."
                value={goalDescription}
                onChangeText={setGoalDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Goal Type *</Text>
              <View style={styles.goalTypeGrid}>
                {goalTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeCard,
                      goalType === type.value && styles.goalTypeCardSelected,
                    ]}
                    onPress={() => setGoalType(type.value)}
                    disabled={loading}
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
                    <Text style={styles.goalTypeDescription}>{type.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>
                Target Value * ({selectedGoalType?.unit})
              </Text>
              <TextInput
                style={styles.input}
                placeholder={`e.g., 500 ${selectedGoalType?.unit}`}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Subject (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Physics, Mathematics"
                value={targetSubject}
                onChangeText={setTargetSubject}
                editable={!loading}
              />
              <Text style={styles.hint}>Leave empty for all subjects</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.labelRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.label}>Deadline (Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g., 2025-12-31)"
                value={targetDeadline}
                onChangeText={setTargetDeadline}
                editable={!loading}
              />
              <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.labelRow}>
                <Bell size={16} color="#6B7280" />
                <Text style={styles.label}>Reminder Frequency</Text>
              </View>
              <View style={styles.frequencyRow}>
                {reminderFrequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyButton,
                      reminderFrequency === freq.value && styles.frequencyButtonSelected,
                    ]}
                    onPress={() => setReminderFrequency(freq.value)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        reminderFrequency === freq.value && styles.frequencyButtonTextSelected,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Goal Preview</Text>
              <View style={styles.previewContent}>
                <Text style={styles.previewEmoji}>{selectedGoalType?.emoji}</Text>
                <Text style={styles.previewGoalTitle}>
                  {goalTitle || 'Goal title will appear here'}
                </Text>
                <Text style={styles.previewDescription}>
                  {goalDescription || 'Goal description will appear here'}
                </Text>
                {targetValue && (
                  <View style={styles.previewTarget}>
                    <Text style={styles.previewTargetText}>
                      Target: {targetValue} {selectedGoalType?.unit}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Goal...' : 'Create Goal 🎯'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    minHeight: 100,
    paddingTop: 16,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  goalTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalTypeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  goalTypeCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  goalTypeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalTypeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  goalTypeLabelSelected: {
    color: '#4F46E5',
  },
  goalTypeDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  frequencyButtonTextSelected: {
    color: '#FFFFFF',
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewContent: {
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  previewGoalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  previewTarget: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewTargetText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4F46E5',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
});
