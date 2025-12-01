import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { SubjectProgressView } from '@/services/dashboard';

export const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}> = ({ percentage, size = 80, strokeWidth = 8, color = '#4F46E5' }) => {
  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={styles.circularInner}>
        <Text style={styles.circularText}>{percentage}%</Text>
      </View>
    </View>
  );
};

export const ProgressBar: React.FC<{
  percentage: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}> = ({ percentage, height = 8, color = '#4F46E5', backgroundColor = '#E5E7EB' }) => {
  return (
    <View style={[styles.progressBarContainer, { height, backgroundColor }]}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

export const MasteryBadge: React.FC<{ score: number }> = ({ score }) => {
  let level: string;
  let color: string;
  let emoji: string;

  if (score >= 90) {
    level = 'Mastered';
    color = '#10B981';
    emoji = '🏆';
  } else if (score >= 80) {
    level = 'Excellent';
    color = '#3B82F6';
    emoji = '⭐';
  } else if (score >= 60) {
    level = 'Good';
    color = '#8B5CF6';
    emoji = '✅';
  } else if (score >= 40) {
    level = 'Developing';
    color = '#F59E0B';
    emoji = '📈';
  } else {
    level = 'Learning';
    color = '#EF4444';
    emoji = '📚';
  }

  return (
    <View style={[styles.masteryBadge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={styles.masteryEmoji}>{emoji}</Text>
      <Text style={[styles.masteryText, { color }]}>{level}</Text>
    </View>
  );
};

export const SubjectProgressCard: React.FC<{
  subject: SubjectProgressView;
  onPress: () => void;
}> = ({ subject, onPress }) => {
  const progressPercentage = subject.progress_percentage || 0;
  const completedCount = subject.completed_chapters || 0;
  const totalCount = subject.total_chapters || 0;

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.subjectCard} onPress={onPress}>
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectEmoji}>{subject.icon_emoji}</Text>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{subject.subject_name}</Text>
          <Text style={styles.subjectProgress}>
            {completedCount} / {totalCount} chapters
          </Text>
        </View>
        {subject.avg_mastery_score !== null && (
          <MasteryBadge score={subject.avg_mastery_score} />
        )}
      </View>
      <ProgressBar percentage={progressPercentage} />
      <View style={styles.subjectFooter}>
        <Text style={styles.subjectPercentage}>{progressPercentage}% Complete</Text>
        {subject.last_studied_at && (
          <Text style={styles.subjectLastStudied}>
            Last studied {formatRelativeTime(subject.last_studied_at)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const StatsCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}> = ({ icon, label, value, color = '#4F46E5' }) => {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.statsIconText}>{icon}</Text>
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#111827',
  },
  progressBarContainer: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  masteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  masteryEmoji: {
    fontSize: 12,
  },
  masteryText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  subjectProgress: {
    fontSize: 14,
    color: '#6B7280',
  },
  subjectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subjectPercentage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4F46E5',
  },
  subjectLastStudied: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    marginHorizontal: 4,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsIconText: {
    fontSize: 24,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});
