import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckSquare, Square } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SUBJECTS } from "@/constants/types";
import type { SubjectType } from "@/constants/types";
import { useUser } from "@/contexts/UserContext";

export default function SubjectSelectionScreen() {
  const router = useRouter();
  const { updateSelectedSubjects } = useUser();
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectType[]>([]);

  const toggleSubject = (subjectId: SubjectType) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleNext = async () => {
    if (selectedSubjects.length === 0) {
      Alert.alert("No subjects selected", "Please select at least one subject to continue");
      return;
    }
    await updateSelectedSubjects(selectedSubjects);
    router.push("/subject-details" as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 2 of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "50%" }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Select your subjects</Text>
            <Text style={styles.subtitle}>
              Choose all subjects you&apos;re studying
            </Text>
          </View>

          <View style={styles.subjectGrid}>
            {SUBJECTS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.id);
              return (
                <Pressable
                  key={subject.id}
                  style={({ pressed }) => [
                    styles.subjectCard,
                    { borderColor: subject.color },
                    isSelected && { backgroundColor: `${subject.color}15` },
                    pressed && styles.subjectCardPressed,
                  ]}
                  onPress={() => toggleSubject(subject.id)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.subjectIcon}>{subject.icon}</Text>
                    {isSelected ? (
                      <CheckSquare size={24} color={subject.color} />
                    ) : (
                      <Square size={24} color={Colors.border} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.subjectName,
                      isSelected && { color: subject.color },
                    ]}
                  >
                    {subject.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedSubjects.length > 0 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {selectedSubjects.length} subject
                {selectedSubjects.length > 1 ? "s" : ""} selected
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
          >
            <ArrowLeft size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              selectedSubjects.length === 0 && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNext}
            disabled={selectedSubjects.length === 0}
          >
            <LinearGradient
              colors={
                selectedSubjects.length > 0
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
                  selectedSubjects.length === 0 && styles.buttonTextDisabled,
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
  subjectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  subjectCard: {
    width: "48%",
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectIcon: {
    fontSize: 32,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  counterContainer: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    alignSelf: "center",
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  button: {
    flex: 1,
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
