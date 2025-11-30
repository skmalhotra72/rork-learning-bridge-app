import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Award, BookOpen, Flame, Menu, Target } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SUBJECTS } from "@/constants/types";
import { useUser } from "@/contexts/UserContext";

export default function ProgressScreen() {
  const { user } = useUser();
  const [menuVisible, setMenuVisible] = useState(false);

  if (!user) return null;

  const userSubjects = user.selectedSubjects
    .map((id) => SUBJECTS.find((s) => s.id === id))
    .filter(Boolean);

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
});
