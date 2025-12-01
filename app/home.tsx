import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowRight, Flame, Menu, Trophy } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SUBJECTS, type Subject } from "@/constants/types";
import { useUser } from "@/contexts/UserContext";
import { supabase, SubjectProgress } from "@/lib/supabase";
import { getDashboardData, getSubjectProgress } from "@/services/dashboard";
import type { DashboardData, SubjectProgressView } from "@/services/dashboard";
import { SubjectProgressCard, StatsCard, MasteryBadge } from "@/components/ProgressComponents";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", emoji: "⛅" };
  if (hour >= 17 && hour < 21) return { text: "Good evening", emoji: "🌆" };
  return { text: "Still studying", emoji: "🌙" };
};

export default function HomeScreen() {
  const { user, stats: userStats, refreshData, authUser, logout } = useUser();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [cbseSubjectProgress, setCbseSubjectProgress] = useState<SubjectProgressView[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No session found, redirecting to welcome");
        router.replace("/welcome");
        return;
      }

      if (authUser) {
        console.log("Loading dashboard data in parallel for user:", authUser.id);
        
        const [, progressResult, dashData, cbseProgress] = await Promise.all([
          refreshData(),
          supabase
            .from("subject_progress")
            .select("*")
            .eq("user_id", authUser.id),
          getDashboardData(authUser.id),
          getSubjectProgress(authUser.id)
        ]);

        if (progressResult.error) {
          console.error("Error loading subject progress:", progressResult.error);
        } else {
          console.log("Loaded subject progress:", progressResult.data?.length || 0, "subjects");
          setSubjectProgress(progressResult.data || []);
        }

        if (dashData) {
          console.log("Loaded dashboard data:", dashData);
          setDashboardData(dashData);
        }

        if (cbseProgress) {
          console.log("Loaded CBSE subject progress:", cbseProgress.length, "subjects");
          setCbseSubjectProgress(cbseProgress);
        }
      } else {
        await refreshData();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }, [refreshData, authUser]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadDashboardData();
  }, [pulseAnim, loadDashboardData]);

  if (!user) return null;

  const userSubjects = user.selectedSubjects
    .map((id) => SUBJECTS.find((s) => s.id === id))
    .filter(Boolean);

  const greeting = getTimeBasedGreeting();

  const handleSubjectPress = (subject: Subject, progressRecord: SubjectProgress | undefined) => {
    console.log("=== SUBJECT PRESSED ===");
    console.log("Subject:", subject.name);
    console.log("Subject ID (constant):", subject.id);
    console.log("Progress Record:", progressRecord);
    console.log("Database ID:", progressRecord?.id);
    console.log("Status:", progressRecord?.status);

    if (!progressRecord) {
      Alert.alert("Error", "Subject progress record not found. Please try again.");
      return;
    }

    // Check status to determine where to navigate
    if (progressRecord.status === "lets_bridge_gaps") {
      // Navigate to AI Tutor
      console.log("Navigating to AI Tutor");
      router.push({
        pathname: "/ai-tutor",
        params: {
          subjectProgressId: progressRecord.id,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          subjectColor: subject.color,
        },
      });
    } else {
      // Navigate to Assessment Intro (default: getting_to_know_you)
      console.log("Navigating to Assessment Intro");
      router.push({
        pathname: "/assessment-intro",
        params: {
          subjectProgressId: progressRecord.id,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          subjectColor: subject.color,
        },
      });
    }
  };

  const navigateToHome = () => {
    setMenuVisible(false);
    router.push("/home");
  };

  const navigateToProgress = () => {
    setMenuVisible(false);
    router.push("/progress");
  };

  const navigateToProfile = () => {
    setMenuVisible(false);
    router.push("/profile");
  };

  const navigateToBadges = () => {
    setMenuVisible(false);
    router.push("/badges");
  };

  const handleLogout = () => {
    setMenuVisible(false);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", Colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={navigateToHome}>
            <Text style={styles.appTitle}>Learning Bridge</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
            ]}
            onPress={() => setMenuVisible(true)}
          >
            <Menu size={24} color={Colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>
                {greeting.text}, {user.name}! {greeting.emoji}
              </Text>
              <Text style={styles.userSubtitle}>Ready to learn today?</Text>
            </View>
            <View style={styles.levelBadge}>
              <Trophy size={20} color={Colors.accent} />
              <Text style={styles.levelText}>Level {userStats?.current_level ?? 1}</Text>
            </View>
          </View>

          {dashboardData?.summary && (
            <View style={styles.enhancedStatsContainer}>
              <StatsCard
                icon="📚"
                label="Chapters"
                value={dashboardData.summary.chapters_completed || 0}
                color="#4F46E5"
              />
              <StatsCard
                icon="🎯"
                label="Mastered"
                value={dashboardData.summary.chapters_mastered || 0}
                color="#10B981"
              />
              <StatsCard
                icon="⏱️"
                label="Hours"
                value={dashboardData.summary.total_hours_studied?.toFixed(1) || '0'}
                color="#F59E0B"
              />
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Flame size={24} color={Colors.accent} />
              </View>
              <Text style={styles.statValue}>{userStats?.streak_count ?? 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>⚡</Text>
              </View>
              <Text style={styles.statValue}>{userStats?.total_xp ?? 0}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>🎯</Text>
              </View>
              <Text style={styles.statValue}>{userStats?.concepts_mastered ?? 0}</Text>
              <Text style={styles.statLabel}>Concepts</Text>
            </View>
          </View>

          {dashboardData?.summary?.avg_mastery_score && (
            <View style={styles.overallProgress}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Overall Performance</Text>
                <MasteryBadge score={dashboardData.summary.avg_mastery_score} />
              </View>
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {Math.round(dashboardData.summary.avg_mastery_score)}%
                  </Text>
                  <Text style={styles.progressStatLabel}>Average Score</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {dashboardData.summary.chapters_in_progress || 0}
                  </Text>
                  <Text style={styles.progressStatLabel}>In Progress</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {dashboardData.summary.difficult_chapters_count || 0}
                  </Text>
                  <Text style={styles.progressStatLabel}>Need Help</Text>
                </View>
              </View>
            </View>
          )}

          {cbseSubjectProgress.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Chapter Progress</Text>
              {cbseSubjectProgress.map((subject) => (
                <SubjectProgressCard
                  key={subject.subject_id}
                  subject={subject}
                  onPress={() => {
                    router.push({
                      pathname: "/subject-detail",
                      params: {
                        subjectCode: subject.subject_code,
                        gradeNumber: user.grade,
                      },
                    });
                  }}
                />
              ))}
            </View>
          )}

          {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
              {dashboardData.recent_activity.slice(0, 5).map((activity) => (
                <View key={activity.activity_id} style={styles.activityCard}>
                  <Text style={styles.activityEmoji}>{activity.icon_emoji}</Text>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.chapter_title}</Text>
                    <Text style={styles.activitySubject}>{activity.subject_name}</Text>
                  </View>
                  <View style={styles.activityBadge}>
                    <Text style={styles.activityScore}>{activity.completion_percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Subjects</Text>
            <View style={styles.subjectGrid}>
              {userSubjects.map((subject) => {
                if (!subject) return null;
                
                const progressRecord = subjectProgress.find(
                  (p) => p.subject === subject.id
                );
                
                const masteryPercentage = progressRecord?.mastery_percentage || 0;
                const status = progressRecord?.status || "getting_to_know_you";
                
                return (
                  <Animated.View
                    key={subject.id}
                    style={{
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [1, 0.95],
                      }),
                    }}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.subjectCard,
                        { borderColor: subject.color },
                        pressed && styles.subjectCardPressed,
                      ]}
                      onPress={() => handleSubjectPress(subject, progressRecord)}
                    >
                      <View style={styles.subjectHeader}>
                        <Text style={styles.subjectIcon}>{subject.icon}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: `${subject.color}20` },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {status === "lets_bridge_gaps" ? "🎯" : "🔍"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.subjectName}>{subject.name}</Text>

                      <View style={styles.progressRing}>
                        <Text style={styles.progressPercentage}>{masteryPercentage}%</Text>
                      </View>

                      <View
                        style={[
                          styles.assessmentButton,
                          { backgroundColor: subject.color },
                        ]}
                      >
                        <Text style={styles.assessmentText}>
                          {status === "lets_bridge_gaps" ? "Start Learning" : "Start Assessment"}
                        </Text>
                        <ArrowRight size={16} color="#FFFFFF" />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          <View style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>🦉</Text>
            <Text style={styles.motivationTitle}>Ready to learn?</Text>
            <Text style={styles.motivationText}>
              Let&apos;s start with an assessment to understand your current level
              and create a personalized learning path!
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.testButton,
              pressed && styles.testButtonPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/chapter-index",
                params: {
                  subjectCode: "MATH",
                  gradeNumber: user.grade,
                },
              })
            }
          >
            <Text style={styles.testButtonText}>📚 View Mathematics Curriculum</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={navigateToHome}
            >
              <Text style={styles.menuItemText}>🏠 Home</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={navigateToProgress}
            >
              <Text style={styles.menuItemText}>📊 Progress</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={navigateToProfile}
            >
              <Text style={styles.menuItemText}>👤 Profile</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={navigateToBadges}
            >
              <Text style={styles.menuItemText}>🏆 Badges</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={handleLogout}
            >
              <Text style={[styles.menuItemText, { color: Colors.error }]}>🚪 Logout</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                styles.menuItemClose,
                pressed && styles.menuItemPressed,
              ]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={[styles.menuItemText, styles.closeText]}>✕ Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  menuButtonPressed: {
    opacity: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  enhancedStatsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
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
  },
  section: {
    marginBottom: 32,
  },
  overallProgress: {
    backgroundColor: Colors.cardBackground,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  progressStat: {
    alignItems: "center",
  },
  progressStatValue: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  subjectGrid: {
    gap: 16,
  },
  subjectCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  subjectCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectIcon: {
    fontSize: 40,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: Colors.border,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  assessmentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  assessmentText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  motivationCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
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
    fontSize: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    backgroundColor: Colors.cardBackground,
    marginTop: 60,
    marginRight: 20,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemPressed: {
    backgroundColor: Colors.background,
  },
  menuItemClose: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  closeText: {
    color: Colors.textSecondary,
  },
  testButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  activityCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  activitySubject: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  activityBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityScore: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
