import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import {
  getTopicCompleteData,
  startTopic,
  trackTopicTime,
  type CompleteTopicData,
  type TopicContent as TopicContentType,
  type TopicConcept,
  type TopicExample,
} from '@/services/topicContentService';



type TabType = 'theory' | 'formulas' | 'examples';

export default function TopicDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    topicId: string;
    topicTitle?: string;
  }>();
  const { topicId } = params;
  const { authUser } = useUser();

  const [loading, setLoading] = useState<boolean>(true);
  const [topicData, setTopicData] = useState<CompleteTopicData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('theory');
  const [startTime] = useState<number>(Date.now());

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (authUser?.id && topicId) {
      loadTopicData();
    }

    return () => {
      if (startTime && authUser?.id && topicId) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        if (timeSpent > 0) {
          trackTopicTime(authUser.id, topicId, timeSpent);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTopicData = async () => {
    if (!authUser?.id) return;

    try {
      await startTopic(authUser.id, topicId);

      const result = await getTopicCompleteData(topicId, authUser.id);

      if (result.success && result.data) {
        setTopicData(result.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Load topic error:', error);
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return Colors.textSecondary;
    }
  };

  const getDifficultyEmoji = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return '😊';
      case 'medium':
        return '🤔';
      case 'hard':
        return '💪';
      default:
        return '📚';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EEF2FF', '#FFFFFF']} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading topic...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!topicData?.topic) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EEF2FF', '#FFFFFF']} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>📚 Topic not found</Text>
          <Text style={styles.errorSubtext}>This topic content is not yet available.</Text>
          <Pressable
            style={({ pressed }) => [styles.backButtonAlt, pressed && styles.backButtonPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonTextAlt}>← Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const { topic, content, concepts, formulas, examples } = topicData;
  const subjectEmoji = topic.chapter?.book?.subject?.subject_emoji || '📚';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EEF2FF', '#FFFFFF']} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerEmoji}>{subjectEmoji}</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {topic.topic_title}
              </Text>
              <Text style={styles.headerSubtitle}>{topic.chapter?.chapter_title}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor('medium') + '20' },
              ]}
            >
              <Text style={[styles.difficultyText, { color: getDifficultyColor('medium') }]}>
                {getDifficultyEmoji('medium')} Intermediate
              </Text>
            </View>
            {topic.estimated_duration_minutes && (
              <View style={styles.durationContainer}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.durationText}>{topic.estimated_duration_minutes} min</Text>
              </View>
            )}
          </View>
          {topic.topic_description && (
            <Text style={styles.description}>{topic.topic_description}</Text>
          )}
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'theory' && styles.activeTab,
              pressed && styles.tabPressed,
            ]}
            onPress={() => setActiveTab('theory')}
          >
            <BookOpen size={16} color={activeTab === 'theory' ? Colors.primary : Colors.textSecondary} />
            <Text
              style={[styles.tabText, activeTab === 'theory' && styles.activeTabText]}
            >
              Theory
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'formulas' && styles.activeTab,
              pressed && styles.tabPressed,
            ]}
            onPress={() => setActiveTab('formulas')}
          >
            <Text style={styles.tabIcon}>📐</Text>
            <Text
              style={[styles.tabText, activeTab === 'formulas' && styles.activeTabText]}
            >
              Formulas
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'examples' && styles.activeTab,
              pressed && styles.tabPressed,
            ]}
            onPress={() => setActiveTab('examples')}
          >
            <Text style={styles.tabIcon}>💡</Text>
            <Text
              style={[styles.tabText, activeTab === 'examples' && styles.activeTabText]}
            >
              Examples
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'theory' && <TheoryTab content={content} concepts={concepts} />}
          {activeTab === 'formulas' && <FormulasTab formulas={formulas} concepts={concepts} />}
          {activeTab === 'examples' && <ExamplesTab examples={examples} />}
        </ScrollView>

        <View style={styles.bottomActions}>
          <Pressable
            style={({ pressed }) => [styles.practiceButton, pressed && styles.buttonPressed]}
            onPress={() => {
              console.log('Practice questions');
            }}
          >
            <Text style={styles.practiceButtonText}>📝 Practice Questions</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.askButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/ai-tutor')}
          >
            <Text style={styles.askButtonText}>🤖 Ask Buddy</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

interface TheoryTabProps {
  content: TopicContentType[];
  concepts: TopicConcept[];
}

