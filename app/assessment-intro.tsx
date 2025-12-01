import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const getConfidenceEmoji = (level: number) => {
  if (level <= 3) return "😰";
  if (level <= 5) return "😐";
  if (level <= 7) return "🙂";
  return "😄";
};

export default function AssessmentIntroScreen() {
  const params = useLocalSearchParams();
  const subjectProgressId = params.subjectProgressId as string;
  const subjectName = params.subjectName as string;
  const subjectColor = params.subjectColor as string;

  console.log("=== ASSESSMENT INTRO ===");
  console.log("Subject Progress ID:", subjectProgressId);
  console.log("Subject Name:", subjectName);

  if (!subjectProgressId || !subjectName) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#EEF2FF", Colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={styles.errorText}>Subject information missing</Text>
            <Pressable
              style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.8 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.startButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleStartAssessment = () => {
    console.log("=== NAVIGATING TO QUIZ ===");
    console.log("Passing Subject Progress ID:", subjectProgressId);
    console.log("Passing Subject Name:", subjectName);
    
    if (!subjectProgressId) {
      Alert.alert("Error", "Subject ID is missing. Please go back and try again.");
      return;
    }

    router.push({
      pathname: "/assessment-quiz",
      params: {
        subjectProgressId: subjectProgressId,
        subjectName: subjectName,
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", Colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mascotContainer}>
            <Text style={styles.mascotEmoji}>🦉</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>
              Let&apos;s understand where you are in {subjectName}! 📚
            </Text>

            <Text style={styles.subtitle}>
              I&apos;ll ask a few quick questions to help me teach you better.
            </Text>

            <View style={styles.infoBox}>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>✓</Text>
                <Text style={styles.infoText}>
                  No pressure - this helps me understand you
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>✓</Text>
                <Text style={styles.infoText}>About 5-10 questions</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>✓</Text>
                <Text style={styles.infoText}>Takes 5-7 minutes</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>✓</Text>
                <Text style={styles.infoText}>
                  You can skip questions if unsure
                </Text>
              </View>
            </View>

            <View style={styles.currentInfo}>
              <Text style={styles.currentInfoTitle}>What you told me:</Text>
              <View style={styles.currentInfoCard}>
                <View style={styles.currentInfoRow}>
                  <Text style={styles.currentInfoLabel}>Subject:</Text>
                  <Text style={styles.currentInfoValue}>{subjectName}</Text>
                </View>
                <View style={styles.currentInfoRow}>
                  <Text style={styles.currentInfoLabel}>
                    Your confidence level:
                  </Text>
                  <Text style={styles.currentInfoValue}>
                    5/10 {getConfidenceEmoji(5)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                { backgroundColor: subjectColor || Colors.primary },
                pressed && styles.startButtonPressed,
              ]}
              onPress={handleStartAssessment}
            >
              <Text style={styles.startButtonText}>Start Assessment 🎯</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    alignSelf: "flex-start",
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mascotContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  mascotEmoji: {
    fontSize: 72,
  },
  content: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoEmoji: {
    fontSize: 16,
    marginRight: 12,
    color: Colors.success,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  currentInfo: {
    marginBottom: 24,
  },
  currentInfoTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  currentInfoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  currentInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  currentInfoValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: 20,
  },
  startButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
