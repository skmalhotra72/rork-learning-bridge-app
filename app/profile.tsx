import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Info,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { generateParentInvitation } from "@/services/parentPortal";

export default function ProfileScreen() {
  const { user, authUser, logout } = useUser();
  const [menuVisible, setMenuVisible] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  if (!user || !authUser) return null;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const handleOptionPress = (option: string) => {
    Alert.alert(option, `${option} feature coming soon!`);
  };

  const handleGenerateCode = async () => {
    setLoadingCode(true);

    try {
      const result = await generateParentInvitation(authUser.id);

      if (result.success && result.invitationCode) {
        setInvitationCode(result.invitationCode);
        Alert.alert(
          "Code Generated! 📱",
          `Share this code with your parent:\n\n${result.invitationCode}\n\nThis code is valid for one use only.`,
          [
            {
              text: "Copy Code",
              onPress: () => {
                // Could implement clipboard copy here
                Alert.alert("Copied!", "Code copied to clipboard");
              },
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to generate code. Please try again.");
      }
    } catch (error) {
      console.error("Generate code error:", error);
      Alert.alert("Error", "Failed to generate code.");
    } finally {
      setLoadingCode(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userGrade}>Class {user.grade}th</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.optionItem,
                pressed && styles.optionItemPressed,
              ]}
              onPress={() => handleOptionPress("Edit Profile")}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: "#DBEAFE" },
                  ]}
                >
                  <Settings size={20} color={Colors.primary} />
                </View>
                <Text style={styles.optionText}>Edit Profile</Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.optionItem,
                pressed && styles.optionItemPressed,
              ]}
              onPress={() => handleOptionPress("Notification Settings")}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  <Bell size={20} color={Colors.accent} />
                </View>
                <Text style={styles.optionText}>Notification Settings</Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </Pressable>

          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>👨‍👩‍👧 Parent Portal</Text>
              <Text style={styles.sectionDescription}>
                Let your parents track your learning progress
              </Text>
            </View>

            {invitationCode ? (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Your Invitation Code:</Text>
                <Text style={styles.codeText}>{invitationCode}</Text>
                <Text style={styles.codeHint}>
                  Share this code with your parent. They can use it once to
                  connect their account.
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.regenerateButton,
                    pressed && styles.regenerateButtonPressed,
                  ]}
                  onPress={handleGenerateCode}
                  disabled={loadingCode}
                >
                  <Text style={styles.regenerateButtonText}>
                    {loadingCode ? "Generating..." : "Generate New Code"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  pressed && styles.generateButtonPressed,
                ]}
                onPress={handleGenerateCode}
                disabled={loadingCode}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: "#E0E7FF" },
                    ]}
                  >
                    {loadingCode ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Users size={20} color={Colors.primary} />
                    )}
                  </View>
                  <Text style={styles.optionText}>
                    {loadingCode ? "Generating Code..." : "Generate Parent Code"}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.optionItem,
                pressed && styles.optionItemPressed,
              ]}
              onPress={() => handleOptionPress("Help & Support")}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: "#D1FAE5" },
                  ]}
                >
                  <HelpCircle size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.optionText}>Help & Support</Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.optionItem,
                pressed && styles.optionItemPressed,
              ]}
              onPress={() => handleOptionPress("About Learning Bridge")}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: "#E0E7FF" },
                  ]}
                >
                  <Info size={20} color={Colors.primary} />
                </View>
                <Text style={styles.optionText}>About Learning Bridge</Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.optionItem,
                styles.logoutButton,
                pressed && styles.optionItemPressed,
              ]}
              onPress={handleLogout}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                >
                  <LogOut size={20} color={Colors.error} />
                </View>
                <Text style={[styles.optionText, { color: Colors.error }]}>
                  Logout
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Learning Bridge v1.0.0</Text>
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
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userGrade: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionItemPressed: {
    backgroundColor: Colors.background,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  lockedBadge: {
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 6,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  codeCard: {
    backgroundColor: Colors.background,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.primary,
    textAlign: "center" as const,
    letterSpacing: 4,
    marginBottom: 12,
  },
  codeHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 16,
  },
  regenerateButton: {
    backgroundColor: Colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center" as const,
  },
  regenerateButtonPressed: {
    backgroundColor: Colors.background,
  },
  regenerateButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  generateButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  generateButtonPressed: {
    backgroundColor: Colors.background,
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
