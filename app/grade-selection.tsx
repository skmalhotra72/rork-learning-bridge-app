import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BookOpen } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import type { Grade } from "@/constants/types";
import { useUser } from "@/contexts/UserContext";

const GRADES: { id: Grade; label: string; icon: string; description: string }[] = [
  { id: "9", label: "Class 9th", icon: "📚", description: "Foundation Year" },
  { id: "10", label: "Class 10th", icon: "📖", description: "Board Exam Year" },
  { id: "11", label: "Class 11th", icon: "📓", description: "Specialization Begins" },
  { id: "12", label: "Class 12th", icon: "📕", description: "Final Sprint" },
];

export default function GradeSelectionScreen() {
  const router = useRouter();
  const { updateGrade } = useUser();
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  const handleNext = async () => {
    if (!selectedGrade) return;
    await updateGrade(selectedGrade);
    router.push("/subject-selection" as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 1 of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "25%" }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <BookOpen size={48} color={Colors.primary} strokeWidth={2} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Which grade are you in?</Text>
            <Text style={styles.subtitle}>
              This helps us personalize your learning
            </Text>
          </View>

          <View style={styles.gradeGrid}>
            {GRADES.map((grade) => (
              <Pressable
                key={grade.id}
                style={({ pressed }) => [
                  styles.gradeCard,
                  selectedGrade === grade.id && styles.gradeCardSelected,
                  selectedGrade && selectedGrade !== grade.id && styles.gradeCardUnselected,
                  pressed && styles.gradeCardPressed,
                ]}
                onPress={() => setSelectedGrade(grade.id)}
              >
                <Text style={styles.gradeIcon}>{grade.icon}</Text>
                <Text
                  style={[
                    styles.gradeLabel,
                    selectedGrade === grade.id && styles.gradeLabelSelected,
                  ]}
                >
                  {grade.label}
                </Text>
                <Text
                  style={[
                    styles.gradeDescription,
                    selectedGrade === grade.id && styles.gradeDescriptionSelected,
                  ]}
                >
                  {grade.description}
                </Text>
                {selectedGrade === grade.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !selectedGrade && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNext}
            disabled={!selectedGrade}
          >
            <LinearGradient
              colors={
                selectedGrade
                  ? [Colors.gradients.primary[0], Colors.gradients.primary[1]]
                  : [Colors.border, Colors.border]
              }
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text
                style={[
                  styles.buttonText,
                  !selectedGrade && styles.buttonTextDisabled,
                ]}
              >
                Next
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: "600" as const,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  gradeGrid: {
    gap: 16,
  },
  gradeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gradeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EEF2FF",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  gradeCardUnselected: {
    opacity: 0.6,
  },
  gradeCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  gradeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  gradeLabel: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  gradeLabelSelected: {
    color: Colors.primary,
  },
  gradeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  gradeDescriptionSelected: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold" as const,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  buttonTextDisabled: {
    color: Colors.textSecondary,
  },
});
