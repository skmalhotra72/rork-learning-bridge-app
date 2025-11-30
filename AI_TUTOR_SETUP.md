# AI Tutor Comprehensive Learning History - Database Setup

## Overview
This document provides the SQL commands needed to set up comprehensive learning history tracking in your Supabase database.

## Database Tables

### 1. Learning History Table (Enhanced)
Tracks detailed session information including all interactions with the AI tutor.

```sql
-- Drop existing table if you want to start fresh (OPTIONAL - WARNING: Deletes all data!)
-- DROP TABLE IF EXISTS public.learning_history CASCADE;

-- Create enhanced learning_history table
CREATE TABLE IF NOT EXISTS public.learning_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT,
  concept TEXT NOT NULL,
  session_type TEXT DEFAULT 'general' CHECK (session_type IN ('explanation', 'practice', 'assessment', 'general')),
  conversation_summary TEXT,
  key_points_learned JSONB DEFAULT '[]'::jsonb,
  concepts_explained JSONB DEFAULT '[]'::jsonb,
  examples_used JSONB DEFAULT '[]'::jsonb,
  problems_attempted INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  mistakes_made JSONB DEFAULT '[]'::jsonb,
  understanding_level INTEGER CHECK (understanding_level >= 1 AND understanding_level <= 10),
  confidence_before INTEGER CHECK (confidence_before >= 1 AND confidence_before <= 10),
  confidence_after INTEGER CHECK (confidence_after >= 1 AND confidence_after <= 10),
  questions_asked INTEGER DEFAULT 0,
  ai_responses_count INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for learning_history (for testing - enable in production!)
ALTER TABLE public.learning_history DISABLE ROW LEVEL SECURITY;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_history_user_subject 
ON public.learning_history(user_id, subject);

CREATE INDEX IF NOT EXISTS idx_learning_history_concept 
ON public.learning_history(user_id, concept);

CREATE INDEX IF NOT EXISTS idx_learning_history_created_at 
ON public.learning_history(created_at DESC);
```

### 2. Concept Mastery Table
Tracks how well students have mastered individual concepts.

```sql
-- Create concept_mastery table
CREATE TABLE IF NOT EXISTS public.concept_mastery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT,
  concept TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  attempts_count INTEGER DEFAULT 0,
  successful_attempts INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'mastered', 'needs_revision')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject, concept)
);

-- Disable RLS for concept_mastery (for testing - enable in production!)
ALTER TABLE public.concept_mastery DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_subject 
ON public.concept_mastery(user_id, subject);

CREATE INDEX IF NOT EXISTS idx_concept_mastery_status 
ON public.concept_mastery(user_id, status);
```

### 3. Learning Insights Table
Stores AI-generated insights about student's learning patterns.

```sql
-- Create learning_insights table
CREATE TABLE IF NOT EXISTS public.learning_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('strength', 'weakness', 'recommendation', 'achievement')),
  insight_text TEXT NOT NULL,
  related_concepts JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '{}'::jsonb,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for learning_insights (for testing - enable in production!)
ALTER TABLE public.learning_insights DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_insights_user_subject 
ON public.learning_insights(user_id, subject);

CREATE INDEX IF NOT EXISTS idx_learning_insights_priority 
ON public.learning_insights(priority DESC);

CREATE INDEX IF NOT EXISTS idx_learning_insights_status 
ON public.learning_insights(status);
```

### 4. Student Learning Context View (Optional but Recommended)
Creates a view that aggregates learning data for easy querying.

```sql
-- Create a view for comprehensive student learning context
CREATE OR REPLACE VIEW student_learning_context AS
SELECT 
  lh.user_id,
  lh.subject,
  COUNT(DISTINCT lh.id) as sessions_count,
  SUM(lh.session_duration) as total_time_spent,
  ROUND(AVG(lh.understanding_level)) as avg_understanding,
  SUM(lh.problems_solved) as total_problems_solved,
  sp.mastery_percentage,
  sp.confidence_level,
  sp.current_chapter,
  sp.stuck_points,
  ARRAY_AGG(DISTINCT lh.concept ORDER BY lh.created_at DESC) FILTER (WHERE lh.concept IS NOT NULL) as recent_concepts,
  (
    SELECT json_agg(cm.*)
    FROM concept_mastery cm
    WHERE cm.user_id = lh.user_id 
    AND cm.subject = lh.subject 
    AND cm.status = 'mastered'
    LIMIT 10
  ) as mastered_concepts,
  (
    SELECT json_agg(cm.*)
    FROM concept_mastery cm
    WHERE cm.user_id = lh.user_id 
    AND cm.subject = lh.subject 
    AND cm.status = 'needs_revision'
    LIMIT 5
  ) as needs_revision,
  (
    SELECT json_agg(li.*)
    FROM learning_insights li
    WHERE li.user_id = lh.user_id 
    AND li.subject = lh.subject 
    AND li.status = 'active'
    ORDER BY li.priority DESC, li.created_at DESC
    LIMIT 5
  ) as active_insights
FROM learning_history lh
LEFT JOIN subject_progress sp ON lh.user_id = sp.user_id AND lh.subject = sp.subject
GROUP BY lh.user_id, lh.subject, sp.mastery_percentage, sp.confidence_level, sp.current_chapter, sp.stuck_points;
```

