import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

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

const generateSampleQuestions = (subjectName: string): Question[] => {
  if (subjectName === "Mathematics" || subjectName.includes("Math")) {
    return [
      {
        id: "math_1",
        type: "Basic Concept",
        question: "What is the standard form of a quadratic equation?",
        options: [
          "ax + b = 0",
          "ax² + bx + c = 0",
          "ax³ + bx² + c = 0",
          "ax² = c",
        ],
        correctAnswer: 1,
        concept: "Quadratic Equations - Basics",
      },
      {
        id: "math_2",
        type: "Application",
        question:
          "If the discriminant (b² - 4ac) is negative, what can you say about the roots?",
        options: [
          "Two real and equal roots",
          "Two real and distinct roots",
          "No real roots",
          "One real root",
        ],
        correctAnswer: 2,
        concept: "Quadratic Equations - Nature of Roots",
      },
      {
        id: "math_3",
        type: "Prerequisite Check",
        question: "What is the value of (a + b)²?",
        options: [
          "a² + b²",
          "a² + 2ab + b²",
          "a² - 2ab + b²",
          "2a² + 2b²",
        ],
        correctAnswer: 1,
        concept: "Algebraic Identities",
      },
      {
        id: "math_4",
        type: "Problem Solving",
        question:
          "The sum of a number and its reciprocal is 10/3. What is the number?",
        options: ["3 or 1/3", "2 or 1/2", "3 or 2", "5 or 1/5"],
        correctAnswer: 0,
        concept: "Quadratic Equations - Word Problems",
      },
      {
        id: "math_5",
        type: "Basic Concept",
        question: "Which method can solve x² + 5x + 6 = 0?",
        options: [
          "Factorization",
          "Completing the square",
          "Quadratic formula",
          "All of the above",
        ],
        correctAnswer: 3,
        concept: "Methods of Solving Quadratics",
      },
    ];
  }

  if (subjectName === "Physics") {
    return [
      {
        id: "phy_1",
        type: "Basic Concept",
        question: "What is the SI unit of force?",
        options: ["Joule", "Newton", "Watt", "Pascal"],
        correctAnswer: 1,
        concept: "Force and Motion - Units",
      },
      {
        id: "phy_2",
        type: "Application",
        question:
          "If mass is doubled and velocity is halved, what happens to kinetic energy?",
        options: ["Remains same", "Doubles", "Halves", "Becomes one-fourth"],
        correctAnswer: 2,
        concept: "Work and Energy",
      },
      {
        id: "phy_3",
        type: "Prerequisite Check",
        question: "What is acceleration?",
        options: [
          "Rate of change of position",
          "Rate of change of velocity",
          "Rate of change of force",
          "Rate of change of momentum",
        ],
        correctAnswer: 1,
        concept: "Motion - Basic Definitions",
      },
      {
        id: "phy_4",
        type: "Problem Solving",
        question:
          "A car accelerates from rest to 20 m/s in 5 seconds. What is its acceleration?",
        options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"],
        correctAnswer: 1,
        concept: "Equations of Motion",
      },
      {
        id: "phy_5",
        type: "Conceptual",
        question: "Newton's third law states that:",
        options: [
          "F = ma",
          "Every action has an equal and opposite reaction",
          "An object at rest stays at rest",
          "Force is proportional to acceleration",
        ],
        correctAnswer: 1,
        concept: "Newton's Laws",
      },
    ];
  }

  return [
    {
      id: "gen_1",
      type: "Basic Concept",
      question: `What is a fundamental concept in ${subjectName}?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      concept: "Basic Concepts",
    },
    {
      id: "gen_2",
      type: "Application",
      question: `How do you apply knowledge in ${subjectName}?`,
      options: ["Method 1", "Method 2", "Method 3", "Method 4"],
      correctAnswer: 1,
      concept: "Application",
    },
    {
      id: "gen_3",
      type: "Prerequisite",
      question: `What should you know before studying ${subjectName}?`,
      options: [
        "Foundation A",
        "Foundation B",
        "Foundation C",
        "Foundation D",
      ],
      correctAnswer: 0,
      concept: "Prerequisites",
    },
    {
      id: "gen_4",
      type: "Problem Solving",
      question: `How would you solve a problem in ${subjectName}?`,
      options: ["Approach 1", "Approach 2", "Approach 3", "Approach 4"],
      correctAnswer: 2,
      concept: "Problem Solving",
    },
    {
      id: "gen_5",
      type: "Advanced",
      question: `What is an advanced concept in ${subjectName}?`,
      options: ["Concept A", "Concept B", "Concept C", "Concept D"],
      correctAnswer: 1,
      concept: "Advanced Topics",
    },
  ];
};

export default function AssessmentQuizScreen() {
  const params = useLocalSearchParams();
  const subjectId = params.subjectId as string;
  const subjectName = params.subjectName as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );

  const loadQuestions = useCallback(() => {
    try {
      console.log("Loading questions for:", subjectName);
      const sampleQuestions = generateSampleQuestions(subjectName);
      setQuestions(sampleQuestions);
      setLoading(false);
    } catch (error) {
      console.error("Load questions error:", error);
      setLoading(false);
    }
  }, [subjectName]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        selected: selectedOption,
        correct: currentQuestion.correctAnswer,
        isCorrect: selectedOption === currentQuestion.correctAnswer,
        timeSpent: timeTaken,
      },
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
    } else {
      finishAssessment();
    }
  };

  const handleSkip = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        selected: null,
        correct: currentQuestion.correctAnswer,
        isCorrect: false,
        timeSpent: timeTaken,
        skipped: true,
      },
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = () => {
    console.log("Assessment finished, navigating to results");
    router.push({
      pathname: "/assessment-results",
      params: {
        subjectId,
        subjectName,
        questionsData: JSON.stringify(questions),
        answersData: JSON.stringify(answers),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#EEF2FF", Colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Preparing your assessment...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", Colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.questionContainer}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{currentQuestion.type}</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.optionButton,
                  selectedOption === index && styles.optionButtonSelected,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={() => handleOptionSelect(index)}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionCircle,
                      selectedOption === index && styles.optionCircleSelected,
                    ]}
                  >
                    {selectedOption === index && (
                      <View style={styles.optionCircleInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedOption === index && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed,
            ]}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              !selectedOption && styles.nextButtonDisabled,
              pressed && selectedOption && styles.nextButtonPressed,
            ]}
            onPress={handleNext}
            disabled={!selectedOption}
          >
            <Text
              style={[
                styles.nextButtonText,
                !selectedOption && styles.nextButtonTextDisabled,
              ]}
            >
              {currentQuestionIndex === questions.length - 1
                ? "Finish"
                : "Next →"}
            </Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  questionContainer: {
    marginBottom: 32,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 8,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  questionText: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: Colors.text,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  optionButtonPressed: {
    opacity: 0.7,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  optionCircleSelected: {
    borderColor: Colors.primary,
  },
  optionCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
  },
  nextButtonPressed: {
    opacity: 0.8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  nextButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});
