import createContextHook from "@nkzw/create-context-hook";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

import type { Grade, SubjectDetails, SubjectType, UserProfile } from "@/constants/types";
import type { Profile, SubjectProgress, UserStats } from "@/lib/supabase";
import { supabase, testConnection } from "@/lib/supabase";

export const [UserProvider, useUser] = createContextHook(() => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log('Initializing app...');
        
        const connectionTest = await testConnection();
        if (!connectionTest.success) {
          console.error('Connection test failed:', connectionTest.error);
          setConnectionError(connectionTest.error || 'Unable to connect to server');
          if (mounted) setIsLoading(false);
          return;
        }
        
        console.log('Connection test passed, getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setConnectionError(sessionError.message);
        }
        
        if (!mounted) return;
        
        setSession(session);
        setAuthUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
        setConnectionError(errorMessage);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      console.log("Auth state changed:", _event);
      setSession(session);
      setAuthUser(session?.user ?? null);
      
      if (_event === "SIGNED_OUT") {
        setUser(null);
        setStats(null);
        router.replace("/welcome");
      } else if (_event === "SIGNED_IN" && session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router]);



  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setIsLoading(false);
        return;
      }

      if (!profile) {
        setIsLoading(false);
        return;
      }

      const { data: subjects, error: subjectsError } = await supabase
        .from("subject_progress")
        .select("*")
        .eq("user_id", userId);

      if (subjectsError) {
        console.error("Error loading subjects:", subjectsError);
      }

      const { data: userStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (statsError) {
        console.error("Error loading stats:", statsError);
      } else {
        setStats(userStats);
      }

      const selectedSubjects: SubjectType[] = [];
      const subjectDetails: SubjectDetails[] = [];

      if (subjects && subjects.length > 0) {
        subjects.forEach((s: SubjectProgress) => {
          const subjectId = s.subject as SubjectType;
          selectedSubjects.push(subjectId);
          subjectDetails.push({
            subjectId,
            currentChapter: s.current_chapter,
            confidence: s.confidence_level,
            stuckPoints: s.stuck_points || "",
          });
        });
      }

      const userData: UserProfile = {
        name: profile.full_name,
        email: profile.email,
        grade: profile.grade as Grade,
        selectedSubjects,
        subjectDetails,
        hasCompletedOnboarding: !!(subjects && subjects.length > 0),
      };

      setUser(userData);
    } catch (error) {
      console.error("Error in loadUserProfile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("========== SIGNUP PROCESS STARTED ==========");
      console.log("Step 1: Creating auth user...");
      console.log("Email:", email.trim().toLowerCase());
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        return { success: false, error: authError.message };
      }

      if (!authData?.user?.id) {
        console.error("No user ID returned");
        return { success: false, error: "Failed to create account. Please try again." };
      }

      const userId = authData.user.id;
      console.log("✓ User created with ID:", userId);

      console.log("Step 2: Waiting for triggers and RLS to settle...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Step 3: Verifying profile creation...");
      let profileExists = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!profileExists && retryCount < maxRetries) {
        const { data: profileCheck } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", userId)
          .maybeSingle();

        if (profileCheck) {
          profileExists = true;
          console.log("✓ Profile verified:", profileCheck.full_name);
        } else {
          console.log(`Profile not found yet, retry ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
        }
      }

      if (!profileExists) {
        console.log("Profile not created by trigger, creating manually...");
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            grade: "10"
          });

        if (profileError) {
          console.error("Manual profile creation failed:", profileError);
          return { success: false, error: "Failed to create profile. Please contact support." };
        }
        console.log("✓ Profile created manually");
      }

      console.log("Step 4: Ensuring user stats exist...");
      const { data: statsCheck } = await supabase
        .from("user_stats")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!statsCheck) {
        const { error: statsError } = await supabase
          .from("user_stats")
          .insert({
            user_id: userId,
            total_xp: 0,
            current_level: 1,
            streak_count: 0,
            concepts_mastered: 0,
            quizzes_completed: 0,
            last_activity_date: new Date().toISOString().split('T')[0]
          });

        if (statsError) {
          console.warn("Stats creation failed:", statsError.message);
        } else {
          console.log("✓ User stats created");
        }
      } else {
        console.log("✓ User stats already exist");
      }

      console.log("Step 5: Setting up session in context...");
      
      setSession(authData.session);
      setAuthUser(authData.user);
      
      const tempUser: UserProfile = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        grade: "10",
        selectedSubjects: [],
        subjectDetails: [],
        hasCompletedOnboarding: false,
      };
      setUser(tempUser);
      setConnectionError(null);
      
      console.log("✓ Session set:", !!authData.session);
      console.log("✓ User state initialized");

      console.log("========== SIGNUP COMPLETED SUCCESSFULLY ==========");
      
      setTimeout(() => {
        router.push("/grade-selection");
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error("Unexpected signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("========== LOGIN PROCESS STARTED ==========");
      console.log("Attempting login for:", email.trim().toLowerCase());
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error("Login error:", error);
        let errorMessage = "Failed to login";
        
        if (error.message.includes("Invalid")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("not found")) {
          errorMessage = "Account not found";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error - check your connection";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email before logging in";
        }
        
        return { success: false, error: errorMessage };
      }

      if (!data.user) {
        return { success: false, error: "Failed to login" };
      }

      console.log("✓ Authentication successful");
      console.log("Loading user profile...");

      setSession(data.session);
      setAuthUser(data.user);
      setConnectionError(null);

      await loadUserProfile(data.user.id);

      console.log("Checking onboarding status...");
      const { data: subjects } = await supabase
        .from("subject_progress")
        .select("id")
        .eq("user_id", data.user.id)
        .limit(1);

      if (subjects && subjects.length > 0) {
        console.log("✓ User has completed onboarding, navigating to home");
        setTimeout(() => router.replace("/home"), 100);
      } else {
        console.log("⚠ User needs to complete onboarding, navigating to grade selection");
        setTimeout(() => router.push("/grade-selection"), 100);
      }

      console.log("========== LOGIN COMPLETED SUCCESSFULLY ==========");
      return { success: true };
    } catch (error) {
      console.error("Login exception:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const updateGrade = async (grade: Grade) => {
    if (!user || !authUser) return;

    const updated = { ...user, grade };
    setUser(updated);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ grade })
        .eq("id", authUser.id);

      if (error) {
        console.error("Error updating grade:", error);
        setUser(user);
      }
    } catch (error) {
      console.error("Update grade exception:", error);
      setUser(user);
    }
  };

  const updateSelectedSubjects = async (subjects: SubjectType[]) => {
    if (!user) return;
    const updated = { ...user, selectedSubjects: subjects };
    setUser(updated);
  };

  const updateSubjectDetails = async (details: SubjectDetails) => {
    if (!user) return;
    const existingDetails = user.subjectDetails.filter(
      (d) => d.subjectId !== details.subjectId
    );
    const updated = {
      ...user,
      subjectDetails: [...existingDetails, details],
    };
    setUser(updated);
  };

  const completeOnboarding = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      console.error("No user in context");
      return { success: false, error: "User data not available" };
    }

    try {
      console.log("========== COMPLETE ONBOARDING STARTED ==========");
      console.log("Current user in context:", user.name, user.email);
      console.log("Current authUser:", authUser?.id);
      console.log("Current session exists:", !!session);
      
      console.log("Step 1: Determining user ID...");
      
      let userId: string | undefined;
      
      if (authUser?.id) {
        userId = authUser.id;
        console.log("✓ Using authUser ID from context:", userId);
      } else if (session?.user?.id) {
        userId = session.user.id;
        console.log("✓ Using session user ID from context:", userId);
      } else {
        console.log("⚠️ No user ID in context, fetching fresh session...");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        console.log("Session fetch result:", {
          hasSession: !!currentSession,
          hasError: !!sessionError,
          userId: currentSession?.user?.id
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          return { success: false, error: "Session error occurred" };
        }

        if (currentSession?.user?.id) {
          userId = currentSession.user.id;
          console.log("✓ Using fresh session user ID:", userId);
        }
      }
      
      if (!userId) {
        console.error("❌ No user ID available from any source");
        console.error("Context state:", { hasAuthUser: !!authUser, hasSession: !!session, hasUser: !!user });
        return { success: false, error: "Authentication error. Please log in again." };
      }
      
      console.log("Step 2: User ID confirmed:", userId);

      console.log("Step 3: Updating profile...");
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          grade: user.grade,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return { success: false, error: "Failed to save profile" };
      }
      console.log("Profile updated successfully");

      console.log("Step 4: Preparing subject data...");
      const subjectData = user.subjectDetails.map((detail) => {
        return {
          user_id: userId,
          subject: detail.subjectId,
          current_chapter: detail.currentChapter,
          confidence_level: detail.confidence,
          stuck_points: detail.stuckPoints || null,
          status: "getting_to_know_you",
          mastery_percentage: 0,
        };
      });

      console.log("Inserting subjects:", subjectData.length);
      const { error: subjectsError } = await supabase
        .from("subject_progress")
        .upsert(subjectData, { onConflict: "user_id,subject" });

      if (subjectsError) {
        console.error("Subjects save error:", subjectsError);
        return { success: false, error: "Failed to save subjects" };
      }
      console.log("Subjects saved successfully");

      console.log("Step 5: Ensuring user stats exist...");
      const { error: statsError } = await supabase
        .from("user_stats")
        .upsert({
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          streak_count: 0,
          concepts_mastered: 0,
          quizzes_completed: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id", ignoreDuplicates: false });

      if (statsError) {
        console.error("Stats initialization error:", statsError);
      } else {
        console.log("Stats initialized successfully");
      }

      const updated = { ...user, hasCompletedOnboarding: true };
      setUser(updated);

      console.log("Onboarding completed successfully! Navigating to home...");
      console.log("========== COMPLETE ONBOARDING FINISHED ==========");
      
      router.replace("/home");
      return { success: true };
    } catch (error) {
      console.error("Complete onboarding exception:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        Alert.alert("Error", "Failed to logout. Please try again.");
        return;
      }

      setUser(null);
      setAuthUser(null);
      setSession(null);
      setStats(null);
      router.replace("/welcome");
    } catch (error) {
      console.error("Logout exception:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    const updated = { ...user, ...updates };
    setUser(updated);

    try {
      const dbUpdates: Partial<Profile> = {};
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.grade) dbUpdates.grade = updates.grade;

      const { error } = await supabase
        .from("profiles")
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq("id", authUser.id);

      if (error) {
        console.error("Profile update error:", error);
        setUser(user);
        return { success: false, error: "Failed to update profile" };
      }

      return { success: true };
    } catch (error) {
      console.error("Update profile exception:", error);
      setUser(user);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const refreshData = async () => {
    if (authUser) {
      await loadUserProfile(authUser.id);
    }
  };

  return {
    user,
    isLoading,
    authUser,
    session,
    stats,
    connectionError,
    signup,
    login,
    logout,
    updateGrade,
    updateSelectedSubjects,
    updateSubjectDetails,
    completeOnboarding,
    updateProfile,
    refreshData,
  };
});