## Setup Instructions

### Step 1: Run SQL in Supabase
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste **ALL** the SQL commands above (all 4 sections)
5. Click "Run" to execute

### Step 2: Verify Tables Were Created
1. Go to "Table Editor" in Supabase
2. You should see these new tables:
   - `learning_history`
   - `concept_mastery`
   - `learning_insights`
3. You should see the view in "SQL Editor" → "Views"

### Step 3: Test the System
1. Open your app
2. Navigate to a subject
3. Complete an assessment (if status is "getting_to_know_you")
4. Start the AI Tutor ("Start Learning" button)
5. Have a conversation with Buddy - ask questions, request explanations
6. Exit the AI Tutor screen
7. Check Supabase:
   - Go to `learning_history` table - you should see a new row with your session data
   - Check `concept_mastery` if you solved problems
   - Look at the console logs for detailed tracking info

## What Gets Tracked

### In learning_history:
- ✅ Session duration (in seconds)
- ✅ Concepts explained
- ✅ Key points learned
- ✅ Examples used
- ✅ Problems attempted vs solved
- ✅ Questions asked
- ✅ AI responses count
- ✅ Mistakes made
- ✅ Understanding level (1-10)
- ✅ Confidence before/after session

### In concept_mastery:
- ✅ Mastery level per concept (0-100%)
- ✅ Number of attempts
- ✅ Successful attempts
- ✅ Status (learning/mastered/needs_revision)
- ✅ Last practiced timestamp

### In learning_insights:
- ✅ Strengths identified
- ✅ Weaknesses found
- ✅ Recommendations for learning
- ✅ Achievement milestones
- ✅ Evidence-based insights

## Features Implemented

### 1. Comprehensive Session Tracking
- Every AI tutor session is saved with detailed metrics
- Only sessions longer than 10 seconds are saved
- Automatic calculation of understanding and confidence improvements

### 2. Context-Aware AI
- AI system prompt includes full learning history
- References past topics, mistakes, and mastery
- Personalized teaching based on student progress

### 3. Concept Mastery Tracking
- Tracks individual concept understanding
- Automatically updates mastery levels
- Identifies which concepts need revision

### 4. Learning Insights (Foundation)
- Database structure ready for AI-generated insights
- Can identify patterns in learning behavior
- Priority-based insight system

## Console Logs to Watch

When using the AI Tutor, watch for these logs:

```
=== BUILDING STUDENT CONTEXT ===
✅ Built student context
- Total sessions: X
- Problems solved: Y
- Time spent: Z minutes

=== SAVING SESSION ON EXIT ===
Duration: X seconds
Concepts explained: Y
Questions asked: Z
✅ Learning session saved successfully
✅ Concept mastery updated
```

## Troubleshooting

### If tables don't appear:
1. Check for SQL errors in the query output
2. Make sure you're in the correct Supabase project
3. Verify you have admin permissions

### If data isn't saving:
1. Check the console logs for error messages
2. Verify RLS (Row Level Security) is disabled for testing
3. Check that `profiles` table exists and user_id is valid
4. Look for foreign key constraint errors

### If AI context isn't working:
1. Verify you have at least one learning session saved
2. Check that `getStudentContext` returns data in logs
3. Ensure Supabase connection is active

## Next Steps

After setting up the database:

1. ✅ Test AI Tutor thoroughly
2. ✅ Have multiple sessions to build history
3. ✅ Solve practice problems to track mastery
4. ✅ Check that data appears in Supabase tables
5. 🔄 Enable RLS policies in production (see Supabase docs)
6. 🔄 Add dashboard UI to display learning insights
7. 🔄 Implement automatic insight generation
8. 🔄 Add progress tracking visualizations

## Production Considerations

**IMPORTANT**: Before deploying to production:

1. **Enable Row Level Security (RLS)**:
```sql
ALTER TABLE public.learning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own learning history"
ON public.learning_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning history"
ON public.learning_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Repeat for other tables
```

2. **Set up proper indexes** for your query patterns
3. **Monitor database performance**
4. **Consider data retention policies** (archive old sessions)
5. **Implement backup strategies**

## Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify all SQL ran successfully
3. Ensure your app is connected to the correct Supabase project
4. Check that authentication is working properly

## Summary

You now have a comprehensive learning history system that:
- Tracks every interaction with the AI tutor
- Builds cumulative student context
- Enables personalized AI teaching
- Monitors concept mastery
- Prepares for learning insights generation

The AI tutor will now remember what students have learned, their common mistakes, and their progress over time!
