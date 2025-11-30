import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: number;
  concept: string;
}

interface Answer {
  selected: number | null;
  correct: number;
  isCorrect: boolean;
  timeSpent: number;
  skipped?: boolean;
}

interface ConceptPerformance {
  name: string;
  accuracy: number;
  total: number;
  correct: number;
  avgTime: number;
  priority: "high" | "medium" | "low";
}

interface GapAnalysis {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  skippedQuestions: number;
  strongConcepts: ConceptPerformance[];
  needsReview: ConceptPerformance[];
  criticalGaps: ConceptPerformance[];
  learningPath: ConceptPerformance[];
}

const getEncouragingMessage = (score: number) => {
  if (score >= 80) {
    return "Wow! You're doing great! 🌟 Let's make you even stronger in the areas where you can improve.";
  } else if (score >= 60) {
    return "Good work! 💪 You have a solid foundation. Let's build on it together.";
  } else if (score >= 40) {
    return "Great effort! 🎯 I can see where you need help. Don't worry - we'll bridge these gaps together!";
  } else {
    return "Thank you for being honest! 🤗 This shows me exactly where to start. We'll take it step by step, and you'll be amazed at your progress!";
  }
};

export default function AssessmentResultsScreen() {
  const params = useLocalSearchParams();
  const subjectId = params.subjectId as string;
  const subjectName = params.subjectName as string;
  const questionsData = params.questionsData as string;
  const answersData = params.answersData as string;

  const { authUser, refreshData } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);

  const saveAssessment = useCallback(async (
    analysis: GapAnalysis,
    questions: Question[],
    answers: Record<string, Answer>
  ) => {
    try {
      if (!authUser) {
        console.error("No authenticated user");
        return;
      }

      const userId = authUser.id;
      console.log("Saving assessment for user:", userId);

      const { data: subjectData } = await supabase
        .from("subject_progress")
        .select("id")
        .eq("user_id", userId)
        .eq("subject", subjectId)
        .single();

      if (!subjectData) {
        console.error("Subject progress not found");
        return;
      }

      const { error: updateError } = await supabase
        .from("subject_progress")
        .update({
          status: "lets_bridge_gaps",
          mastery_percentage: analysis.score,
          last_updated: new Date().toISOString(),
        })
        .eq("id", subjectData.id);

      if (updateError) {
        console.error("Update status error:", updateError);
      } else {
        console.log("Assessment saved successfully");
        await refreshData();
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  }, [authUser, subjectId, refreshData]);

  const analyzeResults = useCallback(async () => {
    try {
      const questions: Question[] = JSON.parse(questionsData);
      const answers: Record<string, Answer> = JSON.parse(answersData);

      console.log("Analyzing results for:", subjectName);
      console.log("Total questions:", questions.length);

      const totalQuestions = questions.length;
      const correctAnswers = Object.values(answers).filter(
        (a) => a.isCorrect
      ).length;
      const skippedQuestions = Object.values(answers).filter(
        (a) => a.skipped
      ).length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      console.log("Score:", score, "%");
      console.log("Correct:", correctAnswers);
      console.log("Skipped:", skippedQuestions);

      const conceptPerformance: Record<
        string,
        {
          total: number;
          correct: number;
          skipped: number;
          avgTime: number;
        }
      > = {};

      questions.forEach((q) => {
        const answer = answers[q.id];
        const concept = q.concept || "General";

        if (!conceptPerformance[concept]) {
          conceptPerformance[concept] = {
            total: 0,
            correct: 0,
            skipped: 0,
            avgTime: 0,
          };
        }

        conceptPerformance[concept].total++;
        if (answer.isCorrect) conceptPerformance[concept].correct++;
        if (answer.skipped) conceptPerformance[concept].skipped++;
        conceptPerformance[concept].avgTime += answer.timeSpent;
      });

      Object.keys(conceptPerformance).forEach((concept) => {
        const perf = conceptPerformance[concept];
        perf.avgTime = Math.round(perf.avgTime / perf.total);
      });

      const strongConcepts: ConceptPerformance[] = [];
      const needsReview: ConceptPerformance[] = [];
      const criticalGaps: ConceptPerformance[] = [];

      Object.entries(conceptPerformance).forEach(([concept, perf]) => {
        const accuracy = Math.round((perf.correct / perf.total) * 100);
        const category: ConceptPerformance = {
          name: concept,
          accuracy,
          total: perf.total,
          correct: perf.correct,
          avgTime: perf.avgTime,
          priority: "medium",
        };

        if (accuracy >= 80) {
          category.priority = "low";
          strongConcepts.push(category);
        } else if (accuracy >= 50) {
          category.priority = "medium";
          needsReview.push(category);
        } else {
          category.priority = "high";
          criticalGaps.push(category);
        }
      });

      const learningPath: ConceptPerformance[] = [
        ...criticalGaps,
        ...needsReview,
        ...strongConcepts,
      ];

      const analysis: GapAnalysis = {
        score,
        totalQuestions,
        correctAnswers,
        skippedQuestions,
        strongConcepts,
        needsReview,
        criticalGaps,
        learningPath,
      };

      setGapAnalysis(analysis);
      await saveAssessment(analysis, questions, answers);
      setLoading(false);
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("Error", "Failed to analyze results");
      setLoading(false);
    }
  }, [questionsData, answersData, subjectName, saveAssessment]);

  useEffect(() => {
    analyzeResults();
  }, [analyzeResults]);

  const handleStartLearning = () => {
    console.log("Starting learning journey");
    router.replace("/home");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#EEF2FF", Colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing your responses...</Text>
      </View>
    );
  }

  if (!gapAnalysis) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load results</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", Colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.mascotEmoji}>🦉</Text>
            <Text style={styles.headerTitle}>Assessment Complete!</Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Your Score</Text>
            <Text style={styles.scoreValue}>{gapAnalysis.score}%</Text>
            <Text style={styles.scoreSubtext}>
              {gapAnalysis.correctAnswers} out of {gapAnalysis.totalQuestions}{" "}
              correct
            </Text>
            {gapAnalysis.skippedQuestions > 0 && (
              <Text style={styles.skippedText}>
                ({gapAnalysis.skippedQuestions} skipped)
              </Text>
            )}
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {getEncouragingMessage(gapAnalysis.score)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What I Learned About You 📊</Text>

            {gapAnalysis.strongConcepts.length > 0 && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>✅ You&apos;re Strong In:</Text>
                {gapAnalysis.strongConcepts.map((concept, index) => (
                  <View key={index} style={styles.conceptCardGreen}>
                    <Text style={styles.conceptName}>{concept.name}</Text>
                    <Text style={styles.conceptAccuracy}>
                      {concept.accuracy}% accuracy
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {gapAnalysis.needsReview.length > 0 && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>📝 Let&apos;s Strengthen:</Text>
                {gapAnalysis.needsReview.map((concept, index) => (
                  <View key={index} style={styles.conceptCardOrange}>
                    <Text style={styles.conceptName}>{concept.name}</Text>
                    <Text style={styles.conceptAccuracy}>
                      {concept.accuracy}% accuracy
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {gapAnalysis.criticalGaps.length > 0 && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>🎯 We&apos;ll Focus On:</Text>
                {gapAnalysis.criticalGaps.map((concept, index) => (
                  <View key={index} style={styles.conceptCardRed}>
                    <Text style={styles.conceptName}>{concept.name}</Text>
                    <Text style={styles.conceptAccuracy}>
                      {concept.accuracy}% accuracy
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Learning Path 🛤️</Text>
            <Text style={styles.sectionSubtext}>
              I&apos;ve created a personalized plan for you:
            </Text>

            {gapAnalysis.learningPath.slice(0, 5).map((step, index) => (
              <View key={index} style={styles.pathStep}>
                <View style={styles.pathNumber}>
                  <Text style={styles.pathNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.pathContent}>
                  <Text style={styles.pathStepName}>{step.name}</Text>
                  <Text style={styles.pathStepPriority}>
                    Priority:{" "}
                    {step.priority === "high"
                      ? "🔥 High"
                      : step.priority === "medium"
                        ? "⚠️ Medium"
                        : "✅ Review"}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.startLearningButton,
                pressed && styles.startLearningButtonPressed,
              ]}
              onPress={handleStartLearning}
            >
              <Text style={styles.startLearningButtonText}>
                Let&apos;s Start Learning! 🚀
              </Text>
            </Pressable>
          </View>
        </ScrollView>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  mascotEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  scoreCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  scoreSubtext: {
    fontSize: 16,
    color: Colors.text,
  },
  skippedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  messageBox: {
    backgroundColor: `${Colors.accent}20`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  messageText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  sectionSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  conceptCardGreen: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conceptCardOrange: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conceptCardRed: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conceptName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  conceptAccuracy: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pathStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pathNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pathNumberText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
  },
  pathContent: {
    flex: 1,
  },
  pathStepName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  pathStepPriority: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    marginTop: 16,
  },
  startLearningButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startLearningButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  startLearningButtonText: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
  },
});
