import { supabase } from '@/lib/supabase';

export interface ParentChildRelationship {
  id: string;
  parent_id: string;
  child_id: string;
  invitation_code?: string;
  verified: boolean;
  created_at: string;
  child?: {
    id: string;
    full_name: string;
    email: string;
    grade: string;
    created_at: string;
  };
}

export interface ParentDashboardData {
  child_name: string;
  grade: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  concepts_mastered: number;
  quizzes_completed: number;
  study_time_week: number;
  subjects: {
    subject: string;
    mastery_percentage: number;
    status: string;
  }[];
  recent_activity: {
    activity_type: string;
    subject: string;
    created_at: string;
    details: string;
  }[];
}

export interface ParentGoal {
  id: string;
  parent_id: string;
  student_id: string;
  goal_title: string;
  goal_description: string;
  goal_type: string;
  target_value: number;
  current_progress: number;
  progress_percentage: number;
  target_subject?: string;
  target_deadline?: string;
  reminder_frequency: string;
  status: string;
  completed_at?: string;
  created_at: string;
}

export interface ParentReward {
  id: string;
  parent_id: string;
  student_id: string;
  reward_name: string;
  reward_description: string;
  reward_type: string;
  reward_value: string;
  milestone_type: string;
  milestone_target: number;
  milestone_subject?: string;
  milestone_description: string;
  status: string;
  claimed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  student_id: string;
  week_start: string;
  week_end: string;
  total_xp_earned: number;
  study_time_minutes: number;
  concepts_learned: number;
  quizzes_completed: number;
  average_quiz_score: number;
  streak_maintained: boolean;
  subjects_studied: string[];
  strengths: string[];
  improvement_areas: string[];
  parent_notes?: string;
  created_at: string;
}

export interface StudyTimeLog {
  id: string;
  user_id: string;
  subject: string;
  activity_type: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  interactions_count: number;
  questions_asked: number;
  problems_solved: number;
  focus_score: number;
  productivity_score: number;
  created_at: string;
}

export interface ParentComment {
  id: string;
  parent_id: string;
  student_id: string;
  comment_text: string;
  comment_type: string;
  related_subject?: string;
  related_concept?: string;
  visible_to_student: boolean;
  created_at: string;
}

// Generate invitation code for parent
export const generateParentInvitation = async (
  studentId: string
): Promise<{ success: boolean; invitationCode?: string; error?: any }> => {
  try {
    console.log('=== GENERATING PARENT INVITATION ===');
    console.log('Student ID:', studentId);

    const { data, error } = await supabase.rpc('generate_parent_invitation', {
      p_child_id: studentId,
    });

    if (error) {
      console.error('Generate invitation error:', error);
      return { success: false, error };
    }

    const invitationCode = data as string;
    console.log('✅ Invitation code generated:', invitationCode);

    return { success: true, invitationCode };
  } catch (error) {
    console.error('Generate invitation exception:', error);
    return { success: false, error };
  }
};

// Accept parent invitation
export const acceptParentInvitation = async (
  parentId: string,
  invitationCode: string
): Promise<{ success: boolean; error?: any; reason?: string }> => {
  try {
    console.log('=== ACCEPTING PARENT INVITATION ===');
    console.log('Code:', invitationCode);

    const { data, error } = await supabase.rpc('accept_parent_invitation', {
      p_parent_id: parentId,
      p_invitation_code: invitationCode,
    });

    if (error) {
      console.error('Accept invitation error:', error);
      return { success: false, error };
    }

    const accepted = data as boolean;

    if (accepted) {
      console.log('✅ Invitation accepted!');
      return { success: true };
    } else {
      console.log('❌ Invalid invitation code');
      return { success: false, reason: 'invalid_code' };
    }
  } catch (error) {
    console.error('Accept invitation exception:', error);
    return { success: false, error };
  }
};

// Get children for parent
export const getParentChildren = async (
  parentId: string
): Promise<ParentChildRelationship[]> => {
  try {
    const { data, error } = await supabase
      .from('parent_child_relationships')
      .select(
        `
        *,
        child:child_id (
          id,
          full_name,
          email,
          grade,
          created_at
        )
      `
      )
      .eq('parent_id', parentId)
      .eq('verified', true);

    if (error) {
      console.error('Get children error:', error);
      return [];
    }

    return (data as ParentChildRelationship[]) || [];
  } catch (error) {
    console.error('Get children exception:', error);
    return [];
  }
};

