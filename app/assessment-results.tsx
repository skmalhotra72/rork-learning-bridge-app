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
import { addXP, updateStreak, checkBadgeEligibility } from "@/services/gamification";

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
  const subjectProgressId = params.subjectProgressId as string;
  const subjectName = params.subjectName as string;
  const questionsData = params.questionsData as string;
  const answersData = params.answersData as string;

  console.log("=== ASSESSMENT RESULTS ===");
  console.log("Subject Progress ID:", subjectProgressId);
  console.log("Subject Name:", subjectName);

  const { authUser, refreshData } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [gamificationData, setGamificationData] = useState<{
    xpEarned: number;
    leveledUp: boolean;
    newLevel?: number;
    streakDay: number;
    badgeEarned?: string;
  } | null>(null);

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
      console.log("=== SAVING ASSESSMENT ===");
      console.log("User ID:", userId);
      console.log("Subject Progress ID:", subjectProgressId);
      console.log("Subject Name:", subjectName);
      console.log("Score:", analysis.score);

      if (!subjectProgressId) {
        console.error("❌ No subject progress ID provided");
        Alert.alert("Error", "Subject ID is missing. Cannot save assessment.");
        return;
      }

      // Verify the subject exists
      console.log("Verifying subject progress record...");
      const { data: existingSubject, error: checkError } = await supabase
        .from("subject_progress")
        .select("*")
        .eq("id", subjectProgressId)
        .eq("user_id", userId)
        .single();

      if (checkError || !existingSubject) {
        console.error("❌ Subject verification failed:", checkError);
        console.error("Subject Progress ID:", subjectProgressId);
        console.error("User ID:", userId);
        Alert.alert(
          "Error",
          "Could not find subject to update. Please try the assessment again."
        );
        return;
      }

      console.log("✅ Subject found:", existingSubject.subject);

      // Update the subject status
      const { data: updateData, error: updateError } = await supabase
        .from("subject_progress")
        .update({
          status: "lets_bridge_gaps",
          mastery_percentage: analysis.score,
          last_updated: new Date().toISOString(),
        })
        .eq("id", subjectProgressId)
        .eq("user_id", userId)
        .select();

      if (updateError) {
        console.error("❌ Update error:", updateError);
        console.error("Error details:", JSON.stringify(updateError));
        Alert.alert("Save Error", `Failed to save: ${updateError.message}`);
        return;
      }

      console.log("✅ Subject status updated successfully!");
      console.log("Updated rows:", updateData?.length || 0);
      if (updateData && updateData.length > 0) {
        console.log("New status:", updateData[0].status);
        console.log("New mastery:", updateData[0].mastery_percentage, "%");
      }

      // ===== GAMIFICATION REWARDS =====
      console.log("=== AWARDING GAMIFICATION REWARDS ===");
      
      // Calculate XP (10 XP per correct answer)
      const xpEarned = analysis.correctAnswers * 10;
      
      // Add bonus XP for perfect score
      const bonusXP = analysis.score === 100 ? 50 : 0;
      const totalXP = xpEarned + bonusXP;

      // Award XP
      const xpResult = await addXP(
        userId,
        totalXP,
        `Assessment completed: ${analysis.score}%`,
        'assessment',
        subjectName
      );

      console.log(`✅ Awarded ${totalXP} XP (${xpEarned} base + ${bonusXP} bonus)`);

      // Update streak
      const streakResult = await updateStreak(userId);
      console.log(`✅ Streak updated: ${streakResult.currentStreak} days`);

      // Check for badges
      await checkBadgeEligibility(userId, 'quiz_completed', analysis.score, {
        subject: subjectName
      });

      // Update user stats - get current stats first
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('total_quizzes, perfect_quizzes')
        .eq('user_id', userId)
        .single();

      const totalQuizzes = (currentStats?.total_quizzes || 0) + 1;
      const perfectQuizzes = (currentStats?.perfect_quizzes || 0) + (analysis.score === 100 ? 1 : 0);

      const { error: statsError } = await supabase
        .from('user_stats')
        .update({
          total_quizzes: totalQuizzes,
          perfect_quizzes: perfectQuizzes
        })
        .eq('user_id', userId);

      if (statsError) {
        console.error('Stats update error:', statsError);
      } else {
        console.log('✅ User stats updated');
      }

      // Store gamification data to display
      setGamificationData({
        xpEarned: totalXP,
        leveledUp: xpResult.leveledUp || false,
        newLevel: xpResult.newLevel,
        streakDay: streakResult.currentStreak || 0,
        badgeEarned: streakResult.badgeEarned
      });

      console.log("✅ Gamification rewards complete!");
      // ===== END GAMIFICATION =====

      // Refresh user data to show updated progress
      console.log("Refreshing user data...");
      await refreshData();
      console.log("✅ Assessment save complete!");

    } catch (error) {
      console.error("❌ Save assessment exception:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      Alert.alert("Error", "Failed to save assessment. Please try again.");
    }
  }, [authUser, subjectProgressId, subjectName, refreshData]);

  const analyzeResults = useCallback(async () => {
    try {
      console.log("Starting analysis...");
      console.log("Questions data:", questionsData?.substring(0, 100) || "N/A");
      console.log("Answers data:", answersData?.substring(0, 100) || "N/A");

      // Validate input data
      if (!questionsData || !answersData) {
        console.error("Missing data - questions or answers not provided");
        Alert.alert("Error", "Assessment data is missing. Please try again.");
        setLoading(false);
        return;
      }

      let questions: Question[];
      let answers: Record<string, Answer>;

      try {
        questions = JSON.parse(questionsData);
        answers = JSON.parse(answersData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        Alert.alert("Error", "Failed to load assessment data. Please try again.");
        setLoading(false);
        return;
      }

      // Validate parsed data
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.error("Invalid questions data");
        Alert.alert("Error", "No questions found in assessment data.");
        setLoading(false);
        return;
      }

      if (!answers || typeof answers !== "object" || Object.keys(answers).length === 0) {
        console.error("Invalid answers data");
        Alert.alert("Error", "No answers recorded. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Analyzing results for:", subjectName);
      console.log("Total questions:", questions.length);
      console.log("Total answers:", Object.keys(answers).length);

      const totalQuestions = questions.length;
      let correctAnswers = 0;
      let skippedQuestions = 0;

      // Safely count correct and skipped answers
      Object.values(answers).forEach((answer) => {
        if (answer && answer.isCorrect === true) {
          correctAnswers++;
        }
        if (answer && answer.skipped === true) {
          skippedQuestions++;
        }
      });

      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      console.log("Score:", score, "%");
      console.log("Correct:", correctAnswers);
      console.log("Skipped:", skippedQuestions);

      const conceptPerformance: Record<
        string,
        {
          total: number;
          correct: number;
          skipped: number;
          totalTime: number;
        }
      > = {};

      // Safely process each question
      questions.forEach((q) => {
        if (!q || !q.id) {
          console.warn("Skipping invalid question:", q);
          return;
        }

        const answer = answers[q.id];
        if (!answer) {
          console.warn("No answer found for question:", q.id);
          return;
        }

        const concept = q.concept || "General Concepts";

        if (!conceptPerformance[concept]) {
          conceptPerformance[concept] = {
            total: 0,
            correct: 0,
            skipped: 0,
            totalTime: 0,
          };
        }

        conceptPerformance[concept].total++;
        if (answer.isCorrect) conceptPerformance[concept].correct++;
        if (answer.skipped) conceptPerformance[concept].skipped++;
        conceptPerformance[concept].totalTime += answer.timeSpent || 0;
      });

      console.log("Concept performance:", Object.keys(conceptPerformance).length, "concepts");

      const strongConcepts: ConceptPerformance[] = [];
      const needsReview: ConceptPerformance[] = [];
      const criticalGaps: ConceptPerformance[] = [];

      Object.entries(conceptPerformance).forEach(([concept, perf]) => {
        const avgTime = perf.total > 0 ? Math.round(perf.totalTime / perf.total) : 0;
        const accuracy = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0;
        
        const category: ConceptPerformance = {
          name: concept,
          accuracy,
          total: perf.total,
          correct: perf.correct,
          avgTime,
          priority: "medium",
        };

        if (accuracy >= 75) {
          category.priority = "low";
          strongConcepts.push(category);
        } else if (accuracy >= 40) {
          category.priority = "medium";
          needsReview.push(category);
        } else {
          category.priority = "high";
          criticalGaps.push(category);
        }
      });

      console.log("Strong:", strongConcepts.length, "Review:", needsReview.length, "Gaps:", criticalGaps.length);

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

      console.log("Analysis complete:", analysis);

      setGapAnalysis(analysis);
      await saveAssessment(analysis, questions, answers);
      setLoading(false);
    } catch (error) {
      console.error("Analysis error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      Alert.alert(
        "Analysis Error",
        "Failed to analyze your results. Please try taking the assessment again."
      );
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
        <Text style={styles.loadingSubtext}>This will just take a moment</Text>
      </View>
    );
  }

  if (!gapAnalysis) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={["#EEF2FF", Colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.errorText}>Unable to load results</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
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

          {gamificationData && (
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsSectionTitle}>🎉 Rewards Earned!</Text>
              
              <View style={styles.rewardsGrid}>
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardEmoji}>⭐</Text>
                  <Text style={styles.rewardValue}>+{gamificationData.xpEarned}</Text>
                  <Text style={styles.rewardLabel}>XP Earned</Text>
                </View>

                <View style={styles.rewardCard}>
                  <Text style={styles.rewardEmoji}>🔥</Text>
                  <Text style={styles.rewardValue}>{gamificationData.streakDay}</Text>
                  <Text style={styles.rewardLabel}>Day Streak</Text>
                </View>
              </View>

              {gamificationData.leveledUp && (
                <View style={styles.levelUpCard}>
                  <Text style={styles.levelUpEmoji}>🎊</Text>
                  <Text style={styles.levelUpText}>
                    Level Up! You&apos;re now Level {gamificationData.newLevel}!
                  </Text>
                </View>
              )}

              {gamificationData.badgeEarned && (
                <View style={styles.badgeEarnedCard}>
                  <Text style={styles.badgeEarnedEmoji}>🏆</Text>
                  <Text style={styles.badgeEarnedText}>
                    New badge earned: {gamificationData.badgeEarned}!
                  </Text>
                </View>
              )}
            </View>
          )}

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
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.error,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
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
  rewardsSection: {
    marginBottom: 32,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  rewardsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  rewardsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rewardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  rewardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  levelUpCard: {
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  levelUpEmoji: {
    fontSize: 32,
  },
  levelUpText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  badgeEarnedCard: {
    backgroundColor: `${Colors.success}20`,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  badgeEarnedEmoji: {
    fontSize: 32,
  },
  badgeEarnedText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
});
