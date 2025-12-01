import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useUser } from '@/contexts/UserContext';
import { getSubjectDetail } from '@/services/dashboardService';
import Colors from '@/constants/colors';

interface ChapterProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  is_completed: boolean;
  is_difficult: boolean;
  confidence_level: number;
  study_time_minutes?: number;
  last_studied?: string | null;
  mastery_score?: number;
  status?: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  chapter_title: string;
  difficulty_level?: string;
  progress?: ChapterProgress | null;
}

export default function SubjectDetailScreen() {
  const { subjectCode, gradeNumber } = useLocalSearchParams<{
    subjectCode: string;
    gradeNumber: string;
  }>();
  const { authUser } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjectDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSubjectDetail = async () => {
    try {
      if (!authUser) {
        console.error('No authenticated user');
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      const gradeNum = parseInt(gradeNumber || '10', 10);
      console.log('Loading subject detail:', { subjectCode, gradeNumber: gradeNum });

      setError(null);
      const data = await getSubjectDetail(authUser.id, subjectCode || '', gradeNum);
      
      console.log('Subject detail loaded:', data);
      
      if (!data.success) {
        const errorMsg = typeof data.error === 'string' ? data.error : 'Failed to load subject details';
        setError(errorMsg);
        console.error('Subject detail error:', errorMsg);
      } else {
        setBook(data.book);
        setChapters(data.chapters);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Load subject detail error:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'mastered':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusText = (status?: string): string => {
    switch (status) {
      case 'mastered':
        return 'Mastered';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getProgressStatus = (progress?: ChapterProgress | null): string => {
    if (!progress) return 'not_started';
    if (progress.is_completed && (progress.confidence_level || 0) >= 80) {
      return 'mastered';
    }
    if (progress.is_completed) return 'completed';
    if ((progress.study_time_minutes || 0) > 0 || progress.last_studied) return 'in_progress';
    return 'not_started';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading chapters...</Text>
      </SafeAreaView>
    );
  }

  if (error || !book) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorEmoji}>😟</Text>
        <Text style={styles.errorText}>{error || 'Subject not found'}</Text>
        <Text style={styles.errorHint}>Please check your network connection and try again.</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={loadSubjectDetail}
        >
          <Text style={styles.retryButtonText}>🔄 Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => {
    const status = getProgressStatus(c.progress);
    return status === 'completed' || status === 'mastered';
  }).length;
  const progressPercentage =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>
            {book.subject?.icon_emoji || '📚'}
          </Text>
          <View>
            <Text style={styles.headerTitle}>
              {book.subject?.subject_name || 'Subject'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {book.grade?.display_name || 'Class'}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Your Progress</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
        </View>
        <Text style={styles.progressText}>
          {completedChapters} of {totalChapters} chapters completed
        </Text>
      </View>

      {/* Chapters List */}
      <ScrollView style={styles.chaptersContainer}>
        <Text style={styles.chaptersTitle}>Chapters</Text>

        {chapters.map((chapter) => {
          const progress = chapter.progress;
          const status = getProgressStatus(progress);
          const masteryScore = progress?.mastery_score;

          return (
            <TouchableOpacity
              key={chapter.id}
              style={styles.chapterCard}
              onPress={() => {
                console.log('Chapter pressed:', chapter.chapter_title);
              }}
            >
              <View style={styles.chapterRow}>
                <View
                  style={[
                    styles.chapterNumber,
                    { backgroundColor: getStatusColor(status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.chapterNumberText,
                      { color: getStatusColor(status) },
                    ]}
                  >
                    {chapter.chapter_number}
                  </Text>
                </View>

                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>
                    {chapter.chapter_title}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {getStatusText(status)}
                    </Text>
                  </View>

                  {masteryScore != null && (
                    <Text style={styles.masteryText}>
                      Mastery: {masteryScore}%
                    </Text>
                  )}

                  {progress && (progress.study_time_minutes || 0) > 0 && (
                    <Text style={styles.studyTimeText}>
                      ⏱️ {Math.round(progress.study_time_minutes || 0)} min studied
                    </Text>
                  )}
                </View>

                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {chapters.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📚</Text>
            <Text style={styles.emptyStateText}>No chapters available yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  backButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIcon: {
    fontSize: 28,
    color: Colors.primary,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressCard: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    minWidth: 45,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chaptersContainer: {
    flex: 1,
    padding: 16,
  },
  chaptersTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  chapterCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  masteryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  studyTimeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