// Get parent dashboard data for specific child
export const getParentDashboardData = async (
  parentId: string,
  childId: string
): Promise<ParentDashboardData | null> => {
  try {
    const { data, error } = await supabase.rpc('get_parent_dashboard_data', {
      p_parent_id: parentId,
      p_child_id: childId,
    });

    if (error) {
      console.error('Get dashboard data error:', error);
      return null;
    }

    return (data?.[0] as ParentDashboardData) || null;
  } catch (error) {
    console.error('Get dashboard data exception:', error);
    return null;
  }
};

// Create parent goal for child
export const createParentGoal = async (
  parentId: string,
  childId: string,
  goalData: {
    goalTitle: string;
    goalDescription: string;
    goalType: string;
    targetValue: number;
    targetSubject?: string;
    targetDeadline?: string;
    reminderFrequency?: string;
  }
): Promise<{ success: boolean; data?: ParentGoal; error?: any }> => {
  try {
    console.log('=== CREATING PARENT GOAL ===');
    console.log('Goal:', goalData.goalTitle);

    const { data, error } = await supabase
      .from('parent_goals')
      .insert({
        parent_id: parentId,
        student_id: childId,
        goal_title: goalData.goalTitle,
        goal_description: goalData.goalDescription,
        goal_type: goalData.goalType,
        target_value: goalData.targetValue,
        target_subject: goalData.targetSubject,
        target_deadline: goalData.targetDeadline,
        reminder_frequency: goalData.reminderFrequency || 'weekly',
      })
      .select();

    if (error) {
      console.error('Create goal error:', error);
      return { success: false, error };
    }

    console.log('✅ Goal created!');
    return { success: true, data: data?.[0] as ParentGoal };
  } catch (error) {
    console.error('Create goal exception:', error);
    return { success: false, error };
  }
};

// Get active goals for child
export const getChildGoals = async (
  childId: string,
  status?: string
): Promise<ParentGoal[]> => {
  try {
    let query = supabase
      .from('parent_goals')
      .select('*')
      .eq('student_id', childId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get goals error:', error);
      return [];
    }

    return (data as ParentGoal[]) || [];
  } catch (error) {
    console.error('Get goals exception:', error);
    return [];
  }
};

// Update goal progress
export const updateGoalProgress = async (
  goalId: string,
  currentProgress: number
): Promise<{ success: boolean; completed?: boolean; error?: any }> => {
  try {
    const { data: goal } = await supabase
      .from('parent_goals')
      .select('target_value')
      .eq('id', goalId)
      .single();

    if (!goal) return { success: false };

    const progressPercentage = Math.min(
      100,
      Math.round((currentProgress / goal.target_value) * 100)
    );
    const isCompleted = progressPercentage >= 100;

    const { error } = await supabase
      .from('parent_goals')
      .update({
        current_progress: currentProgress,
        progress_percentage: progressPercentage,
        status: isCompleted ? 'completed' : 'active',
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', goalId);

    if (error) {
      console.error('Update goal progress error:', error);
      return { success: false, error };
    }

    return { success: true, completed: isCompleted };
  } catch (error) {
    console.error('Update goal progress exception:', error);
    return { success: false, error };
  }
};

// Create parent reward
export const createParentReward = async (
  parentId: string,
  childId: string,
  rewardData: {
    rewardName: string;
    rewardDescription: string;
    rewardType: string;
    rewardValue: string;
    milestoneType: string;
    milestoneTarget: number;
    milestoneSubject?: string;
    milestoneDescription: string;
    expiresAt?: string;
  }
): Promise<{ success: boolean; data?: ParentReward; error?: any }> => {
  try {
    console.log('=== CREATING PARENT REWARD ===');
    console.log('Reward:', rewardData.rewardName);

    const { data, error } = await supabase
      .from('parent_rewards')
      .insert({
        parent_id: parentId,
        student_id: childId,
        reward_name: rewardData.rewardName,
        reward_description: rewardData.rewardDescription,
        reward_type: rewardData.rewardType,
        reward_value: rewardData.rewardValue,
        milestone_type: rewardData.milestoneType,
        milestone_target: rewardData.milestoneTarget,
        milestone_subject: rewardData.milestoneSubject,
        milestone_description: rewardData.milestoneDescription,
        expires_at: rewardData.expiresAt,
      })
      .select();

    if (error) {
      console.error('Create reward error:', error);
      return { success: false, error };
    }

    console.log('✅ Reward created!');
    return { success: true, data: data?.[0] as ParentReward };
  } catch (error) {
    console.error('Create reward exception:', error);
    return { success: false, error };
  }
};

// Get child rewards
export const getChildRewards = async (
  childId: string,
  status?: string
): Promise<ParentReward[]> => {
  try {
    let query = supabase
      .from('parent_rewards')
      .select('*')
      .eq('student_id', childId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get rewards error:', error);
      return [];
    }

    return (data as ParentReward[]) || [];
  } catch (error) {
    console.error('Get rewards exception:', error);
    return [];
  }
};

// Get weekly report
export const getWeeklyReport = async (
  childId: string,
  weekStart: string
): Promise<WeeklyReport | null> => {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('student_id', childId)
      .eq('week_start', weekStart)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get weekly report error:', error);
      return null;
    }

    return (data as WeeklyReport) || null;
  } catch (error) {
    console.error('Get weekly report exception:', error);
    return null;
  }
};

