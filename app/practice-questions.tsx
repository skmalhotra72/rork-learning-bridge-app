import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,

  Alert,
  TextInput,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useUser } from '@/contexts/UserContext'
import {
  getPracticeQuestions,
  startPracticeSession,
  submitQuestionAttempt,
  completePracticeSession,
} from '@/services/practiceService'



interface Question {
  id: string
  question_text: string
  question_type: string
  difficulty_level: string
  options?: string[]
  correct_answer?: string
  explanation?: string
}

interface QuestionResult {
  is_correct: boolean
  correct_answer: string
  explanation?: string
  xp_earned?: number
}

export default function PracticeQuestionsScreen() {
  const { topicId, topicTitle } = useLocalSearchParams<{
    topicId: string
    topicTitle: string
  }>()
  const { authUser } = useUser()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<QuestionResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (authUser?.id && topicId) {
      loadPractice()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, topicId])

  const loadPractice = async () => {
    try {
      if (!authUser?.id || !topicId) return

      console.log('Loading practice for topic:', topicId)

      // Start session
      const sessionResult = await startPracticeSession(authUser.id, topicId as string, 10)
      if (sessionResult.success && sessionResult.sessionId) {
        setSessionId(sessionResult.sessionId)
      }

      // Get questions
      const questionsResult = await getPracticeQuestions(topicId as string, authUser.id, {
        limit: 10,
      })

      if (questionsResult.success && questionsResult.questions.length > 0) {
        setQuestions(questionsResult.questions)
        setQuestionStartTime(Date.now())
      } else {
        Alert.alert('No Questions', 'No practice questions available for this topic.')
        router.back()
      }

      setLoading(false)
    } catch (error) {
      console.error('Load practice error:', error)
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer && !textAnswer.trim()) {
      Alert.alert('Select Answer', 'Please select or enter an answer before submitting.')
      return
    }

    if (!authUser?.id || !questionStartTime) return

    const currentQuestion = questions[currentQuestionIndex]
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)

    // Submit attempt
    const submitResult = await submitQuestionAttempt(
      authUser.id,
      currentQuestion.id,
      {
        option: selectedAnswer,
        text: textAnswer,
      },
      timeTaken,
      sessionId
    )

    if (submitResult.success && submitResult.result) {
      setResult(submitResult.result)
      setShowResult(true)

      // Update score
      if (submitResult.result.is_correct) {
        setScore((prev) => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }))
      } else {
        setScore((prev) => ({ ...prev, total: prev.total + 1 }))
      }
    }
  }

  const handleNextQuestion = () => {
    setShowResult(false)
    setResult(null)
    setSelectedAnswer(null)
    setTextAnswer('')

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    } else {
      // Finish practice
      finishPractice()
    }
  }

  const finishPractice = async () => {
    if (sessionId) {
      const completeResult = await completePracticeSession(sessionId)

      if (completeResult.success && completeResult.summary) {
        router.replace({
          pathname: '/practice-results',
          params: {
            summary: JSON.stringify(completeResult.summary),
            topicTitle: topicTitle || 'Practice',
          },
        })
      }
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </SafeAreaView>
    )
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No questions available</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {topicTitle || 'Practice'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {score.correct}/{score.total}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Question Content */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
        {/* Difficulty Badge */}
        <View style={styles.difficultyContainer}>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  currentQuestion.difficulty_level === 'easy'
                    ? '#D1FAE5'
                    : currentQuestion.difficulty_level === 'medium'
                    ? '#FEF3C7'
                    : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                {
                  color:
                    currentQuestion.difficulty_level === 'easy'
                      ? '#065F46'
                      : currentQuestion.difficulty_level === 'medium'
                      ? '#92400E'
                      : '#991B1B',
                },
              ]}
            >
              {currentQuestion.difficulty_level === 'easy'
                ? '😊 Easy'
                : currentQuestion.difficulty_level === 'medium'
                ? '🤔 Medium'
                : '💪 Hard'}
            </Text>
          </View>
        </View>

        {/* Question Text */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question:</Text>
          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>
        </View>

        {/* Answer Options */}
        {!showResult && (
          <View style={styles.optionsContainer}>
            {currentQuestion.question_type === 'mcq' && currentQuestion.options ? (
              // Multiple Choice Options
              currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedAnswer(option)}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionRadio,
                        selectedAnswer === option && styles.optionRadioSelected,
                      ]}
                    >
                      {selectedAnswer === option && <View style={styles.optionRadioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        selectedAnswer === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              // Text Input for Short Answer
              <View style={styles.textAnswerContainer}>
                <Text style={styles.textAnswerLabel}>Your Answer:</Text>
                <TextInput
                  style={styles.textAnswerInput}
                  value={textAnswer}
                  onChangeText={setTextAnswer}
                  placeholder="Type your answer here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>
        )}

        {/* Result Display */}
        {showResult && result && (
          <View style={styles.resultContainer}>
            <View
              style={[
                styles.resultCard,
                { backgroundColor: result.is_correct ? '#D1FAE5' : '#FEE2E2' },
              ]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultEmoji}>{result.is_correct ? '✅' : '❌'}</Text>
                <Text
                  style={[
                    styles.resultTitle,
                    { color: result.is_correct ? '#065F46' : '#991B1B' },
                  ]}
                >
                  {result.is_correct ? 'Correct!' : 'Incorrect'}
                </Text>
              </View>

              {!result.is_correct && (
                <View style={styles.correctAnswerBox}>
                  <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
                  <Text style={styles.correctAnswerText}>{result.correct_answer}</Text>
                </View>
              )}

              {result.explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>💡 Explanation:</Text>
                  <Text style={styles.explanationText}>{result.explanation}</Text>
                </View>
              )}

              {result.xp_earned && result.xp_earned > 0 && (
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>+{result.xp_earned} XP</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {!showResult ? (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAnswer}>
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'Finish 🎉'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIcon: {
    fontSize: 28,
    color: '#4F46E5',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  scoreContainer: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  difficultyContainer: {
    marginBottom: 16,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#4F46E5',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  textAnswerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textAnswerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
  },
  textAnswerInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
  },
  resultContainer: {
    marginBottom: 24,
  },
  resultCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  correctAnswerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  correctAnswerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 6,
  },
  correctAnswerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C2D12',
  },
  explanationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    padding: 12,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  xpBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
})
