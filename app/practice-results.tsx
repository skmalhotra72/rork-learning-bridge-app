import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

interface Summary {
  score_percentage: number
  questions_correct: number
  total_questions: number
  time_spent_seconds: number
}

export default function PracticeResultsScreen() {
  const params = useLocalSearchParams<{
    summary: string
    topicTitle: string
  }>()
  const router = useRouter()

  const summary: Summary = params.summary ? JSON.parse(params.summary as string) : null
  const topicTitle = params.topicTitle || 'Practice'

  const scorePercentage = summary?.score_percentage || 0
  const questionsCorrect = summary?.questions_correct || 0
  const totalQuestions = summary?.total_questions || 0
  const timeSpent = summary?.time_spent_seconds || 0

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', emoji: '🏆', color: '#10B981' }
    if (percentage >= 80) return { grade: 'A', emoji: '⭐', color: '#10B981' }
    if (percentage >= 70) return { grade: 'B', emoji: '👍', color: '#3B82F6' }
    if (percentage >= 60) return { grade: 'C', emoji: '👌', color: '#F59E0B' }
    if (percentage >= 50) return { grade: 'D', emoji: '💪', color: '#F59E0B' }
    return { grade: 'F', emoji: '📚', color: '#EF4444' }
  }

  const gradeInfo = getGrade(scorePercentage)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🎉</Text>
          <Text style={styles.headerTitle}>Practice Complete!</Text>
          <Text style={styles.headerSubtitle}>{topicTitle}</Text>
        </View>

        {/* Score Card */}
        <View style={[styles.scoreCard, { borderColor: gradeInfo.color }]}>
          <Text style={styles.scoreEmoji}>{gradeInfo.emoji}</Text>
          <Text style={styles.scorePercentage}>{Math.round(scorePercentage)}%</Text>
          <Text style={[styles.scoreGrade, { color: gradeInfo.color }]}>
            Grade: {gradeInfo.grade}
          </Text>
          <Text style={styles.scoreDetails}>
            {questionsCorrect} out of {totalQuestions} correct
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{questionsCorrect}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>❌</Text>
            <Text style={styles.statValue}>{totalQuestions - questionsCorrect}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statValue}>{formatTime(timeSpent)}</Text>
            <Text style={styles.statLabel}>Time Taken</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>
              {totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0}s
            </Text>
            <Text style={styles.statLabel}>Avg. Time</Text>
          </View>
        </View>

        {/* Performance Message */}
        <View style={styles.messageCard}>
          {scorePercentage >= 80 ? (
            <>
              <Text style={styles.messageTitle}>🌟 Excellent Work!</Text>
              <Text style={styles.messageText}>
                You&apos;ve demonstrated strong understanding of this topic. Keep up the great work!
              </Text>
            </>
          ) : scorePercentage >= 60 ? (
            <>
              <Text style={styles.messageTitle}>👍 Good Job!</Text>
              <Text style={styles.messageText}>
                You&apos;re making good progress. Review the questions you missed and try again to
                improve.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.messageTitle}>💪 Keep Practicing!</Text>
              <Text style={styles.messageText}>
                Don&apos;t worry! Practice makes perfect. Review the theory and try again. You&apos;ve got
                this!
              </Text>
            </>
          )}
        </View>

        {/* XP Earned */}
        <View style={styles.xpCard}>
          <Text style={styles.xpEmoji}>⚡</Text>
          <Text style={styles.xpText}>
            You earned <Text style={styles.xpValue}>{questionsCorrect * 10} XP</Text>!
          </Text>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>📚 What&apos;s Next?</Text>

          {scorePercentage < 80 && (
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationEmoji}>🔄</Text>
              <Text style={styles.recommendationText}>
                Try this practice again to improve your score
              </Text>
            </View>
          )}

          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationEmoji}>📖</Text>
            <Text style={styles.recommendationText}>
              Review the theory and examples for this topic
            </Text>
          </View>

          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationEmoji}>🤖</Text>
            <Text style={styles.recommendationText}>
              Ask Buddy for help on questions you found difficult
            </Text>
          </View>

          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationEmoji}>➡️</Text>
            <Text style={styles.recommendationText}>
              Move on to the next topic when you&apos;re ready
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/home')}>
          <Text style={styles.secondaryButtonText}>🏠 Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>🔄 Practice Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  scorePercentage: {
    fontSize: 56,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 8,
  },
  scoreGrade: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  messageCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E40AF',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#3730A3',
    lineHeight: 22,
  },
  xpCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  xpEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  xpText: {
    fontSize: 16,
    color: '#78350F',
  },
  xpValue: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#92400E',
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  recommendationEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
})
