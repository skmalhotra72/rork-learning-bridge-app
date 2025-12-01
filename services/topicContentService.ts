import { supabase } from '@/lib/supabase';
import type { CBSETopic } from './contentLibrary';

export interface TopicContent {
  id: string;
  topic_id: string;
  content_type: 'theory' | 'definition' | 'explanation' | 'note';
  title?: string;
  content_text: string;
  is_important: boolean;
  is_exam_critical: boolean;
  display_order: number;
  created_at: string;
}

export interface TopicConcept {
  id: string;
  topic_id: string;
  concept_name: string;
  explanation?: string;
  formula?: string;
  formula_latex?: string;
  key_points?: string[];
  concept_description?: string;
  created_at: string;
}

export interface TopicExample {
  id: string;
  topic_id: string;
  example_number: number;
  example_type: string;
  problem_statement: string;
  solution_steps: string[];
  final_answer: string;
  tips?: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface TopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  understanding_score?: number;
  time_spent_seconds: number;
  last_studied_at: string;
  created_at: string;
  updated_at: string;
}

export interface CompleteTopicData {
  topic: CBSETopic & {
    chapter: {
      chapter_title: string;
      chapter_number: number;
      book: {
        subject: {
          subject_name: string;
          subject_emoji: string;
        };
      };
    };
  };
  content: TopicContent[];
  concepts: TopicConcept[];
  formulas: {
    id: string;
    formula_title: string;
    formula_text: string;
    formula_latex?: string;
    when_to_use?: string;
  }[];
  examples: TopicExample[];
  user_progress?: TopicProgress;
}

export const getTopicCompleteData = async (
  topicId: string,
  userId: string
): Promise<{ success: boolean; data?: CompleteTopicData; error?: any }> => {
  try {
    console.log('=== FETCHING TOPIC DATA ===', { topicId, userId });

    const { data: topic, error: topicError } = await supabase
      .from('cbse_topics')
      .select(`
        *,
        chapter:cbse_chapters!cbse_topics_chapter_id_fkey(
          chapter_title,
          chapter_number,
          book:cbse_books!cbse_chapters_book_id_fkey(
            subject:cbse_subjects!cbse_books_subject_id_fkey(
              subject_name,
              icon_emoji
            )
          )
        )
      `)
      .eq('id', topicId)
      .single();

    if (topicError) {
      console.error('Topic fetch error:', topicError);
      return { success: false, error: topicError };
    }

    const { data: content, error: contentError } = await supabase
      .from('topic_content')
      .select('*')
      .eq('topic_id', topicId)
      .order('display_order');

    if (contentError) {
      console.error('Content fetch error:', contentError);
    }

    const { data: concepts, error: conceptsError } = await supabase
      .from('topic_concepts')
      .select('*')
      .eq('topic_id', topicId);

    if (conceptsError) {
      console.error('Concepts fetch error:', conceptsError);
    }

    const { data: formulas, error: formulasError } = await supabase
      .from('formula_library')
      .select('*')
      .eq('topic_id', topicId);

    if (formulasError) {
      console.error('Formulas fetch error:', formulasError);
    }

    const { data: examples, error: examplesError } = await supabase
      .from('examples_library')
      .select('*')
      .eq('topic_id', topicId)
      .order('example_number');

    if (examplesError) {
      console.error('Examples fetch error:', examplesError);
    }

    const { data: progress, error: progressError } = await supabase
      .from('student_topic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle();

    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Progress fetch error:', progressError);
    }

    console.log('✅ Topic data loaded');
    console.log('Content items:', content?.length || 0);
    console.log('Concepts:', concepts?.length || 0);
    console.log('Formulas:', formulas?.length || 0);
    console.log('Examples:', examples?.length || 0);

    return {
      success: true,
      data: {
        topic: topic as any,
        content: (content as TopicContent[]) || [],
        concepts: (concepts as TopicConcept[]) || [],
        formulas: (formulas as any[]) || [],
        examples: (examples as TopicExample[]) || [],
        user_progress: progress as TopicProgress | undefined,
      },
    };
  } catch (error) {
    console.error('Get topic data exception:', error);
    return {
      success: false,
      error,
    };
  }
};

export const updateTopicProgress = async (
  userId: string,
  topicId: string,
  updates: {
    status?: 'not_started' | 'in_progress' | 'completed';
    understandingScore?: number;
    timeSpentIncrement?: number;
  } = {}
): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    console.log('=== UPDATING TOPIC PROGRESS ===', { topicId, updates });

    const { data: existing, error: fetchError } = await supabase
      .from('student_topic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch progress error:', fetchError);
      return { success: false, error: fetchError };
    }

    const now = new Date().toISOString();
    const timeSpentSeconds = existing?.time_spent_seconds || 0;
    const newTimeSpent = timeSpentSeconds + (updates.timeSpentIncrement || 0);

    const progressData = {
      user_id: userId,
      topic_id: topicId,
      status: updates.status || existing?.status || 'in_progress',
      understanding_score: updates.understandingScore ?? existing?.understanding_score,
      time_spent_seconds: newTimeSpent,
      last_studied_at: now,
      updated_at: now,
    };

    if (existing) {
      const { data, error } = await supabase
        .from('student_topic_progress')
        .update(progressData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Update progress error:', error);
        return { success: false, error };
      }

      console.log('✅ Progress updated');
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('student_topic_progress')
        .insert({
          ...progressData,
          created_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert progress error:', error);
        return { success: false, error };
      }

      console.log('✅ Progress created');
      return { success: true, data };
    }
  } catch (error) {
    console.error('Update progress exception:', error);
    return {
      success: false,
      error,
    };
  }
};

export const startTopic = async (userId: string, topicId: string) => {
  return updateTopicProgress(userId, topicId, {
    status: 'in_progress',
  });
};

export const completeTopic = async (
  userId: string,
  topicId: string,
  understandingScore?: number
) => {
  return updateTopicProgress(userId, topicId, {
    status: 'completed',
    understandingScore: understandingScore,
  });
};

export const trackTopicTime = async (userId: string, topicId: string, seconds: number) => {
  return updateTopicProgress(userId, topicId, {
    timeSpentIncrement: seconds,
  });
};
