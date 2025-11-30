import createContextHook from "@nkzw/create-context-hook";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

import type { Grade, SubjectDetails, SubjectType, UserProfile } from "@/constants/types";
import type { Profile, SubjectProgress, UserStats } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

export const [UserProvider, useUser] = createContextHook(() => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setAuthUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
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
      });

      if (authError) {
        console.error("Auth error:", authError);
        return { success: false, error: authError.message };
      }

      if (!authData?.user?.id) {
        console.error("No user ID returned");
        return { success: false, error: "No user ID returned" };
      }

      const userId = authData.user.id;
      console.log("User created with ID:", userId);

      console.log("Step 2: Waiting for auth to settle...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Step 3: Creating profile...");
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          grade: "10"
        });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        
        const { data: checkData } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId);
        
        if (!checkData || checkData.length === 0) {
          return { success: false, error: "Failed to create profile. Please try again." };
        }
        console.log("Profile exists from trigger");
      } else {
        console.log("Profile created successfully");
      }

      console.log("Step 4: Creating user stats...");
      const { error: statsError } = await supabase
        .from("user_stats")
        .insert({
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          streak_count: 0,
          concepts_mastered: 0,
          quizzes_completed: 0
        });

      if (statsError) {
        console.error("Stats error:", statsError);
      } else {
        console.log("Stats created successfully");
      }

      console.log("Signup complete!");
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
      
      console.log("Session set:", !!authData.session);
      console.log("Auth user set:", authData.user.id);

      router.push("/grade-selection");
      
      console.log("========== SIGNUP COMPLETED SUCCESSFULLY ==========");
      return { success: true };
    } catch (error) {
      console.error("Unexpected signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
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
        }
        
        return { success: false, error: errorMessage };
      }

      if (!data.user) {
        return { success: false, error: "Failed to login" };
      }

      setSession(data.session);
      setAuthUser(data.user);

      await loadUserProfile(data.user.id);

      const { data: subjects } = await supabase
        .from("subject_progress")
        .select("*")
        .eq("user_id", data.user.id);

      if (subjects && subjects.length > 0) {
        router.replace("/home");
      } else {
        router.push("/grade-selection");
      }

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
      
      console.log("Step 1: Getting current session...");
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

      let userId: string;
      
      if (currentSession?.user?.id) {
        userId = currentSession.user.id;
        console.log("Using session user ID:", userId);
      } else if (authUser?.id) {
        userId = authUser.id;
        console.log("Using authUser ID (fallback):", userId);
      } else {
        console.error("No user ID available anywhere");
        return { success: false, error: "Authentication error. Please log in again." };
      }

      console.log("Step 2: Updating profile...");
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

      console.log("Step 3: Preparing subject data...");
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

      console.log("Step 4: Ensuring user stats exist...");
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