// Get recent weekly reports
export const getRecentReports = async (
  childId: string,
  limit: number = 4
): Promise<WeeklyReport[]> => {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('student_id', childId)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get recent reports error:', error);
      return [];
    }

    return (data as WeeklyReport[]) || [];
  } catch (error) {
    console.error('Get recent reports exception:', error);
    return [];
  }
};

// Add parent comment
export const addParentComment = async (
  parentId: string,
  childId: string,
  commentData: {
    text: string;
    type: string;
    subject?: string;
    concept?: string;
    visibleToStudent?: boolean;
  }
): Promise<{ success: boolean; data?: ParentComment; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('parent_comments')
      .insert({
        parent_id: parentId,
        student_id: childId,
        comment_text: commentData.text,
        comment_type: commentData.type,
        related_subject: commentData.subject,
        related_concept: commentData.concept,
        visible_to_student: commentData.visibleToStudent || false,
      })
      .select();

    if (error) {
      console.error('Add comment error:', error);
      return { success: false, error };
    }

    return { success: true, data: data?.[0] as ParentComment };
  } catch (error) {
    console.error('Add comment exception:', error);
    return { success: false, error };
  }
};

// Get parent comments
export const getParentComments = async (
  childId: string,
  limit: number = 10
): Promise<ParentComment[]> => {
  try {
    const { data, error } = await supabase
      .from('parent_comments')
      .select('*')
      .eq('student_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get comments error:', error);
      return [];
    }

    return (data as ParentComment[]) || [];
  } catch (error) {
    console.error('Get comments exception:', error);
    return [];
  }
};

// Log study time
export const logStudyTime = async (
  userId: string,
  subject: string,
  activityType: string,
  startTime: string,
  endTime: string,
  metrics: {
    interactions?: number;
    questions?: number;
    problems?: number;
    focusScore?: number;
    productivityScore?: number;
  } = {}
): Promise<{ success: boolean; error?: any }> => {
  try {
    const durationSeconds = Math.floor(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
    );

    const { error } = await supabase.from('study_time_logs').insert({
      user_id: userId,
      subject: subject,
      activity_type: activityType,
      start_time: startTime,
      end_time: endTime,
      duration_seconds: durationSeconds,
      interactions_count: metrics.interactions || 0,
      questions_asked: metrics.questions || 0,
      problems_solved: metrics.problems || 0,
      focus_score: metrics.focusScore || 70,
      productivity_score: metrics.productivityScore || 70,
    });

    if (error) {
      console.error('Log study time error:', error);
      return { success: false, error };
    }

    // Update user stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('study_time_today')
      .eq('user_id', userId)
      .single();

    if (currentStats) {
      await supabase
        .from('user_stats')
        .update({
          study_time_today: (currentStats.study_time_today || 0) + durationSeconds,
        })
        .eq('user_id', userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Log study time exception:', error);
    return { success: false, error };
  }
};
