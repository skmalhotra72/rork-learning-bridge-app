import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Calendar, TrendingUp, Target, Award, BookOpen, Clock } from 'lucide-react-native';

import { useUser } from '@/contexts/UserContext';
import {
  getParentChildren,
  getParentDashboardData,
  getChildGoals,
  getChildRewards,
  type ParentChildRelationship,
  type ParentDashboardData,
  type ParentGoal,
  type ParentReward,
} from '@/services/parentPortal';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { authUser } = useUser();

  const [children, setChildren] = useState<ParentChildRelationship[]>([]);
  const [selectedChild, setSelectedChild] = useState<ParentChildRelationship | null>(null);
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [goals, setGoals] = useState<ParentGoal[]>([]);
  const [rewards, setRewards] = useState<ParentReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadParentData = useCallback(async () => {
    try {
      if (!authUser?.id) return;

      const childrenData = await getParentChildren(authUser.id);
      setChildren(childrenData);

      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Load parent data error:', error);
      setLoading(false);
    }
  }, [authUser]);

  const loadChildData = useCallback(async (childId: string) => {
    try {
      if (!authUser?.id) return;

      const [dashboard, childGoals, childRewards] = await Promise.all([
        getParentDashboardData(authUser.id, childId),
        getChildGoals(childId, 'active'),
        getChildRewards(childId, 'active'),
      ]);

      setDashboardData(dashboard);
      setGoals(childGoals);
      setRewards(childRewards);
    } catch (error) {
      console.error('Load child data error:', error);
    }
  }, [authUser]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  useEffect(() => {
    if (selectedChild?.child?.id) {
      loadChildData(selectedChild.child.id);
    }
  }, [selectedChild, loadChildData]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadParentData();
    if (selectedChild?.child?.id) {
      await loadChildData(selectedChild.child.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRefreshing(false);
  };

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>No Children Connected</Text>
          <Text style={styles.emptySubtitle}>
            Ask your child to generate a parent invitation code from their profile
          </Text>
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => router.push('/add-child')}
          >
            <Text style={styles.addChildButtonText}>+ Connect Child</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Parent Portal</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childCard,
                  selectedChild?.id === child.id && styles.childCardSelected,
                ]}
                onPress={() => setSelectedChild(child)}
              >
                <View style={styles.childAvatar}>
                  <Text style={styles.childInitial}>
                    {child.child?.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.childName}>{child.child?.full_name}</Text>
                <Text style={styles.childGrade}>Grade {child.child?.grade}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedChild && dashboardData && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <TrendingUp size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{dashboardData.total_xp}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
                <Text style={styles.statSubLabel}>Level {dashboardData.current_level}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Calendar size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{dashboardData.current_streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
                <Text style={styles.statSubLabel}>🔥 Keep it going!</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <BookOpen size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.statValue}>{dashboardData.concepts_mastered}</Text>
                <Text style={styles.statLabel}>Concepts</Text>
                <Text style={styles.statSubLabel}>Mastered</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Clock size={24} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>
                  {formatStudyTime(dashboardData.study_time_week)}
                </Text>
                <Text style={styles.statLabel}>This Week</Text>
                <Text style={styles.statSubLabel}>Study time</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Subject Progress</Text>
              </View>
              {dashboardData.subjects && dashboardData.subjects.length > 0 ? (
                dashboardData.subjects.map((subject, index) => (
                  <View key={index} style={styles.subjectCard}>
                    <View style={styles.subjectHeader}>
                      <Text style={styles.subjectName}>{subject.subject}</Text>
                      <Text style={styles.subjectPercentage}>
                        {subject.mastery_percentage}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${subject.mastery_percentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.subjectStatus}>{subject.status}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No subjects yet</Text>
              )}
            </View>

            {goals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Goals</Text>
                  <TouchableOpacity onPress={() => selectedChild?.child?.id && router.push(`/create-goal?childId=${selectedChild.child.id}`)}>
                    <Text style={styles.seeAll}>+ New Goal</Text>
                  </TouchableOpacity>
                </View>
                {goals.slice(0, 3).map((goal) => (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalIcon}>
                      <Target size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.goalContent}>
                      <Text style={styles.goalTitle}>{goal.goal_title}</Text>
                      <Text style={styles.goalDescription}>{goal.goal_description}</Text>
                      <View style={styles.goalProgressBar}>
                        <View
                          style={[
                            styles.goalProgressFill,
                            { width: `${goal.progress_percentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.goalProgress}>
                        {goal.current_progress} / {goal.target_value} {goal.goal_type}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {rewards.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Rewards</Text>
                  <TouchableOpacity onPress={() => console.log('Rewards coming soon')}>
                    <Text style={styles.seeAll}>See All →</Text>
                  </TouchableOpacity>
                </View>
                {rewards.slice(0, 2).map((reward) => (
                  <View key={reward.id} style={styles.rewardCard}>
                    <View style={styles.rewardIcon}>
                      <Award size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.rewardContent}>
                      <Text style={styles.rewardName}>{reward.reward_name}</Text>
                      <Text style={styles.rewardDescription}>{reward.reward_description}</Text>
                      <Text style={styles.rewardMilestone}>{reward.milestone_description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {dashboardData.recent_activity && dashboardData.recent_activity.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {dashboardData.recent_activity.slice(0, 5).map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityType}>{activity.activity_type}</Text>
                      <Text style={styles.activityDetails}>{activity.details}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(activity.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              selectedChild?.child?.id && router.push(`/create-goal?childId=${selectedChild.child.id}`);
            }}
          >
            <Target size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Set Goals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Coming Soon', 'Rewards feature will be available in the next update.');
            }}
          >
            <Award size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Create Rewards</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  childSelector: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  childCard: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 100,
  },
  childCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  childInitial: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  childName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  childGrade: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4F46E5',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  subjectPercentage: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#10B981',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  subjectStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  goalProgress: {
    fontSize: 12,
    color: '#6B7280',
  },
  rewardCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardContent: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#92400E',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 4,
  },
  rewardMilestone: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic' as const,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4F46E5',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4F46E5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addChildButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addChildButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 16,
  },
});