function TheoryTab({ content, concepts }: TheoryTabProps) {
  if (!content || content.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>📖</Text>
        <Text style={styles.emptyStateText}>No theory content available</Text>
      </View>
    );
  }

  return (
    <View>
      {content.map((item, index) => (
        <View
          key={item.id || index}
          style={[styles.contentBlock, item.is_important && styles.importantBlock]}
        >
          {item.title && (
            <Text style={styles.contentTitle}>
              {item.is_important && '⭐ '}
              {item.title}
            </Text>
          )}
          <Text style={styles.contentText}>{item.content_text}</Text>
          {item.is_exam_critical && (
            <View style={styles.examBadge}>
              <Text style={styles.examBadgeText}>🎯 Exam Important</Text>
            </View>
          )}
        </View>
      ))}

      {concepts && concepts.length > 0 && (
        <View style={styles.conceptsSection}>
          <Text style={styles.sectionTitle}>📚 Key Concepts</Text>
          {concepts.map((concept, index) => (
            <View key={concept.id || index} style={styles.conceptCard}>
              <Text style={styles.conceptName}>{concept.concept_name}</Text>
              {concept.explanation && (
                <Text style={styles.conceptExplanation}>{concept.explanation}</Text>
              )}
              {concept.key_points && concept.key_points.length > 0 && (
                <View style={styles.keyPointsContainer}>
                  <Text style={styles.keyPointsTitle}>Key Points:</Text>
                  {concept.key_points.map((point, i) => (
                    <Text key={i} style={styles.keyPoint}>
                      • {point}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface FormulasTabProps {
  formulas: {

    id: string;
    formula_title: string;
    formula_text: string;
    formula_latex?: string;
    when_to_use?: string;
  }[];
  concepts: TopicConcept[];
}

function FormulasTab({ formulas, concepts }: FormulasTabProps) {
  const allFormulas = [...formulas];

  if (concepts && concepts.length > 0) {
    concepts.forEach((concept) => {
      if (concept.formula) {
        allFormulas.push({
          id: concept.id,
          formula_title: concept.concept_name,
          formula_text: concept.formula,
          formula_latex: concept.formula_latex,
          when_to_use: concept.concept_description,
        });
      }
    });
  }

  if (allFormulas.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>📐</Text>
        <Text style={styles.emptyStateText}>No formulas available</Text>
      </View>
    );
  }

  return (
    <View>
      {allFormulas.map((formula, index) => (
        <View key={formula.id || index} style={styles.formulaCard}>
          <Text style={styles.formulaName}>{formula.formula_title}</Text>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>{formula.formula_text}</Text>
          </View>
          {formula.when_to_use && (
            <View style={styles.formulaInfo}>
              <Text style={styles.formulaInfoLabel}>When to use:</Text>
              <Text style={styles.formulaInfoText}>{formula.when_to_use}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

interface ExamplesTabProps {
  examples: TopicExample[];
}

function ExamplesTab({ examples }: ExamplesTabProps) {
  if (!examples || examples.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>💡</Text>
        <Text style={styles.emptyStateText}>No examples available</Text>
      </View>
    );
  }

  return (
    <View>
      {examples.map((example, index) => (
        <View key={example.id || index} style={styles.exampleCard}>
          <View style={styles.exampleHeader}>
            <Text style={styles.exampleNumber}>Example {example.example_number}</Text>
            <View
              style={[
                styles.exampleTypeBadge,
                {
                  backgroundColor:
                    example.difficulty_level === 'hard' ? '#FEE2E2' : '#DBEAFE',
                },
              ]}
            >
              <Text
                style={[
                  styles.exampleTypeText,
                  {
                    color: example.difficulty_level === 'hard' ? '#DC2626' : '#2563EB',
                  },
                ]}
              >
                {example.example_type}
              </Text>
            </View>
          </View>

          <View style={styles.problemBox}>
            <Text style={styles.problemLabel}>Problem:</Text>
            <Text style={styles.problemText}>{example.problem_statement}</Text>
          </View>

          <View style={styles.solutionBox}>
            <Text style={styles.solutionLabel}>Solution:</Text>
            {example.solution_steps &&
              example.solution_steps.map((step, i) => (
                <View key={i} style={styles.solutionStep}>
                  <Text style={styles.stepNumber}>{i + 1}.</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            <View style={styles.answerBox}>
              <Text style={styles.answerLabel}>Answer:</Text>
              <Text style={styles.answerText}>{example.final_answer}</Text>
            </View>
          </View>

          {example.tips && example.tips.length > 0 && (
            <View style={styles.tipsBox}>
              <Text style={styles.tipsLabel}>💡 Tips:</Text>
              {example.tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonAlt: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  backButtonTextAlt: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  headerEmoji: {
    fontSize: 36,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabPressed: {
    opacity: 0.6,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  contentBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importantBlock: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  examBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examBadgeText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600' as const,
  },
  conceptsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  conceptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conceptName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  conceptExplanation: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  keyPointsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
  },
  keyPointsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  keyPoint: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  formulaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formulaName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  formulaBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  formulaText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  formulaInfo: {
    marginTop: 8,
  },
  formulaInfoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  formulaInfoText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  exampleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exampleNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  exampleTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  exampleTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  problemBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  problemLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#92400E',
    marginBottom: 6,
  },
  problemText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  solutionBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  solutionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  solutionStep: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  answerBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#065F46',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#047857',
  },
  tipsBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
  },
  tipsLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#3730A3',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
    marginBottom: 4,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  practiceButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  practiceButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  askButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  askButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});
