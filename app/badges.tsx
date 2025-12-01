import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import {
  getAllBadges,
  getUserBadges,
  type Badge,
  type UserBadge,
} from "@/services/gamification";

type FilterType = "all" | "earned" | "locked";

type BadgeWithXP = Badge & { xp_reward?: number };

export default function BadgesScreen() {
  const { authUser } = useUser();

  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeWithXP[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState<boolean>(true);

  const loadBadges = useCallback(async () => {
    if (!authUser) return;

    try {
      const [earned, all] = await Promise.all([
        getUserBadges(authUser.id),
        getAllBadges(),
      ]);

      setEarnedBadges(earned);
      setAllBadges(all);
      setLoading(false);
    } catch (error) {
      console.error("Load badges error:", error);
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const isEarned = (badgeCode: string): boolean => {
    return earnedBadges.some((b) => b.badge_code === badgeCode);
  };

  const getFilteredBadges = (): BadgeWithXP[] => {
    if (filter === "earned") {
      return allBadges.filter((b) => isEarned(b.badge_code));
    } else if (filter === "locked") {
      return allBadges.filter((b) => !isEarned(b.badge_code));
    }
    return allBadges;
  };

  const getBadgesByCategory = (): Record<string, BadgeWithXP[]> => {
    const filtered = getFilteredBadges();
    const categories: Record<string, BadgeWithXP[]> = {};

    filtered.forEach((badge) => {
      const category = badge.badge_category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(badge);
    });

    return categories;
  };

  const getCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      learning: "📚 Learning",
      streak: "🔥 Streaks",
      mastery: "🎯 Mastery",
      special: "⭐ Special",
      milestone: "🏆 Milestones",
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const categories = getBadgesByCategory();
  const progressPercentage =
    allBadges.length > 0 ? (earnedBadges.length / allBadges.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Badges</Text>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {earnedBadges.length} / {allBadges.length} Badges Earned
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
        </View>

        <View style={styles.filterTabs}>
          <Pressable
            style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === "all" && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterTab,
              filter === "earned" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("earned")}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === "earned" && styles.filterTabTextActive,
              ]}
            >
              Earned
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterTab,
              filter === "locked" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("locked")}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === "locked" && styles.filterTabTextActive,
              ]}
            >
              Locked
            </Text>
          </Pressable>
        </View>

        <FlatList
          style={styles.badgesContainer}
          data={Object.entries(categories)}
          keyExtractor={([category]) => category}
          renderItem={({ item: [category, badges] }) => (
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {getCategoryName(category)}
              </Text>

              <View style={styles.badgesGrid}>
                {badges.map((badge) => {
                  const earned = isEarned(badge.badge_code);

                  return (
                    <View
                      key={badge.badge_code}
                      style={[
                        styles.badgeCard,
                        !earned && styles.badgeCardLocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeEmoji,
                          !earned && styles.badgeEmojiLocked,
                        ]}
                      >
                        {badge.badge_emoji}
                      </Text>

                      <Text
                        style={[
                          styles.badgeName,
                          !earned && styles.badgeTextLocked,
                        ]}
                      >
                        {earned ? badge.badge_name : "???"}
                      </Text>

                      <Text
                        style={[
                          styles.badgeDescription,
                          !earned && styles.badgeTextLocked,
                        ]}
                      >
                        {earned
                          ? badge.badge_description
                          : "Keep learning to unlock!"}
                      </Text>

                      {earned && (
                        <View style={styles.earnedBadge}>
                          <Text style={styles.earnedText}>✓ Earned</Text>
                        </View>
                      )}

                      {!earned && badge.xp_reward && (
                        <View style={styles.xpReward}>
                          <Text style={styles.xpRewardText}>
                            +{badge.xp_reward} XP
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>
                {filter === "earned"
                  ? "No badges earned yet. Start learning to earn your first badge!"
                  : "No badges available"}
              </Text>
            </View>
          }
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(_, index) => ({
            length: 200,
            offset: 200 * index,
            index,
          })}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  filterTabs: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  badgesContainer: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "48%",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: "center",
  },
  badgeCardLocked: {
    borderColor: Colors.border,
    opacity: 0.6,
  },
  badgeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  badgeEmojiLocked: {
    opacity: 0.3,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  badgeTextLocked: {
    color: Colors.textSecondary,
  },
  earnedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  earnedText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  xpReward: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpRewardText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
