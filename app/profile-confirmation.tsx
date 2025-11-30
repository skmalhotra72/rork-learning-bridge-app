import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Edit2 } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { getConfidenceLabel, SUBJECTS } from "@/constants/types";
import { useUser } from "@/contexts/UserContext";
import { saveLanguageSettings } from "@/services/multilingualPrompts";

export default function ProfileConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const schoolMedium = params.schoolMedium as string;
  const preferredLanguage = params.preferredLanguage as string;
  const allowCodeMixing = params.allowCodeMixing === 'true';
  
  const { user, authUser, session, completeOnboarding } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  console.log("========== PROFILE CONFIRMATION SCREEN ==========");
  console.log("User context:", {
    hasUser: !!user,
    userName: user?.name,
    hasAuthUser: !!authUser,
    authUserId: authUser?.id,
    hasSession: !!session,
    sessionUserId: session?.user?.id
  });
  console.log("=================================================");

  if (!user) {
    console.log("No user in context, redirecting to welcome");
    return null;
  }

  const handleStartJourney = async () => {
    if (!authUser?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      console.log('=== SAVING LANGUAGE SETTINGS ===');
      console.log('School Medium:', schoolMedium);
      console.log('Preferred Language:', preferredLanguage);
      console.log('Allow Code Mixing:', allowCodeMixing);
      
      const langResult = await saveLanguageSettings(authUser.id, {
        schoolMedium: schoolMedium || 'English',
        preferredLanguage: preferredLanguage || 'English',
        allowCodeMixing: allowCodeMixing,
        englishProficiency: 3
      });

      if (!langResult.success) {
        console.error('Language settings save failed:', langResult.error);
      } else {
        console.log('✅ Language settings saved successfully');
      }

      const result = await completeOnboarding();
      
      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to save. Please try again.");
      }
    } catch (error) {
      console.error("Complete onboarding error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.back();
  };

  const userSubjects = user.selectedSubjects
    .map((id) => ({
      subject: SUBJECTS.find((s) => s.id === id),
      details: user.subjectDetails.find((d) => d.subjectId === id),
    }))
    .filter((item) => item.subject);

  const averageConfidence =
    user.subjectDetails.reduce((sum, d) => sum + d.confidence, 0) /
    (user.subjectDetails.length || 1);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 4 of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.mascot}>🦉</Text>
            <Text style={styles.title}>
              Let&apos;s confirm your learning profile!
            </Text>
            <Text style={styles.subtitle}>
              Great! Here&apos;s what I learned about you. Does this look right?
            </Text>
          </View>

          <View style={styles.basicInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Grade:</Text>
              <Text style={styles.infoValue}>Class {user.grade}th</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Subjects:</Text>
              <Text style={styles.infoValue}>{user.selectedSubjects.length}</Text>
            </View>
          </View>

          <View style={styles.subjectsSection}>
            <Text style={styles.sectionTitle}>Your Subjects</Text>
            {userSubjects.map(({ subject, details }) => {
              if (!subject || !details) return null;
              const confidenceInfo = getConfidenceLabel(details.confidence);

              return (
                <View
                  key={subject.id}
                  style={[
                    styles.subjectCard,
                    { borderLeftColor: subject.color, borderLeftWidth: 4 },
                  ]}
                >
                  <View style={styles.subjectHeader}>
                    <View style={styles.subjectTitleRow}>
                      <Text style={styles.subjectIcon}>{subject.icon}</Text>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                    </View>
                  </View>

                  <View style={styles.subjectDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Current Chapter:</Text>
                      <Text style={styles.detailValue}>
                        {details.currentChapter}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Confidence:</Text>
                      <View style={styles.confidenceRow}>
                        <Text style={styles.confidenceEmoji}>
                          {confidenceInfo.emoji}
                        </Text>
                        <Text style={styles.detailValue}>
                          {details.confidence}/10
                        </Text>
                      </View>
                    </View>

                    {details.stuckPoints && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Stuck on:</Text>
                        <Text
                          style={styles.stuckText}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {details.stuckPoints}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.overallSection}>
            <Text style={styles.sectionTitle}>Overall Confidence</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${(averageConfidence / 10) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              Average: {averageConfidence.toFixed(1)}/10
            </Text>
          </View>

          <View style={styles.encouragement}>
            <Text style={styles.encouragementText}>
              I can help you bridge these gaps! Let&apos;s get started 🎯
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
            onPress={handleEdit}
          >
            <Edit2 size={18} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleStartJourney}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Start My Learning Journey</Text>
              )}
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
    backgroundColor: Colors.secondary,
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
  mascot: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
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
  basicInfo: {
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  subjectsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  subjectCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    marginBottom: 12,
  },
  subjectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subjectIcon: {
    fontSize: 24,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  subjectDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confidenceEmoji: {
    fontSize: 16,
  },
  stuckText: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: "italic" as const,
    flex: 1,
    textAlign: "right",
  },
  overallSection: {
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
  confidenceBar: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: "hidden",
    marginVertical: 12,
  },
  confidenceBarFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
  },
  confidenceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  encouragement: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  encouragementText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: "center",
    fontWeight: "600" as const,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
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
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
