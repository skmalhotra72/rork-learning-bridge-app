import { supabase } from '@/lib/supabase';

export interface XPTransaction {
  id: string;
  user_id: string;
  xp_amount: number;
  reason: string;
  source: string;
  subject?: string;
  concept?: string;
  created_at: string;
}

export interface Badge {
  badge_code: string;
  badge_name: string;
  badge_description: string;
  badge_emoji: string;
  badge_category: string;
  difficulty: string;
  is_secret: boolean;
  display_order: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_code: string;
  earned_at: string;
  subject?: string;
  concept?: string;
  badges?: Badge;
}

export interface StreakInfo {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

// Add XP to user
export const addXP = async (
  userId: string,
  xpAmount: number,
  reason: string,
  source: string,
  subject?: string,
  concept?: string
): Promise<{ success: boolean; totalXP?: number; leveledUp?: boolean; newLevel?: number; error?: any }> => {
  try {
    console.log('=== ADDING XP ===');
    console.log('User:', userId);
    console.log('Amount:', xpAmount);
    console.log('Reason:', reason);

    const { data, error } = await supabase
      .rpc('add_xp_to_user', {
        p_user_id: userId,
        p_xp_amount: xpAmount,
        p_reason: reason,
        p_source: source,
        p_subject: subject,
        p_concept: concept
      });

    if (error) {
      console.error('Add XP error:', error);
      return { success: false, error };
    }

    const result = data?.[0];
    console.log('✅ XP added! New total:', result?.new_total_xp);
    
    if (result?.leveled_up) {
      console.log('🎉 LEVEL UP! New level:', result.new_level);
    }

    return { 
      success: true, 
      totalXP: result?.new_total_xp,
      leveledUp: result?.leveled_up,
      newLevel: result?.new_level
    };

  } catch (error) {
    console.error('Add XP exception:', error);
    return { success: false, error };
  }
};

// Award badge to user
export const awardBadge = async (
  userId: string,
  badgeCode: string,
  subject?: string,
  concept?: string
): Promise<{ success: boolean; badgeCode?: string; error?: any; reason?: string }> => {
  try {
    console.log('=== AWARDING BADGE ===');
    console.log('Badge:', badgeCode);

    const { data, error } = await supabase
      .rpc('award_badge_to_user', {
        p_user_id: userId,
        p_badge_code: badgeCode,
        p_subject: subject,
        p_concept: concept
      });

    if (error) {
      console.error('Award badge error:', error);
      return { success: false, error };
    }

    const awarded = data;

    if (awarded) {
      console.log('✅ Badge awarded!', badgeCode);
      return { success: true, badgeCode };
    } else {
      console.log('Badge already earned');
      return { success: false, reason: 'already_earned' };
    }

  } catch (error) {
    console.error('Award badge exception:', error);
    return { success: false, error };
  }
};

// Update daily streak
export const updateStreak = async (userId: string): Promise<{ 
  success: boolean; 
  currentStreak?: number; 
  streakBroken?: boolean;
  badgeEarned?: string;
  error?: any;
}> => {
  try {
    console.log('=== UPDATING STREAK ===');

    const { data, error } = await supabase
      .rpc('update_learning_streak', {
        p_user_id: userId
      });

    if (error) {
      console.error('Update streak error:', error);
      return { success: false, error };
    }

    const result = data?.[0];
    console.log('Current streak:', result?.current_streak);
    
    if (result?.streak_broken) {
      console.log('⚠️ Streak was broken, starting fresh');
    }

    if (result?.new_badge) {
      console.log('🏆 Streak badge earned!', result.new_badge);
    }

    return {
      success: true,
      currentStreak: result?.current_streak,
      streakBroken: result?.streak_broken,
      badgeEarned: result?.new_badge
    };

  } catch (error) {
    console.error('Update streak exception:', error);
    return { success: false, error };
  }
};

// Get user's badges
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (
          badge_name,
          badge_description,
          badge_emoji,
          badge_category,
          difficulty
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Get badges error:', error);
      return [];
    }

    return (data as UserBadge[]) || [];

  } catch (error) {
    console.error('Get badges exception:', error);
    return [];
  }
};

// Get all available badges (for progress tracking)
export const getAllBadges = async (): Promise<Badge[]> => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_secret', false)
      .order('display_order');

    if (error) {
      console.error('Get all badges error:', error);
      return [];
    }

    return (data as Badge[]) || [];

  } catch (error) {
    console.error('Get all badges exception:', error);
    return [];
  }
};

// Get streak info
export const getStreakInfo = async (userId: string): Promise<StreakInfo> => {
  try {
    const { data, error } = await supabase
      .from('learning_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_active_days: 0,
        last_activity_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return data as StreakInfo;

  } catch (error) {
    console.error('Get streak info exception:', error);
    return {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      total_active_days: 0,
      last_activity_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

// Check for badge eligibility after action
export const checkBadgeEligibility = async (
  userId: string,
  action: string,
  value: number,
  context: { subject?: string; concept?: string } = {}
): Promise<string[]> => {
  try {
    console.log('Checking badge eligibility:', action, value);

    const badges: string[] = [];

    // Get user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!stats) return badges;

    // Check concept-based badges
    if (action === 'concept_mastered') {
      const masteredCount = stats.concepts_mastered || 0;
      
      if (masteredCount === 1) badges.push('first_steps');
      if (masteredCount === 5) badges.push('concept_crusher');
      if (masteredCount === 10) badges.push('knowledge_seeker');
      if (masteredCount === 25) badges.push('wisdom_warrior');
      if (masteredCount === 50) badges.push('master_mind');
    }

    // Check quiz-based badges
    if (action === 'quiz_completed') {
      if (value === 100) {
        // Check if this is their first perfect score
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_code', 'perfect_score')
          .single();

        if (!existingBadge) {
          badges.push('perfect_score');
        }
      }

      const totalQuizzes = stats.total_quizzes || 0;
      if (totalQuizzes === 10) badges.push('quiz_master');

      const perfectQuizzes = stats.perfect_quizzes || 0;
      if (perfectQuizzes >= 5) badges.push('sharpshooter');
    }

    // Check XP-based badges
    if (action === 'xp_earned') {
      const dailyXP = stats.daily_xp_earned || 0;
      if (dailyXP >= 100) badges.push('centurion');
    }

    // Check subject mastery
    if (action === 'subject_mastery' && value >= 80) {
      badges.push('subject_champion');
    }

    // Award any eligible badges
    for (const badgeCode of badges) {
      await awardBadge(userId, badgeCode, context.subject, context.concept);
    }

    return badges;

  } catch (error) {
    console.error('Check badge eligibility error:', error);
    return [];
  }
};

// Get recent XP transactions
export const getRecentXP = async (userId: string, limit: number = 10): Promise<XPTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get recent XP error:', error);
      return [];
    }

    return (data as XPTransaction[]) || [];

  } catch (error) {
    console.error('Get recent XP exception:', error);
    return [];
  }
};
