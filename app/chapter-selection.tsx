import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { getBook, getChapters } from "@/services/contentLibrary";
import type { CBSEBook, CBSEChapter } from "@/services/contentLibrary";
import { bulkInitializeChapters, saveInitialAssessment } from "@/services/studentProgress";
import type { ChapterProgressData } from "@/services/studentProgress";

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { authUser } = useUser();

  const selectedGrade = params.selectedGrade as string;
  
  const selectedSubjectsParam = params.selectedSubjects as string;
  const selectedSubjects = selectedSubjectsParam ? JSON.parse(selectedSubjectsParam) : [];

  const [currentSubjectIndex, setCurrentSubjectIndex] = useState<number>(0);
  const [book, setBook] = useState<CBSEBook | null>(null);
  const [chapters, setChapters] = useState<CBSEChapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, boolean>>({});
  const [difficultChapters, setDifficultChapters] = useState<Record<string, boolean>>({});
  const [overallConfidence, setOverallConfidence] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const currentSubject = selectedSubjects[currentSubjectIndex];

  useEffect(() => {
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSubjectIndex]);

  const loadChapters = async () => {
    try {
      setLoading(true);

      if (!currentSubject) {
        console.error('No current subject');
        setLoading(false);
        return;
      }

      const bookData = await getBook(parseInt(selectedGrade), currentSubject.subject_code);
      if (!bookData) {
        Alert.alert('Error', 'Could not load curriculum');
        setLoading(false);
        return;
      }
      setBook(bookData);

      const chaptersData = await getChapters(bookData.id);
      setChapters(chaptersData);

      setSelectedChapters({});
      setDifficultChapters({});
      setOverallConfidence(5);

      setLoading(false);

    } catch (error) {
      console.error('Load chapters error:', error);
      Alert.alert('Error', 'Failed to load chapters');
      setLoading(false);
    }
  };

  const toggleChapterCompleted = (chapterId: string) => {
    setSelectedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const toggleChapterDifficult = (chapterId: string) => {
    setDifficultChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleNext = async () => {
    if (!authUser?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSaving(true);

      const chapterData: ChapterProgressData[] = chapters.map(chapter => ({
        chapterId: chapter.id,
        completed: selectedChapters[chapter.id] || false,
        difficult: difficultChapters[chapter.id] || false,
        confidence: overallConfidence
      }));

      await bulkInitializeChapters(authUser.id, chapterData);

      const completedChapterNumbers = chapters
        .filter(c => selectedChapters[c.id])
        .map(c => c.chapter_number);

      const difficultChapterNumbers = chapters
        .filter(c => difficultChapters[c.id])
        .map(c => c.chapter_number);

      await saveInitialAssessment(authUser.id, currentSubject.id, {
        completedChapters: completedChapterNumbers,
        difficultChapters: difficultChapterNumbers,
        confidence: overallConfidence,
        learningGoals: [],
        studyPace: 'medium'
      });

      setSaving(false);

      if (currentSubjectIndex < selectedSubjects.length - 1) {
        setCurrentSubjectIndex(currentSubjectIndex + 1);
      } else {
        router.replace("/home");
      }

    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save progress');
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentSubjectIndex < selectedSubjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
    } else {
      router.replace("/home");
    }
  };

  const completedCount = Object.values(selectedChapters).filter(Boolean).length;
  const difficultCount = Object.values(difficultChapters).filter(Boolean).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading chapters...</Text>
      </View>
    );
  }

  if (!book || !currentSubject) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load content</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.progress}>
            Subject {currentSubjectIndex + 1} of {selectedSubjects.length}
          </Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipButton}>Skip →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.emoji}>{currentSubject.icon_emoji}</Text>
          <Text style={styles.title}>{currentSubject.subject_name}</Text>
          <Text style={styles.subtitle}>
            Mark chapters you&apos;ve already studied
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completed:</Text>
            <Text style={styles.summaryValue}>{completedCount} / {chapters.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Found Difficult:</Text>
            <Text style={styles.summaryValue}>{difficultCount}</Text>
          </View>
        </View>

        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceLabel}>
            Overall Confidence in {currentSubject.subject_name}:
          </Text>
          <View style={styles.confidenceDisplay}>
            <Text style={styles.confidenceValue}>{overallConfidence}/10</Text>
            <Text style={styles.confidenceEmoji}>
              {overallConfidence <= 3 ? '😰' : 
               overallConfidence <= 6 ? '😐' : 
               overallConfidence <= 8 ? '🙂' : '😊'}
            </Text>
          </View>
          <View style={styles.confidenceSlider}>
            {[1,2,3,4,5,6,7,8,9,10].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.confidenceButton,
                  overallConfidence >= level && styles.confidenceButtonActive
                ]}
                onPress={() => setOverallConfidence(level)}
              >
                <Text style={[
                  styles.confidenceButtonText,
                  overallConfidence >= level && styles.confidenceButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView style={styles.chaptersContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.instructionText}>
            ✓ = Completed • ⚠️ = Found Difficult
          </Text>

          {chapters.map((chapter) => (
            <View key={chapter.id} style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <View style={styles.chapterNumberBadge}>
                  <Text style={styles.chapterNumber}>{chapter.chapter_number}</Text>
                </View>
                <Text style={styles.chapterTitle} numberOfLines={2}>
                  {chapter.chapter_title}
                </Text>
              </View>

              <View style={styles.chapterActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedChapters[chapter.id] && styles.actionButtonCompleted
                  ]}
                  onPress={() => toggleChapterCompleted(chapter.id)}
                >
                  <Text style={styles.actionButtonText}>
                    {selectedChapters[chapter.id] ? '✓ Completed' : 'Not Yet'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.actionButtonDifficult,
                    difficultChapters[chapter.id] && styles.actionButtonDifficultActive
                  ]}
                  onPress={() => toggleChapterDifficult(chapter.id)}
                >
                  <Text style={styles.actionButtonText}>
                    {difficultChapters[chapter.id] ? '⚠️ Difficult' : 'Mark Hard'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomButton}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              saving && styles.nextButtonDisabled,
              pressed && styles.nextButtonPressed
            ]}
            onPress={handleNext}
            disabled={saving}
          >
            <LinearGradient
              colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.nextButtonText}>
                {saving ? 'Saving...' : 
                 currentSubjectIndex < selectedSubjects.length - 1 ? 'Next Subject →' : 
                 'Complete Setup 🎉'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginBottom: 16,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progress: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  skipButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  confidenceSection: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  confidenceDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  confidenceValue: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  confidenceEmoji: {
    fontSize: 32,
  },
  confidenceSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  confidenceButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  confidenceButtonActive: {
    backgroundColor: Colors.primary,
  },
  confidenceButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  confidenceButtonTextActive: {
    color: '#FFFFFF',
  },
  chaptersContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chapterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionButtonCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  actionButtonDifficult: {
    backgroundColor: Colors.border,
  },
  actionButtonDifficultActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bottomButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
