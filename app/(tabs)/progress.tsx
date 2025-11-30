import { LinearGradient } from "expo-linear-gradient";
import { Award, BookOpen, Flame, Target } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SUBJECTS } from "@/constants/types";
import { useUser } from "@/contexts/UserContext";

export default function ProgressScreen() {
  const { user } = useUser();

  if (!user) return null;

  const userSubjects = user.selectedSubjects
    .map((id) => SUBJECTS.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", Colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Your Progress</Text>
            <Text style={styles.subtitle}>
              Track your learning journey and achievements
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#FEF3C7" },
                ]}
              >
                <Target size={24} color={Colors.accent} />
              </View>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#DBEAFE" },
                ]}
              >
                <BookOpen size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Concepts Mastered</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#FEE2E2" },
                ]}
              >
                <Flame size={24} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#D1FAE5" },
                ]}
              >
                <Award size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.statValue}>0/20</Text>
              <Text style={styles.statLabel}>Badges Earned</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject Progress</Text>
            <View style={styles.subjectList}>
              {userSubjects.map((subject) => {
                if (!subject) return null;
                return (
                  <View key={subject.id} style={styles.subjectItem}>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectIcon}>{subject.icon}</Text>
                      <View style={styles.subjectTextContainer}>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <Text style={styles.subjectStatus}>Not started</Text>
                      </View>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: "0%",
                              backgroundColor: subject.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>0%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>🎯</Text>
            <Text style={styles.motivationTitle}>
              Start learning to see progress!
            </Text>
            <Text style={styles.motivationText}>
              Complete assessments and practice exercises to fill up your progress
              bars and earn badges. Every step counts!
            </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: "48%",
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  subjectList: {
    gap: 12,
  },
  subjectItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  subjectTextContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  subjectStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    minWidth: 40,
  },
  motivationCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  motivationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
